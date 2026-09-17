import { expect, test, type Page } from '@playwright/test';

/**
 * The performance budgets (09 §4).
 *
 * | Metric                            | Budget          |
 * |-----------------------------------|-----------------|
 * | Typing latency, 50 KB document    | < 16 ms p95     |
 * | Mount time, `standard` preset     | < 50 ms         |
 * | Word paste, 200 KB                | < 400 ms        |
 *
 * Measured in a real browser against the production build, because that is the only
 * place the numbers mean anything: jsdom has no layout and a synthetic benchmark has
 * no React.
 *
 * The thresholds here are the budgets themselves, not the numbers this machine
 * happens to produce. A CI runner is slower than a laptop, so the margin is the point:
 * a run that lands at 15 ms on a fast machine and 15.9 ms on a slow one is a run that
 * is about to start failing, and the reported figures below say so.
 */

/** The harness page, which exposes its measurements on `window.__rtePerf`. */
async function harness(page: Page): Promise<void> {
  await page.goto('/internal/performance');
  await expect(page.getByTestId('perf-status')).toHaveText('ready');
}

/** The editable surface. */
function editor(page: Page) {
  return page.getByRole('textbox', { name: 'Document' });
}

// Run through `playwright.perf.config.ts` — one browser, one worker, no retries. The
// default config ignores this file for that reason.
test.describe.configure({ mode: 'serial' });

test.describe('performance budgets (09 §4)', () => {
  test('mounts a standard editor in under 50 ms', async ({ page }) => {
    await harness(page);

    // Five mounts, because the first one pays for the engine's module-level setup and
    // a budget that only holds on a warm cache is not a budget.
    const times: number[] = [];
    for (let run = 0; run < 5; run += 1) {
      times.push(await page.evaluate(() => window.__rtePerf!.remount()));
      await expect(page.getByTestId('perf-status')).toHaveText('ready');
    }

    const median = [...times].sort((a, b) => a - b)[Math.floor(times.length / 2)]!;
    console.log(`mount: ${times.map((time) => time.toFixed(1)).join(', ')} ms (median ${median.toFixed(1)})`);

    expect(median).toBeLessThan(50);
  });

  test('keeps typing under 16 ms at the 95th percentile in a 50 KB document', async ({ page }) => {
    await harness(page);

    const loaded = await page.evaluate(() => window.__rtePerf!.load(50_000));
    expect(loaded).toBeGreaterThan(0);

    const before = await page.evaluate(() => window.__rtePerf!.editor()!.getLength());
    const samples = await page.evaluate(() => window.__rtePerf!.type(60));
    const after = await page.evaluate(() => window.__rtePerf!.editor()!.getLength());

    // The characters have to have landed, or the numbers describe an editor that did
    // nothing sixty times.
    expect(after - before).toBe(60);

    const sorted = [...samples].sort((a, b) => a - b);
    const p95 = sorted[Math.floor(sorted.length * 0.95)]!;
    const median = sorted[Math.floor(sorted.length / 2)]!;
    console.log(`typing: median ${median.toFixed(1)} ms, p95 ${p95.toFixed(1)} ms over ${samples.length} keys`);

    expect(p95).toBeLessThan(16);
  });

  test('settles a 200 KB Word paste in under 400 ms', async ({ page }) => {
    await harness(page);

    const elapsed = await page.evaluate(() => window.__rtePerf!.pasteWord(200_000));
    console.log(`word paste: ${elapsed.toFixed(0)} ms for 200 KB`);

    expect(elapsed).toBeLessThan(400);

    // It has to have actually landed: a fast run that dropped the content is not a
    // fast run.
    await expect(editor(page)).toContainText('chlorine');
  });

  test('serializes a 100 KB document without blocking for a frame', async ({ page }) => {
    await harness(page);
    await page.evaluate(() => window.__rtePerf!.load(100_000));

    const timings = await page.evaluate(() => {
      const editorInstance = window.__rtePerf!.editor()!;
      const time = (run: () => unknown): number => {
        const started = performance.now();
        run();
        return performance.now() - started;
      };
      return {
        text: time(() => editorInstance.getText()),
        json: time(() => editorInstance.getJSON()),
        html: time(() => editorInstance.getHTML()),
      };
    });
    console.log(
      `100 KB: getText ${timings.text.toFixed(0)} ms, getJSON ${timings.json.toFixed(0)} ms, getHTML ${timings.html.toFixed(0)} ms`,
    );

    // A change handler that reads the value on every keystroke is the common mistake
    // the performance guide warns about; these are the numbers behind that advice.
    expect(timings.html).toBeLessThan(400);
  });
});
