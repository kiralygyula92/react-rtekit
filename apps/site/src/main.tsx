import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router/dom';
import { router } from './router';

// Self-hosted, so the classic preset renders in its real typeface offline and in CI.
import '@fontsource-variable/open-sans';

import 'react-rtekit/styles.css';
import 'react-rtekit/presets/classic.css';
import 'react-rtekit/presets/dark.css';
import './styles/site.css';

const container = document.getElementById('root');
if (!container) throw new Error('#root is missing from index.html');

createRoot(container).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
