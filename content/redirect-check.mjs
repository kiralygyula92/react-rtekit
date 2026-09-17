import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Verifies every redirect against a running site, not against the config (brief §6.7).
 *
 * The config is what the site *intends*; this is what it does. The two can differ, and
 * on a client-rendered SPA they differ silently — every URL answers 200 with the
 * application shell, so a check that reads status codes reports a perfect score on a
 * site whose redirects are all broken. Each row here loads the URL in a browser and
 * records where the address bar ended up.
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

const rows = (await readFile(path.join(here, 'react-rtekit/migration/url-map.csv'), 'utf8'))
  .trim()
  .split('\n')
  .slice(1)
  .map((line) => line.match(/(".*?"|[^,]*)(,|$)/g)?.map((cell) => cell.replace(/,$/, '').replace(/^"|"$/g, '')) ?? []);

const browser = await chromium.launch();
const page = await browser.newPage();
const results = [];

for (const [from, , , to, action, note] of rows) {
  if (!from) continue;
  await page.goto(`${BASE}${from}`, { waitUntil: 'networkidle' });
  // The router replaces rather than pushes, so this is the settled address.
  const landed = new URL(page.url()).pathname;
  const heading = await page
    .locator('h1')
    .first()
    .innerText()
    .catch(() => '');

  const expected = note === '(same URL)' ? from : to;
  const ok = landed === expected && heading !== '';
  results.push({ from, expected, landed, heading, action, ok });
  process.stdout.write(`${ok ? '✓' : '✗'} ${from} -> ${landed}\n`);
}

await browser.close();

const cell = (value) => (/[",]/.test(String(value)) ? `"${String(value).replace(/"/g, '""')}"` : String(value));
const csv = [
  ['legacy_url', 'expected', 'landed', 'h1_on_arrival', 'action', 'result'],
  ...results.map((row) => [row.from, row.expected, row.landed, row.heading, row.action, row.ok ? 'pass' : 'FAIL']),
]
  .map((row) => row.map(cell).join(','))
  .join('\n');

await mkdir(path.join(root, 'qa'), { recursive: true });
await writeFile(path.join(root, 'qa/redirect-check.csv'), `${csv}\n`, 'utf8');

const failed = results.filter((row) => !row.ok);
process.stdout.write(
  `\n${results.length} redirects checked in a browser · ${failed.length} failed\n`,
);
process.exit(failed.length > 0 ? 1 : 0);
