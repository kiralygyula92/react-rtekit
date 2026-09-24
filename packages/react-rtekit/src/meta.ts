/**
 * `react-rtekit/meta` — runtime metadata for the documentation site.
 *
 * The API pages list slots, commands, handlers, toolbar items, tokens, localization
 * keys and icons from *this* object, not from a hand-maintained page, so a symbol
 * cannot exist without appearing in the docs.
 *
 * Two mechanisms keep it honest. Lists that have a runtime registry — slots, icons,
 * tokens, localization keys, plugins — are enumerated from that registry. Lists whose
 * source is a TypeScript type, where there is nothing to enumerate at runtime, are
 * written as a `Record<TheUnion, …>`, so adding a member without describing it fails
 * the build rather than quietly shrinking the docs.
 *
 * @module
 */
import type { CommandId } from './types/commands.js';
import type { HandlerName } from './types/handlers.js';
import type { RteSlots } from './types/slots.js';
import type { ToolbarItemName } from './types/toolbar.js';
import { VERSION } from './version.js';
import { defaultSlots } from './react/slots/defaults.js';
import { defaultIcons } from './icons/index.js';
import { lightTheme } from './themes/index.js';
import { en } from './locales/en.js';
import { presets } from './core/plugins/presets.js';

/** One documented symbol. */
export interface MetaEntry {
  name: string;
  group: string;
  description: string;
}

/** The shape consumed by the docs site. */
export interface RteMeta {
  version: string;
  slots: MetaEntry[];
  commands: MetaEntry[];
  handlers: MetaEntry[];
  toolbarItems: MetaEntry[];
  tokens: MetaEntry[];
  localizationKeys: string[];
  icons: string[];
  plugins: MetaEntry[];
}

/** A described entry, before its name is attached. */
interface Described {
  group: string;
  description: string;
}

/** Turns a `{ name: { group, description } }` table into the flat list the site wants. */
function entries(table: Record<string, Described>): MetaEntry[] {
  return Object.entries(table).map(([name, described]) => ({ name, ...described }));
}

// ── slots ────────────────────────────────────────────────────────────────────

/** What each slot replaces. Keyed by slot name, so a new slot must be described. */
const SLOT_GROUPS: Record<keyof RteSlots, Described> = {
  ToolbarSeparator: { group: 'toolbar', description: 'The divider between groups.' },
  ToolbarButton: { group: 'toolbar', description: 'A plain toolbar button.' },
  ToolbarToggle: { group: 'toolbar', description: 'A toolbar button with a pressed state.' },
  ToolbarDropdown: { group: 'toolbar', description: 'A toolbar control that opens a menu.' },
  ColorPicker: { group: 'toolbar', description: 'The colour palette, recents and custom input.' },
  Label: { group: 'field', description: 'The field label.' },
  HelperText: { group: 'field', description: 'The helper text below the editor.' },
  ErrorText: { group: 'field', description: 'The validation message, with role="alert".' },
  Counter: { group: 'field', description: 'The character or word counter.' },
  LinkPopover: { group: 'link', description: 'The link editor and preview.' },
  ImagePopover: { group: 'media', description: 'The controls shown for a selected image.' },
  TableToolbar: { group: 'table', description: 'Row and column controls for a selected table.' },
  InlineSuggestMenu: { group: 'menus', description: 'The shared list behind every trigger menu.' },
  EmojiPicker: { group: 'menus', description: 'The emoji list.' },
  FloatingToolbar: { group: 'toolbar', description: 'The toolbar that follows the selection.' },
  FindReplacePanel: { group: 'chrome', description: 'The find-and-replace panel.' },
  SourceView: { group: 'chrome', description: 'The HTML source editor.' },
  RestoreDraftPrompt: { group: 'chrome', description: 'The prompt offering a saved draft.' },
  ShortcutHelpDialog: { group: 'chrome', description: 'The keyboard shortcut reference.' },
  Dialog: { group: 'primitive', description: 'Dialog primitive.' },
};

// ── commands ─────────────────────────────────────────────────────────────────

