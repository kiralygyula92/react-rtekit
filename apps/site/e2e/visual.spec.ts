import { expect, test, type Page } from '@playwright/test';

/**
 * Visual regression (09 §1).
 *
 * The parity guarantee is a visual one, so it gets pixel snapshots: idle, focused,
 * with the colour popover open, and in an error state. A diff here is either a bug or
 * a deliberate change to a frozen preset — which 09 §7 makes a major version.
 */

/**
 * Pixel baselines are per-platform: the same CSS renders differently on Windows,
 * macOS and the Linux container CI uses, so a baseline taken on one machine fails
 * everywhere else. The suite therefore runs on request — `VISUAL=1 pnpm e2e` after
 * `pnpm e2e:update` has produced baselines for the current platform. M6 adds the
 * Linux baseline set and turns this on in CI (09 §1).
 */
test.skip(!process.env.VISUAL, 'Set VISUAL=1 to run the pixel comparison (see the note above).');

/** The message editor on the parity page. */
function editor(page: Page) {
  return page.getByRole('textbox', { name: 'Message' });
}

/** The editor plus its chrome, which is what the snapshots capture. */
function field(page: Page) {
  return page.locator('.rte-root').first();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/examples/parity-skimmer-email');
  await expect(editor(page)).toBeVisible();
  // Web fonts change metrics; waiting keeps the snapshots stable.
  await page.evaluate(() => document.fonts.ready);
});

test('classic preset, idle', async ({ page }) => {
  await expect(field(page)).toHaveScreenshot('classic-idle.png');
});

test('classic preset, focused', async ({ page }) => {
  await editor(page).click();
  await expect(page.locator('.rte-root')).toHaveAttribute('data-focused', 'true');
  await expect(field(page)).toHaveScreenshot('classic-focused.png');
});

test('classic preset, colour popover open', async ({ page }) => {
  await editor(page).click();
  await page.getByRole('button', { name: 'Text color' }).click();
  await expect(page.getByRole('dialog', { name: 'Text color' })).toBeVisible();
  await expect(page.locator('.rte-popover')).toHaveScreenshot('classic-color-popover.png');
});

test('classic preset, empty with placeholder', async ({ page }) => {
  await editor(page).click();
  await page.keyboard.press('Control+a');
  await page.keyboard.press('Delete');
  await expect(page.locator('.rte-placeholder')).toBeVisible();
  await expect(field(page)).toHaveScreenshot('classic-empty.png');
});

test('classic preset, formatted content', async ({ page }) => {
  await editor(page).click();
  await page.keyboard.press('Control+a');
  await page.keyboard.type('Formatted sample');
  await page.keyboard.press('Control+a');
  await page.getByRole('button', { name: 'Bold' }).click();
  await page.getByRole('button', { name: 'Align center' }).click();
  await page.getByRole('button', { name: 'Bulleted list' }).click();
  await expect(field(page)).toHaveScreenshot('classic-formatted.png');
});

test('three editors keep independent chrome', async ({ page }) => {
  await page.goto('/examples/multiple-editors');
  await expect(page.getByRole('textbox', { name: 'Message body' })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);

  await page.getByRole('textbox', { name: 'Message body' }).click();
  await expect(page.locator('.editor-grid')).toHaveScreenshot('multiple-editors.png');
});
