import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * Editing behaviour in a real browser.
 *
 * This is the primary gate for anything involving a caret: jsdom cannot drive a
 * contenteditable, so typing, selection and formatting are only ever proved here.
 */

/** The editable surface of the basic example. */
function editor(page: Page) {
  return page.getByRole('textbox', { name: 'Message' });
}

test.beforeEach(async ({ page }) => {
  await page.goto('/examples/basic');
  await expect(editor(page)).toBeVisible();
});

test('the example is listed in the gallery', async ({ page }) => {
  await page.goto('/examples');
  await expect(page.getByRole('link', { name: /Basic/ })).toBeVisible();
});

test('typing updates the value and the counter', async ({ page }) => {
  const surface = editor(page);
  await surface.click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type('Hello world');

  await expect(page.getByTestId('basic-html')).toContainText('Hello world');
  await expect(page.locator('.rte-counter')).toContainText('11 characters');
});

test('the read-only view matches the editor exactly', async ({ page }) => {
  const surface = editor(page);
  await surface.click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type('Matched content');

  const html = (await page.getByTestId('basic-html').innerText()).trim();
  const viewHtml = await page.getByTestId('basic-view').locator('.rte-view').innerHTML();
  expect(viewHtml).toBe(html);
});

test('Ctrl+B bolds the selection and Ctrl+Z undoes it', async ({ page }) => {
  const surface = editor(page);
  await surface.click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type('bold me');
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.press('ControlOrMeta+b');

  await expect(page.getByTestId('basic-html')).toContainText('<strong>bold me</strong>');

  await page.keyboard.press('ControlOrMeta+z');
  await expect(page.getByTestId('basic-html')).not.toContainText('<strong>');
});

test('Enter creates a new paragraph and Shift+Enter a line break', async ({ page, isMobile }) => {
  const surface = editor(page);
  await surface.click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type('first');
  await page.keyboard.press('Enter');
  await page.keyboard.type('second');

  await expect(page.getByTestId('basic-html')).toContainText('<p>first</p><p>second</p>');

  // A phone keyboard has no Shift+Enter: its return key always starts a new block, and
  // WebKit's touch build reports the modifier but does not act on it. The soft break is
  // a desktop gesture, so it is asserted where it exists.
  test.skip(isMobile, 'Shift+Enter is a desktop gesture');

  await page.keyboard.press('Shift+Enter');
  await page.keyboard.type('third');
  await expect(page.getByTestId('basic-html')).toContainText('second<br>third');
});

test('the placeholder shows only while the editor is empty (R24)', async ({ page }) => {
  const surface = editor(page);
  await surface.click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.press('Delete');

  await expect(page.locator('.rte-placeholder')).toBeVisible();
  await expect(page.locator('.rte-root')).toHaveAttribute('data-empty', 'true');

  await page.keyboard.type('x');
  await expect(page.locator('.rte-placeholder')).toHaveCount(0);
  await expect(page.locator('.rte-root')).toHaveAttribute('data-empty', 'false');
});

test('an empty editor reports itself empty even though the DOM is not (R2)', async ({ page }) => {
  const surface = editor(page);
  await surface.click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.press('Delete');

  // Lexical leaves an empty paragraph behind, exactly as Quill did.
  await expect(surface.locator('p')).toHaveCount(1);
  await expect(page.locator('.rte-root')).toHaveAttribute('data-empty', 'true');
});

test('focusing the editor does not shift the content (R10)', async ({ page }) => {
  const surface = editor(page);

  /**
   * The content's offset inside its own editor box.
   *
   * Measured relative to the root rather than to the viewport: mobile Safari scrolls
   * the focused element into view and insets for the on-screen keyboard, so a viewport
   * comparison would report a 168px "shift" that has nothing to do with R10. What R10
   * is about is the old 1px→2px border swap moving the text under the caret, and that
   * shows up here whatever the page is scrolled to.
   */
  const offset = async () =>
    page.evaluate(() => {
      const root = document.querySelector('.rte-root');
      const content = document.querySelector('.rte-content');
      if (!(root instanceof HTMLElement) || !(content instanceof HTMLElement)) {
        throw new Error('no editor on the page');
      }
      const rootBox = root.getBoundingClientRect();
      const contentBox = content.getBoundingClientRect();
      return {
        left: Math.round(contentBox.left - rootBox.left),
        top: Math.round(contentBox.top - rootBox.top),
        width: Math.round(contentBox.width),
      };
    });

  const before = await offset();
  await surface.click();
  await expect(page.locator('.rte-root')).toHaveAttribute('data-focused', 'true');

  expect(await offset()).toEqual(before);
});

test('the editor has no serious accessibility violations', async ({ page }) => {
  const results = await new AxeBuilder({ page })
    .include('.rte-root')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const blocking = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  );
  expect(blocking.map((violation) => violation.id)).toEqual([]);
});
