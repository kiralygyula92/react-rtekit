import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const fixtures = fileURLToPath(new URL('./packages/react-rtekit/test/fixtures', import.meta.url));

/**
 * Test projects (09 §1).
 *
 * `core` runs in node against the headless core; `react` runs in jsdom for component
 * behaviour. jsdom cannot do real contenteditable editing, so anything involving a
 * caret lives in the Playwright suite instead.
 */
export default defineConfig({
  test: {
    projects: [
      {
        resolve: { alias: { '@fixtures': fixtures } },
        test: {
          name: 'core',
          root: './packages/react-rtekit',
          environment: 'node',
          include: ['src/core/**/*.test.ts', 'src/themes/**/*.test.ts', 'test/core/**/*.test.ts', 'test/interop/**/*.test.ts', 'test/security/**/*.test.ts'],
          globals: true,
        },
      },
      {
        resolve: { alias: { '@fixtures': fixtures } },
        test: {
          name: 'react',
          root: './packages/react-rtekit',
          environment: 'jsdom',
          setupFiles: ['./test/setup.ts'],
          include: [
            'src/react/**/*.test.{ts,tsx}',
            'src/engines/**/*.test.{ts,tsx}',
            'src/plugins/**/*.test.{ts,tsx}',
            'src/view/**/*.test.{ts,tsx}',
            'test/react/**/*.test.{ts,tsx}',
          ],
          globals: true,
        },
      },
      {
        resolve: { alias: { '@fixtures': fixtures } },
        test: {
          name: 'rhf',
          root: './packages/react-rtekit-rhf',
          environment: 'jsdom',
          setupFiles: ['./test/setup.ts'],
          include: ['src/**/*.test.{ts,tsx}', 'test/**/*.test.{ts,tsx}'],
          globals: true,
        },
      },
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['packages/*/src/**/*.{ts,tsx}'],
      exclude: ['**/*.test.*', '**/types/**', '**/*.d.ts', '**/meta.ts'],
      thresholds: {
        'packages/react-rtekit/src/core/**': { lines: 90, branches: 85, functions: 85, statements: 90 },
        'packages/react-rtekit/src/react/**': { lines: 80, branches: 70, functions: 75, statements: 80 },
      },
    },
  },
});
