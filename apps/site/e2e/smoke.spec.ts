import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/*
 * A route from each section, plus the two legacy URLs whose redirects matter most.
 * The per-page coverage is in `docs.spec.ts`, which opens all 123; this is the
 * shape-of-the-site check.
 */
const ROUTES = [
  { path: '/react-rtekit/', heading: /React RTE Kit . Overview/i },
  { path: '/react-rtekit/getting-started/installation/', heading: /installation/i },
  { path: '/react-rtekit/all-features/', heading: /all features/i },
  { path: '/react-rtekit/api/', heading: /api reference/i },
  { path: '/react-rtekit/demos/playground/', heading: /playground/i },
  { path: '/react-rtekit/demos/theme-editor/', heading: /theme editor/i },
  { path: '/react-rtekit/discover-more/changelog/', heading: /changelog/i },
];

/** Legacy URLs, which must land somewhere rather than 404 (PPDS R6, P12). */
const REDIRECTS: [string, string][] = [
  ['/', '/react-rtekit/'],
  ['/docs/guides/getting-started', '/react-rtekit/getting-started/usage/'],
  ['/examples', '/react-rtekit/all-features/'],
  ['/examples/tables', '/react-rtekit/tables/'],
  ['/api/types', '/react-rtekit/api/types/'],
  ['/playground', '/react-rtekit/demos/playground/'],
  ['/changelog', '/react-rtekit/discover-more/changelog/'],
];

for (const [from, to] of REDIRECTS) {
  test(`${from} lands at ${to}`, async ({ page }) => {
    await page.goto(from);
    // The client-side redirect replaces rather than pushes, so the URL is the target.
    await expect(page).toHaveURL((url) => url.pathname === to);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
}

/** Every route renders, has an h1, and logs nothing to the console. */
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
  await page.goto('/react-rtekit/');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const blocking = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  );
  expect(blocking.map((violation) => violation.id)).toEqual([]);
});

test('the theme switch drives the document theme attributes', async ({ page }) => {
  await page.goto('/react-rtekit/');
  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-site-theme', 'light');

  // A two-state icon toggle rather than a three-option select: light and dark are what
  // a reader switches between, and `classic` is set by the theme editor.
  await page.getByRole('button', { name: /switch to dark theme/i }).click();
  await expect(html).toHaveAttribute('data-site-theme', 'dark');
  await expect(html).toHaveAttribute('data-color-scheme', 'dark');

  await page.getByRole('button', { name: /switch to light theme/i }).click();
  await expect(html).toHaveAttribute('data-site-theme', 'light');
  await expect(html).toHaveAttribute('data-color-scheme', 'light');
});

test('a deep link to an unknown route renders the not-found page', async ({ page }) => {
  await page.goto('/does-not-exist');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/page not found/i);
});
