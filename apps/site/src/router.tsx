import { createBrowserRouter, Navigate, useLocation } from 'react-router';
import { DocsLayout } from './docs/DocsLayout';
import { DocsPage } from './docs/DocsPage';
import { NotFound } from './docs/NotFound';
import { config } from './docs/manifest';
import redirects from './content/redirects.json';

/**
 * Routes.
 *
 * One catch-all under the plugin namespace: the page is looked up in the compiled
 * manifest by pathname, so adding a page is adding a Markdown file and a nav entry, never
 * a route. Everything outside the namespace is a legacy URL and is redirected.
 *
 * @module
 */

const LEGACY = redirects as Record<string, string>;

/**
 * Sends a legacy URL to its mapped target.
 *
 * PPDS R6 and operating rule 2: no URL is ever deleted, and the mapping is the one in
 * `migration/url-map.csv` — this reads the generated table rather than repeating it, so
 * the redirect the site performs and the redirect the map promises cannot diverge.
 *
 * A browser cannot issue a 301 from script; the static host does that, from the same
 * table. This is the client-side equivalent so a deep link works in development and in
 * the SPA fallback, and it replaces rather than pushes so Back does not re-trigger it.
 */
function LegacyRedirect() {
  const { pathname, search, hash } = useLocation();
  const target = LEGACY[pathname.replace(/\/+$/, '') || '/'];
  if (target) return <Navigate to={`${target}${search}${hash}`} replace />;
  return <NotFound />;
}

export const router = createBrowserRouter(
  [
    {
      path: `/${config.id}`,
      element: <DocsLayout />,
      children: [
        { index: true, element: <DocsPage /> },
        { path: '*', element: <DocsPage /> },
      ],
    },
    {
      // The e2e performance harness. Not in the nav, not indexed (EXCEPTIONS E-05).
      path: '/internal/performance',
      lazy: async () => ({ Component: (await import('./routes/Performance')).Performance }),
    },
    {
      path: '*',
      element: <DocsLayout />,
      children: [{ path: '*', element: <LegacyRedirect /> }],
    },
  ],
  // The router runs at the origin root, not at Vite's `base`: the deploy prefix and the
  // docs namespace are the same path (`/react-rtekit/`), so honouring both would double
  // it. `base` still points the assets at the right place.
  { basename: '/' },
);
