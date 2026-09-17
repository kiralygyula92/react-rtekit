import type { DeepPartial } from '../types/common.js';
import type { ResolvedRteTheme, RteTheme } from '../types/theme.js';
import { CLASSIC_COLORS, CLASSIC_TOOLBAR } from '../core/classic-parity.js';
import { themeToCssVars } from './css-vars.js';

// One mapping table, shared by `theme.toCssVars()` and the React tree.
export { themeToCssVars } from './css-vars.js';

/**
 * The shipped themes.
 *
 * Every visual the library has is one of these tokens, which is what makes the theme
 * editor's list exhaustive and the `classic` parity guarantee checkable.
 *
 * @module
 */

/**
 * Deep-merges theme fragments onto a base.
 *
 * Plain nested records, so one generic walk covers every level; the casts only restate
 * that for the type checker.
 */
function merge<T extends object>(base: T, override: DeepPartial<T> | undefined): T {
  if (!override) return base;
  const result = { ...base } as Record<string, unknown>;
  for (const [key, value] of Object.entries(override) as [string, unknown][]) {
    if (value === undefined) continue;
    const existing = result[key];
    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      existing !== null &&
      typeof existing === 'object' &&
      !Array.isArray(existing)
    ) {
      result[key] = merge(existing, value);
    } else {
      result[key] = value;
    }
  }
  return result as T;
}

/** Attaches `toCssVars` so a theme can be written out for SSR or static use. */
function resolve(theme: RteTheme & { defaults?: Record<string, unknown> }): ResolvedRteTheme {
  return {
    ...theme,
    toCssVars: () => themeToCssVars(theme),
  };
}

/**
 * The default theme.
 *
 * Subtle toolbar hover states, a visible placeholder, paragraph spacing — the modern
 * look, as opposed to `classic`'s reproduction of the old editor.
 */
export const lightTheme: ResolvedRteTheme = /* @__PURE__ */ resolve({
  name: 'light',
  font: { family: 'inherit', size: '14px', sizeSm: '12px', lineHeight: '1.5' },
  color: {
    surface: '#FFFFFF',
    surfaceMuted: '#FAFAFA',
    surfaceRaised: '#FFFFFF',
    text: '#212121',
    // Every token below that is rendered as text meets AA against *both* surfaces —
    // #FAFAFA, not just #FFFFFF, since the toolbar and the footer sit on the muted one
    // and a ratio measured against white alone is optimistic by about 4%.
    textMuted: '#667085',
    textDisabled: '#A4A7AE',
    // Placeholder text has to meet AA against the surface: #A4A7AE is 2.4:1, this is
    // 4.8:1. The inactive *icon* colour stays #A4A7AE, which classic parity freezes.
    placeholder: '#667085',
    border: '#D5D7DA',
    borderSubtle: '#E9EAEB',
    // A solid button puts #FFFFFF on this, so it is the text contrast that sets the
    // shade: the brighter #2196F3 is 3.1:1, which is a UI-component ratio rather than
    // a text one. `classic` keeps #2196F3, because its accent is a parity value used
    // for a border and a focus ring.
    accent: '#1976D2',
    accentSoft: '#1976D21A',
    accentBorder: '#1976D280',
    accentContrast: '#FFFFFF',
    danger: '#D92D20',
    success: '#067647',
    warning: '#B54708',
  },
  editor: {
    minHeight: '287px',
    maxHeight: 'none',
    padding: '12px',
    radius: '4px',
    borderWidth: '1px',
    borderColor: 'var(--rte-color-border)',
    focusRing: 'inset 0 0 0 2px var(--rte-color-accent)',
    invalidBorderColor: 'var(--rte-color-danger)',
    background: 'var(--rte-color-surface)',
    disabledBackground: '#FAFAFA',
  },
  toolbar: {
    background: 'transparent',
    border: 'none',
    padding: '0',
    gap: '0px',
    marginBottom: '8px',
    radius: '4px',
    separatorColor: 'var(--rte-color-border-subtle)',
    separatorMargin: '4px',
  },
  button: {
    size: '40px',
    padding: '8px',
    radius: '4px',
    iconSize: '24px',
    color: '#A4A7AE',
    activeColor: 'var(--rte-color-text)',
    activeBg: 'transparent',
    hoverBg: 'rgb(0 0 0 / 4%)',
    disabledColor: 'var(--rte-color-text-disabled)',
    focusRing: '0 0 0 2px var(--rte-color-accent-border)',
  },
  popover: {
    bg: 'var(--rte-color-surface-raised)',
    border: '1px solid var(--rte-color-border)',
    radius: '4px',
    shadow: '0 4px 12px rgb(0 0 0 / 12%)',
    padding: '16px',
  },
  menu: {
    itemHeight: '32px',
    itemHoverBg: 'rgb(0 0 0 / 4%)',
    itemActiveBg: 'var(--rte-color-accent-soft)',
    itemPadding: '0 12px',
  },
  colorPicker: {
    swatchSize: '24px',
    gap: '4px',
    radius: '4px',
    borderColor: 'var(--rte-color-border)',
    selectedRing: '0 0 0 2px var(--rte-color-accent)',
  },
  footer: { gap: '8px', padding: '4px 0 0' },
  helper: { color: 'var(--rte-color-text-muted)' },
  counter: {
    color: 'var(--rte-color-text-muted)',
    warnColor: 'var(--rte-color-warning)',
    overColor: 'var(--rte-color-danger)',
  },
  mergeTag: {
    bg: '#EAF6FF',
    color: '#175CD3',
    border: '1px solid #B2DDFF',
    radius: '4px',
    padding: '1px 4px',
    selectedBg: '#B2DDFF',
  },
  mention: { bg: '#F3E8FF', color: '#6941C6', radius: '4px', padding: '1px 4px' },
  selection: { bg: '#B2DDFF' },
  findMatch: { bg: '#FFF3A3', activeBg: '#FFC0CB' },
  content: {
    fontFamily: 'inherit',
    fontSize: '14px',
    lineHeight: '1.5',
    color: 'var(--rte-color-text)',
    paragraphSpacing: '0.5em',
    headingScale: ['2em', '1.5em', '1.17em', '1em', '0.83em', '0.67em'],
    headingWeight: '600',
    listIndent: '1.5em',
    listItemPadding: '0.5em',
    indentStep: '2em',
    linkColor: 'var(--rte-color-accent)',
    linkDecoration: 'underline',
    quoteBorder: '3px solid var(--rte-color-border)',
    quotePadding: '12px',
    codeBg: '#F5F5F5',
    codeColor: '#B91C1C',
    codeFont: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    tableBorder: '1px solid var(--rte-color-border-subtle)',
    tableHeaderBg: '#FAFAFA',
    cellPadding: '6px 8px',
    hrColor: 'var(--rte-color-border-subtle)',
  },
  motion: { duration: '150ms', easing: 'cubic-bezier(0.2, 0, 0, 1)' },
  z: { popover: '1300', fullscreen: '1400' },
  density: 'standard',
});

