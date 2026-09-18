import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync, existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
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

/**
 * Fails the build if any file would be served in place of a page.
 *
 * Every page is a route of the application: the host has no file for it, declines, and
 * the SPA fallback hands the request to `index.html`. That only works while the host has
 * nothing to serve. A file named `index.anything` inside a route's directory is served
 * first — a host resolving a directory to its index does not check the extension, and a
 * rewrite is consulted only after the filesystem has declined — so the page arrives as
 * that file instead of as the application.
 *
 * That is not hypothetical. The Markdown twins were once emitted as `<page>/index.md`, and
 * every refresh on the deployed site came back as raw frontmatter while every in-app click
 * looked fine, because a click never asked the server. It went through every test,
 * because the test server resolves directories differently from the host. So the check is
 * on the output, against the page list, and it stops the build rather than the reader.
 */
function routeShadowGuard() {
  return {
    name: 'route-shadow-guard',
    closeBundle() {
      const dist = fileURLToPath(new URL('./dist', import.meta.url));
      if (!existsSync(`${dist}/index.html`)) return; // a failed build: let its own error stand
      const manifest = JSON.parse(
        readFileSync(
          fileURLToPath(new URL('./src/content/manifest.json', import.meta.url)),
          'utf8',
        ),
      ) as { pages: { pathname: string }[] };

      const shadowed: string[] = [];
      for (const { pathname } of manifest.pages) {
        const directory = path.join(dist, pathname);
        const asFile = path.join(dist, pathname.replace(/\/$/, ''));
        if (existsSync(asFile) && statSync(asFile).isFile()) shadowed.push(pathname);
        if (!existsSync(directory) || !statSync(directory).isDirectory()) continue;
        for (const entry of readdirSync(directory)) {
          if (/^index\./i.test(entry)) shadowed.push(`${pathname}${entry}`);
        }
      }
      if (shadowed.length > 0) {
        throw new Error(
          `${shadowed.length} file(s) would be served instead of a page, e.g. ${shadowed
            .slice(0, 3)
            .join(', ')}. A route's URL must have no file behind it.`,
        );
      }
    },
  };
}

export default defineConfig({
  base,
  // Read by `main.tsx` to decide whether the analytics components are worth mounting.
  define: { __ON_VERCEL__: JSON.stringify(onVercel) },
  plugins: [react(), spaFallback(), routeShadowGuard()],
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
