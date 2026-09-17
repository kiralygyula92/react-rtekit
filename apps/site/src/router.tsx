import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { Home } from './routes/Home';

/**
 * Route table for the demo + docs site (08 §1).
 *
 * Every route but the landing page is loaded on demand. The examples alone pull in 44
 * live editors and the whole Lexical bundle, so keeping them in the entry chunk would
 * make the landing page pay for pages most visitors never open (08 §8).
 */
export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <Layout />,
      errorElement: <Layout />,
      children: [
        { index: true, element: <Home /> },
        {
          path: 'docs',
          lazy: async () => ({ Component: (await import('./routes/DocsPage')).DocsPage }),
        },
        {
          path: 'docs/:section',
          lazy: async () => ({ Component: (await import('./routes/DocsPage')).DocsPage }),
        },
        {
          path: 'docs/guides/:slug',
          lazy: async () => ({ Component: (await import('./routes/DocsPage')).DocsPage }),
        },
        {
          path: 'examples',
          lazy: async () => ({
            Component: (await import('./routes/ExamplesGallery')).ExamplesGallery,
          }),
        },
        {
          path: 'examples/:slug',
          lazy: async () => ({ Component: (await import('./routes/ExamplePage')).ExamplePage }),
        },
        {
          path: 'playground',
          lazy: async () => ({ Component: (await import('./routes/Playground')).Playground }),
        },
        {
          path: 'theme-editor',
          lazy: async () => ({ Component: (await import('./routes/ThemeEditor')).ThemeEditor }),
        },
        {
          path: 'api',
          lazy: async () => ({ Component: (await import('./routes/ApiIndex')).ApiIndex }),
        },
        {
          path: 'api/:slug',
          lazy: async () => ({ Component: (await import('./routes/ApiPage')).ApiPage }),
        },
        {
          // Not linked from the navigation: the e2e suite's performance harness (09 §4).
          path: 'internal/performance',
          lazy: async () => ({ Component: (await import('./routes/Performance')).Performance }),
        },
        {
          path: 'changelog',
          lazy: async () => ({ Component: (await import('./routes/Changelog')).Changelog }),
        },
        {
          path: '*',
          lazy: async () => ({ Component: (await import('./routes/NotFound')).NotFound }),
        },
      ],
    },
  ],
  // Vite writes the deploy prefix here, so the router and the asset URLs cannot
  // disagree about where the site lives.
  { basename: import.meta.env.BASE_URL },
);
