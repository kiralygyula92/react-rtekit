import { expect, test, type Page } from '@playwright/test';

/**
 * The user flows through the docs, end to end.
 *
 * Each one is walked as a clickable path rather than asserted on by URL, because the
 * requirement is that the flow is *completable without a dead end* — a page that exists
 * but that nothing links to satisfies a URL check and fails a reader.
 */

/** Clicks a link by its visible text, inside the article rather than the chrome. */
async function follow(page: Page, name: string | RegExp): Promise<void> {
  await page.locator('#main').getByRole('link', { name }).first().click();
}

test('evaluate: docs overview → features index → a capability', async ({ page }) => {
  // No marketing surface and no pricing, so the flow starts at
  // the docs root and ends where a reader decides to install rather than to buy.
  await page.goto('/react-rtekit/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('React RTE Kit');

  await follow(page, 'All features');
  await expect(page).toHaveURL(/all-features/);

  await page.locator('a.card[href="/react-rtekit/merge-tags/"]').click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Merge tags');
  await expect(page.getByRole('heading', { name: 'Limitations' })).toBeVisible();
});

test('adopt: overview → installation → usage → a working editor', async ({ page }) => {
  await page.goto('/react-rtekit/');
  await follow(page, 'Installation');
  // The page has an H1 and an `## Installation` section; this is the page, not the section.
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Installation');

  // The minimal example is complete: no ellipses, and it imports what it uses.
  const example = page.locator('.code-block').filter({ hasText: 'RichTextEditor' }).first();
  await expect(example).toContainText("import { RichTextEditor } from 'react-rtekit'");
  await expect(example).not.toContainText('…');

  await follow(page, 'Usage');
  await expect(page.locator('[contenteditable="true"]').first()).toBeVisible();
});

test('implement: search → capability → demo → reference → back', async ({ page }) => {
  await page.goto('/react-rtekit/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  await page.keyboard.press('/');
  const input = page.locator('.search-dialog').getByRole('combobox');
  await input.fill('tables');
  await page.locator('.search-dialog').getByRole('option').first().click();
  await expect(page).toHaveURL(/tables/);

  // The demo is the first thing under Basics, and it runs.
  await expect(page.locator('.demo [contenteditable="true"]').first()).toBeVisible();
  await page.getByRole('button', { name: 'Show source' }).first().click();
  await expect(page.locator('.demo__source').first()).toBeVisible();

  // The API section links to the generated reference, and the reference links back.
  await page.locator('#main').getByRole('link', { name: 'TableOptions' }).click();
  await expect(page).toHaveURL(/\/api\//);
  await expect(page.getByRole('heading', { name: 'Used by' })).toBeVisible();
  await page.locator('#main').getByRole('link', { name: 'Tables' }).first().click();
  await expect(page).toHaveURL(/\/react-rtekit\/tables\/$/);
});

test('customise: capability → customization guide → tokens', async ({ page }) => {
  await page.goto('/react-rtekit/tables/');
  await page.locator('#main').getByRole('link', { name: 'How to customize' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('How to customize');

  await follow(page, 'Theming & tokens');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Theming');
  await expect(page.locator('.demo [contenteditable="true"]').first()).toBeVisible();
});

test('upgrade: version selector → versions → migration → changelog', async ({
  page,
  isMobile,
}) => {
  await page.goto('/react-rtekit/');
  if (isMobile) {
    // The header has no room for the version picker on a phone; the page is in the menu.
    await page.getByRole('button', { name: 'Documentation menu' }).click();
    await page.locator('.docs-sidebar').getByRole('link', { name: 'Versions' }).click();
  } else {
    await page.locator('.docs-header__version select').selectOption({ label: 'All versions…' });
  }
  await expect(page).toHaveURL(/versions/);
  await expect(page.getByRole('heading', { name: 'Versioning policy' })).toBeVisible();

  await follow(page, 'Migration');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Migration');

  await page.goto('/react-rtekit/getting-started/versions/');
  await follow(page, 'changelog');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Changelog');
});

test('support: any docs page → support → a channel', async ({ page }) => {
  await page.goto('/react-rtekit/tables/');
  await page.locator('.site-footer').getByRole('link', { name: 'Support' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Support');

  // A real destination, not a promise of one.
  const issues = page.locator('#main').getByRole('link', { name: 'GitHub issues' });
  await expect(issues).toHaveAttribute('href', /github\.com\/.+\/issues/);
});

test('agent: llms.txt → a .md twin → the whole corpus', async ({ page }) => {
  const index = await page.goto('/react-rtekit/llms.txt');
  expect(index?.headers()['content-type']).toContain('text');
  const text = (await index?.text()) ?? '';
  expect(text.startsWith('# React RTE Kit')).toBe(true);

  // Every entry is a Markdown twin, and the first one resolves to Markdown rather than
  // to the application shell — which is what a status-code check would have missed.
  const entries = [...text.matchAll(/^- \[[^\]]+\]\(([^)]+)\)/gm)].map((match) => match[1]);
  expect(entries.length).toBeGreaterThan(100);

  const twin = await page.goto(entries[0]!);
  const body = (await twin?.text()) ?? '';
  expect(body.startsWith('---')).toBe(true);
  expect(body).toContain('pluginId: react-rtekit');
  expect(body).not.toContain('<div id="root">');

  // And the whole corpus in one read: the AI-context file llms.txt points to before its
  // lists. Every page is in it, and every live demo has become the source behind it — a
  // leftover ```demo fence would be a demo an agent can see the name of and not the code.
  const full = /\]\((\/[^)\s]*llms-full\.md)\)/.exec(text)?.[1];
  expect(full, 'llms.txt links the full file').toBeTruthy();
  const corpus = await page.goto(full!);
  const all = (await corpus?.text()) ?? '';
  expect(all.startsWith('# React RTE Kit')).toBe(true);
  expect(all).not.toContain('<div id="root">');
  expect(all.match(/^# /gm)?.length ?? 0).toBeGreaterThan(entries.length);
  expect(all).not.toMatch(/^```demo$/m);
  expect(all).toContain("from 'react-rtekit'");

  const sitemap = await page.goto('/sitemap.xml');
  expect((await sitemap?.text())?.startsWith('<?xml')).toBe(true);
});
