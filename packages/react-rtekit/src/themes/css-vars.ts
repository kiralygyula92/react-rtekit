import type { DeepPartial } from '../types/common.js';
import type { RteTheme } from '../types/theme.js';

/**
 * Theme token → CSS custom property.
 *
 * The mapping is not a mechanical kebab-case of the token path. The stylesheet names
 * tokens by what they *style* (`--rte-border-width`, `--rte-content-padding`), while
 * the theme groups them by what owns them (`editor.borderWidth`, `editor.padding`),
 * and this map is the contract between the two. A generic flatten produces
 * `--rte-editor-border-width`, which no rule reads, so the token silently does
 * nothing — the whole theme looks applied and none of it is.
 *
 * `themes.test.ts` asserts that every variable the stylesheets read is produced here,
 * which is what keeps the two from drifting again.
 *
 * @module
 */

/** Token paths whose CSS variable is not the kebab-cased path. */
const EXPLICIT: Readonly<Record<string, string>> = {
  'font.lineHeight': '--rte-line-height',

  'editor.minHeight': '--rte-min-height',
  'editor.maxHeight': '--rte-max-height',
  'editor.padding': '--rte-content-padding',
  'editor.radius': '--rte-radius',
  'editor.borderWidth': '--rte-border-width',
  'editor.borderColor': '--rte-border-color',
  'editor.focusRing': '--rte-focus-ring',
  'editor.invalidBorderColor': '--rte-invalid-border-color',
  'editor.background': '--rte-editor-bg',
  'editor.disabledBackground': '--rte-disabled-bg',

  'toolbar.background': '--rte-toolbar-bg',
  'toolbar.separatorColor': '--rte-toolbar-separator',

  'button.iconSize': '--rte-icon-size',

  'colorPicker.swatchSize': '--rte-swatch-size',
  'colorPicker.gap': '--rte-swatch-gap',
  'colorPicker.radius': '--rte-swatch-radius',
  'colorPicker.borderColor': '--rte-swatch-border-color',
  'colorPicker.selectedRing': '--rte-swatch-selected-ring',

  'mergeTag.bg': '--rte-mergetag-bg',
  'mergeTag.color': '--rte-mergetag-color',
  'mergeTag.border': '--rte-mergetag-border',
  'mergeTag.radius': '--rte-mergetag-radius',
  'mergeTag.padding': '--rte-mergetag-padding',
  'mergeTag.selectedBg': '--rte-mergetag-selected-bg',

  'findMatch.bg': '--rte-find-bg',
  'findMatch.activeBg': '--rte-find-active-bg',

  'content.paragraphSpacing': '--rte-paragraph-spacing',
  'content.headingWeight': '--rte-heading-weight',
  'content.boldWeight': '--rte-bold-weight',
  'content.listIndent': '--rte-list-indent',
  'content.listItemPadding': '--rte-list-item-padding',
  'content.indentStep': '--rte-indent-step',
  'content.linkColor': '--rte-link-color',
  'content.linkDecoration': '--rte-link-decoration',
  'content.quoteBorder': '--rte-quote-border',
  'content.quotePadding': '--rte-quote-padding',
  'content.codeBg': '--rte-code-bg',
  'content.codeColor': '--rte-code-color',
  'content.codeFont': '--rte-code-font',
  'content.tableBorder': '--rte-table-border',
  'content.tableHeaderBg': '--rte-table-header-bg',
  'content.cellPadding': '--rte-cell-padding',
  'content.hrColor': '--rte-hr-color',

  // `content.headingScale` is an array; each entry gets its own variable.
  'content.headingScale.0': '--rte-h1-size',
  'content.headingScale.1': '--rte-h2-size',
  'content.headingScale.2': '--rte-h3-size',
  'content.headingScale.3': '--rte-h4-size',
  'content.headingScale.4': '--rte-h5-size',
  'content.headingScale.5': '--rte-h6-size',

  density: '--rte-density-scale',
};

/** `density` is a keyword in the theme and a multiplier in CSS. */
const DENSITY_SCALE: Readonly<Record<string, string>> = {
  compact: '0.85',
  standard: '1',
  comfortable: '1.15',
};

/** Keys on a resolved theme that describe it rather than style it. */
const NON_TOKEN_KEYS = new Set(['name', 'defaults', 'toCssVars']);

function kebab(value: string): string {
  return value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/** The CSS variable for a token path, falling back to the kebab-cased path. */
function variableFor(path: readonly string[]): string {
  const explicit = EXPLICIT[path.join('.')];
  if (explicit) return explicit;

  // An unmapped array entry numbers its parent — `scale[0]` becomes `…-scale1` —
  // rather than reading as a separate path segment.
  const last = path[path.length - 1];
  if (last !== undefined && /^\d+$/.test(last)) {
    const parent = path.slice(0, -1).map(kebab).join('-');
    return `--rte-${parent}${Number(last) + 1}`;
  }

  return `--rte-${path.map(kebab).join('-')}`;
}

/**
 * Flattens a theme — or a partial override — into `--rte-*` custom properties.
 *
 * Unknown paths fall through to the kebab-cased default, so a theme extended with
 * tokens of its own still produces variables its own CSS can read.
 *
 * @example
 * ```ts
 * themeToCssVars({ editor: { borderWidth: '2px' } }); // { '--rte-border-width': '2px' }
 * ```
 */
export function themeToCssVars(theme: RteTheme | DeepPartial<RteTheme>): Record<string, string> {
  const vars: Record<string, string> = {};

  const visit = (value: unknown, path: readonly string[]): void => {
    if (value === null || value === undefined) return;

    if (typeof value === 'string' || typeof value === 'number') {
      const name = variableFor(path);
      vars[name] = name === '--rte-density-scale' ? (DENSITY_SCALE[String(value)] ?? '1') : String(value);
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((entry, index) => {
        visit(entry, [...path, String(index)]);
      });
      return;
    }

    if (typeof value === 'object') {
      for (const [key, child] of Object.entries(value)) {
        if (NON_TOKEN_KEYS.has(key)) continue;
        visit(child, [...path, key]);
      }
    }
  };

  visit(theme, []);
  return vars;
}
