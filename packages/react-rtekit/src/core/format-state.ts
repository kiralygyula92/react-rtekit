import type { FormatState } from '../types/selection.js';

/**
 * The format state of a caret in an empty paragraph.
 *
 * Engine-independent on purpose: the toolbar needs something to draw before any engine
 * has mounted, and an engine needs a base to fill in.
 *
 * @module
 */

/** Every mark off, a plain paragraph, nothing to undo. */
export function emptyFormatState(overrides: Partial<FormatState> = {}): FormatState {
  return {
    marks: {
      bold: false,
      italic: false,
      underline: false,
      strike: false,
      code: false,
      subscript: false,
      superscript: false,
      color: null,
      backgroundColor: null,
      fontFamily: null,
      fontSize: null,
    },
    block: { type: 'paragraph', align: 'left', indent: 0 },
    list: { type: null, depth: 0 },
    link: null,
    canUndo: false,
    canRedo: false,
    isEmpty: true,
    isCollapsed: true,
    ...overrides,
  };
}
