import { createBrowserRouter, Navigate, useLocation, type RouteObject } from 'react-router';
import { DocsLayout } from './docs/DocsLayout';
import { DocsPage, PageSkeleton } from './docs/DocsPage';
import { NotFound } from './docs/NotFound';
import { RouteError } from './docs/RouteError';
import { loadPage } from './docs/content';
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
 * The host issues these as 301s from the same table (`vercel.json` is generated from
 * `redirects.json`); this is the client-side equivalent, so a deep link also works in
 * development. It replaces rather than pushes so Back does not re-trigger it.
 */
function LegacyRedirect() {
  const { pathname, search, hash } = useLocation();
  const target = LEGACY[pathname.replace(/\/+$/, '') || '/'];
  if (target) return <Navigate to={`${target}${search}${hash}`} replace />;
  return <NotFound />;
}

/** A documentation page: loaded before it renders, with its own error boundary. */
const docsPage = {
  loader: ({ request }: { request: Request }) => loadPage(new URL(request.url).pathname),
  element: <DocsPage />,
  HydrateFallback: PageSkeleton,
  // Inside the layout, so a page that fails to load still has the header and the sidebar.
  errorElement: <RouteError />,
};

/*
 * The e2e performance harness, built only by `vite build --mode perf` (which is what
 * `pnpm e2e:perf` runs). The condition is a build-time constant, so a production bundle
 * contains neither the route nor its chunk.
 */
const harness: RouteObject[] =
  import.meta.env.MODE === 'perf'
    ? [
        {
          path: '/internal/performance',
          lazy: async () => ({ Component: (await import('./routes/Performance')).Performance }),
          HydrateFallback: () => null,
        },
      ]
    : [];

export const router = createBrowserRouter(
  [
    {
      path: `/${config.id}`,
      element: <DocsLayout />,
      errorElement: <RouteError standalone />,
      children: [
        { index: true, ...docsPage },
        { path: '*', ...docsPage },
      ],
    },
    ...harness,
    {
      path: '*',
      element: <DocsLayout />,
      errorElement: <RouteError standalone />,
      children: [{ path: '*', element: <LegacyRedirect /> }],
    },
  ],
  // The router runs at the origin root: the docs namespace (`/react-rtekit/`) is part of
  // every pathname already.
  { basename: '/' },
);
