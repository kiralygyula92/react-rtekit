/**
 * The site's search index.
 *
 * Built once, in memory, from the compiled manifest (every page and its headings) and
 * the library's runtime metadata (every slot, command, handler, token and icon). No
 * entry is written by hand, so nothing can point at a page that no longer exists.
 *
 * The manifest is already in the shell; the runtime metadata is imported when the
 * palette first opens, so it is not in the entry chunk.
 */
import { pages } from '../docs/manifest';

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
  // The manifest is the site's content; the runtime metadata is the library's enumerable
  // surface. Between them they cover every page and every symbol, and neither is a list
  // anyone maintains by hand, so a result can never point at a page that is not there.
  const { meta } = await import('react-rtekit/meta');

  const entries: SearchEntry[] = [];

  for (const page of pages) {
    const reference = page.pathname.includes('/api/');
    entries.push({
      id: `page:${page.pathname}`,
      kind: reference ? 'api' : page.capabilityId ? 'example' : 'guide',
      title: page.title,
      context: reference ? 'API reference' : (page.group ?? page.section ?? 'Documentation'),
      to: page.pathname,
      keywords: page.description,
    });

    for (const heading of page.headings) {
      entries.push({
        id: `section:${page.pathname}#${heading.id}`,
        kind: 'section',
        title: heading.text,
        context: page.title,
        to: `${page.pathname}#${heading.id}`,
        keywords: page.title,
      });
    }
  }

  // Symbols come from the runtime metadata, which a unit test holds to the modules it
  // enumerates — so the slot, command, handler and token lists cannot drift from the code.
  const symbols: { name: string; page: string; description: string }[] = [
    ...meta.slots.map((entry) => ({ ...entry, page: 'slots' })),
    ...meta.commands.map((entry) => ({ ...entry, page: 'commands' })),
    ...meta.handlers.map((entry) => ({ ...entry, page: 'handlers' })),
    ...meta.tokens.map((entry) => ({ ...entry, page: 'theme-tokens' })),
    ...meta.toolbarItems.map((entry) => ({ ...entry, page: 'toolbar-items' })),
    ...meta.icons.map((name) => ({ name, description: 'Icon', page: 'icons' })),
  ];

  const seen = new Set<string>();
  for (const symbol of symbols) {
    const id = `symbol:${symbol.page}:${symbol.name}`;
    if (seen.has(id)) continue;
    seen.add(id);
    entries.push({
      id,
      kind: 'symbol',
      title: symbol.name,
      context: symbol.page.replace(/-/g, ' '),
      to: `/react-rtekit/api/${symbol.page}/#${symbol.name}`,
      keywords: symbol.description,
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
