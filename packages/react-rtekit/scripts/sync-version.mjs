import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Writes `src/version.ts` from `package.json`.
 *
 * `VERSION` is a real export — the site prints it, `react-rtekit/meta` carries it, and
 * a bug report that says "0.0.0" is a bug report nobody can act on. Nothing injected it
 * before: the constant was a literal with a comment claiming otherwise, so it would
 * have stayed at `0.0.0` through every release.
 *
 * Generated at build time rather than read from `package.json` at runtime, because the
 * package has no runtime access to its own manifest in every environment it supports —
 * a bundler, a worker and a Node ESM loader all disagree about that.
 *
 * Run by `prebuild`. `version.test.ts` fails if the checked-in file and the manifest
 * ever disagree, which is what catches a `changeset version` that has not been built.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const manifest = path.resolve(here, '../package.json');
const target = path.resolve(here, '../src/version.ts');

const { version } = JSON.parse(await readFile(manifest, 'utf8'));

const contents = `/**
 * The package version.
 *
 * Generated from \`package.json\` by \`scripts/sync-version.mjs\`; edit that, not this.
 *
 * @group Metadata
 */
export const VERSION = '${version}';
`;

const current = await readFile(target, 'utf8').catch(() => '');
if (current !== contents) {
  await writeFile(target, contents, 'utf8');
  process.stdout.write(`version.ts -> ${version}\n`);
}
