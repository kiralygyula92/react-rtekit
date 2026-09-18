import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Proofreads the prose, which no other check in this repo looks at.
 *
 * `build.mjs` checks that the pages are well formed: links resolve, headings nest, every
 * page has a description. It is happy with headings that are Title Case on one page and
 * sentence case on the next, or a page that says "color" in a body of text that says
 * "colour" everywhere else — and pages written over many sessions drift that way by
 * default.
 *
 * Every check runs on *prose*: front matter, fenced code, indented code, inline code and
 * link targets are removed first, so an identifier named `color` never votes on how the
 * sentences are spelled.
 *
 * House style, derived from the corpus rather than imposed on it:
 *   - Oxford English — British spellings (colour, behaviour, centre) with -ize endings
 *     (sanitize, customize, serialize).
 *   - Straight apostrophes and quotation marks.
 *   - Spaced em dashes.
 *   - Sentence case for titles and headings.
 *   - A description that is one sentence and ends in a full stop.
 *
 * Usage: node content/copy-check.mjs [--report <file.md>]
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const PLUGIN = 'react-rtekit';

/** Everything in the content tree, since "all copy" means all of it. */
async function markdownFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue;
      out.push(...(await markdownFiles(full)));
    } else if (entry.name.endsWith('.md')) {
      out.push(full);
    }
  }
  return out.sort();
}

/** Splits `---` front matter off the body. Values stay raw; only the keys are needed. */
function split(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { front: null, body: source, offset: 0 };
  const front = {};
  for (const line of match[1].split(/\r?\n/)) {
    const pair = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (pair) front[pair[1]] = pair[2].replace(/^["']|["']$/g, '').trim();
  }
  // So a finding points at the line an editor will open at, not at the line the body
  // happens to start on.
  const offset = source.slice(0, source.length - match[2].length).split('\n').length - 1;
  return { front, body: match[2], offset };
}

/**
 * Erases text without moving anything: spaces, not deletion, so the line and column a
 * finding points at are still the ones in the file.
 */
const blank = (text) => text.replace(/[^\n]/g, ' ');

/**
 * The body with block-level code blanked out: still readable as sentences, and still
 * carrying its inline code. Checks about *spacing* need this view, because blanking an
 * inline code span leaves a run of spaces that looks exactly like a typing error.
 */
function toFlow(body) {
  // Fences are walked rather than matched: `/^```[\s\S]*?$/m` stops at the end of the
  // opening line, which blanks the fence marker and leaves the code as "prose".
  let fenced = false;
  return body
    .split('\n')
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) {
        fenced = !fenced;
        return blank(line);
      }
      return fenced ? blank(line) : line;
    })
    .join('\n')
    .replace(/^(?: {4,}|\t)\S[^\n]*$/gm, blank);
}

/**
 * `toFlow` with each inline code span reduced to one marker glyph.
 *
 * For checks about adjacent words. Blanking a span leaves "to `icons` to" looking like a
 * repeated word; leaving the span alone makes `0 0 0 2px` one. A single non-word
 * character in its place is neither.
 */
function toWords(flow) {
  return flow.replace(/`[^`\n]*`/g, (span) => `·${' '.repeat(span.length - 1)}`);
}

/** `toFlow` with the inline code, link targets, table rules and raw HTML taken out too. */
function toProse(flow) {
  return flow
    .replace(/`[^`\n]*`/g, blank)
    .replace(/^\s*\|[-: |]+\|\s*$/gm, blank)
    .replace(/\]\(([^)\n]*)\)/g, (m) => `](${blank(m.slice(2, -1))})`)
    .replace(/^<[\s\S]*?>$/gm, blank);
}

const findings = [];
const add = (file, line, check, message, severity = 'error') => {
  findings.push({
    file: path.relative(root, file).replaceAll('\\', '/'),
    line,
    check,
    message,
    severity,
  });
};

/** Oxford English: British spellings, -ize endings. Left side is wrong, right is house. */
const SPELLING = [
  [/\bcolors?\b/gi, 'colour'],
  [/\bcolou?ri(s|z)ed?\b/gi, 'coloured'],
  [/\bbehaviors?\b/gi, 'behaviour'],
  [/\bcenters?\b/gi, 'centre'],
  [/\bgray\b/gi, 'grey'],
  [/\bcatalogs?\b/gi, 'catalogue'],
  [/\bcancele[d]\b/gi, 'cancelled'],
  [/\bfulfille?d?\b/g, null],
  [/\bsanitis(e|ed|es|ing|ation)\b/gi, 'sanitize'],
  [/\bcustomis(e|ed|es|ing|ation)\b/gi, 'customize'],
  [/\bserialis(e|ed|es|ing|ation)\b/gi, 'serialize'],
  [/\bnormalis(e|ed|es|ing|ation)\b/gi, 'normalize'],
  [/\brecognis(e|ed|es|ing)\b/gi, 'recognize'],
  [/\borganis(e|ed|es|ing|ation)\b/gi, 'organize'],
  [/\bemphasis(ed|es|ing)\b/gi, 'emphasize'],
].filter(([, to]) => to !== null);

