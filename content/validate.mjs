import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The Phase 2 gate.
 *
 * Checks the three things the brief names — the config validates against the schema, no
 * legacy URL is unmapped, no matrix row points at a slug that does not exist — plus the
 * PPDS §4 nav invariants, which are cheap here and expensive later: a nav node whose
 * title is missing, a `subheader` that is not in the taxonomy, a depth-4 branch, a
 * duplicate pathname.
 *
 * Run: node content/validate.mjs
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const require = createRequire(path.join(root, 'package.json'));
const Ajv = require('ajv/dist/2020.js');
const addFormats = require('ajv-formats');

const PLUGIN = 'react-rtekit';
const dir = path.join(here, PLUGIN);

const read = (file) => JSON.parse(readFileSync(file, 'utf8'));
const schema = read(path.join(root, 'docs/ppds/plugin-site.schema.json'));
const config = read(path.join(dir, 'plugin.config.json'));
const nav = read(path.join(dir, 'nav.json'));
const titles = read(path.join(dir, 'titles.json'));

const failures = [];
const notes = [];
const fail = (check, message) => failures.push(`${check}: ${message}`);

// ── 1. plugin.config.json against the schema ─────────────────────────────────
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);
// `$schema` is a local path for editor tooling; the validator resolves it itself.
const { $schema: _ignored, ...configBody } = config;
if (!validate(configBody)) {
  for (const error of validate.errors ?? []) {
    fail('schema', `${error.instancePath || '/'} ${error.message}`);
  }
}

// ── 2. nav invariants (PPDS §4) ──────────────────────────────────────────────
const seen = new Map();
const capabilityIds = new Set();
let maxDepth = 0;

const walk = (nodes, depth, trail) => {
  maxDepth = Math.max(maxDepth, depth);
  for (const node of nodes) {
    const where = [...trail, node.pathname];

    if (seen.has(node.pathname)) {
      fail('N-dup', `${node.pathname} appears twice (${seen.get(node.pathname)} and ${where.join(' > ')})`);
    }
    seen.set(node.pathname, where.join(' > '));

    const isGroup = node.pathname.endsWith('-group');
    if (!isGroup && node.title === undefined && titles[node.pathname] === undefined) {
      fail('N2', `${node.pathname} has no title, in nav or in titles.json`);
    }
    if (isGroup && node.title === undefined) {
      fail('N2', `virtual group ${node.pathname} needs an inline title`);
    }
    /*
     * The taxonomy vocabulary governs how *capabilities* are grouped: PPDS §5 scopes it
     * to "within section 2", and §12 makes those terms portfolio-consistent so that two
     * plugins' feature lists read alike. The schema's one-line description of
     * `subheader` does not carry that scope, and read literally it would force the
     * reference section's groupings — Components, Hooks, Types — into the capability
     * vocabulary, which would corrupt it for every other plugin. Enforced where the
     * standard scopes it; the reading is recorded in EXCEPTIONS.md as E-04.
     */
    const inFeatures = trail[0] === `/${PLUGIN}/features-group`;
    if (node.subheader !== undefined && inFeatures && !config.taxonomy.includes(node.subheader)) {
      fail('N-tax', `${node.pathname} uses subheader "${node.subheader}", not in taxonomy`);
    }
    if (node.plan !== undefined && !config.tiers.some((tier) => tier.id === node.plan)) {
      fail('N4', `${node.pathname} has plan "${node.plan}", not a declared tier`);
    }
    if (node.capabilityId !== undefined) {
      if (capabilityIds.has(node.capabilityId)) {
        fail('N-cap', `capabilityId "${node.capabilityId}" used twice`);
      }
      capabilityIds.add(node.capabilityId);
      const expected = `/${PLUGIN}/${config.urlPrefix}${node.capabilityId}/`;
      if (node.pathname !== expected) {
        fail('R1', `${node.pathname} should be ${expected} for capabilityId "${node.capabilityId}"`);
      }
    }
    if (!isGroup && !node.pathname.endsWith('/')) {
      fail('R4', `${node.pathname} must end in a trailing slash`);
    }
    if (!node.pathname.startsWith(`/${PLUGIN}/`) && node.pathname !== `/${PLUGIN}/`) {
      fail('R-ns', `${node.pathname} is outside the /${PLUGIN}/ namespace`);
    }

    if (node.children) walk(node.children, depth + 1, where);
  }
};
walk(nav, 1, []);

if (maxDepth > 3) fail('N5', `nav depth is ${maxDepth}, max is 3`);

// Capability pages must be flat: exactly one segment under the namespace (R1).
for (const [pathname] of seen) {
  const node = findNode(nav, pathname);
  if (node?.capabilityId === undefined) continue;
  const segments = pathname.slice(`/${PLUGIN}/`.length).replace(/\/$/, '').split('/');
  if (segments.length !== 1) {
    fail('R1', `capability ${pathname} encodes a category in its URL`);
  }
}

