import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Turns `audit/crawl.json` into the Phase 1 CSVs.
 *
 * Classification (brief §1.2) is by route shape, because on this site route shape *is*
 * content type: every guide lives under `/docs/guides/`, every demo under `/examples/`,
 * every generated table under `/api/`. Where a page does not fit the brief's ten types
 * the mapping says so rather than forcing it, and the mismatch is recorded in GAPS.md.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

/** The source file behind a route, for `git log` and for the Edit-this-page link. */
function sourceFor(route) {
  if (route === '/') return 'apps/site/src/routes/Home.tsx';
  if (route === '/docs') return 'apps/site/src/guides/getting-started.tsx';
  if (route.startsWith('/docs/guides/')) {
    return `apps/site/src/guides/${route.slice('/docs/guides/'.length)}.tsx`;
  }
  if (route === '/examples') return 'apps/site/src/routes/ExamplesGallery.tsx';
  if (route.startsWith('/examples/')) {
    return `apps/site/src/examples/${route.slice('/examples/'.length)}/index.tsx`;
  }
  if (route === '/api') return 'apps/site/src/routes/ApiIndex.tsx';
  if (route.startsWith('/api/')) return 'apps/site/src/routes/ApiPage.tsx';
  if (route === '/playground') return 'apps/site/src/routes/Playground.tsx';
  if (route === '/theme-editor') return 'apps/site/src/routes/ThemeEditor.tsx';
  if (route === '/changelog') return 'apps/site/src/routes/Changelog.tsx';
  if (route === '/internal/performance') return 'apps/site/src/routes/Performance.tsx';
  return '';
}

/**
 * Content type, from the brief's ten-value vocabulary.
 *
 * `tool` is not in that vocabulary. The playground and the theme editor are neither
 * documentation nor marketing — they are interactive instruments — and calling either
 * `capability` would misreport what the page is. The deviation is logged in GAPS.md.
 */
function classify(route) {
  if (route === '/') return 'marketing';
  if (route === '/changelog') return 'changelog';
  if (route === '/internal/performance') return 'orphan';
  if (route === '/playground' || route === '/theme-editor') return 'tool';
  if (route === '/docs' || route === '/docs/guides/getting-started') return 'install';
  if (route.startsWith('/docs/')) return 'how-to';
  if (route === '/examples' || route.startsWith('/examples/')) return 'capability';
  if (route === '/api' || route.startsWith('/api/')) return 'reference';
  return 'orphan';
}

/** ISO date of the last commit touching `file`, or '' when there is no such file. */
function lastModified(file) {
  if (file === '' || !existsSync(path.join(root, file))) return '';
  try {
    return execFileSync('git', ['log', '-1', '--format=%cs', '--', file], {
      cwd: root,
      encoding: 'utf8',
    }).trim();
  } catch {
    return '';
  }
}

