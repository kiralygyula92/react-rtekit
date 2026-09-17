import { afterEach, describe, expect, it } from 'vitest';
import { resolvePlacement } from '../../src/react/plugins/FloatingToolbarUi.js';

/**
 * Where the toolbar that follows a selection ends up.
 *
 * The arithmetic, without a browser. The toolbar used to be placed from the selection
 * alone — centred on it and always above it — so it hung off whichever edge of the
 * window the selection happened to be near, and was cut off by the top of the screen
 * whenever the selection was on the first line. These are those cases.
 */

const OFFSET = 8;
const MARGIN = 8;

/** A selection box. */
const anchor = (top: number, left: number, width = 100, height = 20) => ({
  top,
  bottom: top + height,
  left,
  right: left + width,
});

/** What the toolbar itself measures. */
const self = (width: number, height: number) => ({ width, height }) as DOMRect;

const originalWidth = window.innerWidth;
const originalHeight = window.innerHeight;

function viewport(width: number, height: number): void {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: height, configurable: true });
}

afterEach(() => {
  viewport(originalWidth, originalHeight);
});

describe('resolvePlacement', () => {
  it('centres the toolbar on the selection', () => {
    viewport(1000, 800);
    // Selection spans 200–400, so its centre is 300; a 100-wide toolbar starts at 250.
    const placement = resolvePlacement(anchor(400, 200, 200), self(100, 40), OFFSET);

    expect(placement.left).toBe(250);
  });

  it('puts it above the selection when there is room', () => {
    viewport(1000, 800);
    const placement = resolvePlacement(anchor(400, 200), self(100, 40), OFFSET);

    expect(placement.side).toBe('top');
    expect(placement.top).toBe(400 - 40 - OFFSET);
  });

  it('flips below a selection on the first line', () => {
    viewport(1000, 800);
    // 10px from the top of the window: a toolbar above it would be off the screen.
    const placement = resolvePlacement(anchor(10, 200), self(100, 40), OFFSET);

    expect(placement.side).toBe('bottom');
    expect(placement.top).toBe(30 + OFFSET);
  });

  it('stays above when there is no room either way, and is clamped on screen', () => {
    // A short window with a tall toolbar: neither side fits, and the one thing that
    // must not happen is a negative offset that puts the top of it out of reach.
    viewport(1000, 200);
    const placement = resolvePlacement(anchor(80, 200), self(100, 300), OFFSET);

    expect(placement.top).toBeGreaterThanOrEqual(MARGIN);
  });

  it('pulls it back inside the left edge', () => {
    viewport(1000, 800);
    // Centred, this would start at -30.
    const placement = resolvePlacement(anchor(400, 10, 40), self(100, 40), OFFSET);

    expect(placement.left).toBe(MARGIN);
  });

  it('pulls it back inside the right edge', () => {
    viewport(1000, 800);
    // Centred on a selection at the far right, this would end past 1000.
    const placement = resolvePlacement(anchor(400, 950, 40), self(100, 40), OFFSET);

    expect(placement.left).toBe(1000 - 100 - MARGIN);
  });

  it('sits at the left margin when it is wider than the window', () => {
    // The clamp has to apply the minimum last, or a toolbar wider than the viewport
    // gets a negative left and loses its first buttons off the side.
    viewport(300, 800);
    const placement = resolvePlacement(anchor(400, 100), self(500, 40), OFFSET);

    expect(placement.left).toBe(MARGIN);
  });

  it('honours a custom offset', () => {
    viewport(1000, 800);
    const placement = resolvePlacement(anchor(400, 200), self(100, 40), 24);

    expect(placement.top).toBe(400 - 40 - 24);
  });
});
