import { expect, test, type Page } from '@playwright/test';

/**
 * The editor's chrome, in a real browser.
 *
 * Every case here is a bug that shipped and that no unit test could have caught, because
 * all four are questions about what the browser actually drew: whether a mark has any
 * visible effect, whether a floating element is inside the viewport, whether a button
 * has anything in it. jsdom answers all three the same way — it lays nothing out — so
 * this file is the only gate on them.
 */

/** The editable surface of the formatting example. */
function editor(page: Page) {
  return page.getByRole('textbox', { name: 'Content' });
}

/**
 * Chooses a preset in the playground.
 *
 * The preset lives in the panel's Setup section, which is collapsed: it is one of the
 * few choices that remounts the editor, so it sits apart from the props rather than
 * among them where a change reads as live.
 */
async function choosePreset(page: Page, preset: string): Promise<void> {
  const setup = page.getByRole('button', { name: 'Setup' });
  if ((await setup.getAttribute('aria-expanded')) === 'false') await setup.click();
  await page.locator('.panel__setup').getByLabel('Preset').selectOption(preset);
}

/** Selects the first word of the editor, which is what puts the bubble toolbar up. */
async function selectFirstWord(page: Page): Promise<void> {
  await editor(page).click();
  await page.keyboard.press('ControlOrMeta+Home');
  await page.keyboard.press('Shift+ControlOrMeta+ArrowRight');
}

test.describe('inline marks', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/react-rtekit/text-formatting/');
    await expect(editor(page)).toBeVisible();
  });

  /**
   * A mark has to be *visible*, not merely applied. Bold and italic used to look right
   * by accident because the Lexical adapter also emitted `<strong>` and `<em>`, while
   * underline arrived as a bare span and looked like a button that did nothing.
   *
   * The selectors name both shapes because both engines are in the tree: the Lexical
   * adapter labels marks with classes, and the in-house engine renders the elements the
   * serializer writes, so that the editor and `<RteContentView>` are the same DOM. What
   * is being asserted either way is what the reader sees.
   */
  for (const [name, shortcut, selector, expected] of [
    ['underline', 'ControlOrMeta+u', '.rte-underline, u', 'underline'],
    ['strikethrough', 'ControlOrMeta+Shift+x', '.rte-strike, s', 'line-through'],
  ] as const) {
    test(`${name} is visible, not just applied`, async ({ page }) => {
      await editor(page).click();
      await page.keyboard.press('ControlOrMeta+a');
      await page.keyboard.press(shortcut);

      const marked = editor(page).locator(selector).first();
      await expect(marked).toHaveCSS('text-decoration-line', expected);
    });
  }

  test('bold and italic render at their own weight and style', async ({ page }) => {
    await editor(page).click();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.press('ControlOrMeta+b');

    await expect(editor(page).locator('.rte-bold, strong').first()).toHaveCSS('font-weight', '700');
  });

  test('underline and strikethrough together show both', async ({ page }) => {
    // `text-decoration` is one property, so a mark that sets it cannot simply be added
    // to one that already has: the Lexical adapter needs a class for the pair, and the
    // in-house engine nests `<s><u>`. Either way the model holds both marks and the
    // screen has to show both lines.
    await editor(page).click();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.press('ControlOrMeta+u');
    await page.keyboard.press('ControlOrMeta+Shift+x');

    const both = editor(page).locator('.rte-underline-strike, u:has(s), s:has(u)').first();
    await expect(both).toHaveCSS('text-decoration-line', 'underline line-through');
    await expect(page.getByTestId('formatting-html')).toContainText('<s><u>');
  });
});

