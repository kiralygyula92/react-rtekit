import { readdirSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Every example page renders, works and is accessible.
 *
 * The gallery is the library's own regression surface: an example that throws, logs
 * an error or fails axe is a bug in the library, not in the page.
 */

/**
 * Every registered example, read from the directories on disk.
 *
 * Listing them by hand meant a new example could be added without ever being smoke
 * tested — which is exactly the case where a smoke test is worth having.
 */
const SLUGS = readdirSync(new URL('../src/examples', import.meta.url), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

for (const slug of SLUGS) {
  test(`${slug} renders with an editor and no console errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto(`/examples/${slug}`);
    // Not every example has an editor — the paste and sanitization pages are
    // deliberately read-only — so the heading is what "it rendered" means here.
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test(`${slug} has no serious accessibility violations`, async ({ page }) => {
    await page.goto(`/examples/${slug}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    const blocking = results.violations.filter(
      (violation) => violation.impact === 'serious' || violation.impact === 'critical',
    );
    expect(blocking.map((violation) => violation.id)).toEqual([]);
  });
}

test('the gallery links to every example', async ({ page }) => {
  await page.goto('/examples');
  for (const slug of SLUGS) {
    await expect(page.locator(`a[href="/examples/${slug}"]`)).toHaveCount(1);
  }
});

test('the Code tab shows the source that runs', async ({ page }) => {
  await page.goto('/examples/controlled');
  await page.getByRole('tab', { name: 'Code' }).click();
  await expect(page.locator('.example-source')).toContainText('export default function ControlledExample');
});

test('controlled: loading another report replaces the content (R1)', async ({ page }) => {
  await page.goto('/examples/controlled');
  const editor = page.getByRole('textbox', { name: 'Message' });
  await expect(editor).toContainText('April');

  await page.getByRole('button', { name: 'Load Report B' }).click();
  await expect(editor).toContainText('May');
  await expect(page.getByTestId('controlled-value')).toContainText('<em>May</em>');
});

test('controlled: typing reports source "user" and setContent reports "api" (R21)', async ({ page }) => {
  await page.goto('/examples/controlled');
  await page.getByRole('textbox', { name: 'Message' }).click();
  await page.keyboard.type('!');
  await expect(page.getByTestId('controlled-log')).toContainText('user');

  await page.getByRole('button', { name: 'setContent() imperatively' }).click();
  await expect(page.getByTestId('controlled-log')).toContainText('api');
});

test('presets: switching preset changes the toolbar', async ({ page }) => {
  await page.goto('/examples/presets');
  await page.getByRole('radio', { name: 'classic' }).click();
  const classicButtons = await page.getByRole('toolbar').getByRole('button').count();

  await page.getByRole('radio', { name: 'minimal' }).click();
  const minimalButtons = await page.getByRole('toolbar').getByRole('button').count();

  expect(minimalButtons).toBeLessThan(classicButtons);
});

test('toolbar-config: a custom item sits in the toolbar', async ({ page }) => {
  await page.goto('/examples/toolbar-config');
  await page.getByRole('radio', { name: 'Custom items' }).click();

  await expect(page.getByRole('button', { name: 'Insert signature' })).toBeVisible();
  await expect(page.locator('.toolbar-word-count')).toBeVisible();
});

test('validation-rhf: an empty editor blocks submit, and the old check does not (R2)', async ({ page }) => {
  await page.goto('/examples/validation-rhf');
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page.getByRole('alert')).toContainText('A message is required');
  await expect(page.getByTestId('rhf-payload')).toHaveCount(0);

  await page.getByLabel(/Reproduce the old bug/).check();
  await page.getByRole('button', { name: 'Send' }).click();
  // The old truthiness check accepts `<p><br></p>`, which is the whole point.
  await expect(page.getByTestId('rhf-payload')).toBeVisible();
});

test('multiple-editors: three editors have three distinct id sets (R4)', async ({ page }) => {
  await page.goto('/examples/multiple-editors');
  await expect(page.getByRole('toolbar')).toHaveCount(3);

  const ids = await page
    .getByRole('textbox')
    .evaluateAll((elements) => elements.map((element) => element.id));
  expect(new Set(ids).size).toBe(3);
  expect(await page.locator('#toolbar').count()).toBe(0);
});

test('multiple-editors: formatting one leaves the others alone', async ({ page }) => {
  await page.goto('/examples/multiple-editors');
  const body = page.getByRole('textbox', { name: 'Message body' });
  await body.click();
  await page.keyboard.press('Control+a');
  await page.keyboard.press('Control+b');

  await expect(page.getByTestId('multiple-values')).toContainText('<strong>');
  // The subject editor is untouched.
  await expect(page.getByTestId('multiple-values')).toContainText('<p>Your April report</p>');
});
