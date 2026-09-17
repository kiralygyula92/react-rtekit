import { readdirSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * The guides and the search palette (08 §1, §8).
 *
 * Read from disk rather than listed here, for the same reason as the examples: a guide
 * that is added and never opened is a guide nobody notices is broken.
 */
const GUIDES = readdirSync(new URL('../src/guides', import.meta.url))
  .filter((name) => name.endsWith('.tsx') && name !== 'Guide.tsx')
  .map((name) => name.replace(/\.tsx$/, ''))
  .sort();

for (const slug of GUIDES) {
  test(`the ${slug} guide renders with no console errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto(`/docs/guides/${slug}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // A guide with no sections is a stub, and a stub is what this milestone removed.
    await expect(page.locator('.guide__section').first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test(`the ${slug} guide has no serious accessibility violations`, async ({ page }) => {
    await page.goto(`/docs/guides/${slug}`);
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

test('the sidebar links to every guide', async ({ page }) => {
  await page.goto('/docs');
  // Scoped to the sidebar: a guide's own "see also" block links to others too.
  const sidebar = page.getByRole('navigation', { name: 'Documentation' });
  for (const slug of GUIDES) {
    await expect(sidebar.locator(`a[href="/docs/guides/${slug}"]`)).toHaveCount(1);
  }
});

test('the table of contents links to the sections on the page', async ({ page }) => {
  await page.goto('/docs/guides/theming');

  const toc = page.getByRole('navigation', { name: 'On this page' });
  await expect(toc).toBeVisible();

  const first = toc.getByRole('link').first();
  const href = await first.getAttribute('href');
  expect(href).toMatch(/^#/);
  await expect(page.locator(href!)).toBeVisible();
});

test('previous and next walk the reading order', async ({ page }) => {
  await page.goto('/docs/guides/forms');

  await page.getByRole('link', { name: /Previous/ }).click();
  await expect(page).toHaveURL(/\/docs\/guides\/value-and-formats$/);

  await page.getByRole('link', { name: /Next/ }).click();
  await expect(page).toHaveURL(/\/docs\/guides\/forms$/);
});

test.describe('the search palette', () => {
  test('opens with the keyboard and navigates to a result', async ({ page }) => {
    await page.goto('/');
    // The shortcut is a window listener, so it only works once React has hydrated.
    await expect(page.getByRole('button', { name: /Search/ })).toBeVisible();
    await page.keyboard.press('ControlOrMeta+k');

    const input = page.getByRole('combobox', { name: 'Search the documentation' });
    await expect(input).toBeFocused();

    await input.fill('sanitization');
    const option = page.getByRole('option').first();
    await expect(option).toBeVisible();

    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/docs\/guides\/sanitization/);
  });

  test('finds a command from the runtime metadata', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Search/ }).click();

    await page.getByRole('combobox', { name: 'Search the documentation' }).fill('toggleBold');
    await expect(page.getByRole('option', { name: /toggleBold/ })).toBeVisible();
  });

  test('finds an example by its tag', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Search/ }).click();

    await page.getByRole('combobox', { name: 'Search the documentation' }).fill('parity');
    await expect(page.getByRole('option').first()).toBeVisible();
  });

  test('says so when nothing matches, and closes on Escape', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Search/ }).click();

    const input = page.getByRole('combobox', { name: 'Search the documentation' });
    await input.fill('zzzzqqq');
    await expect(page.getByRole('status')).toContainText('Nothing matches');

    await page.keyboard.press('Escape');
    await expect(input).toBeHidden();
    // Focus returns to the trigger rather than being dropped at the top of the page.
    await expect(page.getByRole('button', { name: /Search/ })).toBeFocused();
  });
});
