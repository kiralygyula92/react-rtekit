import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Writes `apps/site/vercel.json`.
 *
 * A browser cannot issue a 301 from script, so the legacy redirects are the host's job.
 * This generates them from `redirects.json`, the same file the router compiles in, so
 * the redirect the host performs and the one the client would perform cannot diverge.
 * They are permanent, so they are 301s.
 *
 * The router's `LegacyRedirect` stays as the fallback that makes a deep link work in
 * development.
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
   * Canonical URLs carry a trailing slash, which is how every `pathname` in the manifest
   * and every `<loc>` in the sitemap is spelled. Declaring it keeps the host from
   * inventing a second spelling of each page, and — because every page also has a
   * Markdown twin at `installation.md`, directly beside the `installation/` route — it
   * keeps a page URL from resolving to raw Markdown. `cleanUrls` is off for the same
   * reason: nothing should be guessing at extensions next to those twins.
   */
  trailingSlash: true,
  cleanUrls: false,
  /*
   * Sources carry the trailing slash. Vercel adds the slash (its own 308) before it looks
   * at these rules, so a rule written as `/examples/tables` never matched anything: the
   * request had already become `/examples/tables/`. A legacy URL is now two hops, slash
   * then target, and both are permanent.
   */
  redirects: Object.entries(table)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([source, destination]) => ({
      source: source.endsWith('/') ? source : `${source}/`,
      destination,
      permanent: true,
    })),
  /*
   * No SPA rewrite. Every page is built to its own `<page>/index.html` (see the site's
   * `vite.config.ts`), so a real page is a real file, and anything else falls through to
   * `404.html` with a 404 status. A catch-all rewrite used to answer every URL with the
   * application and a 200, including `/og/*.png` and `/robots.txt`, so crawlers indexed
   * "not found" pages and link previews got HTML where they asked for an image.
   */
  headers: [
    {
      // Content-hashed file names: a changed file is a new URL, so these never go stale.
      source: '/assets/(.*)',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
    },
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    },
  ],
};

const file = path.join(root, 'apps/site/vercel.json');
await writeFile(file, `${JSON.stringify(config, null, 2)}\n`, 'utf8');

process.stdout.write(`vercel.json: ${config.redirects.length} redirects, trailing slash on\n`);
