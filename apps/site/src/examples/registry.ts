import type { ComponentType } from 'react';

/** Metadata that accompanies every example page. */
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

/** One loaded example: metadata plus its live component and raw source. */
export interface ExampleEntry extends ExampleMeta {
  Component: ComponentType;
  source: string;
}
