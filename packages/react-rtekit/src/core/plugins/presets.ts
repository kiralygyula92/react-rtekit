import type { PresetName, RtePlugin } from '../../types/plugin.js';
import type { RichTextEditorProps } from '../../types/props.js';
import * as marks from '../../plugins/marks.js';
import * as blocks from '../../plugins/blocks.js';
import * as chrome from '../../plugins/chrome.js';
import { CLASSIC_TOOLBAR } from '../classic-parity.js';

// Re-exported from where it has always been imported from.
export { CLASSIC_TOOLBAR } from '../classic-parity.js';

/**
 * Presets (05 §1.1).
 *
 * A preset is an array of plugins plus the prop defaults they imply — nothing more.
 * `addPlugins` and `removePlugins` adjust one; `plugins` replaces it entirely.
 *
 * @module
 */

/** Every built-in plugin, keyed by name. */
export const plugins = {
  ...marks,
  ...blocks,
  ...chrome,
} satisfies Record<string, RtePlugin>;

/** A preset: its plugins plus the props it implies. */
export interface PresetDefinition {
  /** The plugins the preset turns on. */
  plugins: RtePlugin[];
  /** Props the preset implies, which explicit props still override. */
  defaults: Partial<RichTextEditorProps>;
}

const MINIMAL: RtePlugin[] = [
  blocks.paragraph,
  marks.bold,
  marks.italic,
  marks.underline,
  chrome.link,
  blocks.history,
  chrome.placeholder,
];

/**
 * Exactly the Skimmer feature set, plus history (05 §1.1).
 *
 * Undo and redo exist but are deliberately **not** on the toolbar: the old editor had
 * no history buttons, and the parity page documents the shortcut instead (07 §4).
 */
const CLASSIC: RtePlugin[] = [
  blocks.paragraph,
  marks.bold,
  marks.italic,
  marks.underline,
  marks.color,
  blocks.align,
  blocks.list,
  blocks.history,
  chrome.placeholder,
  chrome.paste,
];

const STANDARD: RtePlugin[] = [
  ...CLASSIC,
  marks.strike,
  marks.clearFormatting,
  blocks.heading,
  blocks.blockquote,
  blocks.indent,
  chrome.link,
  chrome.counter,
  chrome.markdownShortcuts,
  blocks.trailingParagraph,
];

const EMAIL: RtePlugin[] = [
  ...STANDARD.filter((plugin) => plugin.name !== 'codeBlock'),
  chrome.mergeTag,
  chrome.image,
  blocks.horizontalRule,
  marks.fontFamily,
  marks.fontSize,
];

const COMMENT: RtePlugin[] = [
  blocks.paragraph,
  marks.bold,
  marks.italic,
  marks.strike,
  marks.code,
  chrome.link,
  blocks.list,
  chrome.emoji,
  chrome.mention,
  blocks.history,
  chrome.placeholder,
  chrome.paste,
];

const FULL: RtePlugin[] = [
  ...EMAIL,
  marks.backgroundColor,
  marks.code,
  marks.subSup,
  blocks.codeBlock,
  blocks.checkList,
  chrome.table,
  chrome.findReplace,
  chrome.sourceView,
  chrome.fullscreen,
  chrome.slashMenu,
  chrome.floatingToolbar,
];

/** Every shipped preset. */
export const presets: Record<PresetName, PresetDefinition> = {
  minimal: {
    plugins: MINIMAL,
    defaults: { toolbar: [['bold', 'italic', 'underline'], ['link']] },
  },
  classic: {
    plugins: CLASSIC,
    defaults: {
      toolbar: CLASSIC_TOOLBAR,
      minHeight: 287,
      // Keeps what this editor saves readable by the old one during a phased rollout
      // (ADR-004). Switch to 'email' or 'standard' once the old editor is gone.
      htmlProfile: 'quill-compatible',
      sanitize: 'standard',
      showCounter: false,
      placeholder: '',
    },
  },
  standard: {
    plugins: STANDARD,
    defaults: {
      toolbar: [
        ['undo', 'redo'],
        ['blockType'],
        ['bold', 'italic', 'underline', 'strike'],
        ['color'],
        ['alignLeft', 'alignCenter', 'alignRight'],
        ['bulletList', 'orderedList', 'indent', 'outdent'],
        ['link', 'blockquote', 'clearFormatting'],
      ],
    },
  },
  email: {
    plugins: EMAIL,
    defaults: {
      toolbar: [
        ['undo', 'redo'],
        ['bold', 'italic', 'underline', 'strike'],
        ['color'],
        ['alignLeft', 'alignCenter', 'alignRight'],
        ['bulletList', 'orderedList'],
        ['link', 'image', 'horizontalRule'],
        ['mergeTag'],
      ],
      htmlProfile: 'email',
      sanitize: 'email',
    },
  },
  comment: {
    plugins: COMMENT,
    defaults: {
      toolbar: [['bold', 'italic', 'strike', 'code'], ['link'], ['bulletList', 'orderedList'], ['emoji']],
      submitOnEnter: 'mod',
      minHeight: 80,
    },
  },
  full: {
    plugins: FULL,
    defaults: {
      toolbar: [
        ['undo', 'redo'],
        ['blockType'],
        ['bold', 'italic', 'underline', 'strike', 'code'],
        ['color', 'backgroundColor', 'clearFormatting'],
        ['alignLeft', 'alignCenter', 'alignRight', 'alignJustify'],
        ['bulletList', 'orderedList', 'checkList', 'indent', 'outdent'],
        ['link', 'image', 'table', 'horizontalRule', 'emoji'],
        ['findReplace', 'sourceView', 'fullscreen'],
      ],
      slashMenu: true,
      floatingToolbar: true,
    },
  },
};

/**
 * Resolves the plugin list for a set of props.
 *
 * Order of precedence: `plugins` replaces the preset entirely, then `removePlugins`
 * drops names, then `addPlugins` appends, then the `enableX` flags turn individual
 * features off (04 §2.3).
 */
export function resolvePlugins(props: {
  preset?: PresetName;
  plugins?: RtePlugin[];
  addPlugins?: RtePlugin[];
  removePlugins?: string[];
}): RtePlugin[] {
  const base = props.plugins ?? presets[props.preset ?? 'standard'].plugins;
  const removed = new Set(props.removePlugins ?? []);
  const kept = base.filter((plugin) => !removed.has(plugin.name));
  return [...kept, ...(props.addPlugins ?? [])];
}
