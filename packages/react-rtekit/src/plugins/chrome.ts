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

/** The live character or word counter. */
export const counter = /* @__PURE__ */ definePlugin({
  name: 'counter',
});

/**
 * The paste pipeline.
 *
 * Source detection, office cleanup, interop parsing, sanitization and normalization,
 * all landing as one history entry.
 */
export const paste = /* @__PURE__ */ definePlugin({
  name: 'paste',
  keymap: { 'Mod+Shift+V': 'pastePlainText' },
});

/** Links, with the popover, autolinking and protocol normalization. */
export const link = /* @__PURE__ */ definePlugin({
  name: 'link',
  keymap: { 'Mod+K': 'openLinkEditor' },
  sanitize: {
    allowTags: ['a'],
    allowAttributes: { a: ['href', 'target', 'rel', 'title'] },
  },
});

/** Images and the upload flow. */
export const image = /* @__PURE__ */ definePlugin({
  name: 'image',
  sanitize: {
    allowTags: ['img', 'figure', 'figcaption'],
    allowAttributes: { img: ['src', 'alt', 'title', 'width', 'height', 'loading'] },
  },
});

/** Tables. */
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

/** Merge tags: atomic `{key}` chips that survive editing (fixes R23). */
export const mergeTag = /* @__PURE__ */ definePlugin({
  name: 'mergeTag',
  sanitize: { allowAttributes: { span: ['data-merge-tag'] } },
});

/** `@`-mentions with async search. */
export const mention = /* @__PURE__ */ definePlugin({
  name: 'mention',
  sanitize: { allowAttributes: { span: ['data-mention-id'] } },
});

/** Emoji, inserted as plain characters rather than images. */
export const emoji = /* @__PURE__ */ definePlugin({
  name: 'emoji',
});

/** Markdown input rules: `- `, `1. `, `# `, `> ` and friends. */
export const markdownShortcuts = /* @__PURE__ */ definePlugin({
  name: 'markdownShortcuts',
});

/** Find and replace. */
export const findReplace = /* @__PURE__ */ definePlugin({
  name: 'findReplace',
  keymap: { 'Mod+F': 'openFindReplace' },
});

/** The HTML source view, sanitized on apply. */
export const sourceView = /* @__PURE__ */ definePlugin({
  name: 'sourceView',
});

/** Fullscreen. */
export const fullscreen = /* @__PURE__ */ definePlugin({
  name: 'fullscreen',
});

/** Draft autosave and the restore prompt. */
export const autosave = /* @__PURE__ */ definePlugin({
  name: 'autosave',
});

/** The `/` command palette. */
export const slashMenu = /* @__PURE__ */ definePlugin({
  name: 'slashMenu',
});

/** The selection bubble toolbar. */
export const floatingToolbar = /* @__PURE__ */ definePlugin({
  name: 'floatingToolbar',
});
