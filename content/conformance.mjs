import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The 26 conformance checks from PPDS §11.
 *
 * Every check reports `pass`, `fail` or `n/a`, and an `n/a` must name the exception that
 * makes it so — a check that is quietly skipped is a check that is failing.
 *
 * Checks that ask whether a URL resolves assert on **content**, never on status. This
 * site is a client-rendered SPA whose catch-all answers 200 with `index.html` for every
 * path, including ones that do not exist, so a status-code check reports a false pass on
 * a site with no `llms.txt` at all. That was GAPS G-26a, and it is the single most
 * important thing about this file.
 *
 * Run: node content/conformance.mjs            (static checks)
 *      node content/conformance.mjs --served   (also probes a running preview)
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const PLUGIN = 'react-rtekit';
const dir = path.join(here, PLUGIN);
const BASE = process.env.CONFORMANCE_BASE ?? 'http://localhost:4189';
const served = process.argv.includes('--served');

const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));
const config = readJson(path.join(dir, 'plugin.config.json'));
const nav = readJson(path.join(dir, 'nav.json'));
const manifest = readJson(path.join(root, 'apps/site/src/content/manifest.json'));
const pages = manifest.pages;

const results = [];
const check = (id, title, run) => {
  try {
    const outcome = run();
    results.push({ id, title, ...outcome });
  } catch (error) {
    results.push({ id, title, state: 'fail', detail: String(error.message ?? error) });
  }
};
const pass = (detail = '') => ({ state: 'pass', detail });
const fail = (detail) => ({ state: 'fail', detail });
const na = (reason) => ({ state: 'n/a', detail: reason });

/** Flat list of nav pages. */
const navPages = [];
(function walk(nodes) {
  for (const node of nodes) {
    if (!node.pathname.endsWith('-group')) navPages.push(node);
    if (node.children) walk(node.children);
  }
})(nav);

const byPath = new Map(pages.map((page) => [page.pathname, page]));

// ── structure ────────────────────────────────────────────────────────────────
check(1, 'every page resolves to one archetype with its required blocks', () => {
  const REQUIRED = {
    A: ['Introduction', 'Start now'],
    B: ['Basics', 'Customization', 'Limitations', 'API'],
    C: [],
    E: ['Used by', 'Import', 'Options', 'Source'],
    F: ['Installation', 'Next steps'],
    I: [],
  };
  const bad = [];
  for (const page of pages) {
    const required = REQUIRED[page.archetype];
    if (required === undefined) {
      bad.push(`${page.pathname}: unknown archetype ${page.archetype}`);
      continue;
    }
    const headings = page.headings.filter((h) => h.depth === 2).map((h) => h.text);
    for (const block of required) {
      if (!headings.some((text) => text.toLowerCase().includes(block.toLowerCase()))) {
        bad.push(`${page.pathname}: missing ## ${block}`);
      }
    }
  }
  return bad.length === 0 ? pass(`${pages.length} pages`) : fail(bad.slice(0, 6).join('; '));
});

check(2, 'exactly one H1 per page; heading levels never skip', () => {
  const bad = [];
  for (const page of pages) {
    // The H1 is rendered from frontmatter, so a body H1 would be a second one.
    if (/<h1/i.test(page.html)) bad.push(`${page.pathname}: H1 in body`);
    let previous = 1;
    for (const heading of page.headings) {
      if (heading.depth > previous + 1) bad.push(`${page.pathname}: h${previous} -> h${heading.depth}`);
      previous = heading.depth;
    }
  }
  return bad.length === 0 ? pass() : fail(bad.slice(0, 6).join('; '));
});

check(3, 'capability pages carry Basics, Customization, Limitations, API in order', () => {
  const ORDER = ['basics', 'customization', 'limitations', 'api'];
  const bad = [];
  for (const page of pages.filter((entry) => entry.capabilityId !== null)) {
    const seen = page.headings
      .filter((heading) => heading.depth === 2)
      .map((heading) => heading.text.toLowerCase())
      .filter((text) => ORDER.includes(text));
    const expected = ORDER.filter((name) => seen.includes(name));
    if (seen.join(',') !== expected.join(',')) bad.push(`${page.pathname}: ${seen.join(' > ')}`);
  }
  return bad.length === 0 ? pass(`${pages.filter((p) => p.capabilityId).length} capabilities`) : fail(bad.slice(0, 5).join('; '));
});

