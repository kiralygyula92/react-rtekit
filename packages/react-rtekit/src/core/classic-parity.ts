import type { ToolbarConfig } from '../types/toolbar.js';

/**
 * The two frozen lists the `classic` preset reproduces (01 §2, 01 §5).
 *
 * They live in their own leaf module because three unrelated places need them — the
 * theme, the preset table and the colour picker — and importing any one of those from
 * the others pulls a much larger graph behind it. A bundle that only wants
 * `classicTheme` should not also get every plugin.
 *
 * **These lists are frozen**: the order and the values are part of the parity
 * guarantee, and changing either is a major version (09 §7).
 *
 * @module
 */

/** The toolbar the Skimmer editor had, in its original order (01 §5). */
export const CLASSIC_TOOLBAR: ToolbarConfig = [
  ['bold', 'italic', 'underline'],
  ['color'],
  ['alignLeft', 'alignCenter', 'alignRight', 'bulletList'],
];

/** The 21 swatches the old editor shipped, in its original order (01 §2). */
export const CLASSIC_COLORS = [
  '#000000',
  '#FF0000',
  '#00FF00',
  '#0000FF',
  '#FFFF00',
  '#FF00FF',
  '#00FFFF',
  '#800000',
  '#008000',
  '#000080',
  '#808000',
  '#800080',
  '#008080',
  '#C0C0C0',
  '#808080',
  '#FFA500',
  '#FFC0CB',
  '#A52A2A',
  '#00CED1',
  '#FFD700',
  '#DDA0DD',
] as const;
