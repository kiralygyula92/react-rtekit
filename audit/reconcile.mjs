import { readFile, readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Cross-references the three capability sources (brief §1.3).
 *
 * A: the package's own runtime metadata — `react-rtekit/meta` enumerates the plugins,
 *    commands, slots, handlers, tokens and locale keys the build actually ships, so it
 *    cannot drift from the code the way a hand-kept list would.
 * B: the site's claims — the examples registry, the guide registry and the README's
 *    "Why" bullets.
 * C: the marketplace listing — `package.json` keywords, standing in for a registry page
 *    that does not exist because the package is unpublished.
 *
 * Prints the mechanical part of the reconciliation: which plugin has a demo, which has a
 * guide, which has neither. The judgement — grouping plugins into capabilities a reader
 * would recognise — is in `capabilities.md`, written against this output.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const require = createRequire(path.join(root, 'package.json'));

const { meta } = require('./packages/react-rtekit/dist/meta.cjs');
const pkg = require('./packages/react-rtekit/package.json');

// ── B: the site ──────────────────────────────────────────────────────────────
const examplesDir = path.join(root, 'apps/site/src/examples');
const examples = [];
for (const entry of await readdir(examplesDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const file = path.join(examplesDir, entry.name, 'meta.ts');
  const source = await readFile(file, 'utf8').catch(() => null);
  if (source === null) continue;
  const body = await readFile(path.join(examplesDir, entry.name, 'index.tsx'), 'utf8').catch(
    () => '',
  );
  examples.push({ slug: entry.name, source: `${source}\n${body}` });
}

const guidesIndex = await readFile(path.join(root, 'apps/site/src/guides/index.ts'), 'utf8');
const guides = [...guidesIndex.matchAll(/slug: '([^']+)'/g)].map((match) => match[1]);
const guideBodies = new Map();
for (const slug of guides) {
  guideBodies.set(
    slug,
    await readFile(path.join(root, `apps/site/src/guides/${slug}.tsx`), 'utf8').catch(() => ''),
  );
}

/**
 * The spellings a plugin goes by.
 *
 * Matching the camelCase name alone produces false negatives that matter: `findReplace`
 * has an example page, a guide mention and a toolbar button, and the string
 * "findReplace" appears in none of the prose — it is written "find and replace". A
 * capability wrongly reported as undocumented would send Phase 5 to write a page that
 * already exists.
 */
/**
 * Plugins whose user-facing name is not their id.
 *
 * `subSup` is the id; nobody writes "sub sup" — the demo and the prose say subscript
 * and superscript, and the capability is covered under those names.
 */
const ALIASES = {
  subSup: ['subscript', 'superscript'],
  checkList: ['checklist', 'check list', 'task list'],
  findReplace: ['find and replace'],
  mergeTag: ['merge tag', 'merge tags', 'variable'],
  markdownShortcuts: ['markdown shortcut', 'markdown input'],
  horizontalRule: ['divider', 'horizontal rule'],
  trailingParagraph: ['trailing paragraph'],
};

function variants(name) {
  const kebab = name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  const spaced = kebab.replace(/-/g, ' ');
  const singular = spaced.replace(/s$/, '');
  return [
    ...new Set([
      name.toLowerCase(),
      kebab,
      spaced,
      singular,
      `${spaced}s`,
      ...(ALIASES[name] ?? []),
    ]),
  ];
}

/** Where a plugin shows up across the site, under any of its spellings. */
function siteEvidence(name) {
  const patterns = variants(name).map(
    (variant) => new RegExp(`\\b${variant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'),
  );
  const hit = (text) => patterns.some((pattern) => pattern.test(text));

  const demos = examples.filter((example) => hit(example.source)).map((example) => example.slug);
  const inGuides = guides.filter((slug) => hit(guideBodies.get(slug) ?? ''));
  return { demos, guides: inGuides };
}

const rows = meta.plugins.map((plugin) => {
  const evidence = siteEvidence(plugin.name);
  return {
    plugin: plugin.name,
    presets: (plugin.description ?? '').replace('In presets: ', '').replace(/\.$/, ''),
    demos: evidence.demos,
    guides: evidence.guides,
    covered: evidence.demos.length > 0 || evidence.guides.length > 0,
  };
});

const uncovered = rows.filter((row) => !row.covered);
const demoOnly = rows.filter((row) => row.demos.length > 0 && row.guides.length === 0);
const guideOnly = rows.filter((row) => row.guides.length > 0 && row.demos.length === 0);

process.stdout.write(
  `${JSON.stringify(
    {
      counts: {
        plugins: meta.plugins.length,
        commands: meta.commands.length,
        slots: meta.slots.length,
        handlers: meta.handlers.length,
        toolbarItems: meta.toolbarItems.length,
        tokens: meta.tokens.length,
        localizationKeys: meta.localizationKeys.length,
        icons: meta.icons.length,
        examples: examples.length,
        guides: guides.length,
        keywords: pkg.keywords.length,
      },
      pluginsWithNoSiteMention: uncovered.map((row) => row.plugin),
      pluginsWithDemoButNoGuide: demoOnly.map((row) => row.plugin),
      pluginsWithGuideButNoDemo: guideOnly.map((row) => row.plugin),
      keywords: pkg.keywords,
      guides,
    },
    null,
    2,
  )}\n`,
);

// Full per-plugin evidence, for capabilities.md.
if (process.argv.includes('--table')) {
  for (const row of rows) {
    process.stdout.write(
      `${row.plugin}\t${row.presets}\t${row.demos.slice(0, 3).join(' ')}\t${row.guides.slice(0, 3).join(' ')}\n`,
    );
  }
}
