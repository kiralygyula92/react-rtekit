import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Writes `apps/site/vercel.json`.
 *
 * The router says of the legacy URLs: *"A browser cannot issue a 301 from script; the
 * static host does that, from the same table."* On GitHub Pages there is no host config,
 * so the client-side `LegacyRedirect` was all there was. Vercel can do it properly, and
 * this generates those rules from `redirects.json` — the same file the router compiles in
 * — so the redirect the host performs and the one the client would perform cannot
 * diverge. `url-map.csv` records them as 301s, and that is what they become.
 *
 * `LegacyRedirect` stays as the fallback: it is what makes a deep link work in
 * development, and on Pages it remains the only thing that works at all.
 *
 * Run: node content/vercel-config.mjs   (or `pnpm vercel:config`)
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

const table = JSON.parse(
  await readFile(path.join(root, 'apps/site/src/content/redirects.json'), 'utf8'),
);

const config = {
  $schema: 'https://openapi.vercel.sh/vercel.json',
  framework: 'vite',
  /*
   * Vercel's Root Directory is `apps/site`, so its own `build` runs — and that is
   * `vite build` alone. `react-rtekit` and `react-rtekit-rhf` are `link:` dependencies
   * that have to be built first, which is what the root script does and what CI runs
   * before `build:site`.
   */
  buildCommand: 'pnpm -w run build && pnpm run build',
  outputDirectory: 'dist',
  /*
   * Canonical URLs carry a trailing slash (PPDS R4), which is how every `pathname` in the
   * manifest and every `<loc>` in the sitemap is spelled. Declaring it keeps the host from
   * inventing a second spelling of each page, and — because PPDS §7.7 also publishes a
   * Markdown twin at `installation.md`, directly beside the `installation/` route — it
   * keeps a page URL from resolving to raw Markdown. `cleanUrls` is off for the same
   * reason: nothing should be guessing at extensions next to those twins.
   */
  trailingSlash: true,
  cleanUrls: false,
  redirects: Object.entries(table)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([source, destination]) => ({ source, destination, permanent: true })),
  /*
   * The SPA fallback. Rewrites are applied after the filesystem check, so hashed assets
   * and the Markdown twins still serve as files. `_vercel/` is excluded because that is
   * where the analytics scripts live, and a catch-all would answer those requests with
   * the application's HTML.
   */
  rewrites: [{ source: '/((?!_vercel/).*)', destination: '/index.html' }],
};

const file = path.join(root, 'apps/site/vercel.json');
await writeFile(file, `${JSON.stringify(config, null, 2)}\n`, 'utf8');

process.stdout.write(`vercel.json: ${config.redirects.length} redirects, trailing slash on\n`);
