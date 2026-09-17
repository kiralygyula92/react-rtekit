import { test, type Page } from '@playwright/test';

/**
 * Whether the browser's `Mod` shortcuts can be driven on this host.
 *
 * The library maps `Mod` to Cmd or Ctrl from `navigator.userAgent`, which is right for
 * a real user. Playwright's WebKit build reports a Mac user agent whatever machine it
 * runs on, so on a Windows or Linux host it wants Cmd — while the host's keyboard
 * delivers a Meta key that its editing layer ignores. Neither modifier reaches the
 * keymap, and every shortcut assertion fails for a reason that has nothing to do with
 * the library.
 *
 * The mapping itself is unit-tested against both user agents in `keymap.test.ts`; this
 * only decides whether an end-to-end key press is worth making.
 */
export async function modShortcutsAreDrivable(page: Page): Promise<boolean> {
  const apple = await page.evaluate(() => /Mac|iPhone|iPad|iPod/.test(navigator.userAgent));
  return apple === (process.platform === 'darwin');
}

/** Skips the current test when this browser and host disagree about `Mod`. */
export async function skipUndrivableShortcuts(page: Page): Promise<void> {
  test.skip(
    !(await modShortcutsAreDrivable(page)),
    'this browser reports a different platform than the host, so Mod cannot be pressed',
  );
}
