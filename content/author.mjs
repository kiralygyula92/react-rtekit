import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Phase 5 — seeds the capability pages from the authored content table.
 *
 * A one-shot, like `scaffold.mjs`. It writes the description, the `symbols` frontmatter,
 * the opening demo and the real `## Limitations` into each of the 55 capability pages,
 * and then the Markdown file is the source of truth: re-running it leaves a page alone
 * unless the page still carries its `TODO:` placeholders.
 *
 * The table it reads is authored prose, not generated text. It exists because 55 pages
 * need their frontmatter and their first demo wired identically, and doing that by hand
 * 55 times is how a description ends up written twice, differently — which is exactly
 * what P10 forbids.
 *
 * Run: node content/author.mjs [--force]
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN = 'react-rtekit';
const dir = path.join(here, PLUGIN);
const force = process.argv.includes('--force');

const content = JSON.parse(await readFile(path.join(here, 'authoring/capabilities.json'), 'utf8'));
const index = JSON.parse(
  await readFile(path.join(dir, 'reference/index.json'), 'utf8'),
);

let written = 0;
let skipped = 0;
const problems = [];

for (const [capabilityId, entry] of Object.entries(content)) {
  const file = path.join(dir, 'features', capabilityId, 'index.md');
  if (!existsSync(file)) {
    problems.push(`no page for ${capabilityId}`);
    continue;
  }

  const source = await readFile(file, 'utf8');
  if (!source.includes('TODO:') && !force) {
    skipped += 1;
    continue;
  }

  // Every declared symbol must have a reference page, or check 11 fails and the page's
  // `## API` section links nowhere.
  const unknown = entry.symbols.filter((symbol) => index[symbol] === undefined);
  if (unknown.length > 0) {
    problems.push(`${capabilityId}: unknown symbols ${unknown.join(', ')}`);
    continue;
  }

  const frontmatter = source.match(/^---\n[\s\S]*?\n---\n/)?.[0] ?? '';
  const title = frontmatter.match(/^title: (.*)$/m)?.[1] ?? capabilityId;

  const updated = frontmatter
    .replace(/^description: .*$/m, `description: ${quote(entry.description)}`)
    .replace(/^symbols: \[.*\]$/m, `symbols: [${entry.symbols.join(', ')}]`);

  const apiLinks = entry.symbols
    .map((symbol) => `- [${symbol}](${index[symbol].page})`)
    .join('\n');

  const body = [
    '## Basics',
    '',
    entry.demo ? ['```demo', entry.demo, '```'].join('\n') : 'TODO: a runnable demo',
    '',
    // One H3 per variation axis, which is what archetype B asks for — and what gives a
    // demo the capability re-cut left without a page somewhere honest to live.
    ...(entry.variations ?? []).flatMap((variation) => [
      `### ${variation.title}`,
      '',
      ['```demo', variation.demo, '```'].join('\n'),
      '',
    ]),
    /*
     * Prose and a link, not a demo.
     *
     * PPDS §6B asks this section for a demo of one customised instance. A demo of *this*
     * capability customised is what that means, and 50 of the 55 do not have one yet —
     * putting the same generic skinned editor under all of them would satisfy the letter
     * of the rule with something nobody learns anything from, and would put a second
     * editor on every page. Recorded in GAPS.md as G-28 rather than faked.
     */
    '## Customization',
    '',
    `Every part of this is a slot, a token or a handler. See [How to customize](/${PLUGIN}/customization/) for the ten levels and how to pick one, and [Theming & tokens](/${PLUGIN}/customization/theme-tokens/) for the visual side.`,
    '',
    '## Limitations',
    '',
    entry.limitations,
    '',
    '## API',
    '',
    apiLinks,
    '',
  ].join('\n');

  await writeFile(file, `${updated}\n# ${title}\n\n${body}`, 'utf8');
  written += 1;
}

/** Quotes a frontmatter value when it contains something YAML would misread. */
function quote(value) {
  return /[:#'"[\]{}&*!|>%@`]|^\s|\s$/.test(value)
    ? `'${value.replace(/'/g, "''")}'`
    : value;
}

// ── the pages that are not capabilities ──────────────────────────────────────
/*
 * Descriptions for everything else.
 *
 * One line per page, written once and used as the H1 subtitle, the meta description, the
 * OG description and the `llms.txt` entry — P10's single source, and the thing the audit
 * found most broken.
 */
const pageDescriptions = JSON.parse(
  await readFile(path.join(here, 'authoring/pages.json'), 'utf8'),
);

let described = 0;

for (const [pathname, description] of Object.entries(pageDescriptions)) {
  const slug = pathname.replace(`/${PLUGIN}/`, '').replace(/\/$/, '');
  const file = slug === '' ? path.join(dir, 'index.md') : path.join(dir, `${slug}.md`);
  if (!existsSync(file)) {
    problems.push(`no page at ${pathname}`);
    continue;
  }
  const source = await readFile(file, 'utf8');
  if (!/^description: ['"]?TODO/m.test(source) && !force) continue;
  await writeFile(
    file,
    source.replace(/^description: .*$/m, `description: ${quote(description)}`),
    'utf8',
  );
  described += 1;
}

// ── bodies for the pages that are not capabilities and not generated ─────────
/*
 * Prose for the overview, getting-started, demos, customization, guides,
 * integrations, migration and discover-more pages. Split across two files only because
 * one JSON of this length is unreadable in a diff.
 *
 * Reference pages are absent on purpose: their bodies are generated, and authoring one
 * here would be the hand-written reference table P5 forbids.
 */
const bodies = {
  ...JSON.parse(await readFile(path.join(here, 'authoring/bodies.json'), 'utf8')),
  ...JSON.parse(await readFile(path.join(here, 'authoring/bodies-2.json'), 'utf8')),
};

let bodied = 0;

for (const [pathname, body] of Object.entries(bodies)) {
  const slug = pathname.replace(`/${PLUGIN}/`, '').replace(/\/$/, '');
  const file = slug === '' ? path.join(dir, 'index.md') : path.join(dir, `${slug}.md`);
  if (!existsSync(file)) {
    problems.push(`no page at ${pathname}`);
    continue;
  }

  const source = await readFile(file, 'utf8');
  if (!source.includes('TODO:') && !force) continue;

  const frontmatter = source.match(/^---\n[\s\S]*?\n---\n/)?.[0] ?? '';
  const heading = source.match(/^# (.*)$/m)?.[1] ?? '';
  await writeFile(file, `${frontmatter}\n# ${heading}\n\n${body}\n`, 'utf8');
  bodied += 1;
}

if (problems.length > 0) for (const problem of problems) process.stdout.write(`  ! ${problem}\n`);
process.stdout.write(
  `${Object.keys(content).length} capabilities · ${written} written · ${skipped} left alone\n` +
    `${described} descriptions · ${bodied} bodies\n`,
);