function findNode(nodes, pathname) {
  for (const node of nodes) {
    if (node.pathname === pathname) return node;
    const hit = node.children ? findNode(node.children, pathname) : undefined;
    if (hit) return hit;
  }
  return undefined;
}

// ── 3. titles.json and nav.json agree in both directions ─────────────────────
for (const pathname of Object.keys(titles)) {
  if (!seen.has(pathname)) fail('N2', `titles.json has ${pathname}, which is not in nav.json`);
}

// ── 4. sections (PPDS §5) ────────────────────────────────────────────────────
const MANDATORY = [
  'getting-started',
  'features',
  'reference',
  'customization',
  'guides',
  'integrations',
  'migration',
  'discover-more',
];
const enabled = config.sections.filter((section) => section.enabled !== false).map((s) => s.id);
for (const id of MANDATORY) {
  if (!enabled.includes(id)) fail('§5', `mandatory section "${id}" is not enabled`);
}
const CANONICAL_ORDER = [
  'getting-started',
  'features',
  'demos',
  'reference',
  'customization',
  'guides',
  'integrations',
  'resources',
  'migration',
  'discover-more',
  'design-resources',
];
const order = enabled.map((id) => CANONICAL_ORDER.indexOf(id));
if (order.some((value, index) => index > 0 && value < order[index - 1])) {
  fail('§5', 'sections are not in canonical order');
}
// The sidebar's top-level groups must match the enabled sections, in the same order.
const navSections = nav.map((node) => node.pathname.replace(`/${PLUGIN}/`, '').replace('-group', ''));
if (navSections.join(',') !== enabled.join(',')) {
  fail('11.5', `sidebar order [${navSections}] does not match sections [${enabled}]`);
}

// ── 5. pricing (PPDS §8.6, checks 13–15) ─────────────────────────────────────
const pricingFile = path.join(dir, 'pricing.json');
const tiered = config.tiers.length > 1;
if (tiered && !existsSync(pricingFile)) {
  fail('§8.6', 'plugin is tiered but pricing.json is missing');
}
if (!tiered && existsSync(pricingFile)) {
  fail('§8.6', 'plugin is not tiered but pricing.json exists');
}
if (!tiered) {
  notes.push('single tier: pricing.json, the feature matrix and checks 13-15 do not apply (EXCEPTIONS E-02)');
  const gated = [...seen.keys()].filter((p) => findNode(nav, p)?.plan !== undefined);
  if (gated.length > 0) fail('§8.6', `untiered plugin has ${gated.length} gated node(s)`);
}

// ── 6. the URL map covers every legacy URL exactly once ──────────────────────
const mapFile = path.join(here, PLUGIN, 'migration/url-map.csv');
if (!existsSync(mapFile)) {
  fail('§10', 'migration/url-map.csv is missing');
} else {
  const rows = readFileSync(mapFile, 'utf8')
    .trim()
    .split('\n')
    .slice(1)
    .map((line) => line.match(/(".*?"|[^,]*)(,|$)/g)?.map((c) => c.replace(/,$/, '').replace(/^"|"$/g, '')) ?? []);

  const legacy = new Set();
  const ACTIONS = new Set(['port', 'split', 'merge', 'generate', 'rewrite', 'retire']);
  for (const [from, , , to, action, redirect] of rows) {
    if (!from) continue;
    if (legacy.has(from)) fail('§10', `legacy URL ${from} appears twice in url-map.csv`);
    legacy.add(from);
    if (!ACTIONS.has(action)) fail('§10', `${from} has action "${action}", not one of ${[...ACTIONS]}`);
    if (action === 'retire') fail('§10', `${from} is marked retire, which the brief forbids`);
    if (!redirect) fail('§10', `${from} has no redirect target`);
    // A target outside the nav is allowed only where the row says the URL keeps its
    // place: `/internal/performance` is the e2e harness, deliberately unlisted (E-05).
    const keepsItsUrl = redirect === '(same URL)';
    if (to && !seen.has(to) && !keepsItsUrl) {
      fail('§10', `${from} targets ${to}, which is not in nav.json`);
    }
  }

  // Every URL the Phase 1 crawl found must be in the map.
  const crawl = read(path.join(root, 'audit/crawl.json'));
  for (const page of crawl) {
    if (!legacy.has(page.route)) fail('§10', `crawled URL ${page.route} is not in url-map.csv`);
  }
  notes.push(`url-map.csv: ${legacy.size} legacy URLs, ${crawl.length} crawled`);
}

// ── report ───────────────────────────────────────────────────────────────────
notes.push(`nav: ${seen.size} nodes, depth ${maxDepth}, ${capabilityIds.size} capabilities`);
for (const note of notes) process.stdout.write(`  · ${note}\n`);

if (failures.length > 0) {
  process.stdout.write(`\n${failures.length} failure(s):\n`);
  for (const failure of failures) process.stdout.write(`  ✗ ${failure}\n`);
  process.exit(1);
}
process.stdout.write('\nPhase 2 gate: PASS\n');