/**
 * Every command id.
 *
 * A `Record<CommandId, …>`: adding a command to `CommandRegistry` without a line here
 * is a type error, which is what stops the catalogue drifting.
 */
const COMMANDS: Record<CommandId, Described> = {
  toggleBold: { group: 'marks', description: 'Toggles bold on the selection.' },
  toggleItalic: { group: 'marks', description: 'Toggles italic on the selection.' },
  toggleUnderline: { group: 'marks', description: 'Toggles underline on the selection.' },
  toggleStrike: { group: 'marks', description: 'Toggles strikethrough on the selection.' },
  toggleCode: { group: 'marks', description: 'Toggles inline code on the selection.' },
  toggleSubscript: { group: 'marks', description: 'Toggles subscript on the selection.' },
  toggleSuperscript: { group: 'marks', description: 'Toggles superscript on the selection.' },
  setColor: { group: 'marks', description: 'Sets the text colour; `null` removes it (R14).' },
  setBackgroundColor: {
    group: 'marks',
    description: 'Sets the highlight colour; `null` removes it.',
  },
  setFontFamily: { group: 'marks', description: 'Sets the font family; `null` removes it.' },
  setFontSize: { group: 'marks', description: 'Sets the font size; `null` removes it.' },
  clearFormatting: {
    group: 'marks',
    description: 'Removes marks, and optionally block formatting.',
  },
  setBlockType: {
    group: 'blocks',
    description: 'Turns the block into a paragraph, heading, quote or code block.',
  },
  setAlign: { group: 'blocks', description: "Aligns the block; 'left' is the default (R6)." },
  indent: { group: 'blocks', description: 'Indents the block or list item.' },
  outdent: { group: 'blocks', description: 'Outdents the block or list item.' },
  toggleBulletList: { group: 'lists', description: 'Turns the selection into a bulleted list.' },
  toggleOrderedList: { group: 'lists', description: 'Turns the selection into a numbered list.' },
  toggleCheckList: { group: 'lists', description: 'Turns the selection into a check list.' },
  insertLink: { group: 'links', description: 'Links the selection.' },
  updateLink: { group: 'links', description: 'Updates the link at the selection.' },
  removeLink: { group: 'links', description: 'Removes the link, keeping the text.' },
  openLinkEditor: { group: 'links', description: 'Opens the link popover.' },
  insertImage: { group: 'media', description: 'Inserts an image.' },
  updateImage: { group: 'media', description: 'Updates the selected image.' },
  removeImage: { group: 'media', description: 'Removes the selected image.' },
  openImageDialog: { group: 'media', description: 'Opens the insert-image dialog.' },
  insertTable: { group: 'tables', description: 'Inserts a table.' },
  addRowBefore: { group: 'tables', description: 'Adds a row above the current one.' },
  addRowAfter: { group: 'tables', description: 'Adds a row below the current one.' },
  addColumnBefore: { group: 'tables', description: 'Adds a column before the current one.' },
  addColumnAfter: { group: 'tables', description: 'Adds a column after the current one.' },
  deleteRow: { group: 'tables', description: 'Deletes the current row.' },
  deleteColumn: { group: 'tables', description: 'Deletes the current column.' },
  deleteTable: { group: 'tables', description: 'Deletes the table.' },
  toggleHeaderRow: { group: 'tables', description: 'Turns the first row into a header row.' },
  insertHorizontalRule: { group: 'blocks', description: 'Inserts a horizontal rule.' },
  insertLineBreak: { group: 'blocks', description: 'Inserts a line break inside the block.' },
  insertEmoji: { group: 'inserts', description: 'Inserts an emoji character.' },
  insertMergeTag: {
    group: 'merge tags',
    description: 'Inserts a merge tag as one atomic node (R23).',
  },
  insertMention: { group: 'inserts', description: 'Inserts a mention.' },
  insertText: { group: 'inserts', description: 'Inserts plain text at the selection.' },
  insertHTML: { group: 'inserts', description: 'Inserts sanitized HTML at the selection.' },
  insertContent: { group: 'inserts', description: 'Inserts a value in any supported format.' },
  undo: { group: 'history', description: 'Undoes the last change.' },
  redo: { group: 'history', description: 'Redoes the last undone change.' },
  selectAll: { group: 'selection', description: 'Selects the whole document.' },
  focusStart: { group: 'selection', description: 'Moves the caret to the start.' },
  focusEnd: { group: 'selection', description: 'Moves the caret to the end.' },
  toggleSourceView: { group: 'chrome', description: 'Shows or hides the HTML source view.' },
  toggleFullscreen: { group: 'chrome', description: 'Enters or leaves fullscreen.' },
  openFindReplace: { group: 'chrome', description: 'Opens find and replace.' },
  print: { group: 'chrome', description: 'Prints the content.' },
  pastePlainText: { group: 'clipboard', description: 'Pastes text with no formatting.' },
  openShortcutHelp: { group: 'chrome', description: 'Opens the shortcut reference (R25).' },
  openColorPicker: { group: 'toolbar', description: 'Opens the colour picker.' },
  openMergeTagMenu: { group: 'merge tags', description: 'Opens the merge-tag insert menu.' },
};