/**
 * Words this project spells a particular way, whatever a dictionary says.
 *
 * `react-rtekit` (the package) and `React RTE Kit` (the product) are both correct and
 * are not interchangeable, so neither is listed; only the spellings that are neither.
 */
const TERMS = [
  [/(?<!React )\bRTE ?Kit\b/g, 'React RTE Kit'],
  [/\bReact-RTE ?Kit\b/g, 'React RTE Kit'],
  [/\breact ?rte ?kit\b/g, 'react-rtekit'],
  [/\bcontent[- ]editable\b/g, 'contenteditable'],
  [/\bfrontmatter\b/gi, 'front matter'],
];

const PLACEHOLDER = /\b(TODO|TBD|FIXME|XXX|lorem ipsum|coming soon|placeholder text|WIP)\b/gi;

/**
 * What each check enforces, for the report.
 *
 * A report that says only "nothing outstanding" records that the script ran, not what it
 * looked at — so a reader cannot tell a clean corpus from a check that was never written.
 */
const CHECKS = {
  'front-matter': 'Every page has front matter with a title and a description.',
  title: 'Titles are sentence case and do not end in a full stop.',
  description:
    "Descriptions end in a full stop and are 40-200 characters, the schema's own nav limit.",
  spelling: 'Oxford English: British spellings with -ize endings, measured on prose only.',
  term: 'Project spellings: React RTE Kit, react-rtekit, contenteditable, front matter.',
  placeholder: 'No TODO, TBD, FIXME, lorem ipsum or "coming soon" left in a published page.',
  doubled: 'No accidentally repeated word.',
  quotes:
    'Straight apostrophes and quotation marks, which is what 400-odd marks in the corpus use.',
  dash: 'Spaced em dashes; no hyphen standing in for one.',
  spacing: 'One space after a full stop, and no trailing whitespace.',
  link: 'Internal links resolve in the nav; no relative .md targets; link text says where it goes.',
  table: 'No row in a Description column left empty.',
  heading: 'One H1, matching the title; no heading ends in punctuation.',
};

/** Reports every match of `pattern` in `text`, with the line it fell on. */
function each(text, pattern, visit) {
  const lines = text.split('\n');
  lines.forEach((line, index) => {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(line)) !== null) {
      visit(match, index + 1, line);
      if (match[0] === '') pattern.lastIndex += 1;
    }
  });
}

// The published pages only: `content/README.md` documents the pipeline for whoever
// maintains it, and is not copy anyone reads on the site.
const files = await markdownFiles(path.join(here, PLUGIN));

/** Every pathname the nav knows about, for checking internal links. */
const nav = JSON.parse(await readFile(path.join(here, PLUGIN, 'nav.json'), 'utf8'));
const known = new Set();
(function walk(nodes) {
  for (const node of nodes) {
    known.add(node.pathname);
    if (node.children) walk(node.children);
  }
})(nav);

