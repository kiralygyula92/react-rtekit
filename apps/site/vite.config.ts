import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Whether this build is the one Vercel runs.
 *
 * Vercel sets `VERCEL=1` in every build on its own infrastructure. Both analytics scripts
 * are served from `/_vercel/*`, a path only the Vercel edge answers, so mounting the
 * components anywhere else means a 404 in the console of every page — which is a real
 * failure for the smoke suite, since it asserts the console stays empty.
 */
const onVercel = process.env.VERCEL === '1';

/**
 * Where the site is served from.
 *
 * A GitHub Pages *project* site lives under `/<repo>/`, so every asset URL and every
 * route has to carry that prefix — without it the deploy is a blank page with four
 * 404s in the console. Local dev and `preview` serve from the root, so the prefix comes
 * from the environment rather than being hard-coded.
 */
const base = process.env.SITE_BASE ?? '/';

/**
 * Copies `index.html` to `404.html`.
 *
 * GitHub Pages serves static files, so a deep link like `/docs/guides/theming` has no
 * file behind it and returns 404. Pages renders `404.html` for those, and serving the
 * application from there lets the client router take over — the standard fallback for
 * a single-page application on static hosting.
 */
function spaFallback() {
  return {
    name: 'spa-fallback',
    closeBundle() {
      const dist = fileURLToPath(new URL('./dist', import.meta.url));
      /*
       * `closeBundle` also runs when the build failed, and throwing here replaced the
       * error that caused it. A Vercel build that could not resolve `react-rtekit`
       * reported only `ENOENT ... index.html -> 404.html`, which is a description of the
       * consequence and says nothing about the cause.
       */
      if (!existsSync(`${dist}/index.html`)) return;
      copyFileSync(`${dist}/index.html`, `${dist}/404.html`);
    },
  };
}

export default defineConfig({
  base,
  // Read by `main.tsx` to decide whether the analytics components are worth mounting.
  define: { __ON_VERCEL__: JSON.stringify(onVercel) },
  plugins: [react(), spaFallback()],
  resolve: {
    alias: {
      // The fixture corpus is shared with the library's tests so the two cannot drift.
      '@fixtures': fileURLToPath(
        new URL('../../packages/react-rtekit/test/fixtures', import.meta.url),
      ),
    },
  },
  server: { port: 5189 },
  preview: { port: 4189, strictPort: true },
  build: {
    target: 'es2022',
    sourcemap: true,
    // No `manualChunks`: the only shared chunk this ever carved out was the engine's
    // peer dependencies, and there are none left to split.
  },
});
