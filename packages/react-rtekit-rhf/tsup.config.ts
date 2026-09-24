import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'tsup';

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'dist');

/**
 * Puts `"use client"` back on both entries after the build.
 *
 * `RteField` and `useRteField` are hooks, so in a React Server Component graph the entry
 * has to carry the directive. A `banner` is not enough: with `treeshake` on, the output
 * goes through Rollup, which warns "Module level directives cause errors when bundled"
 * and drops it — so the published file started with an `import` and a Next.js App Router
 * page that imported `RteField` failed. The core package re-adds it the same way.
 */
async function addUseClientBanner(): Promise<void> {
  for (const file of ['index.js', 'index.cjs']) {
    const target = path.join(dist, file);
    const source = await readFile(target, 'utf8');
    if (source.startsWith("'use client'") || source.startsWith('"use client"')) continue;
    await writeFile(target, `'use client';\n${source}`, 'utf8');
    // One line was added above everything, so the map gains one empty generated line —
    // otherwise every frame in a stack trace points at the line below the real one.
    const map = JSON.parse(await readFile(`${target}.map`, 'utf8')) as { mappings: string };
    map.mappings = `;${map.mappings}`;
    await writeFile(`${target}.map`, JSON.stringify(map), 'utf8');
  }
}

export default defineConfig({
  entry: ['src/index.tsx'],
  outDir: 'dist',
  format: ['esm', 'cjs'],
  target: 'es2020',
  platform: 'neutral',
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: ['react', 'react-dom', 'react/jsx-runtime', 'react-hook-form', 'react-rtekit'],
  esbuildOptions(options) {
    options.jsx = 'automatic';
  },
  onSuccess: addUseClientBanner,
});
