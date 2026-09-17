import { definePlugin } from '../core/plugins/define.js';

/**
 * The chrome plugins: the pieces that surround the content rather than living in it.
 *
 * @module
 */

/** The empty-state hint (fixes R24). */
export const placeholder = /* @__PURE__ */ definePlugin({
  name: 'placeholder',
});

/** The live character or word counter (05 §12). */
export const counter = /* @__PURE__ */ definePlugin({
  name: 'counter',
});

/**
 * The paste pipeline (03 §3).
 *
 * Source detection, office cleanup, interop parsing, sanitization and normalization,
 * all landing as one history entry.
 */
export const paste = /* @__PURE__ */ definePlugin({
  name: 'paste',
  keymap: { 'Mod+Shift+V': 'pastePlainText' },
});

/** Links, with the popover, autolinking and protocol normalization (05 §6). */
export const link = /* @__PURE__ */ definePlugin({
  name: 'link',
  keymap: { 'Mod+K': 'openLinkEditor' },
  sanitize: {
    allowTags: ['a'],
    allowAttributes: { a: ['href', 'target', 'rel', 'title'] },
  },
});

/** Images and the upload flow (05 §7). */
export const image = /* @__PURE__ */ definePlugin({
  name: 'image',
  sanitize: {
    allowTags: ['img', 'figure', 'figcaption'],
    allowAttributes: { img: ['src', 'alt', 'title', 'width', 'height', 'loading'] },
  },
});

/** Tables (05 §8). */
export const table = /* @__PURE__ */ definePlugin({
  name: 'table',
  sanitize: {
    allowTags: ['table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'caption', 'colgroup', 'col'],
    allowAttributes: {
      td: ['colspan', 'rowspan', 'align', 'valign', 'width'],
      th: ['colspan', 'rowspan', 'align', 'valign', 'width', 'scope'],
    },
  },
});

/** Merge tags: atomic `{key}` chips that survive editing (03 §6, fixes R23). */
export const mergeTag = /* @__PURE__ */ definePlugin({
  name: 'mergeTag',
  sanitize: { allowAttributes: { span: ['data-merge-tag'] } },
});

/** `@`-mentions with async search (05 §10). */
export const mention = /* @__PURE__ */ definePlugin({
  name: 'mention',
  sanitize: { allowAttributes: { span: ['data-mention-id'] } },
});

/** Emoji, inserted as plain characters rather than images (05 §10). */
export const emoji = /* @__PURE__ */ definePlugin({
  name: 'emoji',
});

/** Markdown input rules: `- `, `1. `, `# `, `> ` and friends (05 §5). */
export const markdownShortcuts = /* @__PURE__ */ definePlugin({
  name: 'markdownShortcuts',
});

/** Find and replace (05 §16). */
export const findReplace = /* @__PURE__ */ definePlugin({
  name: 'findReplace',
  keymap: { 'Mod+F': 'openFindReplace' },
});

/** The HTML source view, sanitized on apply (05 §16). */
export const sourceView = /* @__PURE__ */ definePlugin({
  name: 'sourceView',
});

/** Fullscreen (05 §16). */
export const fullscreen = /* @__PURE__ */ definePlugin({
  name: 'fullscreen',
});

/** Draft autosave and the restore prompt (03 §7). */
export const autosave = /* @__PURE__ */ definePlugin({
  name: 'autosave',
});

/** The `/` command palette (05 §10). */
export const slashMenu = /* @__PURE__ */ definePlugin({
  name: 'slashMenu',
});

/** The selection bubble toolbar (05 §10). */
export const floatingToolbar = /* @__PURE__ */ definePlugin({
  name: 'floatingToolbar',
});