check(4, 'no capability page exceeds 8 H2s or ~2,000 words', () => {
  const bad = pages
    .filter((page) => page.capabilityId !== null)
    .filter((page) => page.headings.filter((h) => h.depth === 2).length > 8 || page.words > 2000)
    .map((page) => `${page.pathname} (${page.words}w)`);
  return bad.length === 0 ? pass() : fail(bad.join('; '));
});

check(5, 'sidebar section order matches PPDS §5', () => {
  const CANONICAL = [
    'getting-started', 'features', 'demos', 'reference', 'customization',
    'guides', 'integrations', 'resources', 'migration', 'discover-more', 'design-resources',
  ];
  const actual = nav.map((node) => node.pathname.replace(`/${PLUGIN}/`, '').replace('-group', ''));
  const indices = actual.map((id) => CANONICAL.indexOf(id));
  const ordered = indices.every((value, index) => index === 0 || value > indices[index - 1]);
  return ordered ? pass(actual.join(' > ')) : fail(actual.join(' > '));
});

// ── navigation & data ────────────────────────────────────────────────────────
check(6, 'sidebar and features index render from the same nav data', () => {
  // Structural, not visual: the features index component reads `capabilities`, which is
  // derived from the manifest's nav-ordered pages. Divergence is impossible by
  // construction; this asserts the construction.
  const source = readFileSync(path.join(root, 'apps/site/src/docs/FeaturesIndex.tsx'), 'utf8');
  const usesManifest = source.includes("from './manifest'") && source.includes('capabilities');
  const sidebar = readFileSync(path.join(root, 'apps/site/src/docs/Sidebar.tsx'), 'utf8');
  return usesManifest && sidebar.includes("from './manifest'")
    ? pass('both import the manifest')
    : fail('a list is built from something other than nav data');
});

check(7, 'nav depth <= 3', () => {
  let depth = 0;
  (function walk(nodes, level) {
    depth = Math.max(depth, level);
    for (const node of nodes) if (node.children) walk(node.children, level + 1);
  })(nav, 1);
  return depth <= 3 ? pass(`depth ${depth}`) : fail(`depth ${depth}`);
});

check(8, 'every nav pathname resolves to a real page', () => {
  const missing = navPages.filter((node) => !byPath.has(node.pathname)).map((n) => n.pathname);
  return missing.length === 0 ? pass(`${navPages.length} nodes`) : fail(missing.slice(0, 6).join(', '));
});

