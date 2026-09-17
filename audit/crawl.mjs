import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The Phase 1 crawl (PPDS brief §1.1).
 *
 * Walks the built site from `/`, following every internal link, and records what each
 * page actually renders rather than what its source suggests it renders. The site is a
 * client-rendered SPA whose content is JSX, so a static read of the repository would be
 * guessing at word counts and heading text; this asks the browser.
 *
 * Run against a running preview server:
 *   pnpm --filter @react-rtekit/site preview &
 *   node audit/crawl.mjs
 *
 * Writes `audit/crawl.json`, which `audit/report.mjs` turns into the CSVs.
 */

const BASE = process.env.CRAWL_BASE ?? 'http://localhost:4189';
const here = path.dirname(fileURLToPath(import.meta.url));

// Resolved from the site package, which is where Playwright is installed; this script
// lives outside any workspace package so its own directory resolves nothing.
const { chromium } = createRequire(path.resolve(here, '../apps/site/package.json'))(
  '@playwright/test',
);

/**
 * Routes the router serves but nothing links to.
 *
 * Seeded by hand because a crawl by definition cannot reach them. `/changelog` being
 * here is a finding, not a convenience: it is a real page, built and rendered, with no
 * route into it from anywhere on the site.
 */
const UNLINKED = ['/internal/performance', '/changelog'];

/** Normalizes a URL to a path with a trailing-slash-free, query-free form. */
function toPath(href) {
  try {
    const url = new URL(href, BASE);
    if (url.origin !== new URL(BASE).origin) return null;
    return url.pathname.replace(/\/+$/, '') || '/';
  } catch {
    return null;
  }
}

const browser = await chromium.launch();
const page = await browser.newPage();

const queue = ['/', ...UNLINKED];
const seen = new Set(queue);
/** pathname -> { count, from: Set } */
const inbound = new Map();
const records = [];

while (queue.length > 0) {
  const route = queue.shift();
  const response = await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });

  // The editors mount asynchronously; without this the word count misses their content.
  await page.waitForTimeout(350);

  const data = await page.evaluate(() => {
    const main = document.querySelector('main') ?? document.body;
    const h1s = [...document.querySelectorAll('h1')].map((node) => node.textContent?.trim() ?? '');
    const headings = [...main.querySelectorAll('h2, h3')].map((node) => ({
      level: node.tagName,
      text: node.textContent?.trim() ?? '',
    }));
    const text = (main.innerText ?? '').replace(/\s+/g, ' ').trim();
    return {
      title: document.title,
      h1: h1s[0] ?? '',
      h1Count: h1s.length,
      words: text === '' ? 0 : text.split(' ').length,
      h2Count: headings.filter((h) => h.level === 'H2').length,
      h3Count: headings.filter((h) => h.level === 'H3').length,
      headings: headings.map((h) => `${h.level}:${h.text}`),
      description:
        document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '',
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? '',
      og: [...document.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"]')].map(
        (node) => node.getAttribute('property') ?? node.getAttribute('name'),
      ),
      demos: document.querySelectorAll('[contenteditable="true"]').length,
      links: [...document.querySelectorAll('a[href]')].map((node) => node.getAttribute('href')),
      // Links inside the article, as opposed to the header, sidebar and footer that
      // every page carries. Counting the chrome makes every page look equally
      // well-linked — 80 inbound links each — which is exactly the signal the brief
      // wants inbound counts for, destroyed.
      contentLinks: [...(document.querySelector('main')?.querySelectorAll('a[href]') ?? [])]
        .filter((node) => node.closest('nav, header, footer, .sidebar') === null)
        .map((node) => node.getAttribute('href')),
    };
  });

  const outgoing = new Set();
  for (const href of data.links) {
    const target = toPath(href);
    if (target === null) continue;
    outgoing.add(target);
    if (!seen.has(target)) {
      seen.add(target);
      queue.push(target);
    }
  }

  const outgoingContent = new Set();
  for (const href of data.contentLinks) {
    const target = toPath(href);
    if (target !== null) outgoingContent.add(target);
  }

  for (const target of outgoing) {
    if (target === route) continue;
    const entry = inbound.get(target) ?? { from: new Set(), fromContent: new Set() };
    entry.from.add(route);
    if (outgoingContent.has(target)) entry.fromContent.add(route);
    inbound.set(target, entry);
  }

  records.push({
    route,
    status: response?.status() ?? 0,
    title: data.title,
    h1: data.h1,
    h1Count: data.h1Count,
    words: data.words,
    h2Count: data.h2Count,
    h3Count: data.h3Count,
    headings: data.headings,
    description: data.description,
    canonical: data.canonical,
    ogTags: data.og.length,
    liveDemos: data.demos,
    outgoing: [...outgoing],
  });

  process.stdout.write(`${route} · ${data.words}w · ${outgoing.size} links\n`);
}

await browser.close();

for (const record of records) {
  const entry = inbound.get(record.route);
  record.inboundFrom = [...(entry?.from ?? [])].sort();
  record.inbound = record.inboundFrom.length;
  record.inboundContentFrom = [...(entry?.fromContent ?? [])].sort();
  record.inboundContent = record.inboundContentFrom.length;
}
records.sort((a, b) => a.route.localeCompare(b.route));

await mkdir(here, { recursive: true });
await writeFile(path.join(here, 'crawl.json'), `${JSON.stringify(records, null, 2)}\n`, 'utf8');
process.stdout.write(`\n${records.length} pages -> audit/crawl.json\n`);