/**
 * Merges overrides onto a base theme.
 *
 * @example
 * ```ts
 * const brand = createTheme(classicTheme, { color: { accent: '#7C3AED' } });
 * ```
 */
export function createTheme(
  base: ResolvedRteTheme | RteTheme,
  ...overrides: DeepPartial<RteTheme>[]
): ResolvedRteTheme {
  let result = base as RteTheme & { defaults?: Record<string, unknown> };
  // Each override is a fragment; merging onto a complete base keeps the result complete.
  for (const override of overrides) {
    result = merge(result, override) as RteTheme & { defaults?: Record<string, unknown> };
  }
  return resolve(result);
}

/**
 * 1:1 parity with the legacy editor.
 *
 * **These values are frozen.** The parity guarantee is part of the versioning contract:
 * changing one is a major release. Other presets may move in a minor.
 *
 * Deliberate deviations, documented on the parity page:
 * the focus ring replaces the 1px→2px border swap so focusing shifts nothing (R10),
 * colour Reset clears the format instead of writing `#000000` (R14), swatches are
 * focusable buttons (R15), the toolbar is a real ARIA toolbar (R16), the icons are
 * in-house at the same size and colour, and there is now a placeholder (R24).
 */
export const classicTheme: ResolvedRteTheme = /* @__PURE__ */ createTheme(lightTheme, {
  name: 'classic',
  font: {
    family: '"Open Sans Variable", "Open Sans", Arial, sans-serif',
    size: '14px',
    lineHeight: '1.5',
  },
  color: {
    text: '#212121',
    border: '#D5D7DA',
    borderSubtle: '#E9EAEB',
    accent: '#2196F3',
    // The one deliberate deviation from the reference palette. #F04438 is 3.8:1 on white,
    // which is fine for the 1px invalid border below — a UI component needs 3:1 — and
    // fails for the error text that sits under the field. The border keeps the parity
    // value; the text gets a shade that can actually be read.
    danger: '#D92D20',
    // A solid button on the classic accent needs a dark label; white on #2196F3 is
    // 3.1:1. The classic chrome has no solid button of its own, but a link popover
    // added to a classic editor does.
    accentContrast: '#06121F',
  },
  editor: {
    minHeight: '287px',
    padding: '12px',
    radius: '4px',
    borderWidth: '1px',
    focusRing: 'inset 0 0 0 2px #2196F3',
    invalidBorderColor: '#F04438',
  },
  toolbar: {
    background: 'transparent',
    border: 'none',
    padding: '0',
    gap: '0px',
    marginBottom: '8px',
    separatorMargin: '4px',
  },
  button: {
    size: '40px',
    padding: '8px',
    iconSize: '24px',
    color: '#A4A7AE',
    activeColor: '#212121',
    activeBg: 'transparent',
    hoverBg: 'rgb(0 0 0 / 4%)',
  },
  popover: { bg: '#FFFFFF', border: '1px solid #D5D7DA', radius: '4px', padding: '16px' },
  colorPicker: { swatchSize: '24px', gap: '4px', radius: '4px', borderColor: '#D5D7DA' },
  content: {
    fontSize: '14px',
    lineHeight: '1.5',
    // Quill puts no margin on paragraphs; matching it is part of the 1:1 requirement.
    paragraphSpacing: '0',
    listIndent: '1.5em',
    listItemPadding: '0.5em',
    // Quill's `ql-indent-N` step is 3em, so imported indents land where they were.
    indentStep: '3em',
  },
});

