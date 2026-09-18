import { defineConfig, devices } from '@playwright/test';

const CI = !!process.env.CI;

/**
 * Editing behaviour is the primary gate, so the matrix is real browsers.
 * PRs run Chromium; `main` runs all three engines plus mobile emulation.
 */
export default defineConfig({
  testDir: './e2e',
  // The performance budgets need a quiet machine, so they have their own config and
  // their own CI job rather than running alongside eight parallel browsers.
  testIgnore: ['**/performance.spec.ts'],
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  workers: CI ? 2 : undefined,
  reporter: CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  timeout: 30_000,
  expect: {
    timeout: 5_000,
    toHaveScreenshot: { maxDiffPixelRatio: 0.001, animations: 'disabled' },
  },
  use: {
    baseURL: 'http://localhost:4189',
    trace: 'on-first-retry',
    video: CI ? 'retain-on-failure' : 'off',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    ...(process.env.FULL_MATRIX
      ? [
          { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
          { name: 'webkit', use: { ...devices['Desktop Safari'] } },
          { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
          { name: 'mobile-safari', use: { ...devices['iPhone 14'] } },
        ]
      : []),
  ],
  webServer: {
    command: 'pnpm build && pnpm preview',
    url: 'http://localhost:4189',
    reuseExistingServer: !CI,
    timeout: 180_000,
  },
});
