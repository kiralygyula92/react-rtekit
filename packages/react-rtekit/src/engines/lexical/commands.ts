import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $insertNodes,
  $isElementNode,
  $isRangeSelection,
  $isTextNode,
  $selectAll,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  FORMAT_TEXT_COMMAND,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
  type ElementNode,
  type LexicalCommand,
  type LexicalEditor,
  type TextFormatType,
} from 'lexical';
import { $createHeadingNode, $createQuoteNode, type HeadingTagType } from '@lexical/rich-text';
import { $isListNode, INSERT_CHECK_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND, REMOVE_LIST_COMMAND, ListNode } from '@lexical/list';
import { $toggleLink } from '@lexical/link';
import { $patchStyleText, $setBlocksType } from '@lexical/selection';
import {
  $createTableNodeWithDimensions,
  $deleteTableColumnAtSelection,
  $deleteTableRowAtSelection,
  $insertTableColumnAtSelection,
  $insertTableRowAtSelection,
  $isTableCellNode,
  $isTableNode,
  $isTableRowNode,
  TableCellHeaderStates,
  type TableNode,
} from '@lexical/table';
import { $findMatchingParent, $getNearestNodeOfType } from '@lexical/utils';
import type { CommandId, CommandPayload } from '../../types/commands.js';
import type { EditorDocument } from '../../types/document.js';
import { $documentToNodes } from './convert/from-document.js';
import { $createMergeTagNode } from './nodes/merge-tag.js';
import { $createMentionNode } from './nodes/mention.js';
import { $createImageNode, $isImageNode, type ImageNode } from './nodes/image.js';
import { $createHorizontalRuleNode } from './nodes/horizontal-rule.js';

/**
 * Built-in command implementations (04 §4).
 *
 * Every command is synchronous and state flows back through Lexical's own update
 * listener, so nothing here needs a timer to settle (fixes R7).
 *
 * @module
 */

/** What a built-in command implementation receives. */
export interface EngineCommandContext {
  editor: LexicalEditor;
  /** Parses a value in the configured format into the portable model. */
  parse: (value: string) => EditorDocument;
  /** Current merge-tag labels, keyed by tag key. */
  mergeTagLabels: Record<string, string>;
}

type Implementation = (ctx: EngineCommandContext, payload: unknown) => boolean;

/**
 * Forces Lexical to flush the update synchronously.
 *
 * Lexical batches updates by default. 05 §4 requires commands to be synchronous — the
 * toolbar updates from the engine's own change event, with no timers (fixes R7) — so
 * every command commits before it returns and `getHTML()` on the next line sees it.
 */
const DISCRETE = { discrete: true } as const;

/**
 * Dispatches a Lexical command and flushes the update it schedules.
 *
 * `dispatchCommand` queues its listeners' work like any other update, so without the
 * surrounding discrete update the caller would read stale state.
 */
function dispatchDiscrete<P>(editor: LexicalEditor, command: LexicalCommand<P>, payload: P): boolean {
  let handled = false;
  editor.update(() => {
    handled = editor.dispatchCommand(command, payload);
  }, DISCRETE);
  return handled;
}

const MARK_FORMAT: Partial<Record<CommandId, TextFormatType>> = {
  toggleBold: 'bold',
  toggleItalic: 'italic',
  toggleUnderline: 'underline',
  toggleStrike: 'strikethrough',
  toggleCode: 'code',
  toggleSubscript: 'subscript',
  toggleSuperscript: 'superscript',
};

/** Applies an inline style patch to the selection, or to the pending format at a caret. */
function patchStyle(editor: LexicalEditor, patch: Record<string, string | null>): boolean {
  let applied = false;
  editor.update(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;
    $patchStyleText(selection, patch);
    applied = true;
  }, DISCRETE);
  return applied;
}

/** Replaces the selected blocks with ones built by `factory`. */
function setBlocks(editor: LexicalEditor, factory: () => ElementNode): boolean {
  let applied = false;
  editor.update(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;
    $setBlocksType(selection, factory);
    applied = true;
  }, DISCRETE);
  return applied;
}

