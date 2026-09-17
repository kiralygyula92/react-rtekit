/**
 * Colour helpers.
 *
 * Colours arrive in every shape a CSS author can produce — `#RGB`, `#RRGGBB`,
 * `rgb()`, a keyword — and leave as one canonical form, so `#FF0000` and
 * `rgb(255, 0, 0)` compare equal in the toolbar's active state.
 *
 * @module
 */

/** CSS keywords that mean "no colour" and should clear the mark rather than set one. */
const NEUTRAL = new Set(['inherit', 'initial', 'unset', 'revert', 'currentcolor', 'auto', 'windowtext', 'transparent']);

const NAMED: Record<string, string> = {
  black: '#000000',
  white: '#ffffff',
  red: '#ff0000',
  lime: '#00ff00',
  blue: '#0000ff',
  yellow: '#ffff00',
  magenta: '#ff00ff',
  fuchsia: '#ff00ff',
  cyan: '#00ffff',
  aqua: '#00ffff',
  maroon: '#800000',
  green: '#008000',
  navy: '#000080',
  olive: '#808000',
  purple: '#800080',
  teal: '#008080',
  silver: '#c0c0c0',
  gray: '#808080',
  grey: '#808080',
  orange: '#ffa500',
  pink: '#ffc0cb',
  brown: '#a52a2a',
  gold: '#ffd700',
};

function toHex(value: number): string {
  return Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0');
}

/**
 * Normalizes a CSS colour to lower-case `#rrggbb`.
 *
 * Returns `null` for a missing value or one that means "no colour", which is what makes
 * the picker's Reset remove the format instead of forcing black (fixes R14).
 *
 * @example
 * ```ts
 * normalizeColor('#F00');            // '#ff0000'
 * normalizeColor('rgb(255, 0, 0)');  // '#ff0000'
 * normalizeColor('inherit');         // null
 * ```
 */
export function normalizeColor(input: string | null | undefined): string | null {
  if (!input) return null;
  const value = input.trim().toLowerCase();
  if (value === '' || NEUTRAL.has(value)) return null;

  if (value.startsWith('#')) {
    const hex = value.slice(1);
    if (/^[0-9a-f]{3}$/.test(hex)) return `#${hex[0]!}${hex[0]!}${hex[1]!}${hex[1]!}${hex[2]!}${hex[2]!}`;
    if (/^[0-9a-f]{4}$/.test(hex)) return `#${hex[0]!}${hex[0]!}${hex[1]!}${hex[1]!}${hex[2]!}${hex[2]!}`;
    if (/^[0-9a-f]{6}$/.test(hex)) return `#${hex}`;
    if (/^[0-9a-f]{8}$/.test(hex)) return `#${hex.slice(0, 6)}`;
    return null;
  }

  const rgb = /^rgba?\(\s*([\d.]+%?)[\s,]+([\d.]+%?)[\s,]+([\d.]+%?)/.exec(value);
  if (rgb) {
    const channel = (raw: string): number =>
      raw.endsWith('%') ? (Number.parseFloat(raw) / 100) * 255 : Number.parseFloat(raw);
    return `#${toHex(channel(rgb[1]!))}${toHex(channel(rgb[2]!))}${toHex(channel(rgb[3]!))}`;
  }

  return NAMED[value] ?? null;
}

/** Relative luminance, per WCAG 2.1. */
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255);
  const linear = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]!;
}

/**
 * Contrast ratio between two colours, 1–21.
 *
 * Used by the theme editor's AA badge and by the theming tests (07 §8).
 *
 * @example
 * ```ts
 * contrastRatio('#212121', '#ffffff'); // 15.9…
 * ```
 */
export function contrastRatio(a: string, b: string): number {
  const first = normalizeColor(a);
  const second = normalizeColor(b);
  if (!first || !second) return 1;
  const la = luminance(first);
  const lb = luminance(second);
  const [high, low] = la > lb ? [la, lb] : [lb, la];
  return (high + 0.05) / (low + 0.05);
}

/** True when the pair meets WCAG AA for the given text size. */
export function meetsContrastAA(foreground: string, background: string, largeText = false): boolean {
  return contrastRatio(foreground, background) >= (largeText ? 3 : 4.5);
}
