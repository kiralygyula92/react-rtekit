import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Phase 4 — generates the reference from the package's own source of truth.
 *
 * Inputs, in order of authority:
 *   packages/react-rtekit/api.json   TypeDoc's output, from the TypeScript declarations
 *   react-rtekit/meta                the runtime metadata, for the enumerable catalogues
 *
 * Outputs, per PPDS §8.4/§8.5:
 *   {symbol}.schema.json   structure — always overwritten
 *   {symbol}.strings.json  prose — only ever gains keys, never overwritten
 *   index.json             every symbol, its page, and its usedBy back-links
 *   checksums.json         so conformance check 10 can detect a hand-edited schema
 *
 * The split is P6: structure and prose in separate files so regeneration and translation
 * never fight. The addition is EXCEPTIONS E-07 — on first write, each prose key is
 * *seeded* from the TSDoc comment that already exists and that `docs:check` already
 * enforces in strict mode. Retyping 507 descriptions by hand would lose the guarantee
 * that the docs and the signatures were written together. After seeding, the strings
 * file owns the prose and this script will never touch that key again.
 *
 * Run: pnpm --filter react-rtekit docs:json && node content/react-rtekit/reference/generate.mjs
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../..');
const require = createRequire(path.join(root, 'package.json'));

const REPO = 'https://github.com/kiralygyula92/react-rtekit';
const NS = '/react-rtekit';

/**
 * Which reference page a symbol belongs on.
 *
 * Components, hooks and functions get a page each; the six enumerable catalogues get one
 * page each rather than 444 (EXCEPTIONS E-06 — PPDS §5.4 allows "one page per public
 * symbol *or settings group*", and a flat list of named options generated from one source
 * is a settings group in the strict sense).
 */
const PAGES = {
  'rich-text-editor': { title: 'RichTextEditor', symbols: ['RichTextEditor', 'RichTextEditorProps'] },
  'rte-content-view': { title: 'RteContentView', symbols: ['RteContentView', 'RteContentViewProps'] },
  'composable-parts': {
    title: 'Composable parts',
    symbols: ['Rte', 'RteRoot', 'RteToolbar', 'RteContent', 'RteLabel', 'RteCounter', 'RteFooter', 'RteHelperText', 'RteErrorText', 'RtePortals'],
  },
  providers: { title: 'Providers', symbols: ['RteThemeProvider', 'RteLocaleProvider', 'RteDefaultsProvider'] },
  'use-editor': { title: 'useEditor', symbols: ['useEditor', 'UseEditorOptions'] },
  'editor-hooks': { title: 'Editor hooks', prefix: 'use' },
  'editor-instance': { title: 'EditorInstance', symbols: ['EditorInstance'] },
  serialization: {
    title: 'Serialization',
    symbols: ['htmlToDocument', 'documentToHtml', 'documentToMarkdown', 'markdownToDocument', 'markdownToHtml', 'documentToText', 'isEmptyHtml'],
  },
  sanitize: { title: 'Sanitizer', symbols: ['sanitizeHtml', 'getProfile', 'resolveSanitizeConfig', 'mergeSanitizeConfig', 'checkUrl', 'normalizeUrl'] },
  'plugin-api': { title: 'Plugin API', symbols: ['definePlugin', 'createToolbarItem', 'resolvePlugins', 'resolvePluginOrder', 'featuresOf', 'presets', 'plugins'] },
  'theme-api': { title: 'Theme API', symbols: ['createTheme', 'lightTheme', 'darkTheme', 'classicTheme', 'compactTheme', 'borderedTheme', 'themes'] },
  /*
   * The exported types a consumer annotates with, as one page.
   *
   * Not every type in the package — the props and options interfaces live on the page of
   * the thing they configure, where a reader is already looking. These are the ones that
   * turn up in a user's own signatures.
   */
  types: {
    title: 'Types',
    symbols: [
      'EditorValue', 'EditorDocument', 'ChangeMeta', 'FormatState', 'SelectionInfo',
      'RteTheme', 'RteSlots', 'RteHandlers', 'RteLocalization', 'RteIcons',
      'RtePlugin', 'CommandId', 'ToolbarItemSpec', 'SanitizeConfig', 'SanitizeProfileName',
      'UploadHandler', 'ImageAttrs', 'LinkAttrs', 'TableOptions', 'FindOptions',
    ],
  },
};