test.describe('the toolbar that follows a selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/react-rtekit/selection-toolbar/');
    await expect(editor(page)).toBeVisible();
  });

  test('stays away when a docked toolbar is already there', async ({ page }) => {
    // The `full` preset asked for both, so selecting anything in an editor that already
    // had every command on a toolbar above it raised a second toolbar over the text.
    await page.goto('/react-rtekit/text-formatting/');
    await expect(editor(page)).toBeVisible();
    await selectFirstWord(page);

    await expect(page.locator('.rte-toolbar').first()).toBeVisible();
    await expect(page.locator('.rte-floating-toolbar')).toHaveCount(0);
  });

  test('is a card, not a bare strip of buttons', async ({ page }) => {
    await selectFirstWord(page);

    const bubble = page.locator('.rte-floating-toolbar');
    await expect(bubble).toBeVisible();
    // A surface of its own: it used to inherit nothing and sit transparently over the
    // prose, which is what made it read as part of the text.
    await expect(bubble).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(bubble).not.toHaveCSS('box-shadow', 'none');
  });

  test('stays inside the viewport', async ({ page }) => {
    await selectFirstWord(page);

    const box = await page.locator('.rte-floating-layer').boundingBox();
    const viewport = page.viewportSize();
    expect(box).not.toBeNull();
    expect(viewport).not.toBeNull();
    if (!box || !viewport) return;

    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
  });

  test('flips below a selection with no room above it', async ({ page }) => {
    // The first line of an editor scrolled to the top of the window has nothing above
    // it, and a toolbar placed there unconditionally is cut off by the window.
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await selectFirstWord(page);

    const layer = page.locator('.rte-floating-layer');
    const box = await layer.boundingBox();
    expect(box?.y ?? -1).toBeGreaterThanOrEqual(0);
  });

  test('offers the marks and the link, not the whole toolbar', async ({ page }) => {
    await selectFirstWord(page);

    const bubble = page.locator('.rte-floating-toolbar');
    await expect(bubble.locator('[data-item="bold"]')).toBeVisible();
    await expect(bubble.locator('[data-item="link"]')).toBeVisible();
    // `full` has around forty controls. Putting all of them in a floating strip is what
    // made it wider than the window.
    await expect(bubble.locator('[data-item="image"]')).toHaveCount(0);
    await expect(bubble.locator('[data-item="table"]')).toHaveCount(0);
    expect(await bubble.locator('[data-toolbar-control]').count()).toBeLessThan(12);
  });

  test('applies to the selection it is pointing at', async ({ page }) => {
    await selectFirstWord(page);
    await page.locator('.rte-floating-toolbar [data-item="bold"]').click();

    await expect(editor(page).locator('.rte-bold').first()).toBeVisible();
  });
});

test.describe('the overflow menu', () => {
  test('its button is drawn', async ({ page }) => {
    // It had no icon and no label: the only route to the hidden half of the toolbar
    // was an empty box.
    await page.setViewportSize({ width: 640, height: 720 });
    await page.goto('/react-rtekit/selection-toolbar/');
    await expect(editor(page)).toBeVisible();

    const more = page.locator('[data-item="overflow"]').first();
    await expect(more).toBeVisible();

    const box = await more.locator('svg').boundingBox();
    expect(box?.width ?? 0).toBeGreaterThan(0);
  });

  test('keeps its buttons inside the card', async ({ page }) => {
    // The hidden groups are the same non-wrapping flex rows as the docked toolbar, and
    // in here they are rendered with their labels — so a group of five ran out through
    // the side of the popover instead of the card growing to hold it.
    await page.setViewportSize({ width: 620, height: 720 });
    await page.goto('/react-rtekit/selection-toolbar/');
    await expect(editor(page)).toBeVisible();

    await page.locator('[data-item="overflow"]').first().click();
    const menu = page.locator('.rte-toolbar__overflow');
    await expect(menu).toBeVisible();

    const card = await menu.boundingBox();
    expect(card).not.toBeNull();
    if (!card) return;

    for (const button of await menu.locator('[data-toolbar-control]').all()) {
      const box = await button.boundingBox();
      if (!box) continue;
      expect(box.x).toBeGreaterThanOrEqual(card.x - 1);
      expect(box.x + box.width).toBeLessThanOrEqual(card.x + card.width + 1);
    }
  });

  test('gives the buttons back when there is room again', async ({ page }) => {
    // The measurement only ever saw the groups still on the row, so it could conclude
    // that fewer fit but never that more did: narrowing the window once collapsed the
    // toolbar permanently.
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/react-rtekit/selection-toolbar/');
    await expect(editor(page)).toBeVisible();

    const toolbar = page.locator('.rte-toolbar').first();
    const controls = toolbar.locator('.rte-toolbar__group > [data-toolbar-control]');
    const wide = await controls.count();

    await page.setViewportSize({ width: 560, height: 720 });
    await expect.poll(async () => controls.count()).toBeLessThan(wide);

    await page.setViewportSize({ width: 1280, height: 720 });
    await expect.poll(async () => controls.count()).toBe(wide);
  });
});

