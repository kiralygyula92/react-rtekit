import type { ComponentType } from 'react';
import type { ExampleEntry, ExampleMeta } from './registry';

/**
 * The examples, found by directory and loaded on demand.
 *
 * Every folder in `src/examples/` with an `index.tsx` (the component, as its default
 * export) and a `meta.ts` is an example; there is no list to keep in step with them.
 *
 * Only the metadata is in the main bundle. A component and its source are fetched when a
 * page that shows them is opened, so the two form libraries, the fixtures and forty-four
 * editors' worth of code are not downloaded by a reader who opened the FAQ.
 *
 * @module
 */

export type { ExampleEntry, ExampleMeta } from './registry';

const slugOf = (path: string): string => path.split('/')[1] ?? path;

const metas = new Map(
  Object.entries(import.meta.glob<ExampleMeta>('./*/meta.ts', { eager: true, import: 'meta' })).map(
    ([path, meta]) => [slugOf(path), meta],
  ),
);
const components = import.meta.glob<ComponentType>('./*/index.tsx', { import: 'default' });
const sources = import.meta.glob<string>('./*/index.tsx', { query: '?raw', import: 'default' });

const loaded = new Map<string, ExampleEntry>();
const pending = new Map<string, Promise<ExampleEntry | undefined>>();

/** Whether a slug names an example. */
export function hasExample(slug: string): boolean {
  return metas.has(slug);
}

/** An example that has already been loaded, or `undefined`. */
export function peekExample(slug: string): ExampleEntry | undefined {
  return loaded.get(slug);
}

/**
 * Loads an example's component and source, once.
 *
 * A failed load is not cached, so a retry after a network error fetches again rather than
 * replaying the failure.
 */
export function loadExample(slug: string): Promise<ExampleEntry | undefined> {
  const meta = metas.get(slug);
  const component = components[`./${slug}/index.tsx`];
  const source = sources[`./${slug}/index.tsx`];
  if (!meta || !component || !source) return Promise.resolve(undefined);

  let request = pending.get(slug);
  if (!request) {
    request = Promise.all([component(), source()]).then(([Component, code]) => {
      const entry: ExampleEntry = { ...meta, Component, source: code };
      loaded.set(slug, entry);
      return entry;
    });
    request.catch(() => pending.delete(slug));
    pending.set(slug, request);
  }
  return request;
}