/** The catalogues, each one page, read from the runtime metadata. */
const CATALOGUES = {
  slots: { title: 'Slot catalogue', field: 'slots' },
  'toolbar-items': { title: 'Toolbar items', field: 'toolbarItems' },
  'theme-tokens': { title: 'Theme tokens', field: 'tokens' },
  icons: { title: 'Icon set', field: 'icons' },
  'localization-keys': { title: 'Localization keys', field: 'localizationKeys' },
  plugins: { title: 'Plugin catalogue', field: 'plugins' },
  commands: { title: 'Command catalogue', field: 'commands' },
  handlers: { title: 'Handler catalogue', field: 'handlers' },
};

// ── TypeDoc ──────────────────────────────────────────────────────────────────
const apiJsonPath = path.join(root, 'packages/react-rtekit/api.json');
if (!existsSync(apiJsonPath)) {
  process.stderr.write(
    'packages/react-rtekit/api.json is missing.\nRun: pnpm --filter react-rtekit docs:json\n',
  );
  process.exit(1);
}
const api = JSON.parse(await readFile(apiJsonPath, 'utf8'));

/** The text of a TSDoc comment, summary and remarks joined. */
function commentText(comment) {
  if (!comment) return '';
  const parts = [...(comment.summary ?? [])];
  for (const tag of comment.blockTags ?? []) {
    if (tag.tag === '@remarks') parts.push(...tag.content);
  }
  return parts.map((part) => part.text ?? '').join('').trim();
}

/** A type, printed the way a reader would write it. */
function typeName(type) {
  if (!type) return 'unknown';
  switch (type.type) {
    case 'intrinsic':
    case 'literal':
      return type.type === 'literal' ? JSON.stringify(type.value) : type.name;
    case 'reference':
      return type.typeArguments?.length
        ? `${type.name}<${type.typeArguments.map(typeName).join(', ')}>`
        : type.name;
    case 'union':
      return type.types.map(typeName).join(' | ');
    case 'array':
      return `${typeName(type.elementType)}[]`;
    case 'reflection':
      return type.declaration?.signatures?.length ? 'function' : 'object';
    default:
      return type.name ?? type.type ?? 'unknown';
  }
}

/** Every declaration in the TypeDoc tree, flattened. */
function* declarations(node, trail = []) {
  if (node.name && node.kind) yield { node, trail };
  for (const child of node.children ?? []) yield* declarations(child, [...trail, node.name]);
}

/**
 * TypeDoc's kind number for a re-export.
 *
 * A symbol exported from its module and again from the entry point appears twice: once
 * as the real declaration with its members, and once as a pointer to it with none.
 * Taking whichever came first gave `RichTextEditorProps` — 140 properties — an empty
 * options table, and the reference would have said the component takes no props.
 */
const REFERENCE_KIND = 4194304;

const all = [...declarations(api)].filter(({ node }) => node.kind !== REFERENCE_KIND);

/** The options a symbol exposes: an interface's properties, or a function's parameters. */
function optionsOf(node) {
  const options = {};
  for (const child of node.children ?? []) {
    if (child.kind !== 1024 && child.kind !== 2048) continue;
    const signature = child.signatures?.[0];
    options[child.name] = {
      type: { name: typeName(signature ? { type: 'reflection' } : child.type) },
      required: child.flags?.isOptional !== true,
      ...(child.defaultValue !== undefined ? { default: child.defaultValue } : {}),
    };
  }
  return options;
}

// ── build the symbol records ─────────────────────────────────────────────────
const { meta } = require(path.join(root, 'packages/react-rtekit/dist/meta.cjs'));

/** name -> { page, schema, seedProse } */
const symbols = new Map();

for (const [page, spec] of Object.entries(PAGES)) {
  const wanted = spec.symbols
    ? all.filter(({ node }) => spec.symbols.includes(node.name))
    : all.filter(({ node }) => spec.prefix && node.name.startsWith(spec.prefix) && node.kind === 64);

  for (const { node } of wanted) {
    if (symbols.has(node.name)) continue;
    const signature = node.signatures?.[0];
    symbols.set(node.name, {
      page,
      schema: {
        name: node.name,
        kind:
          node.kind === 256 ? 'interface' : node.kind === 64 ? 'function' : node.kind === 2097152 ? 'type' : 'variable',
        imports: [`import { ${node.name} } from 'react-rtekit';`],
        options: optionsOf(node),
        filename: node.sources?.[0]?.fileName ?? '',
        sourceUrl: node.sources?.[0]?.fileName
          ? `${REPO}/blob/main/packages/react-rtekit/${node.sources[0].fileName}#L${node.sources[0].line ?? 1}`
          : REPO,
        usedBy: [],
      },
      prose: {
        symbolDescription: commentText(signature?.comment ?? node.comment),
        optionDescriptions: Object.fromEntries(
          (node.children ?? [])
            .filter((child) => child.kind === 1024 || child.kind === 2048)
            .map((child) => [child.name, commentText(child.signatures?.[0]?.comment ?? child.comment)]),
        ),
      },
    });
  }
}

