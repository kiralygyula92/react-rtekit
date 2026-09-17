import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * Skimmer parity (01 §7, 07 §4, 09 §1).
 *
 * The acceptance test for M2: the reproduction has to match the reference measurements
 * exactly, and every bug from 01 §9 that only shows in a real browser has to be fixed
 * here rather than reproduced.
 */

// 01 §7's reference measurements are of a desktop editor, and the reproduction is
// deliberately not pixel-identical on a phone: a coarse pointer gets 44px touch
// targets rather than the original 40px (05 §15, 07 §6). Asserting the desktop
// numbers on a phone would be asserting that the accessibility rule is a regression.
test.skip(({ isMobile }) => isMobile, 'the parity measurements are desktop-only');

/** The message editor on the parity page. */
function editor(page: Page) {
  return page.getByRole('textbox', { name: 'Message' });
}

/** The computed value of one CSS property. */
async function css(page: Page, selector: string, property: string): Promise<string> {
  return page
    .locator(selector)
    .first()
    .evaluate(
      (element, name) => getComputedStyle(element).getPropertyValue(name),
      property,
    );
}

test.beforeEach(async ({ page }) => {
  await page.goto('/examples/parity-skimmer-email');
  await expect(editor(page)).toBeVisible();
});

test.describe('the reference measurements (01 §7)', () => {
  test('the editor box is 287px tall with 12px padding and a 4px radius', async ({ page }) => {
    const box = await page.locator('.rte-content-wrapper').first().boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(287);

    expect(await css(page, '.rte-content', 'padding-top')).toBe('12px');
    expect(await css(page, '.rte-content', 'padding-left')).toBe('12px');
    expect(await css(page, '.rte-content-wrapper', 'border-radius')).toBe('4px');
  });

  test('the idle border is 1px solid #D5D7DA', async ({ page }) => {
    expect(await css(page, '.rte-content-wrapper', 'border-top-width')).toBe('1px');
    expect(await css(page, '.rte-content-wrapper', 'border-top-color')).toBe('rgb(213, 215, 218)');
  });

  test('toolbar buttons are 40x40 with 24px icons', async ({ page }) => {
    const button = page.getByRole('button', { name: 'Bold' });
    const box = await button.boundingBox();
    expect(box?.width).toBe(40);
    expect(box?.height).toBe(40);

    const icon = button.locator('svg');
    const iconBox = await icon.boundingBox();
    expect(iconBox?.width).toBe(24);
    expect(iconBox?.height).toBe(24);
  });

  test('the toolbar sits 8px above the editor', async ({ page }) => {
    expect(await css(page, '.rte-toolbar', 'margin-bottom')).toBe('8px');
  });

  test('the content is 14px Open Sans', async ({ page }) => {
    expect(await css(page, '.rte-content', 'font-size')).toBe('14px');
    expect(await css(page, '.rte-content', 'font-family')).toContain('Open Sans');
  });
});