for (const file of files) {
  const source = await readFile(file, 'utf8');
  const { front, body, offset } = split(source);
  const flow = toFlow(body);
  const words = toWords(flow);
  const prose = toProse(flow);
  const at = (line) => line + offset;

  // ── front matter ──────────────────────────────────────────────────────────
  if (front === null) {
    add(file, 1, 'front-matter', 'no front matter');
  } else {
    for (const key of ['title', 'description']) {
      if (!front[key]) add(file, 1, 'front-matter', `no ${key}`);
    }
    if (front.title?.endsWith('.')) add(file, 1, 'title', 'title ends in a full stop');
    if (front.description && !/[.?!]$/.test(front.description)) {
      add(file, 1, 'description', 'description does not end in a full stop');
    }
    // 200 at most: the same string is the nav tooltip, the meta description and the
    // llms.txt line, so an overlong one is an error rather than a preference.
    if (front.description && front.description.length > 200) {
      add(
        file,
        1,
        'description',
        `description is ${front.description.length} characters (max 200)`,
      );
    }
    if (front.description && front.description.length < 40) {
      add(
        file,
        1,
        'description',
        `description is ${front.description.length} characters (min 40)`,
        'warn',
      );
    }
    // Sentence case: no interior capitalised word that is not a known proper noun.
    const PROPER =
      /^(React|RTE|Kit|API|HTML|CSS|JSON|SSR|DOM|MIT|TypeScript|JavaScript|Markdown|Lexical|Quill|Word|Office|Google|Docs|Next\.js|Remix|Vite|Hook|Form|I18n|A11y|E-mail|Tab|Enter|Escape|Shift|Ctrl|Cmd|Alt|Oxford|Playwright|Vitest|ARIA|WCAG|URL|URLs|UI|UX|SVG|XSS|IME|npm|pnpm|GitHub|Storybook|Jest|Emotion|Tailwind|MUI|Chakra|Zod|Yup|Joi|RHF|Formik|Redux)$/;
    const words = (front.title ?? '').split(/[\s/&—-]+/).slice(1);
    const shouty = words.filter(
      (word) => /^[A-Z]/.test(word) && !PROPER.test(word.replace(/[^\w.]/g, '')),
    );
    if (shouty.length > 0) {
      add(file, 1, 'title', `title may be Title Case: ${shouty.join(', ')}`, 'warn');
    }
  }

  // ── spelling and terminology ──────────────────────────────────────────────
  for (const [pattern, house] of SPELLING) {
    each(prose, pattern, (match, line) => {
      add(file, at(line), 'spelling', `“${match[0]}” — house style is “${house}”`);
    });
  }
  for (const [pattern, house] of TERMS) {
    each(prose, pattern, (match, line) => {
      add(file, at(line), 'term', `“${match[0].trim()}” — house style is “${house}”`);
    });
  }

  // ── mechanics ─────────────────────────────────────────────────────────────
  each(prose, PLACEHOLDER, (match, line) => {
    add(file, at(line), 'placeholder', `unfinished copy: “${match[0]}”`);
  });
  each(words, /\b(\w+)\s+\1\b/gi, (match, line) => {
    // "that that" and "had had" are grammatical; a repeated noun rarely is.
    if (/^(that|had|is|the)$/i.test(match[1])) return;
    add(file, at(line), 'doubled', `repeated word: “${match[0]}”`);
  });
  // Straight marks, by a margin of 407 to 3 across the corpus. Consistency is the point
  // rather than typographic preference, and the majority spelling wins.
  each(prose, /[‘’]/g, (match, line) => {
    add(
      file,
      at(line),
      'quotes',
      'curly apostrophe — the rest of the corpus uses a straight one',
      'warn',
    );
  });
  each(prose, /[“”]/g, (match, line) => {
    add(
      file,
      at(line),
      'quotes',
      'curly quotation mark — the rest of the corpus uses straight ones',
      'warn',
    );
  });
  each(prose, /\S—\S/g, (match, line) => {
    add(file, at(line), 'dash', `unspaced em dash: “${match[0]}”`, 'warn');
  });
  each(prose, /(?<=[a-z,;)])\s-\s(?=[a-z(])/g, (match, line) => {
    add(file, at(line), 'dash', 'spaced hyphen where an em dash belongs', 'warn');
  });
  each(flow, /[.!?] {2,}\S/g, (match, line) => {
    add(file, at(line), 'spacing', 'two spaces after a full stop');
  });
  // On the raw body: `prose` blanks code with spaces, so every stripped line would
  // otherwise look like trailing whitespace.
  each(body, /\S[ \t]+$/g, (match, line) => {
    add(file, at(line), 'spacing', 'trailing whitespace', 'warn');
  });

  // ── links ─────────────────────────────────────────────────────────────────
  each(body, /\]\((\/[^)\s#]*)(#[^)\s]*)?\)/g, (match, line) => {
    // The site also serves files the nav does not list: the `.md` twin of every page,
    // `llms.txt` and `sitemap.xml`. Those are addresses, not nav entries.
    if (/\.(md|txt|xml|json|ico|png|svg)$/.test(match[1])) return;
    const target = match[1].endsWith('/') ? match[1] : `${match[1]}/`;
    if (!known.has(target)) {
      add(file, at(line), 'link', `internal link goes nowhere in the nav: ${match[1]}`);
    }
  });
  // A *relative* .md link only works in an editor; an absolute one is a real URL
  // somewhere else, usually a file on GitHub.
  each(body, /\]\((?!https?:|\/)([^)\s]+\.md)(#[^)\s]*)?\)/g, (match, line) => {
    add(file, at(line), 'link', `links to a source file rather than a URL: ${match[1]}`);
  });
  // An empty link text reads as nothing to a screen reader.
  each(body, /\[\s*\]\(/g, (match, line) => {
    add(file, at(line), 'link', 'link with no text');
  });
  each(body, /\[(here|this|click here|link|read more)\]\(/gi, (match, line) => {
    add(file, at(line), 'link', `link text says “${match[1]}” rather than where it goes`, 'warn');
  });

  // ── tables ────────────────────────────────────────────────────────────────
  // A row in a "Description" column with nothing in it is a documented symbol that is
  // not actually documented, and it renders as an empty cell rather than as a gap
  // anybody notices.
  let described = false;
  each(body, /^\|(.+)\|\s*$/gm, (match, line) => {
    const cells = match[1].split('|').map((cell) => cell.trim());
    const last = cells.at(-1) ?? '';
    if (/^:?-{2,}:?$/.test(last)) return;
    if (last.toLowerCase() === 'description') {
      described = true;
      return;
    }
    if (described && last === '') {
      add(file, at(line), 'table', `no description for ${cells[0] || 'a row'}`);
    }
  });

  // ── headings ──────────────────────────────────────────────────────────────
  // On prose, not the body: a shell comment inside a fence starts with `#` too.
  let firstHeading = true;
  each(prose, /^(#{1,6})\s+(.*)$/gm, (match, line) => {
    const text = match[2].trim();
    // The build strips the leading H1 and the page component renders the title in its
    // place, so exactly one H1, first, is right. A second is two H1s on the page.
    if (match[1] === '#') {
      if (!firstHeading) add(file, at(line), 'heading', 'a second H1 — the page already has one');
      // Archetype A is the overview, whose H1 is "<product> — Overview" by design.
      else if (text !== front?.title && !(front?.archetype === 'A' && text.endsWith(front.title))) {
        add(file, at(line), 'heading', `H1 “${text}” does not match the title “${front?.title}”`);
      }
    }
    firstHeading = false;
    if (/[.:]$/.test(text)) add(file, at(line), 'heading', 'heading ends in punctuation', 'warn');
  });
}

// ── output ──────────────────────────────────────────────────────────────────
const errors = findings.filter((f) => f.severity === 'error');
const warnings = findings.filter((f) => f.severity === 'warn');

const byCheck = new Map();
for (const finding of findings) {
  byCheck.set(finding.check, (byCheck.get(finding.check) ?? 0) + 1);
}

const say = (line = '') => process.stdout.write(`${line}\n`);

say(`Read ${files.length} files.`);
say(`${errors.length} errors, ${warnings.length} warnings.\n`);
for (const [check, count] of [...byCheck].sort((a, b) => b[1] - a[1])) {
  say(`  ${String(count).padStart(4)}  ${check}`);
}
say();
for (const finding of findings) {
  say(
    `${finding.severity === 'error' ? 'E' : 'W'} ${finding.file}:${finding.line}  [${finding.check}] ${finding.message}`,
  );
}

const reportAt = process.argv.indexOf('--report');
if (reportAt !== -1) {
  const target = process.argv[reportAt + 1];
  if (target === undefined) {
    console.error('--report needs a path');
    process.exit(2);
  }
  const rows = findings.map(
    (f) =>
      `| ${f.severity} | ${f.check} | \`${f.file}:${f.line}\` | ${f.message.replaceAll('|', '\\|')} |`,
  );
  const body = [
    '# Copy report',
    '',
    `Generated by \`content/copy-check.mjs\` over ${files.length} pages.`,
    '',
    `**${errors.length} errors, ${warnings.length} warnings.**`,
    '',
    '## Findings',
    '',
    ...(findings.length === 0
      ? ['Nothing outstanding.']
      : ['| Severity | Check | Where | What |', '|---|---|---|---|', ...rows]),
    '',
    '## What was checked',
    '',
    '| Check | What it enforces | Findings |',
    '|---|---|---|',
    ...Object.entries(CHECKS).map(
      ([check, what]) => `| \`${check}\` | ${what} | ${byCheck.get(check) ?? 0} |`,
    ),
    '',
    'Every check runs on prose: front matter, fenced and indented code, inline code and',
    'link targets are removed first, so an identifier never votes on how the sentences',
    'are spelled.',
    '',
  ].join('\n');
  await writeFile(path.resolve(root, target), body, 'utf8');
  say(`\nWrote ${target}`);
}

process.exit(errors.length > 0 ? 1 : 0);
