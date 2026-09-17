import type { Align, HeadingLevel } from './document.js';

/**
 * A normalized selection.
 *
 * Paths address a node by its index chain from the document root, which keeps the
 * shape engine-independent and serializable.
 *
 * @group Selection
 */
export interface EditorPoint {
  /** Index chain from the document root to the text node. */
  path: number[];
  /** Character offset inside that node. */
  offset: number;
}

/** A selection range plus the flags toolbars care about. @group Selection */
export interface EditorSelection {
  /** Where the selection started. */
  anchor: EditorPoint;
  /** Where the selection ends, which is where the caret is drawn. */
  focus: EditorPoint;
  /** True when anchor and focus are identical (a caret). */
  isCollapsed: boolean;
  /** True when focus precedes anchor. */
  isBackward: boolean;
}

/**
 * An opaque snapshot that survives focus leaving the editor.
 *
 * Toolbar controls save one on `mousedown` and the engine restores it before running
 * a command, which is what makes clicking a toolbar button apply to the text that was
 * selected (fixes R5).
 *
 * @group Selection
 */
export interface SelectionSnapshot {
  readonly __brand: 'rte-selection-snapshot';
  /** The portable form, for inspection; restoring uses `native`. */
  readonly selection: EditorSelection | null;
  /** The engine's own representation, which is what survives a DOM reflow. */
  readonly native: unknown;
}

/** Where to insert content relative to the current document. @group Selection */
export type Position = 'start' | 'end' | 'selection' | EditorPoint;

/** Link attributes as stored on a link node and edited in the link popover. @group Links */
export interface LinkAttrs {
  /** The destination. Sanitized before it reaches the document. */
  href: string;
  /** The link text, used when creating a link at a collapsed caret. */
  text?: string;
  /** Where the link opens. */
  target?: string;
  /** The relationship, which gains `noopener noreferrer` for `_blank`. */
  rel?: string;
  /** The anchor's advisory title. */
  title?: string;
}

/**
 * The formatting that applies to the current selection (04 §9).
 *
 * A value-carrying mark is `null` when the selection is mixed, so a toolbar can render
 * an indeterminate state rather than lying about one of the values.
 *
 * @group Selection
 */
export interface FormatState {
  /** Inline formatting; a value mark is `null` when the selection is mixed. */
  marks: {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    strike: boolean;
    code: boolean;
    subscript: boolean;
    superscript: boolean;
    color: string | null;
    backgroundColor: string | null;
    fontFamily: string | null;
    fontSize: string | null;
  };
  /** The block the caret is in, and how it is laid out. */
  block: {
    type: 'paragraph' | 'heading' | 'blockquote' | 'codeBlock' | 'listItem' | 'table' | 'image';
    headingLevel?: HeadingLevel;
    align: Align;
    indent: number;
  };
  /** The list the caret is in, if any, and how deeply nested it is. */
  list: {
    type: 'bullet' | 'ordered' | 'check' | null;
    depth: number;
  };
  /** The link the caret is inside, or `null`. */
  link: LinkAttrs | null;
  /** Whether there is anything to undo, which disables the control. */
  canUndo: boolean;
  /** Whether there is anything to redo. */
  canRedo: boolean;
  /** Whether the document is empty in the `isEmpty` sense (fixes R2). */
  isEmpty: boolean;
  /** Whether the selection is a caret rather than a range. */
  isCollapsed: boolean;
}