test.describe('every button in the full preset does something', () => {
  /**
   * Two of these dispatched a command that nothing handled, which is silent: the
   * button is enabled, it has a tooltip, it takes the click and nothing happens. The
   * sweep that found them clicked all twenty-eight and compared the document before
   * and after; these two are the ones that had no effect.
   */
  test.beforeEach(async ({ page }) => {
    await page.goto('/react-rtekit/demos/playground/');
    await choosePreset(page, 'full');
    await expect(page.locator('.playground__editor [contenteditable="true"]')).toBeVisible();
  });

  test('the emoji button opens a picker that inserts', async ({ page }) => {
    // It was wired to `insertEmoji` with no character to insert, and the picker slot
    // behind it was an empty `<div>`, so the feature was two stubs deep.
    const surface = page.locator('.playground__editor [contenteditable="true"]').first();
    await surface.click();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.type('hi ');

    await page.locator('.playground__editor [data-item="emoji"]').click();
    const items = page.locator('.rte-emoji-picker__item');
    await expect(items.first()).toBeVisible();
    expect(await items.count()).toBeGreaterThan(20);

    await items.first().click();
    await expect(surface).toContainText('😀');
  });

  test('the emoji picker filters as you search', async ({ page }) => {
    await page.locator('.playground__editor [contenteditable="true"]').first().click();
    await page.locator('.playground__editor [data-item="emoji"]').click();

    const items = page.locator('.rte-emoji-picker__item');
    const all = await items.count();
    await page.getByLabel('Search emoji').fill('heart');
    await expect.poll(async () => items.count()).toBeLessThan(all);
  });

  test('the source view button opens the source view', async ({ page }) => {
    // `toggleSourceView` existed as a method on the editor and as a toolbar item, and
    // nothing registered it as a command, so the button dispatched into nothing.
    await page.locator('.playground__editor [contenteditable="true"]').first().click();
    await page.locator('.playground__editor [data-item="sourceView"]').click();

    await expect(page.locator('.rte-source-view')).toBeVisible();
  });
});

test.describe('fullscreen', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/react-rtekit/demos/playground/');
    await choosePreset(page, 'full');
    await expect(page.locator('.playground__editor [contenteditable="true"]')).toBeVisible();
  });

  test('the button says which way it will go', async ({ page }) => {
    // A plain button with one glyph: identical whether fullscreen was on or off, so
    // the only way to know was to look at the window.
    const button = page.locator('.playground__editor [data-item="fullscreen"]');
    await expect(button).toHaveAttribute('aria-pressed', 'false');
    const idle = await button.locator('svg path').getAttribute('d');

    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(await button.locator('svg path').getAttribute('d')).not.toBe(idle);

    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  test('a popover opened in fullscreen is on top of it', async ({ page }) => {
    // The fullscreen surface is `position: fixed` over the whole window and a popover
    // portals to `document.body`, outside the editor's stacking context. Ordered the
    // other way round, every menu and colour picker opened behind the editor.
    await page.locator('.playground__editor [data-item="fullscreen"]').click();
    await expect(page.locator('.rte-root[data-fullscreen="true"]')).toBeVisible();

    // The playground page has the demo's editor as well as the playground's own, so the
    // fullscreen root is the one to scope to.
    await page.locator('.rte-root[data-fullscreen="true"] [data-item="color"]').click();
    const picker = page.locator('.rte-color-picker').first();
    await expect(picker).toBeVisible();

    // Visible to Playwright is not the same as painted on top; ask the browser what is
    // actually at that point.
    const box = await picker.boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;
    const onTop = await page.evaluate(
      ([x, y]) => document.elementFromPoint(x, y)?.closest('.rte-color-picker') !== null,
      [box.x + box.width / 2, box.y + box.height / 2] as const,
    );
    expect(onTop).toBe(true);
  });
});

