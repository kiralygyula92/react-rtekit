/**
 * Design tokens.
 *
 * Every token maps 1:1 to a `--rte-*` custom property. Theme CSS reads only these
 * variables, so a theme is fully describable as data and reachable from the theme
 * editor — which is the acceptance test for token coverage.
 *
 * @group Theming
 */

/** A CSS length, colour, shadow or keyword, written exactly as it appears in CSS. */
export type TokenValue = string;

/** Layout density; scales button size, paddings and min-height. */
export type Density = 'compact' | 'standard' | 'comfortable';

/** The token tree. Every field is optional in overrides via `DeepPartial`. */
export interface RteTheme {
  /** Identifies the theme in `data-theme` and in the docs site. */
  name: string;
  /** The chrome’s typography, which is separate from the content’s. */
  font: {
    family: TokenValue;
    size: TokenValue;
    sizeSm: TokenValue;
    lineHeight: TokenValue;
  };
  /** The palette every other group draws from. */
  color: {
    surface: TokenValue;
    surfaceMuted: TokenValue;
    surfaceRaised: TokenValue;
    text: TokenValue;
    textMuted: TokenValue;
    textDisabled: TokenValue;
    placeholder: TokenValue;
    border: TokenValue;
    borderSubtle: TokenValue;
    accent: TokenValue;
    accentSoft: TokenValue;
    accentBorder: TokenValue;
    accentContrast: TokenValue;
    danger: TokenValue;
    success: TokenValue;
    warning: TokenValue;
  };
  /** The content box: its size, its border and its focus ring. */
  editor: {
    minHeight: TokenValue;
    maxHeight: TokenValue;
    padding: TokenValue;
    radius: TokenValue;
    borderWidth: TokenValue;
    borderColor: TokenValue;
    /** An inset ring, so focus never shifts the content (fixes R10). */
    focusRing: TokenValue;
    invalidBorderColor: TokenValue;
    background: TokenValue;
    disabledBackground: TokenValue;
  };
  /** The toolbar strip. */
  toolbar: {
    background: TokenValue;
    border: TokenValue;
    padding: TokenValue;
    gap: TokenValue;
    marginBottom: TokenValue;
    radius: TokenValue;
    separatorColor: TokenValue;
    separatorMargin: TokenValue;
  };
  /** Toolbar controls, in each of their states. */
  button: {
    size: TokenValue;
    padding: TokenValue;
    radius: TokenValue;
    iconSize: TokenValue;
    color: TokenValue;
    activeColor: TokenValue;
    activeBg: TokenValue;
    hoverBg: TokenValue;
    disabledColor: TokenValue;
    focusRing: TokenValue;
  };
  /** Every floating surface. */
  popover: {
    bg: TokenValue;
    border: TokenValue;
    radius: TokenValue;
    shadow: TokenValue;
    padding: TokenValue;
  };
  /** Menu rows. */
  menu: {
    itemHeight: TokenValue;
    itemHoverBg: TokenValue;
    itemActiveBg: TokenValue;
    itemPadding: TokenValue;
  };
  /** The swatch grid. */
  colorPicker: {
    swatchSize: TokenValue;
    gap: TokenValue;
    radius: TokenValue;
    borderColor: TokenValue;
    selectedRing: TokenValue;
  };
  /** The row below the content holding the helper text and the counter. */
  footer: { gap: TokenValue; padding: TokenValue };
  /** The helper text. */
  helper: { color: TokenValue };
  /** The counter, in each of its three states. */
  counter: { color: TokenValue; warnColor: TokenValue; overColor: TokenValue };
  /** Merge-tag chips inside the content. */
  mergeTag: {
    bg: TokenValue;
    color: TokenValue;
    border: TokenValue;
    radius: TokenValue;
    padding: TokenValue;
    selectedBg: TokenValue;
  };
  /** Mention chips inside the content. */
  mention: { bg: TokenValue; color: TokenValue; radius: TokenValue; padding: TokenValue };
  /** The selection highlight. */
  selection: { bg: TokenValue };
  /** Search-match highlights, current and otherwise. */
  findMatch: { bg: TokenValue; activeBg: TokenValue };
  /** Prose styles, shipped separately so stored content renders identically anywhere. */
  content: {
    fontFamily: TokenValue;
    fontSize: TokenValue;
    lineHeight: TokenValue;
    color: TokenValue;
    paragraphSpacing: TokenValue;
    /** `--rte-h1-size` … `--rte-h6-size`, in order. */
    headingScale: readonly [TokenValue, TokenValue, TokenValue, TokenValue, TokenValue, TokenValue];
    headingWeight: TokenValue;
    /** The weight a bold mark renders at. */
    boldWeight: TokenValue;
    listIndent: TokenValue;
    listItemPadding: TokenValue;
    indentStep: TokenValue;
    linkColor: TokenValue;
    linkDecoration: TokenValue;
    quoteBorder: TokenValue;
    quotePadding: TokenValue;
    codeBg: TokenValue;
    codeColor: TokenValue;
    codeFont: TokenValue;
    tableBorder: TokenValue;
    tableHeaderBg: TokenValue;
    cellPadding: TokenValue;
    hrColor: TokenValue;
  };
  /** Transition timing, which `prefers-reduced-motion` overrides to none. */
  motion: { duration: TokenValue; easing: TokenValue };
  /** Stacking, so the editor can sit inside an application’s own layers. */
  z: { floating: TokenValue; popover: TokenValue; fullscreen: TokenValue };
  /** A multiplier over sizes and paddings, so it composes with any theme. */
  density: Density;
}

/** A theme with every token resolved, plus the prop defaults it carries. */
export interface ResolvedRteTheme extends RteTheme {
  /** Prop defaults the theme implies, e.g. `classic`'s toolbar and palette. */
  defaults?: Record<string, unknown>;
  /** Flattens the tree into `{ '--rte-color-text': '#212121', … }`. */
  toCssVars(): Record<string, string>;
}

/** `colorScheme` prop. `'auto'` follows `prefers-color-scheme`. */
export type ColorScheme = 'light' | 'dark' | 'auto';
