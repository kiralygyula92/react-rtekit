/**
 * The site's search index.
 *
 * Built once, in memory, from the same sources the pages themselves render: guide
 * headings are parsed from the guide modules, example metadata comes from the example
 * registry, and API symbols come from TypeDoc plus the library's runtime metadata. No
 * entry is written by hand, so nothing can point at a page that no longer exists.
 *
 * Every source is imported dynamically. The palette lives in the site header, so a
 * static import would pull the guides, the examples and the API data into the entry
 * chunk and undo the route splitting.
 */

/** What kind of thing a result is, which is also how results are grouped. */
export type SearchKind = 'guide' | 'section' | 'example' | 'api' | 'symbol';

/** One searchable thing. */
export interface SearchEntry {
  /** Stable identity, used as the React key and for the active-row announcement. */
  id: string;
  /** What kind of thing this is. */
  kind: SearchKind;
  /** The result's heading. */
  title: string;
  /** Where it sits, e.g. the guide a section belongs to. */
  context: string;
  /** Where activating it goes. */
  to: string;
  /** Extra words that should match, beyond the title. */
  keywords: string;
}

/** The kinds, in the order their groups appear in the results. */
export const KIND_ORDER: readonly SearchKind[] = ['guide', 'section', 'api', 'symbol', 'example'];

/** What each group's heading says. */
export const KIND_LABEL: Record<SearchKind, string> = {
  guide: 'Guides',
  section: 'Sections',
  api: 'API',
  symbol: 'Symbols',
  example: 'Examples',
};

async function build(): Promise<SearchEntry[]> {
  const [{ GUIDES, guideHeadings }, { listExamples }, { API_PAGES }, apiPages, { meta }] =
    await Promise.all([
      import('../guides'),
      import('../examples'),
      import('../routes/ApiIndex'),
      import('../api/pages.json'),
      import('react-rtekit/meta'),
    ]);

  const generated = apiPages.default as Record<string, { name: string; description: string }[]>;
  const entries: SearchEntry[] = [];

  for (const guide of GUIDES) {
    entries.push({
      id: `guide:${guide.slug}`,
      kind: 'guide',
      title: guide.title,
      context: 'Guide',
      to: `/docs/guides/${guide.slug}`,
      keywords: guide.slug.replace(/-/g, ' '),
    });

    for (const heading of guideHeadings(guide.slug)) {
      entries.push({
        id: `section:${guide.slug}#${heading.id}`,
        kind: 'section',
        title: heading.title,
        context: guide.title,
        to: `/docs/guides/${guide.slug}#${heading.id}`,
        keywords: guide.title,
      });
    }
  }

  for (const page of API_PAGES) {
    entries.push({
      id: `api:${page.slug}`,
      kind: 'api',
      title: page.title,
      context: 'API reference',
      to: `/api/${page.slug}`,
      keywords: page.description,
    });
  }

  // Symbols: TypeDoc for the typed surface, runtime metadata for the lists that must
  // never drift (slots, commands, handlers, tokens).
  const symbols: { name: string; page: string; description: string }[] = [];
  for (const [slug, rows] of Object.entries(generated)) {
    for (const row of rows) {
      symbols.push({ name: row.name, page: slug, description: row.description });
    }
  }
  for (const slot of meta.slots) {
    symbols.push({ name: slot.name, page: 'slots', description: slot.description });
  }
  for (const command of meta.commands) {
    symbols.push({ name: command.name, page: 'commands', description: command.description });
  }
  for (const handler of meta.handlers) {
    symbols.push({ name: handler.name, page: 'handlers', description: handler.description });
  }
  for (const token of meta.tokens) {
    symbols.push({ name: token.name, page: 'theme-tokens', description: token.description });
  }

  const seen = new Set<string>();
  for (const symbol of symbols) {
    const id = `symbol:${symbol.page}:${symbol.name}`;
    if (seen.has(id)) continue;
    seen.add(id);
    entries.push({
      id,
      kind: 'symbol',
      title: symbol.name,
      context: API_PAGES.find((page) => page.slug === symbol.page)?.title ?? symbol.page,
      to: `/api/${symbol.page}?q=${encodeURIComponent(symbol.name)}#${symbol.name}`,
      keywords: symbol.description,
    });
  }

  for (const example of listExamples()) {
    entries.push({
      id: `example:${example.slug}`,
      kind: 'example',
      title: example.title,
      context: 'Example',
      to: `/examples/${example.slug}`,
      keywords: `${example.description} ${example.tags.join(' ')} ${example.features.join(' ')}`,
    });
  }

  return entries;
}

let pending: Promise<SearchEntry[]> | null = null;

/** The whole index, built on first use and kept for the rest of the session. */
export function loadSearchIndex(): Promise<SearchEntry[]> {
  pending ??= build();
  return pending;
}

/**
 * Scores one entry against a query.
 *
 * Higher is better; `0` means it does not match. An exact title beats a title prefix,
 * which beats a word inside the title, which beats a keyword hit — so typing "bold"
 * reaches the Bold command before it reaches a guide that merely mentions it.
 */
function score(entry: SearchEntry, query: string): number {
  const title = entry.title.toLowerCase();
  if (title === query) return 100;
  if (title.startsWith(query)) return 80;

  const words = title.split(/[\s.-]+/);
  if (words.some((word) => word.startsWith(query))) return 60;
  if (title.includes(query)) return 40;
  if (entry.context.toLowerCase().includes(query)) return 20;
  if (entry.keywords.toLowerCase().includes(query)) return 10;
  return 0;
}

/** The best matches for a query, most relevant first. */
export function search(index: readonly SearchEntry[], query: string, limit = 24): SearchEntry[] {
  const needle = query.trim().toLowerCase();
  if (needle === '') return [];

  const scored: { entry: SearchEntry; score: number }[] = [];
  for (const entry of index) {
    const value = score(entry, needle);
    if (value > 0) scored.push({ entry, score: value });
  }

  scored.sort(
    (a, b) =>
      b.score - a.score ||
      KIND_ORDER.indexOf(a.entry.kind) - KIND_ORDER.indexOf(b.entry.kind) ||
      a.entry.title.localeCompare(b.entry.title),
  );

  return scored.slice(0, limit).map((hit) => hit.entry);
}