/** The list type the selection currently sits in, if any. */
function currentListType(editor: LexicalEditor): 'bullet' | 'number' | 'check' | null {
  let result: 'bullet' | 'number' | 'check' | null = null;
  editor.getEditorState().read(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;
    const node = $getNearestNodeOfType(selection.anchor.getNode(), ListNode);
    const list = node ?? $findMatchingParent(selection.anchor.getNode(), $isListNode);
    if (list) result = list.getListType();
  });
  return result;
}

function toggleList(
  editor: LexicalEditor,
  wanted: 'bullet' | 'number' | 'check',
): boolean {
  const current = currentListType(editor);
  if (current === wanted) {
    dispatchDiscrete(editor, REMOVE_LIST_COMMAND, undefined);
    return true;
  }
  const command =
    wanted === 'number'
      ? INSERT_ORDERED_LIST_COMMAND
      : wanted === 'check'
        ? INSERT_CHECK_LIST_COMMAND
        : INSERT_UNORDERED_LIST_COMMAND;
  dispatchDiscrete(editor, command, undefined);
  return true;
}

/**
 * Makes sure there is a range selection to insert at.
 *
 * An upload that finishes after focus has moved has no selection left, and an image
 * that uploads successfully and then silently vanishes is worse than one that lands
 * at the end of the document (05 §7). Call inside an update.
 */
function $ensureInsertionPoint(): boolean {
  if ($isRangeSelection($getSelection())) return true;
  $getRoot().selectEnd();
  return $isRangeSelection($getSelection());
}

