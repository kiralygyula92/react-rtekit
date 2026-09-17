import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Builds `url-map.csv` from the Phase 1 crawl.
 *
 * Generated rather than typed, because the invariant the gate checks is that *every*
 * crawled URL appears exactly once — and a hand-kept table of 81 rows drifts from the
 * crawl the moment either changes. The decision rules from PPDS §10 are encoded below;
 * anything they do not cover throws rather than guessing, so a new page cannot slip
 * through with an empty action.
 *
 * Run: node content/react-rtekit/migration/build-url-map.mjs
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../..');
const NS = '/react-rtekit';

/** Legacy example slug -> the capability page it becomes. */
const EXAMPLE_TO_CAPABILITY = {
  accessibility: 'accessibility',
  autosave: 'autosave',
  basic: 'getting-started/usage',
  'command-overrides': 'commands',
  composable: 'composable-parts',
  'content-styles': 'content-view',
  controlled: 'value-formats',
  'counter-and-limits': 'counters-and-limits',
  'design-system-skin': 'customization/design-system-skin',
  'email-output': 'email-output',
  'emoji-and-slash': 'emoji',
  'find-replace': 'find-and-replace',
  'floating-toolbar': 'selection-toolbar',
  formatting: 'text-formatting',
  fullscreen: 'fullscreen',
  'handlers-middleware': 'handler-middleware',
  headless: 'headless',
  history: 'history',
  'html-interop': 'html-interop',
  images: 'images',
  'large-document': 'demos/large-document',
  'legacy-parity': 'demos/legacy-parity',
  links: 'links',
  lists: 'lists',
  localization: 'localization',
  markdown: 'markdown-shortcuts',
  mentions: 'mentions',
  'merge-tags': 'merge-tags',
  mobile: 'mobile',
  'multiple-editors': 'demos/cms-body-field',
  'paste-cleanup': 'paste-cleanup',
  'plugin-authoring': 'plugin-authoring',
  presets: 'presets',
  'readonly-and-disabled': 'read-only-and-disabled',
  sanitization: 'sanitization',
  'slots-custom': 'slots',
  'source-view': 'source-view',
  tables: 'tables',
  'tailwind-skin': 'integrations/tailwind',
  theming: 'theming',
  'toolbar-config': 'toolbar',
  'validation-formik': 'integrations/formik',
  'validation-rhf': 'integrations/react-hook-form',
  'value-formats': 'value-formats',
};

/** Legacy guide slug -> its new home. */
const GUIDE_TO_PAGE = {
  'getting-started': 'getting-started/usage',
  'value-and-formats': 'value-formats',
  forms: 'forms',
  sanitization: 'sanitization',
  'html-interop': 'html-interop',
  'merge-tags': 'merge-tags',
  toolbar: 'toolbar',
  plugins: 'guides/writing-a-plugin',
  'slots-and-handlers': 'slots',
  theming: 'customization/theme-tokens',
  uploads: 'images',
  accessibility: 'guides/accessibility',
  localization: 'guides/localization',
  performance: 'guides/performance',
  ssr: 'guides/server-rendering',
  'migration-from-quill': 'migration/from-quill',
};

/** Legacy generated API page -> its new reference page. */
const API_TO_PAGE = {
  '/api': 'api',
  '/api/rich-text-editor': 'api/rich-text-editor',
  '/api/editor-instance': 'api/editor-instance',
  '/api/commands': 'api/commands',
  '/api/handlers': 'api/handlers',
  '/api/hooks': 'api/editor-hooks',
  '/api/slots': 'api/slots',
  '/api/plugins': 'api/plugins',
  '/api/theme-tokens': 'api/theme-tokens',
  '/api/localization': 'api/localization-keys',
  '/api/icons': 'api/icons',
  '/api/types': 'api/types',
  '/api/utilities': 'api/serialization',
};

/** One row: the §10 decision for a single legacy URL. */
function decide(route) {
  const to = (slug) => `${NS}/${slug}${slug.endsWith('/') ? '' : '/'}`;

  if (route === '/') {
    // No marketing surface (EXCEPTIONS E-01): the root becomes the docs root.
    return ['marketing', 'A. Docs Overview', `${NS}/`, 'rewrite'];
  }
  if (route === '/docs') {
    return ['install', 'F. Getting started', to('getting-started/usage'), 'port'];
  }
  if (route === '/docs/getting-started') {
    return ['install', 'F. Getting started', to('getting-started/usage'), 'merge'];
  }
  if (route.startsWith('/docs/guides/')) {
    const slug = route.slice('/docs/guides/'.length);
    const target = GUIDE_TO_PAGE[slug];
    if (!target) throw new Error(`no mapping for guide ${slug}`);
    // A guide that becomes a capability page is a re-cut, not a port: its prose is
    // redistributed into Basics / Customization / Limitations slots.
    const archetype = target.startsWith('guides/') ? 'I. Editorial' : 'B. Capability';
    return ['how-to', archetype, to(target), 'split'];
  }
  if (route === '/examples') {
    // 44 H2s on one page (GAPS G-20) becomes the features index.
    return ['capability', 'C. Features index', to('all-features'), 'split'];
  }
  if (route.startsWith('/examples/')) {
    const slug = route.slice('/examples/'.length);
    const target = EXAMPLE_TO_CAPABILITY[slug];
    if (!target) throw new Error(`no mapping for example ${slug}`);
    return ['capability', 'B. Capability', to(target), 'port'];
  }
  if (route === '/playground') {
    return ['tool', 'B. Capability', to('demos/playground'), 'port'];
  }
  if (route === '/theme-editor') {
    return ['tool', 'B. Capability', to('demos/theme-editor'), 'port'];
  }
  if (route === '/changelog') {
    // Unreachable today (GAPS G-07); PPDS §5.10 gives it a home.
    return ['changelog', 'I. Editorial', to('discover-more/changelog'), 'port'];
  }
  if (route === '/internal/performance') {
    // The e2e harness. Kept at its own URL, excluded from nav and indexing (E-05).
    return ['orphan', '(none — test harness)', '/internal/performance', 'port'];
  }
  if (API_TO_PAGE[route] !== undefined) {
    return ['reference', 'E. Reference', to(API_TO_PAGE[route]), 'generate'];
  }
  throw new Error(`no §10 decision for ${route}`);
}

const crawl = JSON.parse(await readFile(path.join(root, 'audit/crawl.json'), 'utf8'));
const rows = crawl
  .map((page) => {
    const [type, archetype, to, action] = decide(page.route);
    const redirect = to === page.route ? '(same URL)' : `301 ${page.route} -> ${to}`;
    return [page.route, type, archetype, to, action, redirect];
  })
  .sort((a, b) => a[0].localeCompare(b[0]));

const cell = (value) => (/[",]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);
const csv = [
  ['legacy_url', 'content_type_found', 'target_archetype', 'target_url', 'action', 'redirect'],
  ...rows,
]
  .map((row) => row.map(cell).join(','))
  .join('\n');

await mkdir(here, { recursive: true });
await writeFile(path.join(here, 'url-map.csv'), `${csv}\n`, 'utf8');

const byAction = {};
for (const row of rows) byAction[row[4]] = (byAction[row[4]] ?? 0) + 1;
process.stdout.write(`${rows.length} legacy URLs mapped: ${JSON.stringify(byAction)}\n`);
