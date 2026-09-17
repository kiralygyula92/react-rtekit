import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Turns TypeDoc's JSON into the per-page data the API routes render (08 §6).
 *
 * TypeDoc's output is a whole compiler's worth of detail; the site needs a name, a
 * type, a default, a description and a group. Doing the reduction here rather than in
 * the browser keeps a 4 MB file out of the bundle.
 *
 * Run with `pnpm --filter @react-rtekit/site api:generate`.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const apiJson = path.resolve(here, '../../../packages/react-rtekit/api.json');
const outDir = path.resolve(here, '../src/api');

/** TypeDoc's kind numbers, for the few we care about. */
const KIND = {
  interface: 256,
  property: 1024,
  method: 2048,
  typeAlias: 2097152,
  function: 64,
  variable: 32,
};

/** The text of a TSDoc comment, summary and remarks joined. */
function commentText(comment) {
  if (!comment) return '';
  const parts = [...(comment.summary ?? [])];
  for (const tag of comment.blockTags ?? []) {
    if (tag.tag === '@remarks') parts.push(...tag.content);
  }
  return parts
    .map((part) => part.text ?? '')
    .join('')
    .trim();
}

/** The value of one block tag, e.g. `@default`. */
function blockTag(comment, name) {
  const tag = (comment?.blockTags ?? []).find((entry) => entry.tag === name);
  if (!tag) return '';
  return tag.content
    .map((part) => part.text ?? '')
    .join('')
    .replace(/^`|`$/g, '')
    .trim();
}

/** A readable rendering of a TypeDoc type node. */
function typeToString(type) {
  if (!type) return 'unknown';
  switch (type.type) {
    case 'intrinsic':
      return type.name;
    case 'literal':
      return typeof type.value === 'string' ? `'${type.value}'` : String(type.value);
    case 'reference':
      return type.typeArguments?.length
        ? `${type.name}<${type.typeArguments.map(typeToString).join(', ')}>`
        : type.name;
    case 'union':
      return type.types.map(typeToString).join(' | ');
    case 'intersection':
      return type.types.map(typeToString).join(' & ');
    case 'array':
      return `${typeToString(type.elementType)}[]`;
    case 'reflection':
      return type.declaration?.signatures?.length ? 'function' : 'object';
    case 'templateLiteral':
      return 'string';
    case 'tuple':
      return `[${(type.elements ?? []).map(typeToString).join(', ')}]`;
    case 'indexedAccess':
      return `${typeToString(type.objectType)}[…]`;
    case 'typeOperator':
      return `${type.operator} ${typeToString(type.target)}`;
    default:
      return type.name ?? 'unknown';
  }
}

/** Walks the whole reflection tree. */
function* walk(node) {
  yield node;
  for (const child of node.children ?? []) yield* walk(child);
}

/** Every member of one interface, flattened. */
function membersOf(root, name) {
  const target = [...walk(root)].find(
    (node) => node.name === name && node.kind === KIND.interface,
  );
  if (!target) return [];

  return (target.children ?? [])
    .filter((child) => child.kind === KIND.property || child.kind === KIND.method)
    .map((child) => ({
      name: child.name,
      type:
        child.kind === KIND.method
          ? signatureToString(child)
          : typeToString(child.type),
      optional: child.flags?.isOptional === true,
      default: blockTag(child.comment, '@default'),
      description: commentText(child.comment ?? child.signatures?.[0]?.comment),
      group: blockTag(child.comment, '@group') || 'General',
      deprecated: blockTag(child.comment, '@deprecated'),
      example: blockTag(child.comment, '@example'),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** A method's signature, as one line. */
function signatureToString(node) {
  const signature = node.signatures?.[0];
  if (!signature) return 'function';
  const params = (signature.parameters ?? [])
    .map((parameter) => `${parameter.name}${parameter.flags?.isOptional ? '?' : ''}: ${typeToString(parameter.type)}`)
    .join(', ');
  return `(${params}) => ${typeToString(signature.type)}`;
}

/** Exported functions, for the utilities and hooks pages. */
function functionsOf(root, predicate) {
  return [...walk(root)]
    .filter((node) => node.kind === KIND.function && predicate(node.name))
    .map((node) => ({
      name: node.name,
      type: signatureToString(node),
      optional: false,
      default: '',
      description: commentText(node.signatures?.[0]?.comment),
      group: blockTag(node.signatures?.[0]?.comment, '@group') || 'General',
      deprecated: blockTag(node.signatures?.[0]?.comment, '@deprecated'),
      example: blockTag(node.signatures?.[0]?.comment, '@example'),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Every exported type alias and interface name, for the types page. */
function typeNames(root) {
  return [...walk(root)]
    .filter(
      (node) =>
        (node.kind === KIND.typeAlias || node.kind === KIND.interface) &&
        node.flags?.isExternal !== true,
    )
    .map((node) => ({
      name: node.name,
      type: node.kind === KIND.typeAlias ? typeToString(node.type) : 'interface',
      optional: false,
      default: '',
      description: commentText(node.comment),
      group: blockTag(node.comment, '@group') || 'General',
      deprecated: '',
      example: '',
    }))
    .filter((entry) => entry.description !== '')
    .sort((a, b) => a.name.localeCompare(b.name));
}

const root = JSON.parse(await readFile(apiJson, 'utf8'));

const pages = {
  'rich-text-editor': membersOf(root, 'RichTextEditorProps'),
  'editor-instance': membersOf(root, 'EditorInstance'),
  hooks: functionsOf(root, (name) => name.startsWith('use')),
  utilities: functionsOf(
    root,
    (name) =>
      !name.startsWith('use') &&
      !name.startsWith('Rte') &&
      name[0] === name[0].toLowerCase(),
  ),
  types: typeNames(root),
};

await mkdir(outDir, { recursive: true });
await writeFile(path.join(outDir, 'pages.json'), `${JSON.stringify(pages, null, 2)}\n`);

const counts = Object.entries(pages)
  .map(([name, entries]) => `${name}: ${entries.length}`)
  .join(', ');
process.stdout.write(`generated api pages (${counts})
`);
