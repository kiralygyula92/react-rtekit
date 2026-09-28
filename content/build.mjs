import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Compiles the Markdown content into what the site renders and what machines read.
 *
 * Three outputs, one pass, so they cannot disagree:
 *
 *   apps/site/src/content/manifest.json   every page: frontmatter, headings, HTML
 *   apps/site/public/**.md                the Markdown twins, one per page
 *   apps/site/public/llms.txt             the agent index
 *
 * `description` is read once per page and written into the manifest, the twin and
 * `llms.txt` from that one field, so the three cannot disagree.
 *
 * Run: node content/build.mjs
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const require = createRequire(path.join(root, 'package.json'));
/*
 * The package renders its own documentation.
 *
 * `markdownToHtml` is React RTE Kit's own Markdown reader and HTML serializer — the same
 * code path `valueFormat="markdown"` uses — so the docs site carries no third-party
 * Markdown library, and every page on it exercises the library's own parser. A heading,
 * table or fenced block that renders wrongly here renders wrongly for a consumer too.
 */
const { markdownToHtml } = require('./packages/react-rtekit/dist/core/index.cjs');

const PLUGIN = 'react-rtekit';
const dir = path.join(here, PLUGIN);
const siteSrc = path.join(root, 'apps/site/src/content');
const sitePublic = path.join(root, 'apps/site/public');

const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'));
const config = await readJson(path.join(dir, 'plugin.config.json'));
const nav = await readJson(path.join(dir, 'nav.json'));
const titles = await readJson(path.join(dir, 'titles.json'));

/*
 * The one origin every absolute URL is built on — the sitemap here, the canonical and
 * `og:url` tags in the site through the manifest.
 *
 * Scheme and host only. Every `pathname` already begins with the docs namespace, so an
 * origin that carries `/react-rtekit` as well names every page twice. The sitemap's own
 * default did exactly that, and each of its 123 `<loc>`s pointed at
 * `…/react-rtekit/react-rtekit/…`, which does not exist; the canonical tags had a
 * separate default that was spelled correctly. There is now one, so the two cannot
 * disagree again.
 *
 * Vercel's production domain, because that is the deployment that can issue the legacy
 * redirects as real 301s and the one the analytics run on. The Pages copy of the site still
 * builds, and its pages declare this as their canonical, which is what a search engine
 * needs to treat two copies of a site as one.
 */
const origin = (process.env.SITE_ORIGIN ?? 'https://react-rtekit.vercel.app').replace(/\/+$/, '');
if (new URL(origin).pathname !== '/') {
  throw new Error(`SITE_ORIGIN must be scheme and host only, not ${origin}`);
}

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

