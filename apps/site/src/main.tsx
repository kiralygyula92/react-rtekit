import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router/dom';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { router } from './router';

// Self-hosted, so the classic preset renders in its real typeface offline and in CI.
import '@fontsource-variable/open-sans';

import 'react-rtekit/styles.css';
import 'react-rtekit/presets/classic.css';
import 'react-rtekit/presets/dark.css';
import './styles/site.css';
import './styles/docs.css';

const container = document.getElementById('root');
if (!container) throw new Error('#root is missing from index.html');

/*
 * Page views and real-user Core Web Vitals, on the deployment that can serve them.
 *
 * Both components inject a script from `/_vercel/`, which only the Vercel edge answers,
 * so off Vercel they would do nothing except log a 404 on every page. `__ON_VERCEL__` is
 * substituted at build time, so on a GitHub Pages build this collapses to `false` and
 * neither component — nor either package — is in the bundle at all.
 *
 * Both are cookieless, and neither is a dependency of the library: they are the docs
 * site's, and `packages/react-rtekit` still ships with react and react-dom as its only
 * peers.
 */
createRoot(container).render(
  <StrictMode>
    <RouterProvider router={router} />
    {__ON_VERCEL__ ? (
      <>
        <Analytics />
        <SpeedInsights />
      </>
    ) : null}
  </StrictMode>,
);
