import { defineConfig, devices } from '@playwright/test';

/**
 * The performance budgets, on their own.
 *
 * A budget measured while seven other browsers compete for the same cores measures the
 * machine rather than the editor — the same typing run reports 7 ms alone and 20 ms
 * inside the full matrix. One browser, one worker, no retries: a retry would hide
 * exactly the flakiness a timing budget is supposed to expose.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: ['**/performance.spec.ts'],
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4189',
    trace: 'off',
    video: 'off',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm build && pnpm preview',
    url: 'http://localhost:4189',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
