import type { ComponentType } from 'react';

/** Metadata that accompanies every example page (08 §2). */
export interface ExampleMeta {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  /** Feature ids demonstrated; drives the gallery filter. */
  features: string[];
  /** Slugs of related examples. */
  related?: string[];
  /** Highest-priority examples are pinned to the top of the gallery. */
  priority?: number;
}

/** One registered example: metadata plus its live component and raw source. */
export interface ExampleEntry extends ExampleMeta {
  Component: ComponentType;
  source: string;
}

/**
 * Every example, keyed by slug.
 *
 * Populated by `src/examples/index.ts`, which is the single place a new example has
 * to be registered.
 */
export const examples = new Map<string, ExampleEntry>();

/** Registers one example. Called from `src/examples/index.ts`. */
export function registerExample(entry: ExampleEntry): void {
  examples.set(entry.slug, entry);
}

/** All examples, highest priority first, then alphabetical. */
export function listExamples(): ExampleEntry[] {
  return [...examples.values()].sort(
    (a, b) => (b.priority ?? 0) - (a.priority ?? 0) || a.title.localeCompare(b.title),
  );
}
