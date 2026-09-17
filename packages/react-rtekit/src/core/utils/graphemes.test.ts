import { afterEach, describe, expect, it, vi } from 'vitest';
import { graphemeLength, previousGraphemeBoundary } from './graphemes.js';

/**
 * The cases are the ones that produce visible damage when a caller steps back by code
 * units: half an emoji, an accent without its letter, a family split into people.
 */
describe('previousGraphemeBoundary', () => {
  it('steps back one plain character', () => {
    expect(previousGraphemeBoundary('abc', 3)).toBe(2);
  });

  it('steps back several', () => {
    expect(previousGraphemeBoundary('abcdef', 6, 2)).toBe(4);
  });

  it('clamps at the start rather than going negative', () => {
    expect(previousGraphemeBoundary('ab', 2, 99)).toBe(0);
    expect(previousGraphemeBoundary('', 0)).toBe(0);
  });

  it('clamps an offset past the end', () => {
    expect(previousGraphemeBoundary('abc', 99, 1)).toBe(2);
  });

  it('returns the offset itself for a count of zero', () => {
    expect(previousGraphemeBoundary('abc', 2, 0)).toBe(2);
  });

  it('keeps a surrogate pair together', () => {
    const text = 'a👍';
    expect(text.length).toBe(3);
    expect(previousGraphemeBoundary(text, text.length)).toBe(1);
  });

  it('keeps a combining mark with its base', () => {
    const text = 'aé'; // a, e, combining acute
    expect(previousGraphemeBoundary(text, text.length)).toBe(1);
  });

  it('keeps a ZWJ sequence together', () => {
    const family = '\u{1F468}‍\u{1F469}‍\u{1F467}';
    const text = `a${family}`;
    expect(previousGraphemeBoundary(text, text.length)).toBe(1);
  });

  it('keeps an emoji with its skin tone', () => {
    const text = 'a\u{1F44D}\u{1F3FD}';
    expect(previousGraphemeBoundary(text, text.length)).toBe(1);
  });

  it('keeps a flag together', () => {
    const text = 'a\u{1F1EC}\u{1F1E7}';
    expect(previousGraphemeBoundary(text, text.length)).toBe(1);
  });

  it('steps over a mixed run one cluster at a time', () => {
    const text = 'a\u{1F44D}b';
    expect(previousGraphemeBoundary(text, text.length, 1)).toBe(3);
    expect(previousGraphemeBoundary(text, text.length, 2)).toBe(1);
    expect(previousGraphemeBoundary(text, text.length, 3)).toBe(0);
  });
});

/**
 * The path that runs where `Intl.Segmenter` is missing, which is the half most likely to
 * be wrong and the half no ordinary run exercises. The module caches its segmenter on
 * first use, so the import has to happen after the stub is in place.
 */
describe('without Intl.Segmenter', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  async function fallback() {
    vi.resetModules();
    vi.stubGlobal('Intl', { ...Intl, Segmenter: undefined });
    return import('./graphemes.js');
  }

  it('is not secretly still using the segmenter', async () => {
    const { previousGraphemeBoundary: step } = await fallback();
    expect(typeof Intl.Segmenter).toBe('undefined');
    expect(step('abc', 3)).toBe(2);
  });

  it('keeps a surrogate pair together', async () => {
    const { previousGraphemeBoundary: step } = await fallback();
    expect(step('a\u{1F44D}', 3)).toBe(1);
  });

  it('keeps a combining mark with its base', async () => {
    const { previousGraphemeBoundary: step } = await fallback();
    expect(step('aé', 3)).toBe(1);
  });

  it('keeps a ZWJ sequence together', async () => {
    const { previousGraphemeBoundary: step } = await fallback();
    const text = 'a\u{1F468}‍\u{1F469}‍\u{1F467}';
    expect(step(text, text.length)).toBe(1);
  });

  it('keeps an emoji with its skin tone', async () => {
    const { previousGraphemeBoundary: step } = await fallback();
    const text = 'a\u{1F44D}\u{1F3FD}';
    expect(step(text, text.length)).toBe(1);
  });

  it('keeps a flag together', async () => {
    const { previousGraphemeBoundary: step } = await fallback();
    const text = 'a\u{1F1EC}\u{1F1E7}';
    expect(step(text, text.length)).toBe(1);
  });

  it('steps over a mixed run one cluster at a time', async () => {
    const { previousGraphemeBoundary: step } = await fallback();
    const text = 'a\u{1F44D}b';
    expect(step(text, text.length, 1)).toBe(3);
    expect(step(text, text.length, 2)).toBe(1);
    expect(step(text, text.length, 3)).toBe(0);
  });

  it('counts clusters rather than code units', async () => {
    const { graphemeLength: count } = await fallback();
    expect(count('a\u{1F44D}b')).toBe(3);
    expect(count('\u{1F468}‍\u{1F469}‍\u{1F467}')).toBe(1);
  });
});

describe('graphemeLength', () => {
  it('counts what a reader would count, not code units', () => {
    expect(graphemeLength('')).toBe(0);
    expect(graphemeLength('abc')).toBe(3);
    expect(graphemeLength('\u{1F44D}')).toBe(1);
    expect(graphemeLength('\u{1F468}‍\u{1F469}‍\u{1F467}')).toBe(1);
    expect(graphemeLength('é')).toBe(1);
  });
});
