import { createRequire } from 'node:module';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Compiles the Markdown content into what the site renders and what machines read.
 *
 * Three outputs, one pass, so they cannot disagree:
 *
 *   apps/site/src/content/manifest.json   every page: frontmatter, headings, HTML
 *   apps/site/public/**.md                the Markdown twins (PPDS §7.7)
 *   apps/site/public/llms.txt             the agent index
 *
 * `description` is read once per page and written into the manifest, the twin and
 * `llms.txt` from that one field — which is the whole of P10, and the thing the Phase 1
 * audit found most broken (one description shared by 81 pages).
 *
 * Run: node content/build.mjs
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const require = createRequire(path.join(root, 'package.json'));
const { marked } = require('marked');

const PLUGIN = 'react-rtekit';
const dir = path.join(here, PLUGIN);
const siteSrc = path.join(root, 'apps/site/src/content');
const sitePublic = path.join(root, 'apps/site/public');

const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'));
const config = await readJson(path.join(dir, 'plugin.config.json'));
const nav = await readJson(path.join(dir, 'nav.json'));
const titles = await readJson(path.join(dir, 'titles.json'));

// ── frontmatter ──────────────────────────────────────────────────────────────
/** A deliberately small YAML subset: scalars, and `[a, b]` lists. */
function parseFrontmatter(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return { data: {}, body: source };
  const data = {};
  for (const line of match[1].split('\n')) {
    const pair = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (!pair) continue;
    const [, key, raw] = pair;
    let value = raw.trim();
    if (value.startsWith('[') && value.endsWith(']')) {
      const inner = value.slice(1, -1).trim();
      data[key] = inner === '' ? [] : inner.split(',').map((entry) => entry.trim());
      continue;
    }
    if (
      (value.startsWith("'") && value.endsWith("'")) ||
      (value.startsWith('"') && value.endsWith('"'))
    ) {
      value = value.slice(1, -1).replace(/''/g, "'");
    }
    data[key] = value === 'true' ? true : value === 'false' ? false : value;
  }
  return { data, body: source.slice(match[0].length) };
}

// ── markdown ─────────────────────────────────────────────────────────────────
/** `id` for a heading, matching what the ToC links to. */
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

const renderer = new marked.Renderer();

/*
 * A fenced ```demo block names a live component rather than showing code. Rendering it
 * as a mount point keeps the demo registry in React — where the 44 existing examples
 * already live — while the prose around it stays ordinary Markdown that the twin can
 * serve verbatim.
 */
renderer.code = ({ text, lang }) => {
  if (lang === 'demo') {
    return `<div data-demo="${text.trim()}"></div>`;
  }
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return `<pre class="code-block"><code class="language-${lang ?? 'text'}">${escaped}</code></pre>`;
};

renderer.heading = ({ text, depth, tokens }) => {
  const inline = this?.parser?.parseInline?.(tokens) ?? text;
  const id = slugify(text);
  return `<h${depth} id="${id}">${inline}</h${depth}>`;
};

marked.setOptions({ renderer, gfm: true });

// ── walk the content tree ────────────────────────────────────────────────────
async function* markdownFiles(base) {
  for (const entry of await readdir(base, { withFileTypes: true })) {
    if (entry.name === 'reference') continue;
    const full = path.join(base, entry.name);
    if (entry.isDirectory()) yield* markdownFiles(full);
    else if (entry.name.endsWith('.md') && entry.name !== 'README.md') yield full;
  }
}

/** Nav order, so the manifest can be rendered in reading order without re-sorting. */
const order = [];
(function walk(nodes) {
  for (const node of nodes) {
    if (!node.pathname.endsWith('-group')) order.push(node.pathname);
    if (node.children) walk(node.children);
  }
})(nav);

const pages = [];
const problems = [];