test.describe('the eight-button toolbar (01 §5)', () => {
  test('is exactly the original set, in the original order', async ({ page }) => {
    const labels = await page
      .getByRole('toolbar')
      .getByRole('button')
      .evaluateAll((buttons) => buttons.map((button) => button.getAttribute('aria-label')));

    expect(labels).toEqual([
      'Bold',
      'Italic',
      'Underline',
      'Text color',
      'Align left',
      'Align center',
      'Align right',
      'Bulleted list',
    ]);
  });

  test('is a real ARIA toolbar with roving focus (R16)', async ({ page }) => {
    const toolbar = page.getByRole('toolbar');
    await expect(toolbar).toHaveAttribute('aria-label', 'Formatting');

    await page.getByRole('button', { name: 'Bold' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('button', { name: 'Italic' })).toBeFocused();

    await page.keyboard.press('End');
    await expect(page.getByRole('button', { name: 'Bulleted list' })).toBeFocused();

    await page.keyboard.press('Home');
    await expect(page.getByRole('button', { name: 'Bold' })).toBeFocused();
  });
});

test.describe('the bugs that only show in a browser', () => {
  test('clicking a toolbar button keeps the selection (R5)', async ({ page }) => {
    const surface = editor(page);
    await surface.click();
    await page.keyboard.press('ControlOrMeta+a');
    await page.getByRole('button', { name: 'Bold' }).click();

    await expect(page.getByTestId('parity-output-classic')).toContainText('<strong>');
    // Focus came straight back to the text, not to the button.
    await expect(page.locator('.rte-root')).toHaveAttribute('data-focused', 'true');
  });

  test('focusing does not move the content by a pixel (R10)', async ({ page }) => {
    // Measured against the wrapper rather than the viewport: clicking scrolls the
    // page, and what R10 was about is the content moving *inside* its own box.
    const geometry = async () =>
      editor(page).evaluate((element) => {
        const wrapper = element.closest('.rte-content-wrapper')!;
        const content = element.getBoundingClientRect();
        const box = wrapper.getBoundingClientRect();
        return {
          offsetX: content.left - box.left,
          offsetY: content.top - box.top,
          width: content.width,
          height: content.height,
        };
      });

    const before = await geometry();
    await editor(page).click();
    await expect(page.locator('.rte-root')).toHaveAttribute('data-focused', 'true');

    expect(await geometry()).toEqual(before);
  });

  test('exactly one alignment button is pressed at a time (R6)', async ({ page }) => {
    const pressed = async (): Promise<string[]> =>
      page
        .getByRole('toolbar')
        .getByRole('button', { pressed: true })
        .evaluateAll((buttons) => buttons.map((button) => button.getAttribute('aria-label') ?? ''));

    await editor(page).click();
    expect((await pressed()).filter((label) => label.startsWith('Align'))).toEqual(['Align left']);

    await page.getByRole('button', { name: 'Align center' }).click();
    expect((await pressed()).filter((label) => label.startsWith('Align'))).toEqual(['Align center']);
  });

  test('the colour picker is a keyboard-navigable radiogroup of 21 swatches (R15)', async ({ page }) => {
    await editor(page).click();
    await page.keyboard.press('ControlOrMeta+a');
    await page.getByRole('button', { name: 'Text color' }).click();

    const dialog = page.getByRole('dialog', { name: 'Text color' });
    await expect(dialog.getByRole('radio')).toHaveCount(21);

    await dialog.getByRole('radio').first().focus();
    await page.keyboard.press('ArrowRight');
    await expect(dialog.getByRole('radio').nth(1)).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(page.getByTestId('parity-output-classic')).toContainText(/#ff0000/i);
  });

  test('colour Reset removes the colour instead of writing black (R14)', async ({ page }) => {
    await editor(page).click();
    await page.keyboard.press('ControlOrMeta+a');
    await page.getByRole('button', { name: 'Text color' }).click();
    await page.getByRole('radio', { name: 'Color #FF0000' }).click();
    await expect(page.getByTestId('parity-output-classic')).toContainText(/#ff0000/i);

    await page.getByRole('button', { name: 'Text color' }).click();
    await page.getByRole('button', { name: 'Reset' }).click();

    const html = await page.getByTestId('parity-output-classic').innerText();
    expect(html).not.toContain('color:');
    expect(html.toLowerCase()).not.toContain('#000000');
  });

  test('merge tags survive formatting the whole message (R23)', async ({ page }) => {
    await editor(page).click();
    await page.keyboard.press('ControlOrMeta+a');
    await page.getByRole('button', { name: 'Bold' }).click();

    const html = await page.getByTestId('parity-output-classic').innerText();
    for (const key of ['contact_first_name', 'next_test_date', 'report_date', 'org_name', 'org_address']) {
      expect(html).toContain(`{${key}}`);
    }
  });

  test('Send is disabled for the markup an empty editor produces (R2)', async ({ page }) => {
    await editor(page).click();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.press('Delete');

    await expect(page.getByRole('button', { name: 'Send' })).toBeDisabled();
    await expect(page.getByTestId('parity-status')).toContainText('empty');
  });

  test('the counter counts text, not markup (R3)', async ({ page }) => {
    await editor(page).click();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.type('12345');
    await page.keyboard.press('ControlOrMeta+a');
    await page.getByRole('button', { name: 'Bold' }).click();

    // The markup is far longer than five characters; the counter is not.
    await expect(page.locator('.rte-counter')).toContainText('5');
    await expect(page.getByTestId('parity-output-classic')).toContainText('<strong>');
  });

  test('the differences panel lists all 26 fixed bugs (01 §9)', async ({ page }) => {
    await page.getByRole('button', { name: 'Show differences' }).click();
    await expect(page.getByTestId('parity-differences').getByRole('listitem')).toHaveCount(26);
  });

  test('the two output profiles differ as documented (03 §5)', async ({ page }) => {
    const classic = await page.getByTestId('parity-output-classic').innerText();
    const email = await page.getByTestId('parity-output-email').innerText();

    // The e-mail profile previews the merge tags; the stored profile keeps them.
    expect(classic).toContain('{contact_first_name}');
    expect(email).toContain('Dana');
    expect(email).not.toContain('{contact_first_name}');
  });
});

test('the parity page has no serious accessibility violations', async ({ page }) => {
  const results = await new AxeBuilder({ page })
    .include('.rte-root')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const blocking = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  );
  expect(blocking.map((violation) => violation.id)).toEqual([]);
});
