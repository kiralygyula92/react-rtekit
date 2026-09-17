import { expect, test, type Page } from '@playwright/test';
import { skipUndrivableShortcuts } from './mod-key';

/**
 * The keyboard model in a real browser.
 *
 * jsdom has no focus order and no scrolling, so the parts of the keyboard contract
 * that are about moving around — Tab, Alt+F10, roving focus, Escape — can only be
 * proved here.
 */

/** The editable surface of the accessibility example. */
function editor(page: Page) {
  return page.getByRole('textbox', { name: 'Message' });
}

// The keyboard model is a desktop contract. A phone has no Tab key, no arrow keys
// and no Alt+F10; what it has instead — the bottom-docked toolbar, the touch targets,
// the virtual-keyboard inset — is covered by the mobile example's own tests.
test.skip(({ isMobile }) => isMobile, 'the keyboard model is desktop-only');

test.beforeEach(async ({ page }) => {
  await page.goto('/react-rtekit/accessibility/');
  await expect(editor(page)).toBeVisible();
  await skipUndrivableShortcuts(page);
});

test('the toolbar is one tab stop, and arrows move inside it', async ({ page }) => {
  await page.getByRole('button', { name: 'Bold' }).focus();

  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('button', { name: 'Italic' })).toBeFocused();

  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('button', { name: 'Bold' })).toBeFocused();

  // Tab leaves the whole toolbar rather than walking through 28 buttons.
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Italic' })).not.toBeFocused();
});

test('Alt+F10 moves focus from the text to the toolbar', async ({ page }) => {
  await editor(page).click();
  await page.keyboard.press('Alt+F10');

  const focused = await page.evaluate(() => document.activeElement?.getAttribute('data-item'));
  expect(focused).not.toBeNull();
});

test('Escape in the toolbar puts the caret back', async ({ page }) => {
  await editor(page).click();
  await page.keyboard.type('abc');
  await page.getByRole('button', { name: 'Bold' }).focus();

  await page.keyboard.press('Escape');
  await expect(editor(page)).toBeFocused();
});

test('Mod+/ opens the shortcut reference and Escape closes it', async ({ page }) => {
  await editor(page).click();
  await page.keyboard.press('ControlOrMeta+/');

  const dialog = page.getByRole('dialog', { name: 'Keyboard shortcuts' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Bold')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
});

test('Tab indents inside a list and moves focus outside one', async ({ page }) => {
  // The lists page rather than the accessibility one: this needs a list button, and the
  // accessibility demo's toolbar deliberately has a small item set.
  await page.goto('/react-rtekit/lists/');
  const list = page.getByRole('textbox', { name: 'Lists' });
  await expect(list).toBeVisible();
  await list.click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type('first');

  // The demo opens with a list, so selecting all and typing leaves the caret inside one
  // — clicking the list button here would toggle it *off*. Asserted rather than
  // created: the precondition for this test is a list, not a button press.
  await expect(list.locator('ul > li')).toHaveCount(1);

  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  await page.keyboard.type('second');
  await expect(list.locator('ul > li')).toHaveCount(2);

  await page.keyboard.press('Tab');
  await expect(list.locator('ul ul')).toHaveCount(1);

  // Outside a list, Tab is what it is everywhere else on the web: it moves focus.
  await page.goto('/react-rtekit/getting-started/usage/');
  const basic = page.getByRole('textbox', { name: 'Message' });
  await basic.click();
  // The precondition, asserted rather than assumed: a Tab sent before the click's
  // focus has committed proves nothing about what Tab does from inside the editor.
  await expect(basic).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(basic).not.toBeFocused();
});

test('Mod+F opens find and replace', async ({ page }) => {
  await editor(page).click();
  await page.keyboard.press('ControlOrMeta+f');

  await expect(page.getByRole('search', { name: 'Find and replace' })).toBeVisible();
});

test('the formatting shortcuts apply exactly once', async ({ page }) => {
  await editor(page).click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type('shortcut');
  await page.keyboard.press('ControlOrMeta+a');

  await page.keyboard.press('ControlOrMeta+b');
  await expect(editor(page).locator('strong')).toHaveCount(1);

  await page.keyboard.press('ControlOrMeta+b');
  await expect(editor(page).locator('strong')).toHaveCount(0);
});

test('a heading shortcut carries its level', async ({ page }) => {
  await editor(page).click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type('Title');
  await page.keyboard.press('ControlOrMeta+Alt+2');

  await expect(editor(page).locator('h2')).toHaveCount(1);

  await page.keyboard.press('ControlOrMeta+Alt+0');
  await expect(editor(page).locator('h2')).toHaveCount(0);
});