/** Every command the engine implements. */
export const ENGINE_COMMANDS: Partial<Record<CommandId, Implementation>> = {
  // ── marks ────────────────────────────────────────────────────────────────
  ...Object.fromEntries(
    Object.entries(MARK_FORMAT).map(([command, format]) => [
      command,
      ({ editor }: EngineCommandContext) => dispatchDiscrete(editor, FORMAT_TEXT_COMMAND, format),
    ]),
  ),

  setColor: ({ editor }, payload) => {
    const { color } = (payload ?? {}) as CommandPayload<'setColor'>;
    // `null` removes the declaration rather than writing black (fixes R14).
    return patchStyle(editor, { color });
  },
  setBackgroundColor: ({ editor }, payload) => {
    const { color } = (payload ?? {}) as CommandPayload<'setBackgroundColor'>;
    return patchStyle(editor, { 'background-color': color });
  },
  setFontFamily: ({ editor }, payload) => {
    const { value } = (payload ?? {}) as CommandPayload<'setFontFamily'>;
    return patchStyle(editor, { 'font-family': value });
  },
  setFontSize: ({ editor }, payload) => {
    const { value } = (payload ?? {}) as CommandPayload<'setFontSize'>;
    return patchStyle(editor, { 'font-size': value });
  },

  clearFormatting: ({ editor }, payload) => {
    const { blocks = false } = (payload ?? {}) as { blocks?: boolean };
    let applied = false;
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      for (const node of selection.getNodes()) {
        if ($isTextNode(node)) {
          node.setFormat(0);
          node.setStyle('');
        }
      }
      // A collapsed selection carries a pending format; clear that too.
      selection.setFormat(0);
      selection.setStyle('');
      if (blocks) {
        $setBlocksType(selection, $createParagraphNode);
        // Re-read: `$setBlocksType` replaced the blocks, so the selection captured
        // above points at nodes that are no longer in the tree and their alignment
        // would survive the "clear".
        const after = $getSelection();
        for (const node of $isRangeSelection(after) ? after.getNodes() : []) {
          const block = $isElementNode(node) && !node.isInline()
            ? node
            : $findMatchingParent(node, (candidate) => $isElementNode(candidate) && !candidate.isInline());
          if (block && $isElementNode(block)) {
            block.setFormat('');
            block.setIndent(0);
          }
        }
      }
      applied = true;
    }, DISCRETE);
    return applied;
  },

  // ── blocks ───────────────────────────────────────────────────────────────
  setBlockType: ({ editor }, payload) => {
    const { type, level } = (payload ?? {}) as CommandPayload<'setBlockType'>;
    if (type === 'heading') {
      return setBlocks(editor, () => $createHeadingNode(`h${level ?? 1}` as HeadingTagType));
    }
    if (type === 'blockquote') return setBlocks(editor, () => $createQuoteNode());
    return setBlocks(editor, $createParagraphNode);
  },

  setAlign: ({ editor }, payload) => {
    const { align } = (payload ?? {}) as CommandPayload<'setAlign'>;
    let applied = false;
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      // One canonical value: `left` is the default and is stored as no format at all,
      // so the toolbar's "left" highlight is never ambiguous (fixes R6).
      const value = align === null || align === 'left' ? '' : align;
      const seen = new Set<string>();
      for (const node of selection.getNodes()) {
        const block = $findMatchingParent(
          node,
          (candidate) => $isElementNode(candidate) && !candidate.isInline(),
        );
        if (!block || !$isElementNode(block) || seen.has(block.getKey())) continue;
        seen.add(block.getKey());
        block.setFormat(value);
      }
      if (seen.size === 0) {
        const block = selection.anchor.getNode().getTopLevelElement();
        if (block && $isElementNode(block)) block.setFormat(value);
      }
      applied = true;
    }, DISCRETE);
    return applied;
  },

  indent: ({ editor }) => dispatchDiscrete(editor, INDENT_CONTENT_COMMAND, undefined),
  outdent: ({ editor }) => dispatchDiscrete(editor, OUTDENT_CONTENT_COMMAND, undefined),

  // ── lists ────────────────────────────────────────────────────────────────
  toggleBulletList: ({ editor }) => toggleList(editor, 'bullet'),
  toggleOrderedList: ({ editor }) => toggleList(editor, 'number'),
  toggleCheckList: ({ editor }) => toggleList(editor, 'check'),

  // ── links ────────────────────────────────────────────────────────────────
  // `$toggleLink` rather than `TOGGLE_LINK_COMMAND`: the command handler lives in
  // `registerLink`, which now takes an extension config store we do not otherwise use.
  insertLink: ({ editor }, payload) => {
    const attrs = (payload ?? {}) as CommandPayload<'insertLink'>;
    const href = attrs.href;
    if (!href) return false;
    editor.update(() => {
      $toggleLink(href, {
        target: attrs.target ?? null,
        rel: attrs.rel ?? (attrs.target === '_blank' ? 'noopener noreferrer' : null),
        title: attrs.title ?? null,
      });
    }, DISCRETE);
    return true;
  },
  updateLink: ({ editor }, payload) => {
    const attrs = (payload ?? {}) as CommandPayload<'updateLink'>;
    const href = attrs.href;
    if (!href) return false;
    editor.update(() => {
      $toggleLink(href, {
        target: attrs.target ?? null,
        rel: attrs.rel ?? null,
        title: attrs.title ?? null,
      });
    }, DISCRETE);
    return true;
  },
  removeLink: ({ editor }) => {
    editor.update(() => {
      $toggleLink(null);
    }, DISCRETE);
    return true;
  },

  // ── history ──────────────────────────────────────────────────────────────
  undo: ({ editor }) => dispatchDiscrete(editor, UNDO_COMMAND, undefined),
  redo: ({ editor }) => dispatchDiscrete(editor, REDO_COMMAND, undefined),

  // ── selection ────────────────────────────────────────────────────────────
  selectAll: ({ editor }) => {
    editor.update(() => {
      // A text range, not an element selection: the mark commands need text nodes.
      $selectAll();
    }, DISCRETE);
    return true;
  },
  focusStart: ({ editor }) => {
    editor.update(() => {
      $getRoot().selectStart();
    }, DISCRETE);
    return true;
  },
  focusEnd: ({ editor }) => {
    editor.update(() => {
      $getRoot().selectEnd();
    }, DISCRETE);
    return true;
  },

  // ── insertion ────────────────────────────────────────────────────────────
  insertText: ({ editor }, payload) => {
    const { text } = (payload ?? {}) as CommandPayload<'insertText'>;
    if (typeof text !== 'string') return false;
    let applied = false;
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      selection.insertText(text);
      applied = true;
    }, DISCRETE);
    return applied;
  },

  insertLineBreak: ({ editor }) => {
    let applied = false;
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      selection.insertLineBreak(false);
      applied = true;
    }, DISCRETE);
    return applied;
  },

  insertMergeTag: ({ editor, mergeTagLabels }, payload) => {
    const { key } = (payload ?? {}) as CommandPayload<'insertMergeTag'>;
    if (!key) return false;
    let applied = false;
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      const node = $createMergeTagNode(key, mergeTagLabels[key] ?? null);
      selection.insertNodes([node, $createTextNode('')]);
      applied = true;
    }, DISCRETE);
    return applied;
  },

  insertHTML: ({ editor, parse }, payload) => {
    const { html } = (payload ?? {}) as CommandPayload<'insertHTML'>;
    if (typeof html !== 'string') return false;
    const doc = parse(html);
    let applied = false;
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      $insertNodes($documentToNodes(doc));
      applied = true;
    }, DISCRETE);
    return applied;
  },

  pastePlainText: ({ editor }, payload) => {
    const { text } = (payload ?? {}) as CommandPayload<'pastePlainText'>;
    if (typeof text !== 'string') return false;
    let applied = false;
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      // Double newlines become paragraphs, single ones line breaks (03 §3).
      const paragraphs = text.replace(/\r\n?/g, '\n').split(/\n{2,}/);
      paragraphs.forEach((paragraph, index) => {
        if (index > 0) selection.insertParagraph();
        const lines = paragraph.split('\n');
        lines.forEach((line, lineIndex) => {
          if (lineIndex > 0) selection.insertLineBreak(false);
          if (line !== '') selection.insertText(line);
        });
      });
      applied = true;
    }, DISCRETE);
    return applied;
  },

  insertContent: ({ editor, parse }, payload) => {
    const { value } = (payload ?? {}) as CommandPayload<'insertContent'>;
    const doc = typeof value === 'string' ? parse(value) : value;
    if (!doc || typeof doc !== 'object') return false;
    let applied = false;
    editor.update(() => {
      if (!$ensureInsertionPoint()) return;
      $insertNodes($documentToNodes(doc));
      applied = true;
    }, DISCRETE);
    return applied;
  },

  insertEmoji: ({ editor }, payload) => {
    const { char } = (payload ?? {}) as CommandPayload<'insertEmoji'>;
    if (typeof char !== 'string' || char === '') return false;
    let applied = false;
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      selection.insertText(char);
      applied = true;
    }, DISCRETE);
    return applied;
  },

  insertMention: ({ editor }, payload) => {
    const { id, label } = (payload ?? {}) as CommandPayload<'insertMention'>;
    if (!id || !label) return false;
    let applied = false;
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      // The trailing empty text node is where the caret lands: a token node cannot
      // hold a caret after it, so without one there is nowhere to keep typing.
      selection.insertNodes([$createMentionNode(id, label), $createTextNode(' ')]);
      applied = true;
    }, DISCRETE);
    return applied;
  },

  // ── media ────────────────────────────────────────────────────────────────
  insertImage: ({ editor }, payload) => {
    const attrs = (payload ?? {}) as CommandPayload<'insertImage'>;
    if (!attrs.src) return false;
    let applied = false;
    editor.update(() => {
      if (!$ensureInsertionPoint()) return;
      $insertNodes([$createImageNode(attrs)]);
      applied = true;
    }, DISCRETE);
    return applied;
  },

  updateImage: ({ editor }, payload) => {
    const attrs = (payload ?? {}) as CommandPayload<'updateImage'>;
    let applied = false;
    editor.update(() => {
      const node = $selectedImage();
      if (!node) return;
      node.setAttrs(attrs);
      applied = true;
    }, DISCRETE);
    return applied;
  },

  removeImage: ({ editor }) => {
    let applied = false;
    editor.update(() => {
      const node = $selectedImage();
      if (!node) return;
      node.remove();
      applied = true;
    }, DISCRETE);
    return applied;
  },

  insertHorizontalRule: ({ editor }) => {
    let applied = false;
    editor.update(() => {
      if (!$ensureInsertionPoint()) return;
      // A paragraph after the rule, or there is no way to type past the last one.
      $insertNodes([$createHorizontalRuleNode(), $createParagraphNode()]);
      applied = true;
    }, DISCRETE);
    return applied;
  },

  // ── tables ───────────────────────────────────────────────────────────────
  insertTable: ({ editor }, payload) => {
    const { rows, cols, options } = (payload ?? {}) as CommandPayload<'insertTable'>;
    if (!rows || !cols) return false;
    let applied = false;
    editor.update(() => {
      if (!$ensureInsertionPoint()) return;
      const table = $createTableNodeWithDimensions(rows, cols, options?.headerRow !== false);
      $insertNodes([table, $createParagraphNode()]);
      applied = true;
    }, DISCRETE);
    return applied;
  },

  addRowBefore: ({ editor }) =>
    $withTable(editor, () => {
      $insertTableRowAtSelection(false);
    }),
  addRowAfter: ({ editor }) =>
    $withTable(editor, () => {
      $insertTableRowAtSelection(true);
    }),
  addColumnBefore: ({ editor }) =>
    $withTable(editor, () => {
      $insertTableColumnAtSelection(false);
    }),
  addColumnAfter: ({ editor }) =>
    $withTable(editor, () => {
      $insertTableColumnAtSelection(true);
    }),
  deleteRow: ({ editor }) =>
    $withTable(editor, () => {
      $deleteTableRowAtSelection();
    }),
  deleteColumn: ({ editor }) =>
    $withTable(editor, () => {
      $deleteTableColumnAtSelection();
    }),

  deleteTable: ({ editor }) => {
    let applied = false;
    editor.update(() => {
      const table = $selectedTable();
      if (!table) return;
      table.remove();
      applied = true;
    }, DISCRETE);
    return applied;
  },

  toggleHeaderRow: ({ editor }) => {
    let applied = false;
    editor.update(() => {
      const table = $selectedTable();
      const first = table?.getFirstChild();
      if (!table || !$isTableRowNode(first)) return;
      for (const cell of first.getChildren()) {
        if (!$isTableCellNode(cell)) continue;
        cell.setHeaderStyles(
          cell.hasHeader() ? TableCellHeaderStates.NO_STATUS : TableCellHeaderStates.ROW,
          TableCellHeaderStates.ROW,
        );
      }
      applied = true;
    }, DISCRETE);
    return applied;
  },
};