// ── handlers ─────────────────────────────────────────────────────────────────

/** Every middleware entry point, as a `Record<HandlerName, …>`. */
const HANDLERS: Record<HandlerName, Described> = {
  onBeforeChange: {
    group: 'content',
    description: 'Runs before a change is committed; can veto it.',
  },
  onPaste: { group: 'clipboard', description: 'Wraps the paste pipeline.' },
  onDrop: { group: 'clipboard', description: 'Wraps drop handling.' },
  onUploadStart: { group: 'media', description: 'Runs before an upload begins.' },
  onUploadError: { group: 'media', description: 'Runs when an upload fails.' },
  onKeyDown: { group: 'keyboard', description: 'Wraps key handling before the keymap.' },
  onLinkClick: { group: 'links', description: 'Runs when a link in the content is clicked.' },
  onLinkOpen: { group: 'links', description: 'Runs before a link is opened.' },
  onToolbarCommand: { group: 'toolbar', description: 'Wraps every toolbar activation.' },
  onFocus: { group: 'focus', description: 'Wraps focus handling.' },
  onBlur: { group: 'focus', description: 'Wraps blur handling.' },
  onSelectionChange: { group: 'selection', description: 'Wraps selection updates.' },
  onMaxLengthExceeded: {
    group: 'limits',
    description: 'Runs when input would exceed `maxLength`.',
  },
  onSanitizeViolation: {
    group: 'security',
    description: 'Runs for each thing the sanitizer removed.',
  },
  onFullscreenChange: { group: 'chrome', description: 'Wraps entering and leaving fullscreen.' },
  onSourceViewToggle: { group: 'chrome', description: 'Wraps the source-view toggle.' },
  onDraftRestore: { group: 'autosave', description: 'Wraps restoring a saved draft.' },
  onDraftSave: { group: 'autosave', description: 'Wraps saving a draft.' },
};

// ── toolbar items ────────────────────────────────────────────────────────────

/**
 * Toolbar item names.
 *
 * `ToolbarItemName` is a string union, and `createBuiltInItems` needs icons and
 * option lists to build the real specs, so the catalogue is a `Record` of that union
 * rather than a walk of the factory's output.
 */
