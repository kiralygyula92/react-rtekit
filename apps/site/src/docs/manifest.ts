import data from '../content/manifest.json';

/**
 * The compiled content, typed.
 *
 * One import for the whole site: the sidebar, the features index, the search index, the
 * table of contents and every page body are read from this single object, so there is
 * one source rather than three that could drift apart.
 *
 * @module
 */

/** A node in the ordered navigation tree. */
export interface NavNode {
  pathname: string;
  title?: string;
  subheader?: string;
  plan?: string;
  lifecycle?: string;
  capabilityId?: string;
  children?: NavNode[];
}

/** One heading, for the "on this page" rail. */
export interface PageHeading {
  depth: number;
  text: string;
  id: string;
}

/** A compiled page. */
export interface DocPage {
  pathname: string;
  title: string;
  description: string;
  archetype: string;
  section: string | null;
  capabilityId: string | null;
  group: string | null;
  plan: string | null;
  lifecycle: string | null;
  symbols: string[];
  headings: PageHeading[];
  html: string;
  words: number;
  source: string;
}

/** Identity, tiers, taxonomy and the enabled sections. */
export interface PluginConfig {
  id: string;
  name: string;
  tagline: string;
  description: string;
  categoryId: string | null;
  urlPrefix: string;
  repo: string;
  currentVersion: string;
  versions: { label: string; href: string; current?: boolean; supported?: boolean }[];
  tiers: { id: string; name: string; badge: string | null }[];
  links: Record<string, string>;
  taxonomy: string[];
  sections: { id: string; title?: string; enabled?: boolean }[];
  branding?: { accentColor?: string };
}

const manifest = data as unknown as {
  config: PluginConfig;
  /** Scheme and host of the canonical deployment. Pathnames already carry the namespace. */
  origin: string;
  nav: NavNode[];
  titles: Record<string, string>;
  pages: DocPage[];
};

export const config = manifest.config;
export const origin = manifest.origin;
export const nav = manifest.nav;
export const titles = manifest.titles;
export const pages = manifest.pages;

const byPathname = new Map(pages.map((page) => [page.pathname, page]));

/** Normalizes a URL to the trailing-slash form the nav uses. */
export function canonicalPath(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, '');
  return trimmed === '' ? '/' : `${trimmed}/`;
}

/** The page at a pathname, in either slash form. */
export function findPage(pathname: string): DocPage | undefined {
  return byPathname.get(canonicalPath(pathname));
}

/** The title for a nav node: inline first, then the title map. */
export function titleOf(node: NavNode): string {
  return node.title ?? titles[node.pathname] ?? node.pathname;
}

/** The section a pathname belongs to, for the breadcrumb and the sidebar's open state. */
export function sectionOf(pathname: string): NavNode | undefined {
  const target = canonicalPath(pathname);
  return nav.find(
    (section) =>
      (section.children?.some((child) => child.pathname === target) ?? false) ||
      section.pathname === target,
  );
}

/** Every capability page, in nav order, for the features index. */
export const capabilities = pages.filter((page) => page.capabilityId !== null);

/** Previous and next page in reading order, for the page pager. */
export function neighbours(pathname: string): { previous?: DocPage; next?: DocPage } {
  const index = pages.findIndex((page) => page.pathname === canonicalPath(pathname));
  if (index < 0) return {};
  return {
    ...(index > 0 ? { previous: pages[index - 1] } : {}),
    ...(index < pages.length - 1 ? { next: pages[index + 1] } : {}),
  };
}