for (const [page, spec] of Object.entries(CATALOGUES)) {
  const entries = meta[spec.field] ?? [];
  const name = page;
  symbols.set(name, {
    page,
    catalogue: true,
    schema: {
      name: spec.title,
      kind: 'catalogue',
      imports: [`import { meta } from 'react-rtekit/meta';`],
      options: Object.fromEntries(
        entries.map((entry) => {
          const key = typeof entry === 'string' ? entry : entry.name;
          return [key, { type: { name: typeof entry === 'string' ? 'string' : (entry.type ?? 'entry') }, required: false }];
        }),
      ),
      filename: `src/meta.ts`,
      sourceUrl: `${REPO}/blob/main/packages/react-rtekit/src/meta.ts`,
      usedBy: [],
    },
    prose: {
      symbolDescription: '',
      optionDescriptions: Object.fromEntries(
        entries.map((entry) => [
          typeof entry === 'string' ? entry : entry.name,
          typeof entry === 'string' ? '' : (entry.description ?? ''),
        ]),
      ),
    },
  });
}

// ── usedBy, by inverting the capability pages' `symbols` frontmatter ─────────
const manifest = JSON.parse(
  await readFile(path.join(root, 'apps/site/src/content/manifest.json'), 'utf8'),
);
for (const page of manifest.pages) {
  for (const symbol of page.symbols) {
    const record = symbols.get(symbol);
    if (record) record.schema.usedBy.push(page.pathname);
  }
}

// ── write ────────────────────────────────────────────────────────────────────
await mkdir(here, { recursive: true });

const existingStrings = new Map();
for (const file of existsSync(here) ? await readdir(here) : []) {
  if (!file.endsWith('.strings.json')) continue;
  existingStrings.set(file, JSON.parse(await readFile(path.join(here, file), 'utf8')));
}

const checksums = {};
const index = {};
let seeded = 0;
let preserved = 0;

for (const [name, record] of symbols) {
  const slug = name.replace(/[^\w-]/g, '');
  const schemaFile = `${slug}.schema.json`;
  const stringsFile = `${slug}.strings.json`;

  // Structure: always overwritten, and checksummed so a hand-edit fails CI.
  const schemaBody = `${JSON.stringify(record.schema, null, 2)}\n`;
  await writeFile(path.join(here, schemaFile), schemaBody, 'utf8');
  checksums[schemaFile] = createHash('sha256').update(schemaBody).digest('hex');

  // Prose: only ever gains keys. An existing value is never replaced, whatever the
  // TSDoc now says — that is the whole point of the split (P6).
  const current = existingStrings.get(stringsFile) ?? {};
  const merged = {
    symbolDescription: current.symbolDescription ?? record.prose.symbolDescription,
    optionDescriptions: { ...record.prose.optionDescriptions, ...(current.optionDescriptions ?? {}) },
  };
  for (const key of Object.keys(record.prose.optionDescriptions)) {
    if (current.optionDescriptions?.[key] !== undefined) preserved += 1;
    else seeded += 1;
  }
  await writeFile(path.join(here, stringsFile), `${JSON.stringify(merged, null, 2)}\n`, 'utf8');

  index[name] = {
    page: `${NS}/api/${record.page}/`,
    kind: record.schema.kind,
    options: Object.keys(record.schema.options).length,
    usedBy: record.schema.usedBy,
    // A catalogue documents the library's own surface rather than one capability, so it
    // has no inbound `symbols` reference and is not an orphan (check 12).
    ...(record.catalogue ? { internal: true } : {}),
  };
}

await writeFile(path.join(here, 'index.json'), `${JSON.stringify(index, null, 2)}\n`, 'utf8');
await writeFile(path.join(here, 'checksums.json'), `${JSON.stringify(checksums, null, 2)}\n`, 'utf8');

const missingProse = Object.entries(index).filter(([name]) => {
  const slug = name.replace(/[^\w-]/g, '');
  const strings = JSON.parse(readFileSyncSafe(path.join(here, `${slug}.strings.json`)));
  return (strings.symbolDescription ?? '') === '';
});

function readFileSyncSafe(file) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- node builtin, sync read
  return require('node:fs').readFileSync(file, 'utf8');
}

process.stdout.write(
  `${symbols.size} symbols across ${new Set([...symbols.values()].map((r) => r.page)).size} pages\n` +
    `prose: ${seeded} seeded from TSDoc, ${preserved} preserved\n` +
    (missingProse.length > 0
      ? `warning: ${missingProse.length} symbols have no description yet\n`
      : ''),
);
