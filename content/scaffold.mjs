import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Phase 3 — turns `nav.json` into a Markdown file per page.
 *
 * Every page is an instance of exactly one PPDS §6 archetype, and the archetype decides
 * which headings the stub carries. The headings are the contract the conformance script
 * checks, so they are emitted here rather than left to whoever writes the page: a
 * capability page that is missing `## Limitations` should fail before anyone has written
 * a word of it.
 *
 * Idempotent. A file that already exists is left alone — this is a scaffolder, not a
 * formatter, and it must never overwrite authored prose. Pass `--force` to rewrite
 * stubs that are still untouched (frontmatter + headings, no body).
 *
 * Run: node content/scaffold.mjs
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN = 'react-rtekit';
const dir = path.join(here, PLUGIN);
const force = process.argv.includes('--force');

const read = async (file) => JSON.parse(await readFile(file, 'utf8'));
const config = await read(path.join(dir, 'plugin.config.json'));
const nav = await read(path.join(dir, 'nav.json'));
const titles = await read(path.join(dir, 'titles.json'));

/** Flattens the nav into pages, carrying the section and group each sits in. */
function flatten(nodes, section = null, group = null) {
  const pages = [];
  for (const node of nodes) {
    const nextGroup = node.subheader ?? group;
    if (!node.pathname.endsWith('-group')) {
      pages.push({ ...node, section, group: node.subheader ?? nextGroup });
    }
    if (node.children) {
      const id = node.pathname.replace(`/${PLUGIN}/`, '').replace('-group', '');
      pages.push(...flatten(node.children, id, null));
    }
  }
  return pages;
}

/*
 * `subheader` marks the *first* node of a group, and the rest of the group inherits it.
 * Flattening has to carry that forward or only five capability pages would know which
 * group they are in.
 */
function withInheritedGroups(pages) {
  let current = null;
  return pages.map((page) => {
    if (page.subheader !== undefined) current = page.subheader;
    else if (page.section !== 'features') current = null;
    return { ...page, group: page.capabilityId ? current : undefined };
  });
}

const pages = withInheritedGroups(flatten(nav));

/** Which archetype a page is an instance of. */
function archetypeOf(page) {
  const slug = page.pathname.replace(`/${PLUGIN}/`, '').replace(/\/$/, '');
  if (slug === '') return 'A';
  if (slug === 'all-features') return 'C';
  if (page.capabilityId !== undefined) return 'B';
  if (slug.startsWith('api')) return 'E';
  if (slug.startsWith('getting-started/')) return 'F';
  if (slug.startsWith('demos/')) return 'B';
  return 'I';
}

/** The file a page's Markdown lives in (PPDS §8.1). */
function fileFor(page) {
  const slug = page.pathname.replace(`/${PLUGIN}/`, '').replace(/\/$/, '');
  if (slug === '') return path.join(dir, 'index.md');
  if (page.capabilityId !== undefined) return path.join(dir, 'features', slug, 'index.md');
  return path.join(dir, `${slug}.md`);
}

/** YAML frontmatter, quoted where a value could be misread. */
function frontmatter(fields) {
  const quote = (value) =>
    typeof value === 'string' && /[:#'"[\]{}&*!|>%@`]|^\s|\s$/.test(value)
      ? `'${value.replace(/'/g, "''")}'`
      : value;
  return [
    '---',
    ...Object.entries(fields)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) =>
        Array.isArray(value) ? `${key}: [${value.join(', ')}]` : `${key}: ${quote(value)}`,
      ),
    '---',
  ].join('\n');
}

/**
 * The required blocks for each archetype, in the normative order.
 *
 * `TODO:` marks a block with no source data yet, per operating rule 4 — a placeholder is
 * correct, an invented sentence is not.
 */
function bodyFor(archetype, page, title) {
  const todo = (what) => `TODO: ${what}`;

  if (archetype === 'A') {
    return [
      '## Introduction',
      '',
      todo('what it is, what it implements, and the explicit scope boundary'),
      '',
      '## Why React RTE Kit',
      '',
      todo('4-6 benefit bullets, each **Benefit:** followed by one or two sentences'),
      '',
      '## Start now',
      '',
      todo('a card grid of 4-6 next steps, each {title, one-line, href}'),
    ].join('\n');
  }

  if (archetype === 'B') {
    return [
      '## Basics',
      '',
      todo('a runnable demo, before any prose beyond one sentence'),
      '',
      '## Customization',
      '',
      todo('one customised instance, and a link to the customization guide'),
      '',
      '## Limitations',
      '',
      'None known.',
      '',
      '## API',
      '',
      todo('generated from the symbols in this page’s frontmatter'),
    ].join('\n');
  }

  if (archetype === 'C') {
    return [
      todo('one or two paragraphs of scope: what is in, what is deliberately out'),
      '',
      ...config.taxonomy.flatMap((group) => [`## ${group}`, '', '<!-- cards -->', '']),
    ]
      .join('\n')
      .trimEnd();
  }

  if (archetype === 'E') {
    return [
      '<!--',
      '  Generated in Phase 4 from the TypeScript declarations.',
      '  Do not author prose here: it belongs in reference/{symbol}.strings.json.',
      '-->',
      '',
      '## Used by',
      '',
      '## Import',
      '',
      '## Options',
      '',
      '## Source',
    ].join('\n');
  }

  if (archetype === 'F') {
    return [
      '## Prerequisites',
      '',
      todo('explicitly versioned'),
      '',
      '## Installation',
      '',
      todo('every supported channel, tabbed'),
      '',
      '## Minimal working example',
      '',
      todo('complete and copy-pasteable, with no ellipses'),
      '',
      '## Verify',
      '',
      todo('what the reader should now see'),
      '',
      '## Next steps',
      '',
      todo('three links'),
    ].join('\n');
  }

  return [`## ${title}`, '', todo('body')].join('\n');
}

let written = 0;
let skipped = 0;

for (const page of pages) {
  const file = fileFor(page);
  const title = page.title ?? titles[page.pathname];
  const archetype = archetypeOf(page);

  if (existsSync(file)) {
    const current = await readFile(file, 'utf8');
    const isStub = current.includes('TODO:') || archetype === 'E';
    if (!force || !isStub) {
      skipped += 1;
      continue;
    }
  }

  const fields = {
    pluginId: PLUGIN,
    pathname: page.pathname,
    title,
    description: `TODO: one line, reused in nav, meta and llms.txt`,
    archetype,
    section: page.section,
  };
  if (page.capabilityId !== undefined) {
    fields.capabilityId = page.capabilityId;
    fields.group = page.group;
    fields.symbols = [];
  }
  if (page.plan !== undefined) fields.plan = page.plan;
  if (page.lifecycle !== undefined) fields.lifecycle = page.lifecycle;

  const heading = archetype === 'A' ? `${config.name} — Overview` : title;
  const content = `${frontmatter(fields)}\n\n# ${heading}\n\n${bodyFor(archetype, page, title)}\n`;

  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, content, 'utf8');
  written += 1;
}

const byArchetype = {};
for (const page of pages) {
  const archetype = archetypeOf(page);
  byArchetype[archetype] = (byArchetype[archetype] ?? 0) + 1;
}

process.stdout.write(
  `${pages.length} pages · written ${written} · left alone ${skipped}\n` +
    `archetypes: ${JSON.stringify(byArchetype)}\n`,
);