for await (const file of markdownFiles(dir)) {
  const source = await readFile(file, 'utf8');
  const { data, body } = parseFrontmatter(source);
  if (!data.pathname) {
    problems.push(`${path.relative(root, file)}: no pathname in frontmatter`);
    continue;
  }

  /*
   * The leading H1 is stripped before rendering.
   *
   * It stays in the file so the Markdown twin is a valid standalone document with a
   * title, and it is removed here because the page component renders the H1 from
   * frontmatter. Leaving both gives every page two H1s, which fails conformance check 2.
   */
  const withoutTitle = body.replace(/^\s*#\s+[^\n]*\n+/, '');

  const headings = [];
  for (const token of marked.lexer(withoutTitle)) {
    if (token.type === 'heading' && token.depth >= 2 && token.depth <= 3) {
      headings.push({ depth: token.depth, text: token.text, id: slugify(token.text) });
    }
  }

  const html = marked.parse(withoutTitle);
  const text = withoutTitle.replace(/[#*`_>[\]()-]/g, ' ').replace(/\s+/g, ' ').trim();

  pages.push({
    pathname: data.pathname,
    title: data.title ?? titles[data.pathname] ?? '',
    description: data.description ?? '',
    archetype: data.archetype ?? 'I',
    section: data.section ?? null,
    capabilityId: data.capabilityId ?? null,
    group: data.group ?? null,
    plan: data.plan ?? null,
    lifecycle: data.lifecycle ?? null,
    symbols: data.symbols ?? [],
    headings,
    html,
    words: text === '' ? 0 : text.split(' ').length,
    source: path.relative(root, file).replace(/\\/g, '/'),
    markdown: source,
  });
}

pages.sort((a, b) => order.indexOf(a.pathname) - order.indexOf(b.pathname));

// ── outputs ──────────────────────────────────────────────────────────────────
await mkdir(siteSrc, { recursive: true });
await writeFile(
  path.join(siteSrc, 'manifest.json'),
  `${JSON.stringify(
    {
      config,
      nav,
      titles,
      pages: pages.map(({ markdown: _markdown, ...rest }) => rest),
    },
    null,
    0,
  )}\n`,
  'utf8',
);

/*
 * The Markdown twins.
 *
 * PPDS §7.7 says appending `.md` to a docs URL returns the Markdown. With a trailing
 * slash canonical (R4) that reads literally as `/react-rtekit/tables/.md`, a dotfile
 * most static hosts hide. Both forms are emitted — `tables.md` beside the directory and
 * `tables/index.md` inside it — so the URL works however a reader spells it, and
 * `llms.txt` links the form that is certain to be served. Recorded as EXCEPTIONS E-10.
 */
let twins = 0;
for (const page of pages) {
  const slug = page.pathname.replace(`/${PLUGIN}/`, '').replace(/\/$/, '');
  const base = path.join(sitePublic, PLUGIN);
  const targets =
    slug === ''
      ? [path.join(base, 'index.md')]
      : [path.join(base, `${slug}.md`), path.join(base, slug, 'index.md')];
  for (const target of targets) {
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, page.markdown, 'utf8');
    twins += 1;
  }
}

/* llms.txt — grouped by section, in nav order, one line per page (PPDS §7.7). */
const sectionTitles = Object.fromEntries(
  nav.map((node) => [node.pathname.replace(`/${PLUGIN}/`, '').replace('-group', ''), node.title]),
);
const bySection = new Map();
for (const page of pages) {
  const key = page.section ?? 'getting-started';
  if (!bySection.has(key)) bySection.set(key, []);
  bySection.get(key).push(page);
}

const llms = [
  `# ${config.name}`,
  '',
  config.tagline,
  config.description,
  '',
];
for (const [section, entries] of bySection) {
  llms.push(`## ${sectionTitles[section] ?? section}`, '');
  for (const page of entries) {
    // The docs root's twin is `/{plugin}/index.md`: stripping its trailing slash would
    // name `/react-rtekit.md`, a file one level up that does not exist.
    const href =
      page.pathname === `/${PLUGIN}/`
        ? `/${PLUGIN}/index.md`
        : `${page.pathname.replace(/\/$/, '')}.md`;
    llms.push(`- [${page.title}](${href}): ${page.description}`);
  }
  llms.push('');
}
await writeFile(path.join(sitePublic, PLUGIN, 'llms.txt'), `${llms.join('\n').trimEnd()}\n`, 'utf8');
await writeFile(path.join(sitePublic, 'llms.txt'), `${llms.join('\n').trimEnd()}\n`, 'utf8');

/* sitemap.xml */
const origin = process.env.SITE_ORIGIN ?? 'https://kiralygyula92.github.io/react-rtekit';
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...pages.map((page) => `  <url><loc>${origin}${page.pathname}</loc></url>`),
  '</urlset>',
].join('\n');
await writeFile(path.join(sitePublic, 'sitemap.xml'), `${sitemap}\n`, 'utf8');

if (problems.length > 0) {
  for (const problem of problems) process.stdout.write(`  ! ${problem}\n`);
}
process.stdout.write(
  `${pages.length} pages -> manifest · ${twins} markdown twins · llms.txt · sitemap.xml\n`,
);