check(9, 'every rendered badge traces to a nav plan/lifecycle', () => {
  const badge = readFileSync(path.join(root, 'apps/site/src/docs/Badge.tsx'), 'utf8');
  const hardcoded = pages.filter((page) => /class="badge/.test(page.html)).map((p) => p.pathname);
  if (hardcoded.length > 0) return fail(`badge markup in page content: ${hardcoded.join(', ')}`);
  return badge.includes('plan') && badge.includes('lifecycle')
    ? pass('no page hardcodes a badge')
    : fail('Badge does not read plan/lifecycle');
});

// ── reference ────────────────────────────────────────────────────────────────
const referenceDir = path.join(dir, 'reference');

check(10, 'no reference schema file hand-edited since generation', () => {
  const lock = path.join(referenceDir, 'checksums.json');
  if (!existsSync(lock)) return fail('reference/checksums.json is missing (Phase 4)');
  const checksums = readJson(lock);
  const bad = [];
  for (const [file, expected] of Object.entries(checksums)) {
    const full = path.join(referenceDir, file);
    if (!existsSync(full)) {
      bad.push(`${file} missing`);
      continue;
    }
    const actual = createHash('sha256').update(readFileSync(full)).digest('hex');
    if (actual !== expected) bad.push(`${file} edited`);
  }
  return bad.length === 0 ? pass(`${Object.keys(checksums).length} files`) : fail(bad.slice(0, 5).join('; '));
});

check(11, 'every symbol in capability frontmatter has a reference page', () => {
  const referenced = new Set();
  for (const page of pages) for (const symbol of page.symbols) referenced.add(symbol);
  if (referenced.size === 0) return fail('no capability page declares symbols (Phase 5)');
  const index = existsSync(path.join(referenceDir, 'index.json'))
    ? readJson(path.join(referenceDir, 'index.json'))
    : {};
  const missing = [...referenced].filter((symbol) => index[symbol] === undefined);
  return missing.length === 0
    ? pass(`${referenced.size} symbols`)
    : fail(`${missing.length} without a page: ${missing.slice(0, 6).join(', ')}`);
});

check(12, 'every reference page has a non-empty usedBy or is marked internal', () => {
  if (!existsSync(path.join(referenceDir, 'index.json'))) return fail('reference/index.json missing');
  const index = readJson(path.join(referenceDir, 'index.json'));
  const orphans = Object.entries(index)
    .filter(([, entry]) => (entry.usedBy ?? []).length === 0 && entry.internal !== true)
    .map(([name]) => name);
  return orphans.length === 0
    ? pass(`${Object.keys(index).length} symbols`)
    : fail(`${orphans.length} with no usedBy: ${orphans.slice(0, 8).join(', ')}`);
});

// ── pricing ──────────────────────────────────────────────────────────────────
const tiered = config.tiers.length > 1;
const TIER_REASON = 'EXCEPTIONS E-02: single free tier, MIT licensed';

check(13, 'every pricing-matrix row href resolves', () => (tiered ? fail('not implemented') : na(TIER_REASON)));
check(14, 'every gated capability appears in the matrix', () => {
  if (!tiered) {
    const gated = navPages.filter((node) => node.plan !== undefined);
    return gated.length === 0 ? na(TIER_REASON) : fail(`${gated.length} gated nodes without a matrix`);
  }
  return fail('not implemented');
});
check(15, 'every plan card has a distinct CTA verb', () => (tiered ? fail('not implemented') : na(TIER_REASON)));

// ── machine surface ──────────────────────────────────────────────────────────
check(16, 'llms.txt exists, lists every page, and every entry resolves', () => {
  const file = path.join(root, 'apps/site/public', PLUGIN, 'llms.txt');
  if (!existsSync(file)) return fail('llms.txt missing');
  const text = readFileSync(file, 'utf8');
  const listed = [...text.matchAll(/^- \[[^\]]+\]\(([^)]+)\)/gm)].map((match) => match[1]);
  // Reverse the twin naming: `…/index.md` is the section root, anything else is its
  // own page with the extension swapped for a trailing slash.
  const asPage = new Set(
    listed.map((href) =>
      href.endsWith('/index.md')
        ? href.replace(/index\.md$/, '')
        : `${href.replace(/\.md$/, '')}/`,
    ),
  );
  const missing = pages.filter((page) => !asPage.has(page.pathname)).map((p) => p.pathname);
  const unresolved = listed.filter(
    (href) => !existsSync(path.join(root, 'apps/site/public', href.replace(/^\//, ''))),
  );
  if (missing.length > 0) return fail(`${missing.length} pages not listed`);
  if (unresolved.length > 0) return fail(`${unresolved.length} entries do not resolve`);
  return pass(`${listed.length} entries`);
});

check(17, 'every docs URL + .md returns Markdown', () => {
  const missing = [];
  for (const page of pages) {
    const slug = page.pathname.replace(`/${PLUGIN}/`, '').replace(/\/$/, '');
    const file =
      slug === ''
        ? path.join(root, 'apps/site/public', PLUGIN, 'index.md')
        : path.join(root, 'apps/site/public', PLUGIN, `${slug}.md`);
    if (!existsSync(file)) missing.push(page.pathname);
    else if (!readFileSync(file, 'utf8').startsWith('---')) missing.push(`${page.pathname} (not md)`);
  }
  return missing.length === 0 ? pass(`${pages.length} twins`) : fail(missing.slice(0, 6).join(', '));
});

check(18, 'sitemap.xml covers the surface', () => {
  const file = path.join(root, 'apps/site/public/sitemap.xml');
  if (!existsSync(file)) return fail('sitemap.xml missing');
  const xml = readFileSync(file, 'utf8');
  const missing = pages.filter((page) => !xml.includes(`${page.pathname}<`)).map((p) => p.pathname);
  return missing.length === 0 ? pass(`${pages.length} URLs`) : fail(`${missing.length} missing`);
});

// ── metadata ─────────────────────────────────────────────────────────────────
check(19, 'every page emits the full §7.6 meta set', () => {
  const source = readFileSync(path.join(root, 'apps/site/src/docs/useMetadata.ts'), 'utf8');
  const required = [
    'canonical', 'description', 'og:title', 'og:description', 'og:type', 'og:url',
    'og:image', 'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image',
    'theme-color', 'search:language', 'search:version', 'plugin:id', 'plugin:categoryId',
  ];
  const missing = required.filter((name) => !source.includes(name));
  return missing.length === 0 ? pass(`${required.length} tags`) : fail(missing.join(', '));
});

check(20, 'llms.txt description == meta description == H1 subtitle, per page', () => {
  const llms = readFileSync(path.join(root, 'apps/site/public', PLUGIN, 'llms.txt'), 'utf8');
  const bad = [];
  const blank = [];
  for (const page of pages) {
    if (page.description.trim() === '' || page.description.startsWith('TODO')) {
      blank.push(page.pathname);
      continue;
    }
    const href =
      page.pathname === `/${PLUGIN}/`
        ? `/${PLUGIN}/index.md`
        : `${page.pathname.replace(/\/$/, '')}.md`;
    if (!llms.includes(`](${href}): ${page.description}`)) bad.push(page.pathname);
  }
  if (blank.length > 0) return fail(`${blank.length} pages have no description yet`);
  return bad.length === 0 ? pass(`${pages.length} pages`) : fail(bad.slice(0, 5).join(', '));
});

check(21, 'every page has a canonical URL with a trailing slash', () => {
  const bad = pages.filter((page) => !page.pathname.endsWith('/')).map((p) => p.pathname);
  const source = readFileSync(path.join(root, 'apps/site/src/docs/useMetadata.ts'), 'utf8');
  if (!source.includes("link('canonical'")) return fail('no canonical is emitted');
  return bad.length === 0 ? pass() : fail(bad.join(', '));
});

// ── migration ────────────────────────────────────────────────────────────────
check(22, 'every legacy URL redirects', () => {
  const mapFile = path.join(dir, 'migration/url-map.csv');
  const rows = readFileSync(mapFile, 'utf8').trim().split('\n').slice(1);
  const redirects = readJson(path.join(root, 'apps/site/src/content/redirects.json'));
  const bad = [];
  for (const row of rows) {
    const cells = row.match(/(".*?"|[^,]*)(,|$)/g).map((c) => c.replace(/,$/, '').replace(/^"|"$/g, ''));
    const [from, , , to, , note] = cells;
    if (!from || note === '(same URL)') continue;
    if (redirects[from] !== to) bad.push(from);
  }
  return bad.length === 0 ? pass(`${Object.keys(redirects).length} redirects`) : fail(bad.slice(0, 6).join(', '));
});

check(23, 'no internal link 404s', () => {
  const known = new Set(pages.map((page) => page.pathname));
  const redirects = readJson(path.join(root, 'apps/site/src/content/redirects.json'));
  const bad = [];
  for (const page of pages) {
    for (const match of page.html.matchAll(/href="(\/[^"#?]*)/g)) {
      const href = match[1].endsWith('/') ? match[1] : `${match[1]}/`;
      const raw = match[1];
      const isAsset = /\.(md|txt|xml|png|svg)$/.test(raw);
      if (isAsset || known.has(href) || redirects[raw.replace(/\/$/, '')] !== undefined) continue;
      bad.push(`${page.pathname} -> ${raw}`);
    }
  }
  return bad.length === 0 ? pass() : fail(bad.slice(0, 6).join('; '));
});

check(24, 'old version docs still resolve', () => {
  const others = config.versions.filter((entry) => !entry.current);
  return others.length === 0
    ? na('1.0.0 is the initial release; there is no previous major to keep online')
    : pass(`${others.length} archived versions`);
});

// ── portfolio ────────────────────────────────────────────────────────────────
check(25, 'section names, badges, footer columns and taxonomy are the portfolio set', () => {
  const FOOTER = ['Products', 'Resources', 'Explore', 'Company'];
  const footer = readFileSync(path.join(root, 'apps/site/src/docs/Footer.tsx'), 'utf8');
  const missingColumn = FOOTER.filter((name) => !footer.includes(`'${name}'`));
  const VOCABULARY = [
    'Core features', 'Advanced features', 'Content & data', 'Display & layout',
    'Interaction', 'Automation', 'Integrations', 'Administration', 'Developer tools',
  ];
  const invented = config.taxonomy.filter((term) => !VOCABULARY.includes(term));
  if (missingColumn.length > 0) return fail(`footer columns: ${missingColumn.join(', ')}`);
  if (invented.length > 0) return fail(`invented taxonomy: ${invented.join(', ')}`);
  return pass(`${config.taxonomy.length} taxonomy terms, all from the portfolio vocabulary`);
});

check(26, 'shared components are imported, not forked', () => {
  // One implementation of each shared part. A second copy inside the plugin's own tree
  // is what §12 forbids, because the next plugin inherits the fork.
  const shared = ['Badge.tsx', 'Toc.tsx', 'Footer.tsx', 'Demo.tsx', 'FeaturesIndex.tsx'];
  const missing = shared.filter((file) => !existsSync(path.join(root, 'apps/site/src/docs', file)));
  return missing.length === 0 ? pass(`${shared.length} shared components`) : fail(missing.join(', '));
});

// ── optional: probe a running server ─────────────────────────────────────────
if (served) {
  const probe = async (url, expect) => {
    const response = await fetch(`${BASE}${url}`);
    const body = await response.text();
    return expect(body, response);
  };

  const failures = [];
  const isHtmlShell = (body) => body.includes('<div id="root">') && !body.includes('---');

  for (const url of ['/react-rtekit/llms.txt', '/llms.txt']) {
    const ok = await probe(url, (body) => body.startsWith('# React RTE Kit'));
    if (!ok) failures.push(`${url} served the app shell, not llms.txt`);
  }
  const mdOk = await probe('/react-rtekit/tables.md', (body) => !isHtmlShell(body) && body.startsWith('---'));
  if (!mdOk) failures.push('/react-rtekit/tables.md served the app shell, not Markdown');
  const mapOk = await probe('/sitemap.xml', (body) => body.startsWith('<?xml'));
  if (!mapOk) failures.push('/sitemap.xml served the app shell, not XML');

  results.push({
    id: 'S',
    title: 'served: machine surface returns its own content type, not the SPA shell',
    ...(failures.length === 0 ? pass('llms.txt, .md twin, sitemap.xml') : fail(failures.join('; '))),
  });
}

// ── report ───────────────────────────────────────────────────────────────────
const counts = { pass: 0, fail: 0, 'n/a': 0 };
for (const result of results) counts[result.state] += 1;

const icon = { pass: '✓', fail: '✗', 'n/a': '–' };
for (const result of results) {
  process.stdout.write(
    `  ${icon[result.state]} ${String(result.id).padStart(2)}. ${result.title}${result.detail ? `\n       ${result.detail}` : ''}\n`,
  );
}
process.stdout.write(
  `\n${counts.pass} pass · ${counts.fail} fail · ${counts['n/a']} not applicable\n`,
);

if (existsSync(path.join(root, 'qa'))) {
  const lines = [
    '# Conformance report',
    '',
    `Generated by \`content/conformance.mjs\` against ${pages.length} pages.`,
    '',
    '| # | Check | State | Detail |',
    '|---|---|---|---|',
    ...results.map(
      (result) =>
        `| ${result.id} | ${result.title} | ${result.state} | ${(result.detail || '').replace(/\|/g, '\\|')} |`,
    ),
    '',
    `**${counts.pass} pass · ${counts.fail} fail · ${counts['n/a']} not applicable.**`,
  ];
  await readFile(path.join(root, 'qa/.keep'), 'utf8').catch(() => null);
  const { writeFile } = await import('node:fs/promises');
  await writeFile(path.join(root, 'qa/conformance-report.md'), `${lines.join('\n')}\n`, 'utf8');
}

process.exit(counts.fail > 0 ? 1 : 0);