/** A heading's text with its inline markup removed, for the slug. */
function stripTags(html) {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

/**
 * Turns one Markdown document into the HTML the site renders.
 *
 * Things the library's serializer does not do, because they are the site's concern
 * rather than the document model's:
 *
 *   - heading ids, so the table of contents has somewhere to link;
 *   - the `demo` fence, which names a live component instead of showing code;
 *   - `tabindex` on code blocks, which scroll horizontally and are otherwise unreachable
 *     by keyboard (axe calls it `scrollable-region-focusable`);
 *   - scroll containers for wide tables, keeping the page within a mobile viewport.
 *
 * These are applied to the serialized output rather than by forking the serializer,
 * so the Markdown path this site exercises is exactly the one a consumer gets.
 */
function render(markdown) {
  let html = markdownToHtml(markdown);

  // A ```demo fence becomes a mount point. The registry stays in React, where the 44
  // examples already live, and the prose around it stays ordinary Markdown that the
  // twin can serve verbatim.
  html = html.replace(
    /<pre><code class="language-demo">([\s\S]*?)<\/code><\/pre>/g,
    (_match, slug) => `<div data-demo="${slug.trim()}"></div>`,
  );

  html = html.replace(
    /<pre><code class="language-([\w+-]*)">/g,
    (_match, lang) =>
      `<pre class="code-block" tabindex="0" role="region" aria-label="${lang || 'code'} example"><code class="language-${lang || 'text'}">`,
  );
  // A fence with no language still needs the class and the focusability.
  html = html.replace(
    /<pre><code>/g,
    '<pre class="code-block" tabindex="0" role="region" aria-label="code example"><code>',
  );

  html = html
    .replace(
      /<table>/g,
      '<div class="table-scroll" tabindex="0" role="region" aria-label="Scrollable table"><table>',
    )
    .replace(/<\/table>/g, '</table></div>');

  const heading = /<(h[23])>([\s\S]*?)<\/h[23]>/g;
  html = html.replace(heading, (_match, tag, inner) => {
    return `<${tag} id="${slugify(stripTags(inner))}">${inner}</${tag}>`;
  });

  return html;
}

/**
 * The H2s and H3s of a document, for the "on this page" rail.
 *
 * Read from the Markdown rather than from the rendered HTML: a `##` inside a fenced code
 * block is code, not a heading, and only the source knows the difference.
 */
function headingsOf(markdown) {
  const headings = [];
  let inFence = false;
  for (const line of markdown.split('\n')) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const match = line.match(/^(#{2,3})\s+(.*)$/);
    if (!match) continue;
    const text = match[2].replace(/[*`_]/g, '').trim();
    headings.push({ depth: match[1].length, text, id: slugify(text) });
  }
  return headings;
}

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
  /*
   * `%SITE_ORIGIN%` in a page becomes the origin above. For the few places prose needs an
   * absolute URL — a `curl` command, say — so that they follow the one definition instead
   * of becoming a second copy of it. Deliberately not `{origin}`: braces are JSX in every
   * code sample on the site.
   */
  const source = (await readFile(file, 'utf8')).replaceAll('%SITE_ORIGIN%', origin);
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
   * frontmatter. Leaving both would give every page two H1s.
   */
  const withoutTitle = body.replace(/^\s*#\s+[^\n]*\n+/, '');

  const headings = headingsOf(withoutTitle);
  const html = render(withoutTitle);
  const text = withoutTitle
    .replace(/[#*`_>[\]()-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

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
      origin,
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
 * Appending `.md` to a docs URL returns the page's Markdown. With a trailing slash
 * canonical that reads literally as `/react-rtekit/tables/.md`, a dotfile most
 * static hosts hide, so the twin is the URL with its slash stripped: `tables.md` beside
 * the `tables/` directory, and `react-rtekit.md` beside the namespace itself.
 *
 * One form, and never `index.md` inside the directory.
 *
 * That second form used to be emitted as well, on the theory that it worked "however a
 * reader spells it". What it actually did was put a file called `index` in every
 * directory that is also a route — and a host that resolves a directory to its index file
 * does not check the extension first. Vercel served `/react-rtekit/` as
 * `react-rtekit/index.md`: the site's front page was a screenful of raw frontmatter, and
 * no rewrite could help, because a rewrite is only consulted once the filesystem has
 * declined. Removing the directory index leaves those directories empty and the SPA
 * fallback reachable, which is the only reason any route renders at all.
 */
let twins = 0;
const written = new Set();
for (const page of pages) {
  const slug = page.pathname.replace(`/${PLUGIN}/`, '').replace(/\/$/, '');
  const base = path.join(sitePublic, PLUGIN);
  const target =
    slug === '' ? path.join(sitePublic, `${PLUGIN}.md`) : path.join(base, `${slug}.md`);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, page.markdown, 'utf8');
  written.add(target);
  twins += 1;
}

// A page that was deleted must not stay downloadable as Markdown.
for await (const file of markdownFiles(path.join(sitePublic, PLUGIN))) {
  if (!written.has(file) && path.basename(file) !== 'llms-full.md') await rm(file);
}

/* llms.txt — grouped by section, in nav order, one line per page. */
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
  /*
   * Ahead of the lists, so an agent that wants everything does not have to crawl — and in
   * prose rather than as a `- [..](..)` entry, because every list line in this file is one
   * page's twin (`- [Title](url.md): description`), and agents read it that way.
   */
  `The whole documentation in one file, with the source of every example: [llms-full.md](/${PLUGIN}/llms-full.md).`,
  '',
];
for (const [section, entries] of bySection) {
  llms.push(`## ${sectionTitles[section] ?? section}`, '');
  for (const page of entries) {
    // Every twin is the URL with its trailing slash stripped, the root included: it is
    // `/react-rtekit.md`, one level up from the namespace, and it is written there.
    const href = `${page.pathname.replace(/\/$/, '')}.md`;
    llms.push(`- [${page.title}](${href}): ${page.description}`);
  }
  llms.push('');
}
await writeFile(
  path.join(sitePublic, PLUGIN, 'llms.txt'),
  `${llms.join('\n').trimEnd()}\n`,
  'utf8',
);
await writeFile(path.join(sitePublic, 'llms.txt'), `${llms.join('\n').trimEnd()}\n`, 'utf8');

/*
 * The AI context: the whole documentation, and every example's source, in one file.
 *
 * `llms.txt` is an index an agent has to crawl; this is the thing an agent can be handed
 * whole — dropped into a repository next to a CLAUDE.md, or given as one URL. It is built
 * from the same pages, in the same order, in the same pass as the twins, so it cannot say
 * anything the site does not.
 *
 * Each ```demo fence becomes the source of that example, which is the file the site's
 * "Show source" displays. On the site those fences are live editors; in a text file the
 * only useful thing a demo can be is its code.
 *
 * Written twice. `llms-full.txt` is the name tools look for by convention, and
 * `llms-full.md` is what a person downloads and keeps; the bytes are the same.
 */
const examplesDir = path.join(root, 'apps/site/src/examples');
const exampleSlugs = (await readdir(examplesDir, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

/** One example: its title from `meta.ts`, and the source the site shows. */
async function readExample(slug) {
  const source = (await readFile(path.join(examplesDir, slug, 'index.tsx'), 'utf8')).trimEnd();
  const meta = await readFile(path.join(examplesDir, slug, 'meta.ts'), 'utf8').catch(() => '');
  const title = meta.match(/title:\s*'([^']+)'/)?.[1] ?? slug;
  return { slug, title, source };
}

/** A fence one backtick longer than any run inside the code, so the code cannot close it. */
function fence(language, code) {
  const longest = Math.max(0, ...[...code.matchAll(/`+/g)].map((match) => match[0].length));
  const ticks = '`'.repeat(Math.max(3, longest + 1));
  return `${ticks}${language}\n${code}\n${ticks}`;
}

const packageJson = JSON.parse(
  await readFile(path.join(root, 'packages/react-rtekit/package.json'), 'utf8'),
);
const peers = Object.entries(packageJson.peerDependencies ?? {})
  .map(([name, range]) => `\`${name}\` ${range}`)
  .join(', ');

const shown = new Map(); // slug -> the title of the page that first showed it
const sections = [];
for (const page of pages) {
  const body = page.markdown
    .replace(/^---\n[\s\S]*?\n---\n?/, '') // frontmatter: the fields are restated below
    .replace(/^\s*#\s+[^\n]*\n+/, '') // the H1, which is re-emitted with the description
    .replace(/<!--[\s\S]*?-->\n*/g, ''); // generator markers, which mean nothing out here

  const parts = [];
  let cursor = 0;
  for (const match of body.matchAll(/```demo\r?\n([^\r\n]+)\r?\n```/g)) {
    parts.push(body.slice(cursor, match.index));
    cursor = match.index + match[0].length;
    const slug = match[1].trim();
    if (!exampleSlugs.includes(slug)) {
      problems.push(`${page.pathname}: demo fence names ${slug}, which is not an example`);
      continue;
    }
    const example = await readExample(slug);
    if (shown.has(slug)) {
      parts.push(`*Example: ${example.title}* — the same source as under "${shown.get(slug)}".`);
    } else {
      shown.set(slug, page.title);
      parts.push(
        `*Example: ${example.title}* — the source of the live demo on this page.\n\n${fence('tsx', example.source)}`,
      );
    }
  }
  parts.push(body.slice(cursor));

  // Site-relative links become absolute, so they still work in a file on someone's disk.
  const text = parts.join('').replace(/\]\((\/[^)\s]*)\)/g, `](${origin}$1)`);
  const section = sectionTitles[page.section] ?? page.section ?? '';
  sections.push(
    [
      `# ${page.title}`,
      '',
      `> ${page.description}`,
      '',
      `${section ? `${section} · ` : ''}${origin}${page.pathname}`,
      '',
      text.trim(),
    ].join('\n'),
  );
}

// Every example is on a page today; one added without a page still belongs in here.
const unplaced = exampleSlugs.filter((slug) => !shown.has(slug));
if (unplaced.length > 0) {
  const blocks = [];
  for (const slug of unplaced) {
    const example = await readExample(slug);
    blocks.push(`## ${example.title}\n\n${fence('tsx', example.source)}`);
  }
  sections.push(['# Examples not shown on any page', '', ...blocks].join('\n\n'));
}

const aiContext = [
  `# ${config.name} — the complete documentation`,
  '',
  `> ${config.tagline}`,
  '',
  config.description,
  '',
  `Every page of the documentation at ${origin}/${PLUGIN}/, in reading order, with the source ` +
    'of every live example inlined where its page shows it. It is generated from the same ' +
    'Markdown as the site, so it says exactly what the site says.',
  '',
  `- Package: \`${packageJson.name}\` ${packageJson.version} on npm. Peer dependencies: ${peers}, and nothing else.`,
  `- Page index: ${origin}/${PLUGIN}/llms.txt — and any single page as Markdown, at its URL with \`.md\`.`,
  `- ${pages.length} pages, ${exampleSlugs.length} examples.`,
  '',
  'The examples import a few components that belong to the documentation site rather than to ' +
    'the package — `CodeBlock`, `ChoiceGroup` and the shared test fixtures. They display ' +
    'output; the editor code around them is the part to copy.',
  '',
  ...sections.flatMap((section) => ['---', '', section, '']),
]
  .join('\n')
  .trimEnd();

for (const name of ['llms-full.md', 'llms-full.txt']) {
  await writeFile(path.join(sitePublic, PLUGIN, name), `${aiContext}\n`, 'utf8');
}

/* sitemap.xml */
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...pages.map((page) => `  <url><loc>${origin}${page.pathname}</loc></url>`),
  '</urlset>',
].join('\n');
await writeFile(path.join(sitePublic, 'sitemap.xml'), `${sitemap}\n`, 'utf8');

/* robots.txt: everything is public, so it exists to point crawlers at the sitemap. */
await writeFile(
  path.join(sitePublic, 'robots.txt'),
  ['User-agent: *', 'Allow: /', '', `Sitemap: ${origin}/sitemap.xml`, ''].join('\n'),
  'utf8',
);

/*
 * The invariants a broken site would otherwise ship with.
 *
 * Checked here, where the pages are built, rather than by a separate tool: each is a
 * fact about what this script just produced, and a build that produced a broken site
 * should say so and stop.
 */
const known = new Set(pages.map((page) => page.pathname));
const redirectTable = await readJson(path.join(siteSrc, 'redirects.json'));

// Every sidebar entry leads to a page, and has a name to show.
(function walk(nodes) {
  for (const node of nodes) {
    if (!node.pathname.endsWith('-group')) {
      if (!known.has(node.pathname)) problems.push(`nav: ${node.pathname} is not a page`);
      if (!node.title && !titles[node.pathname]) {
        problems.push(`nav: ${node.pathname} has no title, in nav.json or titles.json`);
      }
    }
    if (node.children) walk(node.children);
  }
})(nav);

const seenTitles = new Map();
for (const page of pages) {
  // The description is the subtitle, the meta description and the llms.txt line at once,
  // so it has to fit a search result: long enough to say something, short enough not to
  // be cut off.
  const { length } = page.description.trim();
  if (length === 0) problems.push(`${page.pathname}: no description`);
  else if (length < 50 || length > 160)
    problems.push(`${page.pathname}: description is ${length} characters, not 50 to 160`);

  // The title becomes the <title>, and two pages sharing one cannot be told apart in a
  // tab, a bookmark or a search result.
  const clash = seenTitles.get(page.title);
  if (clash) problems.push(`${page.pathname}: title "${page.title}" is also ${clash}'s`);
  seenTitles.set(page.title, page.pathname);

  // The H1 comes from frontmatter; the body starts at H2 and never skips a level.
  if (/<h1[\s>]/i.test(page.html)) problems.push(`${page.pathname}: a second H1 in the body`);
  // Read from the HTML, not from `headings`: that list is the table of contents, which
  // holds only H2 and H3, so a jump to H4 would never appear in it.
  let previous = 1;
  for (const [, level] of page.html.matchAll(/<h([2-6])[\s>]/g)) {
    const depth = Number(level);
    if (depth > previous + 1)
      problems.push(`${page.pathname}: jumps from h${previous} to h${depth}`);
    previous = depth;
  }

  // Every internal link goes somewhere: a page, a legacy URL that redirects, or a file.
  for (const match of page.html.matchAll(/href="(\/[^"#?]*)/g)) {
    const href = match[1];
    if (/\.[a-z0-9]+$/i.test(href)) {
      if (!existsSync(path.join(sitePublic, href)))
        problems.push(`${page.pathname}: ${href} is not a file`);
      continue;
    }
    const asPage = href.endsWith('/') ? href : `${href}/`;
    if (known.has(asPage) || redirectTable[href.replace(/\/$/, '') || '/'] !== undefined) continue;
    problems.push(`${page.pathname}: links to ${href}, which is not a page`);
  }
}

if (problems.length > 0) {
  for (const problem of problems) process.stderr.write(`  ! ${problem}\n`);
  process.stderr.write(
    `${problems.length} problem(s) in the content; nothing above is fit to publish.\n`,
  );
  process.exit(1);
}
process.stdout.write(
  `${pages.length} pages -> manifest · ${twins} markdown twins · llms.txt · sitemap.xml · robots.txt\n`,
);