const TOOLBAR_ITEMS: Record<ToolbarItemName, Described> = {
  '|': { group: 'layout', description: 'A group separator.' },
  undo: { group: 'history', description: 'Undo.' },
  redo: { group: 'history', description: 'Redo.' },
  bold: { group: 'marks', description: 'Bold.' },
  italic: { group: 'marks', description: 'Italic.' },
  underline: { group: 'marks', description: 'Underline.' },
  strike: { group: 'marks', description: 'Strikethrough.' },
  code: { group: 'marks', description: 'Inline code.' },
  subscript: { group: 'marks', description: 'Subscript.' },
  superscript: { group: 'marks', description: 'Superscript.' },
  color: { group: 'marks', description: 'Text colour.' },
  backgroundColor: { group: 'marks', description: 'Highlight colour.' },
  fontFamily: { group: 'marks', description: 'Font family.' },
  fontSize: { group: 'marks', description: 'Font size.' },
  clearFormatting: { group: 'marks', description: 'Clear formatting.' },
  blockType: { group: 'blocks', description: 'Paragraph, heading, quote or code block.' },
  heading: { group: 'blocks', description: 'Heading level picker.' },
  blockquote: { group: 'blocks', description: 'Block quote.' },
  codeBlock: { group: 'blocks', description: 'Code block.' },
  alignLeft: { group: 'blocks', description: 'Align left.' },
  alignCenter: { group: 'blocks', description: 'Align centre.' },
  alignRight: { group: 'blocks', description: 'Align right.' },
  alignJustify: { group: 'blocks', description: 'Justify.' },
  align: { group: 'blocks', description: 'Alignment dropdown.' },
  indent: { group: 'blocks', description: 'Increase indent.' },
  outdent: { group: 'blocks', description: 'Decrease indent.' },
  bulletList: { group: 'lists', description: 'Bulleted list.' },
  orderedList: { group: 'lists', description: 'Numbered list.' },
  checkList: { group: 'lists', description: 'Check list.' },
  link: { group: 'links', description: 'Insert or edit a link.' },
  unlink: { group: 'links', description: 'Remove the link.' },
  image: { group: 'media', description: 'Insert an image.' },
  table: { group: 'tables', description: 'Insert a table.' },
  horizontalRule: { group: 'blocks', description: 'Insert a horizontal rule.' },
  emoji: { group: 'inserts', description: 'Insert an emoji.' },
  mergeTag: { group: 'merge tags', description: 'Insert a merge tag.' },
  mention: { group: 'inserts', description: 'Insert a mention.' },
  findReplace: { group: 'chrome', description: 'Open find and replace.' },
  sourceView: { group: 'chrome', description: 'Toggle the HTML source view.' },
  fullscreen: { group: 'chrome', description: 'Toggle fullscreen.' },
  print: { group: 'chrome', description: 'Print.' },
  wordCount: { group: 'field', description: 'A live word count.' },
};

// ── tokens, localization, icons, plugins ─────────────────────────────────────

/**
 * Every theme token, as the CSS variable it becomes.
 *
 * Enumerated from `lightTheme`, so a token that exists is listed and a token that is
 * renamed is renamed here too. The group is the variable's own prefix.
 */
function tokenEntries(): MetaEntry[] {
  return Object.entries(lightTheme.toCssVars())
    .map(([name, value]) => ({
      name,
      group: name.replace(/^--rte-/, '').split('-')[0] ?? 'core',
      description: `Default: ${value}`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Flattens the localization tree into dotted keys. */
function localizationKeys(value: unknown, prefix = ''): string[] {
  if (value === null || typeof value !== 'object') return prefix ? [prefix] : [];
  return Object.entries(value).flatMap(([key, child]) =>
    localizationKeys(child, prefix ? `${prefix}.${key}` : key),
  );
}

/** Every plugin any shipped preset installs, with the presets that install it. */
function pluginEntries(): MetaEntry[] {
  const seen = new Map<string, Set<string>>();
  for (const [presetName, preset] of Object.entries(presets)) {
    for (const plugin of preset.plugins) {
      const presetNames = seen.get(plugin.name) ?? new Set<string>();
      presetNames.add(presetName);
      seen.set(plugin.name, presetNames);
    }
  }
  return [...seen.entries()]
    .map(([name, presetNames]) => ({
      name,
      group: 'plugin',
      description: `In presets: ${[...presetNames].sort().join(', ')}.`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Runtime metadata describing this build of the library. */
export const meta: RteMeta = {
  version: VERSION,
  slots: entries(SLOT_GROUPS).filter((entry) => entry.name in defaultSlots),
  commands: entries(COMMANDS),
  handlers: entries(HANDLERS),
  toolbarItems: entries(TOOLBAR_ITEMS),
  tokens: tokenEntries(),
  localizationKeys: localizationKeys(en).sort(),
  icons: Object.keys(defaultIcons).sort(),
  plugins: pluginEntries(),
};

export default meta;
