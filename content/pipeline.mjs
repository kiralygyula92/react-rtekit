import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Runs the content steps in the one order that works.
 *
 * The dependency is circular by nature and resolved by running the compile twice:
 *
 *   1. build      Markdown -> manifest, so the generator can see each page's `symbols`
 *   2. generate   TypeDoc + metadata -> reference schema/strings, inverting `symbols`
 *                 into `usedBy`
 *   3. render     the generated reference into the API pages' Markdown
 *   4. build      again, because step 3 changed those Markdown files
 *
 * Running `generate` before `build` reads yesterday's manifest and silently produces an
 * empty `usedBy` on every symbol, which is a failure that looks like a success.
 *
 * Run: node content/pipeline.mjs
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

const STEPS = [
  ['content/build.mjs', 'compile Markdown'],
  ['content/react-rtekit/reference/generate.mjs', 'generate reference'],
  ['content/react-rtekit/reference/render.mjs', 'render reference into pages'],
  ['content/build.mjs', 'recompile'],
  // Last, and from the compiled redirect table rather than the CSV, so the host's 301s
  // and the router's client-side fallback are the same list.
  ['content/vercel-config.mjs', 'write vercel.json'],
];

for (const [script, label] of STEPS) {
  const result = spawnSync(process.execPath, [script], { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) {
    process.stderr.write(`${label} failed:\n${result.stderr || result.stdout}\n`);
    process.exit(result.status ?? 1);
  }
  process.stdout.write(`  ${label}: ${result.stdout.trim().split('\n').join(' · ')}\n`);
}
