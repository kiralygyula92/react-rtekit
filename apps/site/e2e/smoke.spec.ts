import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const ROUTES = [
  { path: '/', heading: /rich text editor you can actually own/i },
  { path: '/docs/guides/getting-started', heading: /getting started/i },
  { path: '/examples', heading: /examples/i },
  { path: '/api', heading: /api reference/i },
  { path: '/playground', heading: /playground/i },
  { path: '/theme-editor', heading: /theme editor/i },
  { path: '/changelog', heading: /changelog/i },
];

/** Every route renders, has an h1, and logs nothing to the console (08 §8). */
for (const route of ROUTES) {
  test(`renders ${route.path} without console errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto(route.path);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(route.heading);
    expect(errors).toEqual([]);
  });
}

test('the landing page has no serious or critical accessibility violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const blocking = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  );
  expect(blocking.map((violation) => violation.id)).toEqual([]);
});

test('the theme switch drives the document theme attributes', async ({ page }) => {
  await page.goto('/');
  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-site-theme', 'light');

  await page.getByLabel('Theme').selectOption('dark');
  await expect(html).toHaveAttribute('data-site-theme', 'dark');
  await expect(html).toHaveAttribute('data-color-scheme', 'dark');

  await page.getByLabel('Theme').selectOption('classic');
  await expect(html).toHaveAttribute('data-site-theme', 'classic');
  // `classic` is a light theme, so the colour scheme must not stay dark.
  await expect(html).toHaveAttribute('data-color-scheme', 'light');
});

test('a deep link to an unknown route renders the not-found page', async ({ page }) => {
  await page.goto('/does-not-exist');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/page not found/i);
});