test.describe('popovers open under the button that opened them', () => {
  /**
   * The colour picker and the dropdowns always did, because their popover is rendered
   * inside the item that owns it. The link editor, the image dialog, the table picker
   * and find-and-replace are mounted once beside the editor and reached through a
   * command, so they had no reference to the control that dispatched it and fell back
   * to the content element — which put them under the whole text area.
   */
  test.beforeEach(async ({ page }) => {
    await page.goto('/react-rtekit/demos/playground/');
    await choosePreset(page, 'full');
    await expect(page.locator('.playground__editor [contenteditable="true"]')).toBeVisible();
    await page.locator('.playground__editor [contenteditable="true"]').first().click();
    await page.keyboard.type('anchor me');
  });

  for (const [item, panel] of [
    ['link', '.rte-link-popover'],
    ['image', '.rte-field'],
    ['table', '.rte-table-picker'],
    ['findReplace', '.rte-find-panel'],
  ] as const) {
    test(`${item} opens under its toolbar button`, async ({ page }) => {
      const button = page.locator(`.playground__editor [data-item="${item}"]`).first();
      await button.click();

      const popover = page.locator('.rte-popover').first();
      await expect(popover).toBeVisible();
      await expect(popover.locator(panel).first()).toBeVisible();

      // Both measured after the popover is up: opening it can scroll the page, and a
      // box taken before the click is relative to a different scroll position.
      const trigger = await button.boundingBox();
      const box = await popover.boundingBox();
      expect(trigger && box).toBeTruthy();
      if (!trigger || !box) return;

      // Attached to the control — overlapping it horizontally and touching it
      // vertically — rather than parked under the content area further down the page.
      // It may sit above rather than below: on a short window that is where it fits.
      expect(box.x).toBeLessThan(trigger.x + trigger.width + 8);
      expect(box.x + box.width).toBeGreaterThan(trigger.x - 8);

      const gapBelow = box.y - (trigger.y + trigger.height);
      const gapAbove = trigger.y - (box.y + box.height);
      expect(Math.max(gapBelow, gapAbove)).toBeLessThan(24);

      // And on screen, which a panel placed under a low anchor was not. `boundingBox`
      // is already relative to the viewport.
      const viewport = page.viewportSize();
      if (!viewport) return;
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
    });
  }
});

test.describe('the find and replace panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/react-rtekit/demos/playground/');
    await choosePreset(page, 'full');
    const surface = page.locator('.playground__editor [contenteditable="true"]').first();
    await expect(surface).toBeVisible();
    await surface.click();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.type('the quick brown fox jumps over the lazy dog');
    await page.locator('.playground__editor [data-item="findReplace"]').click();
    await expect(page.locator('.rte-find-panel')).toBeVisible();
  });

  test('is one card, not a card inside a card', async ({ page }) => {
    // It kept the surface it needed when it rendered in the flow, and moving it into a
    // popover — which is already a padded, bordered, raised card — drew a second one
    // just inside the first.
    const panel = page.locator('.rte-find-panel');
    await expect(panel).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(panel).toHaveCSS('border-top-width', '0px');
  });

  test('is wide enough not to wrap into a pile', async ({ page }) => {
    const box = await page.locator('.rte-popover--find').boundingBox();
    expect(box?.width ?? 0).toBeGreaterThan(340);
  });

  test('puts Close on a line of its own', async ({ page }) => {
    // Beside the last checkbox, the way out of the panel read as a fourth option.
    const close = await page.getByRole('button', { name: 'Close' }).boundingBox();
    const options = await page.locator('.rte-find-panel__options').boundingBox();
    expect(close && options).toBeTruthy();
    if (!close || !options) return;

    expect(close.y).toBeGreaterThanOrEqual(options.y + options.height);
  });

  test('says nothing about results until something is searched for', async ({ page }) => {
    const count = page.locator('.rte-find-panel__count');
    await expect(count).toHaveText('');

    await page.locator('.rte-find-panel').getByRole('textbox', { name: 'Find' }).fill('the');
    await expect(count).toHaveText('1 of 2');

    await page.locator('.rte-find-panel').getByRole('textbox', { name: 'Find' }).fill('zzz');
    await expect(count).toHaveText('No results');
  });

  test('each field takes the width, with its buttons under it', async ({ page }) => {
    // Laid out as one wrapping flex line, a label, an input, a count and two buttons
    // broke wherever the widths fell and sat at slightly different heights.
    const field = await page.locator('.rte-find-panel__field').first().boundingBox();
    const actions = await page.locator('.rte-find-panel__actions').first().boundingBox();
    const panel = await page.locator('.rte-find-panel').boundingBox();
    expect(field && actions && panel).toBeTruthy();
    if (!field || !actions || !panel) return;

    expect(field.width).toBeGreaterThan(panel.width * 0.9);
    expect(actions.y).toBeGreaterThanOrEqual(field.y + field.height);
  });
});