/** One CSV field, quoted when it has to be. */
function cell(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function csv(header, rows) {
  return [header, ...rows].map((row) => row.map(cell).join(',')).join('\n') + '\n';
}

const pages = JSON.parse(await readFile(path.join(here, 'crawl.json'), 'utf8'));

// ── pages.csv ────────────────────────────────────────────────────────────────
const pageRows = pages.map((page) => {
  const source = sourceFor(page.route);
  return [
    page.route,
    page.status,
    classify(page.route),
    page.title,
    page.h1,
    page.words,
    page.h2Count,
    page.h3Count,
    page.liveDemos,
    page.inbound,
    page.inboundContent,
    page.inboundContentFrom.join(' '),
    page.canonical === '' ? 'no' : 'yes',
    page.ogTags > 0 ? 'yes' : 'no',
    source,
    lastModified(source),
  ];
});

await writeFile(
  path.join(here, 'pages.csv'),
  csv(
    [
      'url',
      'status',
      'content_type',
      'page_title',
      'h1',
      'word_count',
      'h2_count',
      'h3_count',
      'live_demos',
      'inbound_links_total',
      'inbound_links_in_content',
      'inbound_from_content',
      'has_canonical',
      'has_og',
      'source_file',
      'last_modified',
    ],
    pageRows,
  ),
  'utf8',
);

// ── assets.csv ───────────────────────────────────────────────────────────────
/*
 * Every demo, screenshot and video the site has.
 *
 * The site's demos are live React components, not recordings: there is no screenshot or
 * video anywhere in the published output. The six PNGs below are Playwright regression
 * snapshots — test fixtures, never served — and they are listed because the brief asks
 * for every asset and what it demonstrates, and because they are the only visual record
 * of the classic preset that exists.
 */
const examplesDir = path.join(root, 'apps/site/src/examples');
const assetRows = [];

for (const entry of await readdir(examplesDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const metaFile = path.join(examplesDir, entry.name, 'meta.ts');
  if (!existsSync(metaFile)) continue;
  const source = await readFile(metaFile, 'utf8');
  const field = (key) =>
    (source.match(new RegExp(`${key}:\\s*'([^']*)'`)) ??
      source.match(new RegExp(`${key}:\\s*"([^"]*)"`)) ??
      [])[1] ?? '';
  const crawled = pages.find((page) => page.route === `/examples/${entry.name}`);
  assetRows.push([
    `/examples/${entry.name}`,
    'live-demo',
    field('title'),
    field('description'),
    `apps/site/src/examples/${entry.name}/index.tsx`,
    crawled?.liveDemos ?? 0,
    'yes',
    'yes',
    'no',
    'no',
    lastModified(`apps/site/src/examples/${entry.name}/index.tsx`),
  ]);
}

for (const tool of ['playground', 'theme-editor']) {
  const crawled = pages.find((page) => page.route === `/${tool}`);
  assetRows.push([
    `/${tool}`,
    'live-tool',
    crawled?.h1 ?? '',
    'Interactive configuration surface, not tied to one capability.',
    sourceFor(`/${tool}`),
    crawled?.liveDemos ?? 0,
    'no',
    tool === 'playground' ? 'yes' : 'yes',
    'no',
    'no',
    lastModified(sourceFor(`/${tool}`)),
  ]);
}

const snapshotDir = path.join(root, 'apps/site/e2e/visual.spec.ts-snapshots');
if (existsSync(snapshotDir)) {
  for (const file of await readdir(snapshotDir)) {
    assetRows.push([
      '(not served)',
      'test-snapshot',
      file.replace(/-chromium-win32\.png$/, ''),
      'Visual regression fixture for the classic preset; never published.',
      `apps/site/e2e/visual.spec.ts-snapshots/${file}`,
      0,
      'n/a',
      'n/a',
      'n/a',
      'n/a',
      lastModified(`apps/site/e2e/visual.spec.ts-snapshots/${file}`),
    ]);
  }
}

await writeFile(
  path.join(here, 'assets.csv'),
  csv(
    [
      'url',
      'asset_type',
      'title',
      'demonstrates',
      'source_file',
      'live_editors_on_page',
      'has_copy',
      'has_source_toggle',
      'has_sandbox',
      'has_reset',
      'last_modified',
    ],
    assetRows,
  ),
  'utf8',
);

// ── summary, for the GAPS write-up ───────────────────────────────────────────
const byType = {};
for (const page of pages) {
  const type = classify(page.route);
  byType[type] = (byType[type] ?? 0) + 1;
}
const descriptions = new Set(pages.map((page) => page.description));
const overLong = pages.filter((page) => page.words > 2000 || page.h2Count > 8);

process.stdout.write(
  `${JSON.stringify(
    {
      pages: pages.length,
      byType,
      distinctDescriptions: descriptions.size,
      withCanonical: pages.filter((page) => page.canonical !== '').length,
      withOg: pages.filter((page) => page.ogTags > 0).length,
      noInboundAtAll: pages.filter((page) => page.inbound === 0).map((page) => page.route),
      noInboundFromContent: pages
        .filter((page) => page.inboundContent === 0)
        .map((page) => page.route),
      overLong: overLong.map((page) => `${page.route} (${page.words}w, ${page.h2Count} H2)`),
      withLiveDemo: pages.filter((page) => page.liveDemos > 0).length,
    },
    null,
    2,
  )}\n`,
);
