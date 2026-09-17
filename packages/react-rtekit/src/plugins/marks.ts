import { definePlugin } from '../core/plugins/define.js';

/**
 * The inline-mark plugins (05 §2).
 *
 * Each is a separate module export so `react-rtekit/plugins/marks` can be imported
 * piecemeal and a preset that leaves one out does not pay for it. The commands
 * themselves live in the engine adapter; a plugin's job is to declare the feature, its
 * keymap and its sanitizer rules.
 *
 * @module
 */

/** Bold. `Mod+B`. */
export const bold = /* @__PURE__ */ definePlugin({
  name: 'bold',
  keymap: { 'Mod+B': 'toggleBold' },
  sanitize: { allowTags: ['strong', 'b'] },
});

/** Italic. `Mod+I`. */
export const italic = /* @__PURE__ */ definePlugin({
  name: 'italic',
  keymap: { 'Mod+I': 'toggleItalic' },
  sanitize: { allowTags: ['em', 'i'] },
});

/** Underline. `Mod+U`. */
export const underline = /* @__PURE__ */ definePlugin({
  name: 'underline',
  keymap: { 'Mod+U': 'toggleUnderline' },
  sanitize: { allowTags: ['u', 'ins'] },
});

/** Strikethrough. `Mod+Shift+X`. */
export const strike = /* @__PURE__ */ definePlugin({
  name: 'strike',
  keymap: { 'Mod+Shift+X': 'toggleStrike' },
  sanitize: { allowTags: ['s', 'strike', 'del'] },
});

/** Inline code. `Mod+E`. */
export const code = /* @__PURE__ */ definePlugin({
  name: 'code',
  keymap: { 'Mod+E': 'toggleCode' },
  sanitize: { allowTags: ['code', 'kbd', 'samp'] },
});

/** Subscript and superscript. Mutually exclusive (05 §2). */
export const subSup = /* @__PURE__ */ definePlugin({
  name: 'subSup',
  provides: ['subscript', 'superscript'],
  sanitize: { allowTags: ['sub', 'sup'] },
});

/** Text colour. */
export const color = /* @__PURE__ */ definePlugin({
  name: 'color',
  sanitize: { allowStyles: ['color'] },
});

/** Highlight colour. */
export const backgroundColor = /* @__PURE__ */ definePlugin({
  name: 'backgroundColor',
  sanitize: { allowStyles: ['background-color'] },
});

/** Font family. */
export const fontFamily = /* @__PURE__ */ definePlugin({
  name: 'fontFamily',
  sanitize: { allowStyles: ['font-family'] },
});

/** Font size. */
export const fontSize = /* @__PURE__ */ definePlugin({
  name: 'fontSize',
  sanitize: { allowStyles: ['font-size'] },
});

/** Removes every mark in the selection. `Mod+\` (05 §2). */
export const clearFormatting = /* @__PURE__ */ definePlugin({
  name: 'clearFormatting',
  keymap: { 'Mod+\\': 'clearFormatting' },
});