/** The prop defaults the `classic` theme implies. */
export const classicDefaults = {
  preset: 'classic' as const,
  minHeight: 287,
  toolbar: CLASSIC_TOOLBAR,
  colors: {
    palette: CLASSIC_COLORS,
    allowCustom: true,
    allowClear: true,
    columns: 7,
  },
  htmlProfile: 'quill-compatible' as const,
  sanitize: 'standard' as const,
  placeholder: '',
  showCounter: false,
};

/** The dark theme. Contrast pairs are AA-verified against text and surface. */
export const darkTheme: ResolvedRteTheme = /* @__PURE__ */ createTheme(lightTheme, {
  name: 'dark',
  color: {
    surface: '#0F1115',
    surfaceMuted: '#12151B',
    surfaceRaised: '#161A20',
    text: '#E6E8EB',
    textMuted: '#9AA1AC',
    textDisabled: '#5B626C',
    // 3.9:1 against the muted surface before; 5.4:1 now.
    placeholder: '#858C99',
    border: '#262B33',
    borderSubtle: '#1D222A',
    accent: '#4DA3FF',
    accentSoft: '#4DA3FF26',
    accentBorder: '#4DA3FF80',
    accentContrast: '#06121F',
    danger: '#FF6B5E',
    success: '#3CCB8B',
    warning: '#FFB547',
  },
  editor: { disabledBackground: '#12151B' },
  button: { color: '#9AA1AC', hoverBg: 'rgb(255 255 255 / 6%)' },
  menu: { itemHoverBg: 'rgb(255 255 255 / 6%)' },
  popover: { shadow: '0 4px 16px rgb(0 0 0 / 48%)' },
  mergeTag: {
    bg: '#13263B',
    color: '#8FC6FF',
    border: '1px solid #1E4066',
    selectedBg: '#1E4066',
  },
  mention: { bg: '#241B38', color: '#C4A8FF' },
  selection: { bg: '#1E4066' },
  findMatch: { bg: '#4D4318', activeBg: '#6B3A44' },
  content: { codeBg: '#161A20', codeColor: '#FF9D8A', tableHeaderBg: '#161A20' },
});

/** A denser theme: 32px buttons, 20px icons, a 160px minimum. */
export const compactTheme: ResolvedRteTheme = /* @__PURE__ */ createTheme(lightTheme, {
  name: 'compact',
  density: 'compact',
  button: { size: '32px', iconSize: '20px', padding: '6px' },
  editor: { minHeight: '160px', padding: '8px' },
  toolbar: { marginBottom: '6px' },
});

/** Toolbar and content share one bounding box, and the toolbar sticks. */
export const borderedTheme: ResolvedRteTheme = /* @__PURE__ */ createTheme(lightTheme, {
  name: 'bordered',
  toolbar: {
    background: 'var(--rte-color-surface-muted)',
    border: '1px solid var(--rte-color-border)',
    padding: '4px',
    marginBottom: '0',
    radius: '4px 4px 0 0',
  },
  editor: { radius: '0 0 4px 4px' },
});

/** Every shipped theme, keyed by name. */
export const themes = {
  light: lightTheme,
  classic: classicTheme,
  dark: darkTheme,
  compact: compactTheme,
  bordered: borderedTheme,
} satisfies Record<string, ResolvedRteTheme>;
