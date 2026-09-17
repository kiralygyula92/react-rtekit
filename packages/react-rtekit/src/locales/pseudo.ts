import type { LocalizedString, RteLocalization } from '../types/localization.js';
import { en } from './en.js';

/**
 * The pseudo-locale (09 §2).
 *
 * Every string is accented and padded by 30%, which surfaces two classes of bug that
 * no amount of reading finds: a string that was never routed through `localization`
 * comes out plain, and a layout that only fits English breaks visibly.
 *
 * It is a testing tool, not a shipped locale, but it lives here because it has to
 * stay in step with the catalogue it mirrors.
 *
 * @group Localization
 */

/** Latin letters and their accented stand-ins. */
const ACCENTS: Record<string, string> = {
  a: 'á',
  b: 'ƀ',
  c: 'ç',
  d: 'ð',
  e: 'é',
  f: 'ƒ',
  g: 'ĝ',
  h: 'ĥ',
  i: 'í',
  j: 'ĵ',
  k: 'ķ',
  l: 'ł',
  m: 'ɱ',
  n: 'ñ',
  o: 'ó',
  p: 'þ',
  q: 'ɋ',
  r: 'ŕ',
  s: 'š',
  t: 'ţ',
  u: 'ú',
  v: 'ṽ',
  w: 'ŵ',
  x: 'ẋ',
  y: 'ý',
  z: 'ž',
  A: 'Á',
  B: 'Ɓ',
  C: 'Ç',
  D: 'Ð',
  E: 'É',
  F: 'Ƒ',
  G: 'Ĝ',
  H: 'Ĥ',
  I: 'Í',
  J: 'Ĵ',
  K: 'Ķ',
  L: 'Ł',
  M: 'Ϻ',
  N: 'Ñ',
  O: 'Ó',
  P: 'Þ',
  Q: 'Ɋ',
  R: 'Ŕ',
  S: 'Š',
  T: 'Ţ',
  U: 'Ú',
  V: 'Ṽ',
  W: 'Ŵ',
  X: 'Ẋ',
  Y: 'Ý',
  Z: 'Ž',
};

/** Padding, so a layout that only fits English shows it. */
const PAD = '··';

/**
 * Accents and pads one string.
 *
 * Interpolated values are left alone — `{count}` has to survive, and so does anything
 * the caller substitutes in.
 */
export function pseudoize(value: string): string {
  const accented = value.replace(/[A-Za-z]/g, (character) => ACCENTS[character] ?? character);
  return `⟦${accented}${PAD}⟧`;
}

/** Wraps a catalogue entry, whether it is a string or a function. */
function wrap(value: LocalizedString): LocalizedString {
  if (typeof value === 'function') {
    return (values) => pseudoize(value(values));
  }
  return pseudoize(value);
}

/** Recursively pseudo-localizes a catalogue section. */
function wrapSection<T extends Record<string, unknown>>(section: T): T {
  return Object.fromEntries(
    Object.entries(section).map(([key, value]) => [
      key,
      typeof value === 'object' && value !== null
        ? wrapSection(value as Record<string, unknown>)
        : wrap(value as LocalizedString),
    ]),
  ) as T;
}

/**
 * English, accented and padded.
 *
 * @example
 * ```tsx
 * <RichTextEditor localization={pseudo} />
 * ```
 */
export const pseudo: RteLocalization = {
  ...wrapSection(en as unknown as Record<string, unknown>),
  // These two are configuration rather than copy, so they stay readable.
  locale: 'en-XA',
  dir: 'ltr',
  custom: {},
} as RteLocalization;

export default pseudo;
