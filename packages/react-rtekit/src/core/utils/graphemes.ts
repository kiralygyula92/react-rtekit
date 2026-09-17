/**
 * Grapheme-cluster arithmetic, so "one character" means what a reader means by it.
 *
 * A user pressing Backspace once expects one *thing* to disappear. In UTF-16 that thing
 * can be one code unit (`a`), two (an emoji in the astral planes), or a dozen — a family
 * emoji is several emoji joined by zero-width joiners, and `é` may be `e` followed by a
 * combining acute. Deleting a code unit at a time splits those and leaves debris.
 *
 * The engines get this right by asking the browser: Lexical's `deleteCharacter` calls
 * `Selection.modify('extend', 'backward', 'character')` and lets the DOM decide. That
 * works in a browser and only in a browser — jsdom has no `Selection.modify` at all, so
 * every caller of it is untestable outside the Playwright matrix — and it makes the
 * behaviour the browser's rather than ours, which is the same class of inconsistency
 * this library exists to hide.
 *
 * `Intl.Segmenter` is the same Unicode algorithm, available to us directly, in Node and
 * in every current browser. Where it is missing, the fallback below keeps surrogate
 * pairs and combining marks together, which covers the cases that actually produce
 * visible damage.
 *
 * @module
 */

/** Lazily constructed: `Intl.Segmenter` is not free to build, and this runs per keystroke. */
let segmenter: Intl.Segmenter | undefined;
let segmenterChecked = false;

function graphemeSegmenter(): Intl.Segmenter | undefined {
  if (!segmenterChecked) {
    segmenterChecked = true;
    // The locale does not affect grapheme segmentation, which is locale-independent in
    // UAX #29; `undefined` takes the host's and avoids a needless assumption.
    segmenter =
      typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function'
        ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
        : undefined;
  }
  return segmenter;
}

/** True for the low half of a surrogate pair, whose high half must go with it. */
const isLowSurrogate = (code: number): boolean => code >= 0xdc00 && code <= 0xdfff;
const isHighSurrogate = (code: number): boolean => code >= 0xd800 && code <= 0xdbff;

/** The offset where the code point ending at `at` begins — one step, pair-aware. */
function startOfPreviousCodePoint(text: string, at: number): number {
  if (at <= 0) return 0;
  const before = at - 1;
  if (
    before > 0 &&
    isLowSurrogate(text.charCodeAt(before)) &&
    isHighSurrogate(text.charCodeAt(before - 1))
  ) {
    return before - 1;
  }
  return before;
}

/** Regional indicators, which come in pairs and spell a flag. */
const isRegionalIndicator = (code: number | undefined): boolean =>
  code !== undefined && code >= 0x1f1e6 && code <= 0x1f1ff;

/**
 * Combining marks, variation selectors and the zero-width joiner.
 *
 * Not the whole of Unicode's `Grapheme_Extend`, which is what `Intl.Segmenter` applies —
 * this is the fallback, and these are the ranges whose mishandling is visible: an accent
 * detached from its letter, half an emoji, a skin tone left behind.
 */
function isExtending(text: string, index: number): boolean {
  const code = text.codePointAt(index);
  if (code === undefined) return false;
  return (
    (code >= 0x0300 && code <= 0x036f) || // combining diacritical marks
    (code >= 0x1ab0 && code <= 0x1aff) || // combining diacritical marks extended
    (code >= 0x1dc0 && code <= 0x1dff) || // combining diacritical marks supplement
    (code >= 0x20d0 && code <= 0x20ff) || // combining marks for symbols
    (code >= 0xfe00 && code <= 0xfe0f) || // variation selectors
    (code >= 0xfe20 && code <= 0xfe2f) || // combining half marks
    code === 0x200d || // zero-width joiner
    (code >= 0x1f3fb && code <= 0x1f3ff) // emoji skin tone modifiers
  );
}

/**
 * The offset `count` grapheme clusters before `offset` in `text`.
 *
 * Clamped to 0, so asking to step back further than the string allows returns the start
 * rather than a negative index.
 *
 * @param text the whole string the offset indexes into
 * @param offset a UTF-16 offset into `text`, where the caret is
 * @param count how many grapheme clusters to step back @default 1
 * @returns a UTF-16 offset at or before `offset`
 *
 * @example
 * ```ts
 * previousGraphemeBoundary('abc', 3, 2);       // 1
 * previousGraphemeBoundary('a👨‍👩‍👧b', 12, 1);   // 1 — the whole family, not a fragment
 * ```
 */
export function previousGraphemeBoundary(text: string, offset: number, count = 1): number {
  if (count <= 0) return Math.max(0, Math.min(offset, text.length));
  let at = Math.max(0, Math.min(offset, text.length));
  if (at === 0) return 0;

  const segments = graphemeSegmenter();
  if (segments !== undefined) {
    // Boundaries of the text *before* the caret. Segmenting only that prefix is both
    // cheaper and correct: a cluster cannot start before the caret and end after it
    // without the caret having been placed inside a cluster, which no engine does.
    const boundaries = [0];
    for (const segment of segments.segment(text.slice(0, at))) {
      if (segment.index > 0) boundaries.push(segment.index);
    }
    const target = boundaries.length - count;
    return target <= 0 ? 0 : boundaries[target]!;
  }

  for (let step = 0; step < count && at > 0; step += 1) at = previousClusterStart(text, at);
  return at;
}

/**
 * One cluster back, without `Intl.Segmenter`.
 *
 * Three things bind leftwards and each needs its own pass: extenders (combining marks,
 * variation selectors, skin tones) sit *after* their base; a ZWJ joins whole emoji into
 * one, and a chain of them can be arbitrarily long; and regional indicators pair up into
 * a flag. Handling only the first is what left `👨‍👩‍👧` deleting one person at a time.
 */
function previousClusterStart(text: string, offset: number): number {
  let at = startOfPreviousCodePoint(text, offset);

  // Extenders attach to whatever precedes them.
  while (at > 0 && isExtending(text, at)) at = startOfPreviousCodePoint(text, at);

  // A ZWJ immediately before means this is one link of a joined sequence: take the
  // joiner and the base in front of it, then its extenders, and look again.
  for (;;) {
    if (at === 0) break;
    const joiner = startOfPreviousCodePoint(text, at);
    if (text.codePointAt(joiner) !== 0x200d || joiner === 0) break;
    at = startOfPreviousCodePoint(text, joiner);
    while (at > 0 && isExtending(text, at)) at = startOfPreviousCodePoint(text, at);
  }

  // A flag is exactly two regional indicators, so pair them and stop.
  if (at > 0 && isRegionalIndicator(text.codePointAt(at))) {
    const before = startOfPreviousCodePoint(text, at);
    if (isRegionalIndicator(text.codePointAt(before))) at = before;
  }

  return at;
}

/**
 * How many grapheme clusters `text` contains.
 *
 * What a character counter should report, and what `text.length` does not: `'👍'.length`
 * is 2 and `'👨‍👩‍👧'.length` is 8.
 */
export function graphemeLength(text: string): number {
  if (text === '') return 0;
  const segments = graphemeSegmenter();
  if (segments !== undefined) {
    let count = 0;
    for (const _segment of segments.segment(text)) count += 1;
    return count;
  }
  let count = 0;
  let at = text.length;
  while (at > 0) {
    at = previousGraphemeBoundary(text, at, 1);
    count += 1;
  }
  return count;
}
