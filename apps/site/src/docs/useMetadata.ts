import { useEffect } from 'react';
import { config, origin } from './manifest';
import { pageHead, type HeadPage } from './head';

/**
 * Keeps the document's `<head>` in step with the page being shown.
 *
 * Each page's `index.html` is built with these tags already in it (see `head.ts`), which
 * is what a crawler or a link preview reads. This hook covers what happens after that:
 * navigating inside the application changes the page without a new document, so the
 * title, the canonical URL and the social tags are updated here, from the same function.
 *
 * @module
 */

/** Sets, creates or (given `null`) removes one `<meta>`, keyed by its identifying attribute. */
function meta(key: 'name' | 'property', value: string, content: string | null): void {
  let node = document.head.querySelector<HTMLMetaElement>(`meta[${key}="${value}"]`);
  if (content === null) {
    node?.remove();
    return;
  }
  if (!node) {
    node = document.createElement('meta');
    node.setAttribute(key, value);
    document.head.append(node);
  }
  node.setAttribute('content', content);
}

/** Sets, creates or removes the canonical link. */
function canonical(href: string | null): void {
  let node = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (href === null) {
    node?.remove();
    return;
  }
  if (!node) {
    node = document.createElement('link');
    node.setAttribute('rel', 'canonical');
    document.head.append(node);
  }
  node.setAttribute('href', href);
}

/** What a page contributes to its own metadata. */
export interface PageMetadata extends HeadPage {
  /** A URL with no page behind it: titled as such, and kept out of search indexes. */
  notFound?: boolean;
}

export function useMetadata({
  title,
  description,
  pathname,
  archetype,
  notFound = false,
}: PageMetadata): void {
  useEffect(() => {
    const head = pageHead({ title, description, pathname, archetype }, { ...config, origin });

    document.title = head.title;
    canonical(notFound ? null : head.url);
    meta('name', 'description', head.description);
    // Indexable is the default; only a page that is not there says otherwise.
    meta('name', 'robots', notFound ? 'noindex' : null);

    meta('property', 'og:title', head.title);
    meta('property', 'og:description', head.description);
    meta('property', 'og:type', head.type);
    meta('property', 'og:url', head.url);

    meta('name', 'twitter:title', head.title);
    meta('name', 'twitter:description', head.description);
  }, [title, description, pathname, archetype, notFound]);
}
