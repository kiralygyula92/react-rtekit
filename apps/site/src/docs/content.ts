import type { ComponentType } from 'react';
import bodies from 'virtual:docs/bodies';
import { loadExample } from '../examples';
import { config, findPage, type DocPage } from './manifest';

/**
 * Everything a page needs before it can be shown.
 *
 * Page bodies are not in the main bundle: each is its own chunk (see `vite.config.ts`),
 * and so is each demo. The route loader fetches all of a page's pieces before the page
 * renders, so it appears whole: no placeholder reflows into an editor, and restoring a
 * scroll position or jumping to a `#heading` lands where it should, because the page is
 * already its full height when the router does it.
 *
 * @module
 */

/** What the docs route renders. */
export interface PageData {
  page: DocPage;
  /** The compiled Markdown, with a placeholder where each demo goes. */
  html: string;
  /** The interactive tool mounted under the prose, on the two pages that have one. */
  Tool: ComponentType | null;
}

const TOOLS: Record<string, () => Promise<ComponentType>> = {
  [`/${config.id}/demos/playground/`]: () =>
    import('../routes/Playground').then((module) => module.Playground),
  [`/${config.id}/demos/theme-editor/`]: () =>
    import('../routes/ThemeEditor').then((module) => module.ThemeEditor),
};

/** A demo placeholder in compiled HTML, as `content/build.mjs` writes it. */
export const DEMO_PLACEHOLDER = /<div data-demo="([^"]+)"><\/div>/g;

/** Loads a page and everything on it; `null` when there is no page at that URL. */
export async function loadPage(pathname: string): Promise<PageData | null> {
  const page = findPage(pathname);
  const body = page ? bodies[page.pathname] : undefined;
  if (!page || !body) return null;

  const { default: html } = await body();
  const [Tool] = await Promise.all([
    TOOLS[page.pathname]?.() ?? null,
    ...Array.from(html.matchAll(DEMO_PLACEHOLDER), ([, slug]) => loadExample(slug ?? '')),
  ]);
  return { page, html, Tool };
}
