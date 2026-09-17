import { definePlugin } from '../core/plugins/define.js';

/**
 * The block and structure plugins (05 §3, §4, §5, §9).
 *
 * @module
 */

/** Paragraphs. Always on: every document needs somewhere to put text. */
export const paragraph = /* @__PURE__ */ definePlugin({
  name: 'paragraph',
  sanitize: { allowTags: ['p'] },
});

/** Headings. `Mod+Alt+1..6` set a level, `Mod+Alt+0` returns to a paragraph. */
export const heading = /* @__PURE__ */ definePlugin({
  name: 'heading',
  keymap: {
    'Mod+Alt+0': 'setBlockType',
    'Mod+Alt+1': 'setBlockType',
    'Mod+Alt+2': 'setBlockType',
    'Mod+Alt+3': 'setBlockType',
    'Mod+Alt+4': 'setBlockType',
    'Mod+Alt+5': 'setBlockType',
    'Mod+Alt+6': 'setBlockType',
  },
  sanitize: { allowTags: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] },
});

/** Block quotes. */
export const blockquote = /* @__PURE__ */ definePlugin({
  name: 'blockquote',
  sanitize: { allowTags: ['blockquote'] },
});

/** Fenced code blocks. No rich marks inside (05 §3). */
export const codeBlock = /* @__PURE__ */ definePlugin({
  name: 'codeBlock',
  sanitize: { allowTags: ['pre', 'code'] },
});

/** Thematic breaks. */
export const horizontalRule = /* @__PURE__ */ definePlugin({
  name: 'horizontalRule',
  sanitize: { allowTags: ['hr'] },
});

/**
 * Block alignment.
 *
 * One canonical value per block, `left` serialized as no attribute, which is what makes
 * the four toolbar toggles agree with the format state (fixes R6).
 */
export const align = /* @__PURE__ */ definePlugin({
  name: 'align',
  keymap: {
    'Mod+Shift+L': 'setAlign',
    'Mod+Shift+E': 'setAlign',
    'Mod+Shift+R': 'setAlign',
    'Mod+Shift+J': 'setAlign',
  },
  sanitize: { allowStyles: ['text-align'], allowClasses: [/^rte-align-/, /^ql-align-/] },
});

/** Indent and outdent, 0–8 levels (05 §4). */
export const indent = /* @__PURE__ */ definePlugin({
  name: 'indent',
  sanitize: { allowAttributes: { '*': ['data-indent'] }, allowClasses: [/^ql-indent-\d$/] },
});

/** Bullet and ordered lists. */
export const list = /* @__PURE__ */ definePlugin({
  name: 'list',
  keymap: { 'Mod+Shift+7': 'toggleOrderedList', 'Mod+Shift+8': 'toggleBulletList' },
  sanitize: {
    allowTags: ['ul', 'ol', 'li'],
    allowAttributes: { ol: ['start', 'type'], li: ['value', 'data-list'] },
  },
});

/** Check lists, with an accessible checkbox per item (05 §5). */
export const checkList = /* @__PURE__ */ definePlugin({
  name: 'checkList',
  dependsOn: ['list'],
  keymap: { 'Mod+Shift+9': 'toggleCheckList' },
  sanitize: { allowAttributes: { li: ['data-checked'] } },
});

/** Undo and redo, with typing coalesced inside `historyGroupMs` (05 §9). */
export const history = /* @__PURE__ */ definePlugin({
  name: 'history',
  keymap: { 'Mod+Z': 'undo', 'Mod+Shift+Z': 'redo', 'Ctrl+Y': 'redo' },
});

/**
 * Keeps a final empty paragraph after a table, rule or code block.
 *
 * Without it the caret has nowhere to go once the last block is atomic, and the author
 * cannot type after it (03 §2).
 */
export const trailingParagraph = /* @__PURE__ */ definePlugin({
  name: 'trailingParagraph',
});
