import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { chunkFileNames, docsContent, staticPages } from './vite.docs';

/**
 * Whether this build is the one Vercel runs.
 *
 * Vercel sets `VERCEL=1` in every build on its own infrastructure. Both analytics scripts
 * are served from `/_vercel/*`, a path only the Vercel edge answers, so mounting the
 * components anywhere else means a 404 in the console of every page, which the smoke
 * suite rightly treats as a failure.
 */
const onVercel = process.env.VERCEL === '1';

export default defineConfig({
  // Read by `main.tsx` to decide whether the analytics components are worth mounting.
  define: { __ON_VERCEL__: JSON.stringify(onVercel) },
  plugins: [react(), docsContent(), staticPages()],
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
    // The site is not a library: its source is in the repository, and shipping maps would
    // publish several megabytes that only a debugger reads.
    sourcemap: false,
    rollupOptions: { output: { chunkFileNames } },
  },
});