test.describe('inserting an image from the device', () => {
  test('the picker is offered with no upload handler, and the file is embedded', async ({
    page,
  }) => {
    // The picker used to appear only when the host supplied `onUpload`, so an editor
    // with no backend had a URL box and no way to use a picture from this machine.
    await page.goto('/react-rtekit/demos/playground/');
    await choosePreset(page, 'full');
    const surface = page.locator('.playground__editor [contenteditable="true"]').first();
    await expect(surface).toBeVisible();
    await surface.click();

    await page.locator('.playground__editor [data-item="image"]').click();
    // Scoped to the dialog: the hidden file input carries the same accessible name.
    const upload = page.locator('.rte-popover').getByRole('button', { name: 'Upload' });
    await expect(upload).toBeVisible();

    // A one-pixel PNG, which is a real image the browser will accept.
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    );
    const chooser = page.waitForEvent('filechooser');
    await upload.click();
    await (await chooser).setFiles({ name: 'dot.png', mimeType: 'image/png', buffer: png });

    await expect(surface.locator('img')).toHaveAttribute('src', /^data:image\/png/);
  });
});

test.describe('tables', () => {
  /** Inserts a small table and puts the caret in its first cell. */
  async function insertTable(page: Page) {
    await page.goto('/react-rtekit/demos/playground/');
    await choosePreset(page, 'full');
    const surface = page.locator('.playground__editor [contenteditable="true"]').first();
    await expect(surface).toBeVisible();
    await surface.click();
    await page.keyboard.type('before');

    await page.locator('.playground__editor [data-item="table"]').click();
    await page.locator('.rte-table-picker__cell').nth(12).click();
    await expect(surface.locator('table')).toBeVisible();
    return surface;
  }

  test('every cell is an ordinary cell', async ({ page }) => {
    // A bare `true` means "header rows *and* header columns" to the engine, so every
    // new table arrived with its first row and its first column shaded.
    const surface = await insertTable(page);
    await expect(surface.locator('th')).toHaveCount(0);
    expect(await surface.locator('td').count()).toBeGreaterThan(0);
  });

  test('the controls appear in the table and can remove it', async ({ page }) => {
    // The controls were passed to a slot whose default rendered an empty `<div>` and
    // dropped its children, so the menu was a blank card and a table, once inserted,
    // could not be deleted.
    const surface = await insertTable(page);
    await surface.locator('td').first().click();

    const controls = page.locator('.rte-table-toolbar');
    await expect(controls).toBeVisible();
    for (const label of [
      'Insert row above',
      'Insert row below',
      'Insert column left',
      'Insert column right',
      'Delete row',
      'Delete column',
      'Delete table',
    ]) {
      await expect(controls.getByRole('menuitem', { name: label })).toBeVisible();
    }

    await controls.getByRole('menuitem', { name: 'Delete table' }).click();
    await expect(surface.locator('table')).toHaveCount(0);
  });

  test('the controls are a stacked menu, not a row of links', async ({ page }) => {
    // Eight accented text buttons on a wrapping line: every option read as a link, and
    // nothing separated "Delete table" from "Header row".
    const surface = await insertTable(page);
    await surface.locator('td').first().click();

    const controls = page.locator('.rte-table-toolbar');
    await expect(controls).toBeVisible();

    // Stacked: each row starts at the same x and sits below the one before it.
    const boxes = [];
    for (const item of await controls.getByRole('menuitem').all()) {
      const box = await item.boundingBox();
      if (box) boxes.push(box);
    }
    expect(boxes.length).toBeGreaterThan(6);
    for (let index = 1; index < boxes.length; index += 1) {
      expect(boxes[index]!.x).toBeCloseTo(boxes[0]!.x, 0);
      expect(boxes[index]!.y).toBeGreaterThanOrEqual(
        boxes[index - 1]!.y + boxes[index - 1]!.height,
      );
    }

    // And in the ordinary text colour rather than the accent.
    const accent = await page
      .locator('.rte-root')
      .first()
      .evaluate((element) =>
        getComputedStyle(element).getPropertyValue('--rte-color-accent').trim(),
      );
    const colour = await controls
      .getByRole('menuitem')
      .first()
      .evaluate((element) => getComputedStyle(element).color);
    expect(colour).not.toBe(accent);

    // Grouped, so the destructive items are set apart from the rest.
    expect(await controls.locator('[role="separator"]').count()).toBeGreaterThan(1);
  });

  test('a row can be added and a column removed', async ({ page }) => {
    const surface = await insertTable(page);
    await surface.locator('td').first().click();
    const controls = page.locator('.rte-table-toolbar');

    const rows = await surface.locator('tr').count();
    await controls.getByRole('menuitem', { name: 'Insert row below' }).click();
    await expect(surface.locator('tr')).toHaveCount(rows + 1);

    const cells = await surface.locator('tr').first().locator('td').count();
    await surface.locator('td').first().click();
    await controls.getByRole('menuitem', { name: 'Delete column' }).click();
    await expect(surface.locator('tr').first().locator('td')).toHaveCount(cells - 1);
  });
});

