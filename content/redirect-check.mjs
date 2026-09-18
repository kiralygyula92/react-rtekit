import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Verifies every legacy redirect against a running site, not against the config.
 *
 * The config is what the site *intends*; this is what it does. The two can differ, and
 * on a client-rendered SPA they differ silently — every URL answers 200 with the
 * application shell, so a check that reads status codes reports a perfect score on a
 * site whose redirects are all broken. Each entry here loads the URL in a browser and
 * checks where the address bar ended up, and that a page rendered there.
 *
 * Reads `redirects.json`, the table the router and `vercel.json` are both built from, so
 * what is checked is exactly what is served.
 *
 * Run against a running preview:
 *   pnpm --filter @react-rtekit/site preview &
 *   node content/redirect-check.mjs
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const require = createRequire(path.resolve(root, 'apps/site/package.json'));
const { chromium } = require('@playwright/test');

const BASE = process.env.CHECK_BASE ?? 'http://localhost:4189';

const table = JSON.parse(
  await readFile(path.join(root, 'apps/site/src/content/redirects.json'), 'utf8'),
);

const browser = await chromium.launch();
const page = await browser.newPage();
let failed = 0;

for (const [from, to] of Object.entries(table).sort(([a], [b]) => a.localeCompare(b))) {
  await page.goto(`${BASE}${from}`, { waitUntil: 'networkidle' });
  // The router replaces rather than pushes, so this is the settled address.
  const landed = new URL(page.url()).pathname;
  const heading = await page
    .locator('h1')
    .first()
    .innerText()
    .catch(() => '');

  const ok = landed === to && heading !== '';
  if (!ok) failed += 1;
  process.stdout.write(`${ok ? '✓' : '✗'} ${from} -> ${landed}${ok ? '' : ` (expected ${to})`}\n`);
}

await browser.close();

process.stdout.write(
  `\n${Object.keys(table).length} redirects checked in a browser · ${failed} failed\n`,
);
process.exit(failed > 0 ? 1 : 0);
