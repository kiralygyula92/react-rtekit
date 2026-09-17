import type { Align, HeadingLevel, OrderedListStyle } from './document.js';
import type { LinkAttrs } from './selection.js';
import type { EditorValue } from './common.js';
import type { EditorInstance } from './editor.js';

/** Command types. @group Commands */

/** Image attributes as stored on an image node. */
export interface ImageAttrs {
  /** The source, sanitized before it reaches the document. */
  src: string;
  /** Alternative text; an empty string marks the image as decorative and is kept. */
  alt?: string;
  /** The image's advisory title. */
  title?: string;
  /** Intrinsic width in pixels. */
  width?: number;
  /** Intrinsic height in pixels. */
  height?: number;
  /** How the image sits in the flow. */
  align?: Align;
  /** The caption, which serializes as a `<figure>` with a `<figcaption>`. */
  caption?: string;
}

/** Options for `insertTable`. */
export interface TableOptions {
  /** Make the first row a header row. @default false */
  headerRow?: boolean;
  /** Make the first column a header column. @default false */
  headerColumn?: boolean;
  /** Column widths as percentages, summing to 100. */
  columnWidths?: number[];
}

/**
 * The built-in command catalogue, mapping each id to its payload.
 *
 * Consumers add their own by augmenting this interface:
 *
 * @example
 * ```ts
 * declare module 'react-rtekit' {
 *   interface CommandRegistry {
 *     insertSignature: { name?: string };
 *   }
 * }
 * ```
 */
export interface CommandRegistry {
  /** Toggles bold across the selection. */
  toggleBold: void;
  /** Toggles italic across the selection. */
  toggleItalic: void;
  /** Toggles underline across the selection. */
  toggleUnderline: void;
  /** Toggles strikethrough across the selection. */
  toggleStrike: void;
  /** Toggles inline code across the selection. */
  toggleCode: void;
  /** Toggles subscript, which turns superscript off. */
  toggleSubscript: void;
  /** Toggles superscript, which turns subscript off. */
  toggleSuperscript: void;
  /** `null` removes the colour so the text follows the theme again (fixes R14). */
  setColor: { color: string | null };
  /** Sets or, with `null`, removes the background colour. */
  setBackgroundColor: { color: string | null };
  /** Sets or, with `null`, removes the font family. */
  setFontFamily: { value: string | null };
  /** Sets or, with `null`, removes the font size. */
  setFontSize: { value: string | null };
  /** Strips marks; `blocks: true` also resets block type, alignment and indent. */
  clearFormatting: { blocks?: boolean } | void;
  /** Turns the selected blocks into a paragraph, heading, quote or code block. */
  setBlockType: {
    type: 'paragraph' | 'heading' | 'blockquote' | 'codeBlock';
    level?: HeadingLevel;
    language?: string;
  };
  /** Aligns the selected blocks; `null` returns them to the default (fixes R6). */
  setAlign: { align: Align | null };
  /** Increases the indent, or the list level inside a list. */
  indent: void;
  /** Decreases the indent, or the list level inside a list. */
  outdent: void;
  /** Turns the selection into a bulleted list, or back into paragraphs. */
  toggleBulletList: void;
  /** Turns the selection into a numbered list, optionally with a start and style. */
  toggleOrderedList: { start?: number; style?: OrderedListStyle } | void;
  /** Turns the selection into a checklist, or back into paragraphs. */
  toggleCheckList: void;
  /** Links the selection, or inserts a new link when it is collapsed. */
  insertLink: LinkAttrs;
  /** Changes the link at the selection without replacing its text. */
  updateLink: Partial<LinkAttrs>;
  /** Unwraps the link at the selection, leaving its text. */
  removeLink: void;
  /** Opens the link popover for the selection. */
  openLinkEditor: void;
  /** Inserts an image from attributes you already have. */
  insertImage: ImageAttrs;
  /** Changes the selected image's attributes. */
  updateImage: Partial<ImageAttrs>;
  /** Deletes the selected image. */
  removeImage: void;
  /** Opens the dialog for inserting an image by URL or by file. */
  openImageDialog: void;
  /** Inserts a table and places the caret in its first cell. */
  insertTable: { rows: number; cols: number; options?: TableOptions };
  /** Adds a row above the one containing the caret. */
  addRowBefore: void;
  /** Adds a row below the one containing the caret. */
  addRowAfter: void;
  /** Adds a column left of the one containing the caret. */
  addColumnBefore: void;
  /** Adds a column right of the one containing the caret. */
  addColumnAfter: void;
  /** Deletes the row containing the caret. */
  deleteRow: void;
  /** Deletes the column containing the caret. */
  deleteColumn: void;
  /** Deletes the whole table. */
  deleteTable: void;
  /** Turns the table's first row into a header row, or back. */
  toggleHeaderRow: void;
  /** Inserts a thematic break. */
  insertHorizontalRule: void;
  /** Inserts a soft line break rather than starting a new block. */
  insertLineBreak: void;
  /** Inserts an emoji as text. */
  insertEmoji: { char: string };
  /** Inserts a merge tag as an atomic node (fixes R23). */
  insertMergeTag: { key: string };
  /** Inserts a mention chip. */
  insertMention: { id: string; label: string };
  /** Inserts plain text at the selection. */
  insertText: { text: string };
  /** Inserts HTML, which is sanitized first whatever its origin. */
  insertHTML: { html: string };
  /** Inserts a value in the editor's own `valueFormat`. */
  insertContent: { value: EditorValue };
  /** Steps back one undo entry. */
  undo: void;
  /** Steps forward one undo entry. */
  redo: void;
  /** Selects the whole document. */
  selectAll: void;
  /** Places the caret at the start of the document. */
  focusStart: void;
  /** Places the caret at the end of the document. */
  focusEnd: void;
  /** Opens or closes the HTML source view. */
  toggleSourceView: void;
  /** Enters or leaves fullscreen. */
  toggleFullscreen: void;
  /** Opens the find-and-replace panel. */
  openFindReplace: void;
  /** Prints the document's content on its own. */
  print: void;
  /** Inserts text with every format stripped. */
  pastePlainText: { text: string };
  /** Opens the keyboard reference, built from the keymap in force (fixes R25). */
  openShortcutHelp: void;
  /** Opens the colour palette. */
  openColorPicker: void;
  /** Opens the merge-tag menu. */
  openMergeTagMenu: void;
}

/** Every known command id. */
export type CommandId = Extract<keyof CommandRegistry, string>;

/** The payload a given command takes. */
export type CommandPayload<Id extends CommandId> = CommandRegistry[Id];

/** What a command handler receives. */
export interface CommandContext<Id extends CommandId = CommandId> {
  /** The instance the command is running against. */
  editor: EditorInstance;
  /** Which command is running, so one handler can serve several. */
  command: Id;
  /** The payload, which `next()` can be given a replacement for. */
  payload: CommandPayload<Id>;
  /** What triggered it, which is how a handler can treat a click differently. */
  source: 'toolbar' | 'keyboard' | 'menu' | 'api' | 'plugin';
}

/**
 * A command handler, written as middleware.
 *
 * Call `next()` to run the handler registered before this one (ultimately the
 * built-in). Return `false`, or simply do not call `next`, to cancel.
 */
export type CommandHandler<Id extends CommandId = CommandId> = (
  ctx: CommandContext<Id>,
  next: (payloadOverride?: CommandPayload<Id>) => boolean,
) => boolean | void;

/** `commandOverrides` prop shape. */
export type CommandOverrides = {
  [Id in CommandId]?: CommandHandler<Id>;
};