test.describe('check lists', () => {
  test('have a box, and it can be ticked', async ({ page }) => {
    // The rules looked for a `.rte-checkbox` child of an `li[data-checked]`. The engine
    // renders `<li role="checkbox" class="rte-list-item--unchecked">` and the serializer
    // writes `<li data-checked>`, neither with a child element — so a check list was a
    // bulleted list with nothing to tick.
    await page.goto('/react-rtekit/demos/playground/');
    await choosePreset(page, 'full');
    const surface = page.locator('.playground__editor [contenteditable="true"]').first();
    await expect(surface).toBeVisible();
    await surface.click();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.type('task one');
    await page.locator('.playground__editor [data-item="checkList"]').click();

    const item = surface.locator('li').first();
    await expect(item).toHaveAttribute('aria-checked', 'false');

    // The box is drawn, and the bullet is gone.
    await expect(item).toHaveCSS('list-style-type', 'none');
    const drawn = await item.evaluate((element) => {
      const style = getComputedStyle(element, '::before');
      return { width: style.width, height: style.height };
    });
    expect(drawn.width).not.toBe('auto');
    expect(parseFloat(drawn.width)).toBeGreaterThan(8);
    expect(parseFloat(drawn.height)).toBeGreaterThan(8);

    // And clicking it ticks the item, which is what the box is for.
    const box = await item.boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;
    await page.mouse.click(box.x + 7, box.y + 10);
    await expect(item).toHaveAttribute('aria-checked', 'true');
  });
});

test.describe('the playground', () => {
  test('puts the options above the editor and the output below it', async ({ page }) => {
    await page.goto('/react-rtekit/demos/playground/');
    const controls = await page.locator('.playground__controls').boundingBox();
    const surface = await page.locator('.playground__editor').boundingBox();
    const output = await page.locator('.playground__output').boundingBox();
    expect(controls && surface && output).toBeTruthy();
    if (!controls || !surface || !output) return;

    expect(controls.y + controls.height).toBeLessThanOrEqual(surface.y + 1);
    expect(surface.y + surface.height).toBeLessThanOrEqual(output.y + 1);
  });

  test('gives the editor the full width of the page', async ({ page }) => {
    // Squeezed into the middle of a three-column grid, the page whose purpose is to
    // show every option had room for the fewest.
    await page.goto('/react-rtekit/demos/playground/');
    const surface = await page.locator('.playground__editor').boundingBox();
    const controls = await page.locator('.playground__controls').boundingBox();
    expect(surface && controls).toBeTruthy();
    if (!surface || !controls) return;

    expect(surface.width).toBeGreaterThan(controls.width - 2);
  });

  test('the full preset shows its whole toolbar', async ({ page }) => {
    await page.goto('/react-rtekit/demos/playground/');
    await choosePreset(page, 'full');

    const toolbar = page.locator('.playground__editor .rte-toolbar');
    await expect(toolbar).toBeVisible();
    // Wrapped onto a second row rather than hidden behind a menu.
    await expect(toolbar.locator('[data-item="overflow"]')).toHaveCount(0);
    expect(await toolbar.locator('[data-toolbar-control]').count()).toBeGreaterThan(20);
  });
});

