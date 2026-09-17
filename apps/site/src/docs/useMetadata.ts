import { useEffect } from 'react';
import { config } from './manifest';

/**
 * The metadata contract (PPDS §7.6).
 *
 * Every tag below is derived from exactly one title and one description, which is the
 * whole of P10 — the same pair feeds the H1 subtitle, `<title>`, the meta description,
 * the OG card, the nav tooltip and the `llms.txt` line.
 *
 * The Phase 1 audit found none of this: no canonical on any page, no OG tag on any page,
 * and one description shared by all 81 pages, so check 20 could not pass anywhere.
 *
 * @module
 */

/*
 * The site root, without the docs namespace.
 *
 * The repository and the plugin share a name, so GitHub Pages serves the site at
 * `/react-rtekit/` and the docs namespace is `/react-rtekit/` too — they are the same
 * path, not two. Vite's `base` points the assets at it and the router runs at `/`, so a
 * pathname already carries the namespace and the origin must not repeat it.
 */
const ORIGIN =
  (import.meta.env.VITE_SITE_ORIGIN as string | undefined) ?? 'https://kiralygyula92.github.io';

/** Sets or creates one `<meta>`, keyed by the attribute that identifies it. */
function meta(key: 'name' | 'property', value: string, content: string): void {
  let node = document.head.querySelector<HTMLMetaElement>(`meta[${key}="${value}"]`);
  if (!node) {
    node = document.createElement('meta');
    node.setAttribute(key, value);
    document.head.append(node);
  }
  node.setAttribute('content', content);
}

/** Sets or creates one `<link rel>`. */
function link(rel: string, href: string): void {
  let node = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!node) {
    node = document.createElement('link');
    node.setAttribute('rel', rel);
    document.head.append(node);
  }
  node.setAttribute('href', href);
}

/** What a page contributes to its own metadata. */
export interface PageMetadata {
  title: string;
  description: string;
  pathname: string;
  /** Used for `og:type`; a reference page is not an article. */
  archetype?: string;
}

export function useMetadata({ title, description, pathname, archetype }: PageMetadata): void {
  useEffect(() => {
    const full = pathname === `/${config.id}/` ? config.name : `${title} — ${config.name}`;
    // Trailing slash is canonical (R4), and the canonical URL is absolute.
    const url = `${ORIGIN}${pathname}`;
    const image = `${ORIGIN}/og/${pathname.replace(/^\/|\/$/g, '').replace(/\//g, '-') || 'index'}.png`;

    document.title = full;
    link('canonical', url);

    meta('name', 'description', description);
    meta('name', 'theme-color', config.branding?.accentColor ?? '#3B6FF5');

    meta('property', 'og:title', full);
    meta('property', 'og:description', description);
    meta('property', 'og:type', archetype === 'I' ? 'article' : 'website');
    meta('property', 'og:url', url);
    meta('property', 'og:image', image);

    meta('name', 'twitter:card', 'summary_large_image');
    meta('name', 'twitter:title', full);
    meta('name', 'twitter:description', description);
    meta('name', 'twitter:image', image);

    // Version-scoped search, and the portfolio keys the standard asks every page to emit.
    meta('name', 'search:language', 'en');
    meta('name', 'search:version', config.currentVersion);
    meta('name', 'plugin:id', config.id);
    if (config.categoryId) meta('name', 'plugin:categoryId', config.categoryId);
  }, [title, description, pathname, archetype]);
}
