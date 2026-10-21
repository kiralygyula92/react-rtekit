import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const fixtures = fileURLToPath(new URL('./packages/react-rtekit/test/fixtures', import.meta.url));

/**
 * Test projects.
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
          include: [
            'src/core/**/*.test.ts',
            'src/themes/**/*.test.ts',
            // The native engine's model layer is deliberately DOM-free,
            // and running it in the node project is what proves that rather than asserts
            // it. Its DOM-bound parts are named `*.dom.test.ts` and run under `react`.
            'src/engines/native/**/*.test.ts',
            'test/core/**/*.test.ts',
            'test/interop/**/*.test.ts',
            'test/security/**/*.test.ts',
          ],
          exclude: ['src/engines/native/**/*.dom.test.ts'],
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
            'src/engines/native/**/*.dom.test.{ts,tsx}',
            'src/plugins/**/*.test.{ts,tsx}',
            'src/view/**/*.test.{ts,tsx}',
            'test/react/**/*.test.{ts,tsx}',
            'test/engines/**/*.test.{ts,tsx}',
            // Security tests that need a real editor mounted; the rest run under `core`.
            'test/security/**/*.dom.test.tsx',
          ],
          globals: true,
        },
      },
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['packages/*/src/**/*.{ts,tsx}'],
      exclude: ['**/*.test.*', '**/types/**', '**/*.d.ts', '**/meta.ts'],
      /*
       * Two sets of numbers, because the two halves are testable to different depths.
       *
       * `core` is pure: HTML in, document out, no DOM to drive, so anything short of
       * near-total coverage there is a gap rather than a limit.
       *
       * `react` is not. A good part of it only does anything once a browser has laid it
       * out and a caret is in it — where a popover lands, which toolbar groups still fit
       * on the row, what a mark looks like on screen — and jsdom lays nothing out, so a
       * unit test that rendered those paths would be asserting against a simulation of a
       * browser rather than a browser. That work is done by the Playwright matrix, which
       * runs every case across Chromium, Firefox, WebKit and two mobile emulations, and
       * which vitest's coverage cannot see. The `functions` figure is the one this shows
       * up in: the feature chrome and the toolbar's item renderers are covered there and
       * not here.
       *
       * So these are set to what the unit suite genuinely reaches, not to what would
       * look better — a threshold nothing meets is a red build everybody learns to
       * ignore, and one set above the real figure is a claim the tests do not support.
       * They still sit close enough underneath to catch a regression.
       *
       * Vitest 4's V8 coverage maps statements and branches differently from Vitest 3, so
       * the same suite measures lower: `core` 94/94/86 (lines/statements/branches) became
       * 91/88/83, and `react` 85/85/81 became 79/76/70. The figures that dropped were moved
       * down by that amount, keeping the distance they had below the old measurement;
       * `functions` still clears its threshold in both halves and is unchanged.
       */
      thresholds: {
        'packages/react-rtekit/src/core/**': {
          lines: 87,
          branches: 81,
          functions: 85,
          statements: 84,
        },
        'packages/react-rtekit/src/react/**': {
          lines: 74,
          branches: 64,
          functions: 68,
          statements: 72,
        },
      },
    },
  },
});