/** The image node the selection is on, if any. Call inside an update or read. */
function $selectedImage(): ImageNode | null {
  const selection = $getSelection();
  if (!selection) return null;
  for (const node of selection.getNodes()) {
    if ($isImageNode(node)) return node;
    const parent = $findMatchingParent(node, $isImageNode);
    if (parent) return parent;
  }
  return null;
}

/** The table the selection is inside, if any. Call inside an update or read. */
function $selectedTable(): TableNode | null {
  const selection = $getSelection();
  if (!selection) return null;
  const [first] = selection.getNodes();
  if (!first) return null;
  if ($isTableNode(first)) return first;
  return $findMatchingParent(first, $isTableNode) ?? null;
}

/** Runs a table operation inside an update, reporting whether it applied. */
function $withTable(editor: LexicalEditor, operation: () => void): boolean {
  let applied = false;
  editor.update(() => {
    if (!$selectedTable()) return;
    operation();
    applied = true;
  }, DISCRETE);
  return applied;
}

/** Registers the listeners that keep `canUndo` / `canRedo` current. */
export function registerHistoryState(
  editor: LexicalEditor,
  onChange: (state: { canUndo?: boolean; canRedo?: boolean }) => void,
): () => void {
  const unregisterUndo = editor.registerCommand(
    CAN_UNDO_COMMAND,
    (canUndo: boolean) => {
      onChange({ canUndo });
      return false;
    },
    1,
  );
  const unregisterRedo = editor.registerCommand(
    CAN_REDO_COMMAND,
    (canRedo: boolean) => {
      onChange({ canRedo });
      return false;
    },
    1,
  );
  return () => {
    unregisterUndo();
    unregisterRedo();
  };
}
