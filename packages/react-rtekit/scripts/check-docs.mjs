/**
 * Fails the build when a public symbol has no TSDoc description.
 *
 * Reads the TypeDoc JSON produced by `pnpm docs:json`, walks every exported
 * declaration and reports anything without a `comment.summary`.
 *
 * Two levels:
 *
 * - default: every top-level exported declaration must be described. This is the gate
 *   from milestone 0 onwards.
 * - `--strict` (or `RTEKIT_DOCS_STRICT=1`): every interface member too. Milestone 5
 *   turns this on for CI, once the generated API pages exist and each props table
 *   needs real prose per row. Writing filler now would make the pages worse, not
 *   better, so the level is explicit rather than silently lax.
 */
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const apiJson = path.join(root, 'api.json');
const strict = process.argv.includes('--strict') || process.env.RTEKIT_DOCS_STRICT === '1';

/** TypeDoc reflection kinds. */
const KIND = {
  Module: 2,
  Enum: 8,
  EnumMember: 16,
  Variable: 32,
  Function: 64,
  Class: 128,
  Interface: 256,
  Property: 1024,
  Method: 2048,
  TypeAlias: 2097152,
  Reference: 4194304,
};

/** Top-level declarations: always required to carry a description. */
const TOP_LEVEL_KINDS = new Set([
  KIND.Class,
  KIND.Interface,
  KIND.Function,
  KIND.TypeAlias,
  KIND.Variable,
  KIND.Enum,
]);

/** Members: required only in strict mode. */
const MEMBER_KINDS = new Set([KIND.Property, KIND.Method, KIND.EnumMember]);

/** Containers whose members carry their own meaning rather than the parent's. */
const CONTAINER_KINDS = new Set([KIND.Class, KIND.Interface, KIND.Enum, KIND.Module]);

function hasOwnSummary(node) {
  return (
    Array.isArray(node.comment?.summary) && node.comment.summary.some((part) => part.text?.trim())
  );
}

/**
 * TypeDoc attaches a function's or method's doc comment to its call signature rather
 * than to the declaration, so both places count as documented.
 */
function hasSummary(node) {
  if (hasOwnSummary(node)) return true;
  return (node.signatures ?? []).some(hasOwnSummary);
}

function isExempt(node) {
  return (
    Boolean(node.inheritedFrom) ||
    node.comment?.blockTags?.some((tag) => tag.tag === '@internal') === true ||
    !node.name ||
    node.name.startsWith('__')
  );
}

function collect(node, parent, missing, seen) {
  if (!node || typeof node !== 'object') return;
  if (seen.has(node)) return;
  seen.add(node);

  // A re-export points at a declaration that is checked in its own module.
  if (node.kind === KIND.Reference) return;

  const isTopLevel = TOP_LEVEL_KINDS.has(node.kind);
  const isMember = MEMBER_KINDS.has(node.kind) && parent && CONTAINER_KINDS.has(parent.kind);
  const required = isTopLevel || (strict && isMember);

  if (required && !isExempt(node) && !hasSummary(node)) {
    const where = node.sources?.[0];
    missing.push({
      name: isMember && parent?.name ? `${parent.name}.${node.name}` : node.name,
      file: where ? `${where.fileName}:${where.line}` : 'unknown',
    });
  }

  for (const child of node.children ?? []) collect(child, node, missing, seen);
}

async function main() {
  if (!existsSync(apiJson)) {
    console.error(`api.json not found at ${apiJson}. Run "pnpm docs:json" first.`);
    process.exit(1);
  }

  const doc = JSON.parse(await readFile(apiJson, 'utf8'));
  const missing = [];
  collect(doc, null, missing, new WeakSet());

  // The same symbol is reachable from several entry points; report each name once.
  const unique = [...new Map(missing.map((entry) => [entry.name, entry])).values()];

  if (unique.length > 0) {
    console.error(
      `${unique.length} public symbol(s) have no TSDoc description (${
        strict ? 'strict' : 'top-level'
      } mode):\n`,
    );
    for (const entry of unique.slice(0, 100)) {
      console.error(`  ${entry.name}  (${entry.file})`);
    }
    if (unique.length > 100) console.error(`  ... and ${unique.length - 100} more`);
    process.exit(1);
  }

  process.stdout.write(
    `All public symbols are documented (${strict ? 'strict' : 'top-level'} mode).\n`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
