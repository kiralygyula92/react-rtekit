import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Writes the generated reference into the API pages' Markdown.
 *
 * The prose between the markers is authored nowhere: it is assembled from
 * `{symbol}.schema.json` (structure) and `{symbol}.strings.json` (descriptions) every
 * time this runs. A hand-written options table would drift from the declarations, so
 * the region is fenced with markers and anything inside them is replaced wholesale.
 *
 * `## Used by` is the inversion of every capability page's `symbols` frontmatter, so the
 * link between a capability and its symbols is declared once, on the capability, and the
 * reverse direction is derived.
 *
 * Run: node content/react-rtekit/reference/render.mjs
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(here, '..');
const root = path.resolve(here, '../../..');
const NS = '/react-rtekit';

const START = '<!-- generated:reference:start -->';
const END = '<!-- generated:reference:end -->';

const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'));
const index = await readJson(path.join(here, 'index.json'));
const manifest = await readJson(path.join(root, 'apps/site/src/content/manifest.json'));
const titleOf = new Map(manifest.pages.map((page) => [page.pathname, page.title]));

/** Escapes a cell so a type containing a pipe cannot break the table. */
const cell = (text) =>
  String(text ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\n+/g, ' ')
    .trim();

/** Which symbols each API page carries. */
const byPage = new Map();
for (const [name, entry] of Object.entries(index)) {
  if (!byPage.has(entry.page)) byPage.set(entry.page, []);
  byPage.get(entry.page).push(name);
}

let written = 0;

for (const [pagePath, names] of byPage) {
  const slug = pagePath.replace(`${NS}/`, '').replace(/\/$/, '');
  const file = path.join(dir, `${slug}.md`);
  const source = await readFile(file, 'utf8').catch(() => null);
  if (source === null) continue;

  /*
   * One set of the four required H2s per page, with an H3 per symbol inside Options.
   * Repeating the H2s per symbol would give a page four "## Options" headings, which
   * reads as four sections.
   */
  const records = [];
  for (const name of [...names].sort()) {
    const safe = name.replace(/[^\w-]/g, '');
    records.push({
      name,
      schema: await readJson(path.join(here, `${safe}.schema.json`)),
      strings: await readJson(path.join(here, `${safe}.strings.json`)),
    });
  }

  const usedBy = [...new Set(records.flatMap((record) => record.schema.usedBy))];
  const fence = '```';
  const blocks = [];

  blocks.push('## Used by', '');
  blocks.push(
    usedBy.length > 0
      ? usedBy.map((href) => `- [${titleOf.get(href) ?? href}](${href})`).join('\n')
      : 'Nothing on this site declares these symbols in its frontmatter. They are part of the library’s own surface rather than of one capability.',
    '',
  );

  blocks.push('## Import', '', `${fence}ts`);
  for (const record of records) blocks.push(...record.schema.imports);
  blocks.push(fence, '');

  blocks.push('## Options', '');
  for (const record of records) {
    if (records.length > 1) blocks.push(`### ${record.schema.name}`, '');
    if (record.strings.symbolDescription) blocks.push(record.strings.symbolDescription, '');

    const options = Object.entries(record.schema.options);
    if (options.length === 0) {
      blocks.push('This symbol takes no options.', '');
      continue;
    }
    blocks.push(
      '| Name | Type | Required | Description |',
      '|---|---|---|---|',
      ...options.map(([key, option]) => {
        const description = record.strings.optionDescriptions?.[key] ?? '';
        const tick = '`';
        return `| ${tick}${cell(key)}${tick} | ${tick}${cell(option.type?.name)}${tick} | ${option.required ? 'yes' : 'no'} | ${cell(description)} |`;
      }),
      '',
    );
  }

  blocks.push('## Source', '');
  blocks.push(
    records.map((record) => `- [${record.schema.name}](${record.schema.sourceUrl})`).join('\n'),
    '',
  );

  const generated = `${START}\n\n${blocks.join('\n').trimEnd()}\n\n${END}`;
  const next = source.includes(START)
    ? source.replace(new RegExp(`${START}[\\s\\S]*?${END}`), generated)
    : `${source.trimEnd()}\n\n${generated}\n`;

  if (next !== source) {
    await writeFile(file, next.endsWith('\n') ? next : `${next}\n`, 'utf8');
    written += 1;
  }
}

process.stdout.write(
  `${written} reference pages rendered from ${Object.keys(index).length} symbols\n`,
);
