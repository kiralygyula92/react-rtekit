import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, expect } from 'vitest';
import * as axeMatchers from 'vitest-axe/matchers';

expect.extend(axeMatchers);

afterEach(() => {
  cleanup();
});

/* eslint-disable @typescript-eslint/no-empty-function, @typescript-eslint/no-unnecessary-type-assertion */

// jsdom implements neither of these, and both the engine and the popovers reach for them.
if (typeof globalThis.ResizeObserver === 'undefined') {
  class ResizeObserverStub implements ResizeObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  globalThis.ResizeObserver = ResizeObserverStub;
}

/**
 * jsdom has no layout engine, so nothing has a box.
 *
 * Lexical scrolls the caret into view after an update and asks the selection's target
 * for its rect. In a browser that target is a `Range`; in jsdom it can be a `Text`,
 * which has no `getBoundingClientRect` at all. An empty rect is the honest answer
 * here — these tests assert document state, never geometry.
 */
const EMPTY_RECT: DOMRect = {
  x: 0,
  y: 0,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: 0,
  height: 0,
  toJSON: () => ({}),
};

for (const prototype of [
  typeof Text !== 'undefined' ? Text.prototype : null,
  typeof Range !== 'undefined' ? Range.prototype : null,
]) {
  if (!prototype || 'getBoundingClientRect' in prototype) continue;
  Object.defineProperty(prototype, 'getBoundingClientRect', {
    value: () => EMPTY_RECT,
    configurable: true,
  });
  Object.defineProperty(prototype, 'getClientRects', {
    value: () => [EMPTY_RECT],
    configurable: true,
  });
}

if (typeof Element !== 'undefined' && typeof Element.prototype.scrollIntoView !== 'function') {
  Object.defineProperty(Element.prototype, 'scrollIntoView', {
    value: () => {},
    configurable: true,
  });
}

if (typeof window !== 'undefined' && typeof window.matchMedia === 'undefined') {
  window.matchMedia = ((query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList) as typeof window.matchMedia;
}

/* eslint-enable @typescript-eslint/no-empty-function, @typescript-eslint/no-unnecessary-type-assertion */

/**
 * Recent colours live in `localStorage`, which jsdom shares across the tests in a
 * file. Without this, a test that picks a colour changes the swatch count in the
 * next one.
 */
beforeEach(() => {
  try {
    window.localStorage.clear();
  } catch {
    // Blocked storage is a supported environment; nothing to clear.
  }
});
