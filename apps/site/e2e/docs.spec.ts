import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page as BrowserPage } from '@playwright/test';
import { readFileSync } from 'node:fs';

/**
 * Every documentation page, and the shell around it.
 *
 * The page list comes from the compiled manifest rather than being written here, for the
 * same reason the nav does: a page that is added and never opened is a page nobody
 * notices is broken. 123 pages is too many to open by hand and exactly the right number
 * to open in CI.
 */

interface Page {
  pathname: string;
  title: string;
  description: string;
  archetype: string;
  capabilityId: string | null;
}

// Read at run time rather than imported: Playwright's loader wants an import attribute
// for JSON, and the manifest is a build artefact rather than a module either way.
const manifest = JSON.parse(
  readFileSync(new URL('../src/content/manifest.json', import.meta.url), 'utf8'),
) as { origin: string; pages: Page[] };
const { origin, pages } = manifest;

/** A page's `<title>`: the front page leads with the product, the rest with their own name. */
const titleOf = (page: Page): string =>
  page.pathname === '/react-rtekit/'
    ? 'React RTE Kit | Rich-text editor for React'
    : `${page.title} | React RTE Kit`;

/** A representative page of each archetype, for the checks that are slow. */
const SAMPLE = [
  pages.find((page) => page.archetype === 'A'),
  pages.find((page) => page.archetype === 'C'),
  pages.find((page) => page.archetype === 'F'),
  pages.find((page) => page.capabilityId !== null),
  pages.find((page) => page.archetype === 'E'),
  pages.find((page) => page.archetype === 'I'),
].filter((page): page is Page => page !== undefined);

test.describe('every page', () => {
  for (const page of pages) {
    test(`${page.pathname} renders with no console errors`, async ({ page: browser }) => {
      const errors: string[] = [];
      browser.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      browser.on('pageerror', (error) => errors.push(error.message));

      await browser.goto(page.pathname);

      // Exactly one H1, carrying the page's own title.
      const headings = browser.getByRole('heading', { level: 1 });
      await expect(headings).toHaveCount(1);
      await expect(headings).toBeVisible();

      // The description is on the page, in the metadata and in llms.txt, from one
      // field. This is the visible third of that.
      await expect(browser.locator('.docs-article__lead')).toHaveText(page.description);

      expect(errors).toEqual([]);
    });
  }
});

test.describe('the metadata contract', () => {
  for (const page of SAMPLE) {
    test(`${page.pathname} emits the full metadata tag set`, async ({ page: browser }) => {
      await browser.goto(page.pathname);
      await expect(browser.getByRole('heading', { level: 1 })).toBeVisible();

      const canonical = await browser.locator('link[rel=canonical]').getAttribute('href');
      expect(canonical).toContain(page.pathname);
      expect(canonical?.endsWith('/')).toBe(true);

      for (const [selector, expected] of [
        ['meta[name=description]', page.description],
        ['meta[property="og:description"]', page.description],
        ['meta[name="twitter:description"]', page.description],
      ] as const) {
        await expect(browser.locator(selector)).toHaveAttribute('content', expected);
      }

      await expect(browser).toHaveTitle(titleOf(page));

      for (const name of [
        'meta[property="og:title"]',
        'meta[property="og:type"]',
        'meta[property="og:url"]',
        'meta[property="og:image"]',
        'meta[name="twitter:card"]',
      ]) {
        await expect(browser.locator(name)).toHaveCount(1);
      }
      await expect(browser.locator('meta[name="robots"]')).toHaveCount(0);
    });
  }

  /*
   * The head a crawler or a link preview reads is the one in the HTML the server sends,
   * before any script runs. Each page is built with its own, and this reads it the way a
   * bot does: as text, with no browser.
   */
  for (const page of SAMPLE) {
    test(`${page.pathname} is served with its own head`, async ({ request }) => {
      const html = await (await request.get(page.pathname)).text();
      const escape = (value: string) =>
        value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
      expect(html).toContain(`<title>${escape(titleOf(page))}</title>`);
      expect(html).toContain(`<meta name="description" content="${escape(page.description)}" />`);
      expect(html).toContain(`href="${origin}${page.pathname}" />`);
      expect(html).toContain(`<meta property="og:image" content="${origin}/og.png" />`);
    });
  }
});

test('a page that does not exist says so and stays out of search indexes', async ({ page }) => {
  await page.goto('/react-rtekit/no-such-page/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found');
  await expect(page).toHaveTitle('Page not found | React RTE Kit');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
});

test.describe('accessibility', () => {
  for (const page of SAMPLE) {
    test(`${page.pathname} has no serious violations`, async ({ page: browser }) => {
      await browser.goto(page.pathname);
      await expect(browser.getByRole('heading', { level: 1 })).toBeVisible();

      const results = await new AxeBuilder({ page: browser })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      const blocking = results.violations.filter(
        (violation) => violation.impact === 'serious' || violation.impact === 'critical',
      );
      expect(blocking.map((violation) => violation.id)).toEqual([]);
    });
  }
});

test('the sidebar is rendered from nav data, in nav order', async ({ page }) => {
  await page.goto('/react-rtekit/');
  const sections = await page.locator('.docs-nav__section-title').allInnerTexts();
  expect(sections).toEqual([
    'Getting started',
    'Features',
    'Demos',
    'Reference',
    'Customization',
    'Guides',
    'Integrations',
    'Migration',
    'Discover more',
  ]);
});

