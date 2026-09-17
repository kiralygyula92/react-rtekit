import type { ComponentType } from 'react';
import { GettingStarted } from './getting-started';
import { ValueAndFormats } from './value-and-formats';
import { Forms } from './forms';
import { Sanitization } from './sanitization';
import { HtmlInterop } from './html-interop';
import { MergeTags } from './merge-tags';
import { Toolbar } from './toolbar';
import { Plugins } from './plugins';
import { SlotsAndHandlers } from './slots-and-handlers';
import { Theming } from './theming';
import { Uploads } from './uploads';
import { Accessibility } from './accessibility';
import { Localization } from './localization';
import { Performance } from './performance';
import { Ssr } from './ssr';
import { MigrationSkimmer } from './migration-skimmer';

/**
 * The guide registry (08 §1).
 *
 * The order here is the reading order, which is also the sidebar order and the
 * previous/next order — so there is one list rather than three that can disagree.
 */

/** One guide page. */
export interface GuideEntry {
  /** The URL segment, which is also the module's file name. */
  slug: string;
  /** What the sidebar and the page heading show. */
  title: string;
  /** The component that renders the guide's body. */
  Component: ComponentType;
}

/** Every guide, in reading order. */
export const GUIDES: readonly GuideEntry[] = [
  { slug: 'getting-started', title: 'Getting started', Component: GettingStarted },
  { slug: 'value-and-formats', title: 'Value and formats', Component: ValueAndFormats },
  { slug: 'forms', title: 'Forms', Component: Forms },
  { slug: 'sanitization', title: 'Sanitization', Component: Sanitization },
  { slug: 'html-interop', title: 'HTML interop', Component: HtmlInterop },
  { slug: 'merge-tags', title: 'Merge tags', Component: MergeTags },
  { slug: 'toolbar', title: 'Toolbar', Component: Toolbar },
  { slug: 'plugins', title: 'Plugins', Component: Plugins },
  { slug: 'slots-and-handlers', title: 'Slots and handlers', Component: SlotsAndHandlers },
  { slug: 'theming', title: 'Theming', Component: Theming },
  { slug: 'uploads', title: 'Uploads', Component: Uploads },
  { slug: 'accessibility', title: 'Accessibility', Component: Accessibility },
  { slug: 'localization', title: 'Localization', Component: Localization },
  { slug: 'performance', title: 'Performance', Component: Performance },
  { slug: 'ssr', title: 'SSR', Component: Ssr },
  { slug: 'migration-skimmer', title: 'Migration from CustomRte', Component: MigrationSkimmer },
];

/** One guide, by slug. */
export function findGuide(slug: string): GuideEntry | undefined {
  return GUIDES.find((entry) => entry.slug === slug);
}

/** One heading inside a guide, for the "on this page" list and for search. */
export interface GuideHeading {
  /** The anchor id, as `<Section id>` set it. */
  id: string;
  /** The heading text. */
  title: string;
}

/**
 * Headings per guide, read from the module sources at build time.
 *
 * Parsing the source rather than declaring the headings a second time is what keeps
 * the table of contents and the search index from drifting away from the page: a
 * section that is renamed or deleted cannot leave a stale entry behind.
 */
const SOURCES = import.meta.glob<string>('./*.tsx', {
  eager: true,
  query: '?raw',
  import: 'default',
});

const SECTION = /<Section\s+id="([^"]+)"\s+title="([^"]+)"/g;

const headings = new Map<string, GuideHeading[]>();

for (const [path, source] of Object.entries(SOURCES)) {
  const slug = path.replace(/^\.\//, '').replace(/\.tsx$/, '');
  const found: GuideHeading[] = [];
  for (const match of source.matchAll(SECTION)) {
    found.push({ id: match[1]!, title: match[2]! });
  }
  if (found.length > 0) headings.set(slug, found);
}

/** The sections of one guide, in document order. */
export function guideHeadings(slug: string): GuideHeading[] {
  return headings.get(slug) ?? [];
}
