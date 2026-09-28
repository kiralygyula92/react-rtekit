/**
 * What goes in a page's `<head>`, decided in one place.
 *
 * Two callers: `useMetadata` updates the live document on every navigation, and the build
 * (`vite.config.ts`) writes the same tags into each page's own `index.html`, which is the
 * only copy a link-preview bot or a crawler that does not run JavaScript ever sees. Both
 * derive the tags from this function, so the two copies cannot disagree.
 *
 * Pure, and free of imports from the site, so the Vite config can bundle it without
 * pulling the manifest in with it.
 *
 * @module
 */

/** The site-wide values a page's head is built from. */
export interface SiteIdentity {
  /** Product name, e.g. "React RTE Kit". */
  name: string;
  /** Docs namespace, e.g. "react-rtekit". */
  id: string;
  /** Scheme and host of the canonical deployment. */
  origin: string;
}

/** One page, as far as its head is concerned. */
export interface HeadPage {
  title: string;
  description: string;
  pathname: string;
  /** `I` pages are articles; everything else is reference or product. */
  archetype?: string | undefined;
}

/** The page-specific head values. */
export interface Head {
  title: string;
  description: string;
  /** Absolute canonical URL, trailing slash included. */
  url: string;
  type: 'article' | 'website';
}

/** The social card every page shares: its own title and description, one image. */
export const OG_IMAGE = { path: '/og.png', width: 1200, height: 630 } as const;

export function pageHead(page: HeadPage, site: SiteIdentity): Head {
  const home = page.pathname === `/${site.id}/`;
  return {
    // The front page leads with what the product is; every other page with its own name,
    // so a row of tabs or bookmarks can be told apart.
    title: home ? `${site.name} | Rich-text editor for React` : `${page.title} | ${site.name}`,
    description: page.description,
    url: `${site.origin}${page.pathname}`,
    type: page.archetype === 'I' ? 'article' : 'website',
  };
}
