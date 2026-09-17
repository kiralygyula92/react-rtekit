import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'tsup';

/**
 * Entry points that render React and therefore need the `"use client"` directive so
 * they work inside React Server Component graphs. `core` and `view` stay server-safe
 * (02 §8, 09 §6), so the directive is added per entry rather than as a global banner.
 */
const CLIENT_ENTRIES = ['index', 'engines/lexical/index'];

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'dist');

/** esbuild strips `"use client"` while bundling, so we put it back afterwards. */
async function addUseClientBanners(): Promise<void> {
  for (const entry of CLIENT_ENTRIES) {
    for (const ext of ['.js', '.cjs']) {
      const file = path.join(dist, entry + ext);
      if (!existsSync(file)) continue;
      const source = await readFile(file, 'utf8');
      if (source.startsWith("'use client'") || source.startsWith('"use client"')) continue;
      await writeFile(file, `'use client';\n${source}`, 'utf8');
    }
  }
}

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/core/index.ts',
    'src/view/index.ts',
    'src/engines/lexical/index.ts',
    'src/meta.ts',
    'src/plugins/*.ts',
    'src/plugins/*.tsx',
    'src/locales/*.ts',
    // Not public entry points — `exports` does not list them — but chunk boundaries.
    // A pre-bundled file tree-shakes at chunk granularity, so a module that shares a
    // chunk with something the consumer does use cannot be dropped. Naming the large
    // UI modules here puts each in its own chunk, which is what lets a headless
    // `useEditor` import leave the whole React chrome behind (09 §4).
    'src/react/parts.tsx',
    'src/react/RichTextEditor.tsx',
    'src/react/plugins/FeatureUi.tsx',
    'src/react/toolbar/Toolbar.tsx',
    'src/react/toolbar/items.tsx',
    'src/react/slots/defaults.tsx',
    'src/react/providers.tsx',
    'src/icons/index.tsx',
    'src/themes/index.ts',
  ],
  outDir: 'dist',
  format: ['esm', 'cjs'],
  target: 'es2020',
  platform: 'neutral',
  dts: true,
  // Source maps are two thirds of the published tarball — 2.2 MB of the 3.8 MB — and
  // they ship anyway. The failures this library has are in selection handling, paste
  // cleanup and sanitization: subtle, hard to reproduce, and reported by people who
  // need a readable stack trace to describe them at all. A one-time 900 kB install for
  // a library that costs nothing at runtime is the right side of that trade.
  sourcemap: true,
  clean: true,
  splitting: true,
  treeshake: true,
  minify: false,
  external: [
    'react',
    'react-dom',
    'react/jsx-runtime',
    'react/jsx-dev-runtime',
    'lexical',
    /^@lexical\//,
    'isomorphic-dompurify',
  ],
  esbuildOptions(options) {
    options.jsx = 'automatic';
  },
  onSuccess: addUseClientBanners,
});
