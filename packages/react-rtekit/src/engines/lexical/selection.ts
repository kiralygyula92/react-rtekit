import {
  $getRoot,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $isTextNode,
  type LexicalNode,
  type RangeSelection,
} from 'lexical';
import { $isHeadingNode, $isQuoteNode } from '@lexical/rich-text';
import { $isListItemNode, $isListNode, ListNode } from '@lexical/list';
import { $isLinkNode } from '@lexical/link';
import { $findMatchingParent, $getNearestNodeOfType } from '@lexical/utils';
import type { Align, HeadingLevel } from '../../types/document.js';
import type { EditorPoint, EditorSelection, FormatState, LinkAttrs } from '../../types/selection.js';
import { parseStyle } from '../../core/sanitize/css.js';
import { normalizeColor } from '../../core/utils/color.js';

/**
 * Selection and format state.
 *
 * Format state is recomputed on **every** selection and content change, including the
 * collapse to no selection, which is what keeps the toolbar honest after a blur
 * (fixes R8) and gives alignment one canonical value (fixes R6).
 *
 * @module
 */

/** The index chain from the root to a node. */
function pathOf(node: LexicalNode): number[] {
  const path: number[] = [];
  let current: LexicalNode | null = node;
  while (current) {
    const parent: LexicalNode | null = current.getParent();
    if (!parent) break;
    path.unshift(current.getIndexWithinParent());
    current = parent;
  }
  return path;
}

/** Resolves a path back to a node, or `null` when the document has changed under it. */
function nodeAtPath(path: number[]): LexicalNode | null {
  let current: LexicalNode = $getRoot();
  for (const index of path) {
    if (!$isElementNode(current)) return null;
    const child: LexicalNode | undefined = current.getChildren()[index];
    if (!child) return null;
    current = child;
  }
  return current;
}

/** Converts Lexical's selection into the engine-independent shape. */
export function $readSelection(): EditorSelection | null {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) return null;

  const anchorNode = selection.anchor.getNode();
  const focusNode = selection.focus.getNode();
  const anchor: EditorPoint = { path: pathOf(anchorNode), offset: selection.anchor.offset };
  const focus: EditorPoint = { path: pathOf(focusNode), offset: selection.focus.offset };

  return {
    anchor,
    focus,
    isCollapsed: selection.isCollapsed(),
    isBackward: selection.isBackward(),
  };
}

/** Restores a selection previously read with {@link $readSelection}. */
export function $applySelection(selection: EditorSelection): boolean {
  const anchorNode = nodeAtPath(selection.anchor.path);
  const focusNode = nodeAtPath(selection.focus.path);
  if (!anchorNode || !focusNode) return false;

  const range = $getSelection();
  if (!$isRangeSelection(range)) {
    // No live selection to mutate: set one from the resolved nodes instead.
    if ($isTextNode(anchorNode) && $isTextNode(focusNode)) {
      anchorNode.select(selection.anchor.offset, selection.focus.offset);
      return true;
    }
    if ($isElementNode(anchorNode)) {
      anchorNode.selectEnd();
      return true;
    }
    return false;
  }

  const anchorType = $isTextNode(anchorNode) ? 'text' : 'element';
  const focusType = $isTextNode(focusNode) ? 'text' : 'element';
  range.anchor.set(anchorNode.getKey(), selection.anchor.offset, anchorType);
  range.focus.set(focusNode.getKey(), selection.focus.offset, focusType);
  return true;
}

const ALIGN_BY_FORMAT: Record<string, Align> = {
  left: 'left',
  center: 'center',
  right: 'right',
  justify: 'justify',
  start: 'left',
  end: 'right',
};

/** The value of an inline style property across the selection, or `null` if mixed. */
function styleValue(selection: RangeSelection, property: string): string | null {
  const nodes = selection.getNodes().filter($isTextNode);
  if (nodes.length === 0) {
    const pending = parseStyle(selection.style).find((entry) => entry.property === property);
    return pending ? pending.value : null;
  }
  let value: string | null = null;
  for (const node of nodes) {
    const declaration = parseStyle(node.getStyle()).find((entry) => entry.property === property);
    const current = declaration ? declaration.value : null;
    if (value === null) value = current;
    else if (value !== current) return null;
    if (current === null) return null;
  }
  return value;
}

/** The empty state, used before the engine has a selection. */
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

/**
 * Reads the formatting that applies to the current selection.
 *
 * Must be called inside an editor read or update.
 */
export function $readFormatState(base: Pick<FormatState, 'canUndo' | 'canRedo' | 'isEmpty'>): FormatState {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) {
    return emptyFormatState({ ...base, isCollapsed: true });
  }

  const anchorNode = selection.anchor.getNode();
  const block =
    $findMatchingParent(anchorNode, (node) => $isElementNode(node) && !node.isInline()) ??
    anchorNode.getTopLevelElement();

  let blockType: FormatState['block']['type'] = 'paragraph';
  let headingLevel: HeadingLevel | undefined;
  if ($isHeadingNode(block)) {
    blockType = 'heading';
    headingLevel = Number(block.getTag().slice(1)) as HeadingLevel;
  } else if ($isQuoteNode(block)) {
    blockType = 'blockquote';
  } else if ($isListItemNode(block)) {
    blockType = 'listItem';
  } else if (block?.getType() === 'code') {
    blockType = 'codeBlock';
  }

  const listItem = $getNearestNodeOfType($isListItemNode(block) ? block : anchorNode, ListNode);
  const listNode = listItem ?? ($isListNode(block) ? block : null);
  const listType = listNode
    ? listNode.getListType() === 'number'
      ? 'ordered'
      : listNode.getListType() === 'check'
        ? 'check'
        : 'bullet'
    : null;

  let depth = 0;
  if (listNode) {
    let current: LexicalNode | null = listNode;
    while (current) {
      if ($isListNode(current)) depth += 1;
      current = current.getParent();
    }
  }

  const linkNode = $findMatchingParent(anchorNode, $isLinkNode);
  const link: LinkAttrs | null = linkNode
    ? {
        href: linkNode.getURL(),
        ...(linkNode.getTarget() ? { target: linkNode.getTarget()! } : {}),
        ...(linkNode.getRel() ? { rel: linkNode.getRel()! } : {}),
        ...(linkNode.getTitle() ? { title: linkNode.getTitle()! } : {}),
      }
    : null;

  const alignSource = $isElementNode(block) ? block : null;
  const align = alignSource ? (ALIGN_BY_FORMAT[alignSource.getFormatType()] ?? 'left') : 'left';
  const indent = alignSource ? alignSource.getIndent() : 0;

  return {
    marks: {
      bold: selection.hasFormat('bold'),
      italic: selection.hasFormat('italic'),
      underline: selection.hasFormat('underline'),
      strike: selection.hasFormat('strikethrough'),
      code: selection.hasFormat('code'),
      subscript: selection.hasFormat('subscript'),
      superscript: selection.hasFormat('superscript'),
      color: normalizeColor(styleValue(selection, 'color')),
      backgroundColor: normalizeColor(styleValue(selection, 'background-color')),
      fontFamily: styleValue(selection, 'font-family'),
      fontSize: styleValue(selection, 'font-size'),
    },
    block: { type: blockType, ...(headingLevel ? { headingLevel } : {}), align, indent },
    list: { type: listType, depth },
    link,
    canUndo: base.canUndo,
    canRedo: base.canRedo,
    isEmpty: base.isEmpty,
    isCollapsed: selection.isCollapsed(),
  };
}