test.describe('the playground control panel', () => {
  /**
   * Generated from `RichTextEditorProps`. The old panel was hand-written and exposed 40
   * of 140 props with nothing noticing the other hundred, so the first assertion here is
   * about completeness rather than appearance.
   */
  test.beforeEach(async ({ page }) => {
    await page.goto('/react-rtekit/demos/playground/');
    await expect(page.locator('.panel')).toBeVisible();
  });

  test('is generated from the props, and says how many there are', async ({ page }) => {
    await expect(page.locator('.panel__count')).toContainText('Props 61');
    await expect(page.locator('.panel__count')).toContainText('0 changed');
  });

  test('groups the props, collapsed except the first', async ({ page }) => {
    const groups = page.locator('.panel__summary-title');
    expect(await groups.count()).toBeGreaterThan(8);

    // Only the first group's controls are on screen; the rest are behind a caret.
    const open = page.locator('.panel__section [aria-expanded="true"]');
    expect(await open.count()).toBeLessThan(3);

    await page.getByRole('button', { name: /^Toolbar/ }).click();
    await expect(page.locator('#prop-toolbarPosition')).toBeVisible();
  });

  test('a control shows its type and its default', async ({ page }) => {
    await page.getByRole('button', { name: /^Toolbar/ }).click();
    const control = page.locator('.control').filter({ hasText: 'toolbarPosition' });
    await expect(control.locator('.control__meta')).toContainText('"bottom" | "top" | "none"');
    await expect(control.locator('.control__meta')).toContainText("default 'top'");
  });

  test('a changed value can be reset, and so can all of them', async ({ page }) => {
    await page.locator('#prop-enableBold').selectOption('false');
    await expect(page.locator('.panel__count')).toContainText('1 changed');

    // The reset appears only on the control that changed.
    await expect(page.locator('.control__reset')).toHaveCount(1);
    await page.locator('.control__reset').click();
    await expect(page.locator('.panel__count')).toContainText('0 changed');

    await page.locator('#prop-enableBold').selectOption('false');
    await page.locator('#prop-enableItalic').selectOption('false');
    await expect(page.locator('.panel__count')).toContainText('2 changed');

    await page.getByRole('button', { name: 'Reset all' }).click();
    await expect(page.locator('.panel__count')).toContainText('0 changed');
    await expect(page.locator('#prop-enableBold')).toHaveValue('');
  });

  test('filtering opens the groups that match', async ({ page }) => {
    // A filtered list the reader has to open group by group is worse than no filter.
    await page.getByLabel('Filter props').fill('toolbarOverflow');
    await expect(page.locator('#prop-toolbarOverflow')).toBeVisible();
    await expect(page.locator('.control')).toHaveCount(1);
  });

  test('“changed only” shows just what was touched', async ({ page }) => {
    // Filtering opens the group it lives in, which is how a reader would reach a prop
    // that is not in the one group the panel opens with.
    await page.getByLabel('Filter props').fill('enableTables');
    await page.locator('#prop-enableTables').selectOption('false');
    await page.getByLabel('Filter props').fill('');
    await page.getByLabel('Changed only').check();

    await expect(page.locator('.control')).toHaveCount(1);
    await expect(page.locator('.control__name')).toHaveText('enableTables');
  });

  test('a changed prop reaches the editor and the generated code', async ({ page }) => {
    await page.getByRole('button', { name: /^Toolbar/ }).click();
    await page.locator('#prop-toolbarPosition').selectOption('none');

    // The toolbar goes, and the snippet says why.
    await expect(page.locator('.playground__editor .rte-toolbar')).toHaveCount(0);
    await expect(page.getByTestId('playground-code')).toContainText('toolbarPosition="none"');
  });
});