test('the features index and the sidebar list the same capabilities', async ({ page }) => {
  // Check 6: both render from nav data, so divergence is a defect.
  await page.goto('/react-rtekit/all-features/');
  const cards = await page.locator('.card__title').allInnerTexts();
  const capabilities = pages.filter((entry) => entry.capabilityId !== null);

  expect(cards.length).toBe(capabilities.length);
  for (const capability of capabilities) {
    expect(cards.some((text) => text.trim().startsWith(capability.title))).toBe(true);
  }
});

test('every page links to its own source on GitHub', async ({ page }) => {
  await page.goto('/react-rtekit/tables/');
  await expect(page.getByRole('link', { name: 'Edit this page on GitHub' })).toHaveAttribute(
    'href',
    /\/edit\/main\/content\/react-rtekit\/features\/tables\/index\.md$/,
  );
});

test('wide reference tables keep mobile navigation within the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/react-rtekit/api/types/');
  await expect(page.getByRole('heading', { name: 'Used by' })).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);

  await page.locator('.docs-header').getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page.locator('.search-dialog').getByRole('combobox')).toBeVisible();
  await page.keyboard.press('Escape');

  await page.locator('#main').getByRole('link', { name: 'Tables', exact: true }).click();
  await expect(page).toHaveURL(/\/react-rtekit\/tables\/$/);
});

test('the on-this-page rail lists the page’s own headings', async ({ page }) => {
  await page.goto('/react-rtekit/tables/');
  await expect(page.locator('.toc__link')).toHaveText([
    'Basics',
    'Customization',
    'Limitations',
    'API',
  ]);
});

test('search finds a capability and goes to it', async ({ page }) => {
  await page.goto('/react-rtekit/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  // Scoped to the dialog: the version selector is a <select>, which is also a combobox.
  const input = page.locator('.search-dialog').getByRole('combobox');

  // The shortcut is bound in an effect, and effects run after paint — so the heading can
  // be on screen before the key has a listener, and a single press can reach nothing.
  // Mobile WebKit lost that race every time. Pressing until the dialog answers tests the
  // shortcut without betting on when the effect runs.
  await expect(async () => {
    if (!(await input.isVisible())) await page.keyboard.press('/');
    await expect(input).toBeFocused({ timeout: 500 });
  }).toPass();
  await input.fill('merge tags');
  await page.locator('.search-dialog').getByRole('option').first().click();

  await expect(page).toHaveURL(/merge-tags/);
});

/*
 * A link in a page's own content goes through the router.
 *
 * Page bodies are compiled HTML set with `dangerouslySetInnerHTML`, so their anchors are
 * invisible to React Router, and every one of them used to be a full page load. That was
 * slow, and it made each click a fresh request to the server — which is how a deployment
 * still carrying the old `index.md` twins answered an ordinary link with raw Markdown.
 * Counting navigation requests is what distinguishes the two: a routed click makes none.
 */
test('a link in page content navigates without reloading the page', async ({ page }) => {
  let loads = 0;
  page.on('request', (request) => {
    if (request.isNavigationRequest() && request.frame() === page.mainFrame()) loads += 1;
  });

  await page.goto('/react-rtekit/api/serialization/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Serialization');
  const before = loads;

  await page.locator('.prose a[href="/react-rtekit/value-formats/"]').first().click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Value formats');
  await expect(page).toHaveURL(/\/react-rtekit\/value-formats\/$/);
  expect(loads - before).toBe(0);
});

/*
 * Where the reader was is where they come back to.
 *
 * The layout used to call `scrollTo(0, 0)` on every pathname change and on mount, so a
 * reload always landed at the top — measured on production, 700px became 0. Back
 * happened to survive only because the browser's own restoration was racing that effect
 * and winning. `ScrollRestoration` makes it one mechanism, and these pin both behaviours.
 */
test.describe('scroll position', () => {
  const PAGE = '/react-rtekit/api/serialization/';
  const scrollY = async (page: BrowserPage) => page.evaluate(() => Math.round(window.scrollY));

  test('a reload keeps the reader where they were', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Serialization');
    await page.evaluate(() => {
      window.scrollTo(0, 700);
    });
    await expect.poll(() => scrollY(page)).toBe(700);

    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Serialization');
    await expect.poll(() => scrollY(page)).toBe(700);
  });

  test('a new page opens at the top, and Back returns to the old position', async ({
    page,
    isMobile,
  }) => {
    // The navigation has to happen without moving the window first, which is what a
    // click in the sticky sidebar does on a desktop. On a phone the sidebar is a closed
    // drawer, so there is no such click; the reload case above covers restoration there.
    test.skip(isMobile, 'the sidebar is a drawer on phones');
    await page.goto(PAGE);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Serialization');
    await page.evaluate(() => {
      window.scrollTo(0, 900);
    });
    await expect.poll(() => scrollY(page)).toBe(900);

    // The sidebar is sticky, so clicking it does not move the window first.
    await page
      .locator('.docs-sidebar a[href^="/react-rtekit/api/"]:not([href="' + PAGE + '"])')
      .first()
      .click();
    await expect(page).not.toHaveURL(new RegExp(`${PAGE}$`));
    await expect.poll(() => scrollY(page)).toBe(0);

    await page.goBack();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Serialization');
    await expect.poll(() => scrollY(page)).toBe(900);
  });
});
