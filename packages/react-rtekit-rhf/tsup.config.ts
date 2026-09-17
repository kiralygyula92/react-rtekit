import { defineConfig } from 'tsup';

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
  banner: { js: "'use client';" },
});
