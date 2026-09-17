import {
  $isElementNode,
  $isLineBreakNode,
  $isParagraphNode,
  $isTextNode,
  type ElementNode,
  type LexicalNode,
} from 'lexical';
import { $isHeadingNode, $isQuoteNode } from '@lexical/rich-text';
import { $isListItemNode, $isListNode, type ListItemNode, type ListNode as LexicalListNode } from '@lexical/list';
import { $isLinkNode } from '@lexical/link';
import { $isCodeNode } from '@lexical/code';
import { $isTableCellNode, $isTableNode, $isTableRowNode } from '@lexical/table';
import type {
  Align,
  BlockNode,
  EditorDocument,
  HeadingLevel,
  InlineNode,
  ListItemNode as RteListItemNode,
  ListNode as RteListNode,
  TableCellNode as RteTableCellNode,
  TableNode as RteTableNode,
  TableRowNode as RteTableRowNode,
  Mark,
} from '../../../types/document.js';
import { createDocument, sortMarks } from '../../../core/document.js';
import { parseStyle } from '../../../core/sanitize/css.js';
import { normalizeColor } from '../../../core/utils/color.js';
import { $isMergeTagNode } from '../nodes/merge-tag.js';
import { $isMentionNode } from '../nodes/mention.js';
import { $isImageNode } from '../nodes/image.js';
import { $isHorizontalRuleNode } from '../nodes/horizontal-rule.js';

/**
 * Lexical nodes to the portable document model.
 *
 * Converting directly rather than through HTML keeps alignment, indent levels and
 * merge tags exact: an HTML round-trip would flatten Lexical's `indent` into a pixel
 * padding and lose the distinction the schema cares about.
 *
 * @module
 */

const ALIGN_BY_FORMAT: Record<string, Align> = {
  left: 'left',
  center: 'center',
  right: 'right',
  justify: 'justify',
  start: 'left',
  end: 'right',
};

/** Reads a Lexical element's alignment, or `undefined` for the default. */
function readAlign(node: ElementNode): Align | undefined {
  const align = ALIGN_BY_FORMAT[node.getFormatType()];
  return align && align !== 'left' ? align : undefined;
}

/** Reads a Lexical element's indent level, or `undefined` for none. */
function readIndent(node: ElementNode): number | undefined {
  const indent = node.getIndent();
  return indent > 0 ? indent : undefined;
}

/** Turns a text node's format flags and inline style into marks. */
function readMarks(node: LexicalNode): Mark[] {
  if (!$isTextNode(node)) return [];
  const marks: Mark[] = [];
  if (node.hasFormat('bold')) marks.push({ type: 'bold' });
  if (node.hasFormat('italic')) marks.push({ type: 'italic' });
  if (node.hasFormat('underline')) marks.push({ type: 'underline' });
  if (node.hasFormat('strikethrough')) marks.push({ type: 'strike' });
  if (node.hasFormat('code')) marks.push({ type: 'code' });
  if (node.hasFormat('subscript')) marks.push({ type: 'subscript' });
  if (node.hasFormat('superscript')) marks.push({ type: 'superscript' });

  for (const { property, value } of parseStyle(node.getStyle())) {
    switch (property) {
      case 'color': {
        const color = normalizeColor(value);
        if (color) marks.push({ type: 'color', value: color });
        break;
      }
      case 'background-color': {
        const color = normalizeColor(value);
        if (color) marks.push({ type: 'backgroundColor', value: color });
        break;
      }
      case 'font-family':
        marks.push({ type: 'fontFamily', value });
        break;
      case 'font-size':
        marks.push({ type: 'fontSize', value });
        break;
      default:
        break;
    }
  }
  return sortMarks(marks);
}

/** Converts the inline children of an element. */
function readInline(node: ElementNode): InlineNode[] {
  const out: InlineNode[] = [];

  for (const child of node.getChildren()) {
    if ($isMergeTagNode(child)) {
      const label = child.getLabel();
      out.push({ type: 'mergeTag', key: child.getTagKey(), ...(label ? { label } : {}) });
      continue;
    }
    if ($isMentionNode(child)) {
      out.push({ type: 'mention', id: child.getMentionId(), label: child.getTextContent() });
      continue;
    }
    if ($isLineBreakNode(child)) {
      out.push({ type: 'lineBreak' });
      continue;
    }
    if ($isTextNode(child)) {
      const text = child.getTextContent();
      if (text === '') continue;
      const marks = readMarks(child);
      out.push({ type: 'text', text, ...(marks.length > 0 ? { marks } : {}) });
      continue;
    }
    if ($isLinkNode(child)) {
      const target = child.getTarget();
      const rel = child.getRel();
      const title = child.getTitle();
      out.push({
        type: 'link',
        href: child.getURL(),
        ...(target ? { target } : {}),
        ...(rel ? { rel } : {}),
        ...(title ? { title } : {}),
        content: readInline(child),
      });
      continue;
    }
    if ($isElementNode(child)) {
      // Any other inline wrapper contributes its children.
      out.push(...readInline(child));
    }
  }

  return out;
}

function readListItem(item: ListItemNode): RteListItemNode {
  const nestedLists: RteListNode[] = [];
  const inlineChildren: InlineNode[] = [];

  for (const child of item.getChildren()) {
    if ($isListNode(child)) {
      nestedLists.push(readList(child));
      continue;
    }
    if ($isMergeTagNode(child)) {
      const label = child.getLabel();
      inlineChildren.push({ type: 'mergeTag', key: child.getTagKey(), ...(label ? { label } : {}) });
      continue;
    }
    if ($isLineBreakNode(child)) {
      inlineChildren.push({ type: 'lineBreak' });
      continue;
    }
    if ($isTextNode(child)) {
      const text = child.getTextContent();
      if (text === '') continue;
      const marks = readMarks(child);
      inlineChildren.push({ type: 'text', text, ...(marks.length > 0 ? { marks } : {}) });
      continue;
    }
    if ($isElementNode(child)) inlineChildren.push(...readInline(child));
  }

  const checked = item.getChecked();
  const align = readAlign(item);
  return {
    type: 'listItem',
    ...(checked !== undefined ? { checked } : {}),
    ...(align ? { align } : {}),
    content: inlineChildren,
    ...(nestedLists.length > 0 ? { children: nestedLists } : {}),
  };
}

function readList(node: LexicalListNode): RteListNode {
  const listType = node.getListType();
  const start = node.getStart();
  const items: RteListItemNode[] = [];

  for (const child of node.getChildren()) {
    if (!$isListItemNode(child)) continue;
    // Lexical models nesting as a list item whose only child is a list. Those wrappers
    // carry no text of their own and would otherwise show up as empty items.
    const children = child.getChildren();
    const onlyNested = children.length > 0 && children.every((grandchild) => $isListNode(grandchild));
    if (onlyNested) {
      const previous = items[items.length - 1];
      const nested = children.filter($isListNode).map(readList);
      if (previous) previous.children = [...(previous.children ?? []), ...nested];
      else items.push({ type: 'listItem', content: [], children: nested });
      continue;
    }
    items.push(readListItem(child));
  }

  return {
    type: 'list',
    listType: listType === 'number' ? 'ordered' : listType === 'check' ? 'check' : 'bullet',
    ...(start && start !== 1 ? { start } : {}),
    ...(readIndent(node) ? { indent: readIndent(node) } : {}),
    items,
  };
}

/** Reads a Lexical table back into rows and cells. */
function readTable(node: ElementNode): RteTableNode {
  const rows: RteTableRowNode[] = [];

  for (const rowNode of node.getChildren()) {
    if (!$isTableRowNode(rowNode)) continue;
    const cells: RteTableCellNode[] = [];

    for (const cellNode of rowNode.getChildren()) {
      if (!$isTableCellNode(cellNode)) continue;
      const colSpan = cellNode.getColSpan();
      const rowSpan = cellNode.getRowSpan();
      const width = cellNode.getWidth();
      const align = readAlign(cellNode);
      const content: BlockNode[] = [];
      for (const child of cellNode.getChildren()) {
        const block = readBlock(child);
        if (block) content.push(block);
      }
      cells.push({
        type: 'tableCell',
        ...(cellNode.hasHeader() ? { header: true } : {}),
        ...(colSpan > 1 ? { colSpan } : {}),
        ...(rowSpan > 1 ? { rowSpan } : {}),
        ...(align ? { align } : {}),
        ...(width ? { width } : {}),
        content,
      });
    }

    rows.push({ type: 'tableRow', cells });
  }

  return { type: 'table', rows };
}

function readBlock(node: LexicalNode): BlockNode | null {
  if ($isImageNode(node)) return { type: 'image', ...node.getAttrs() };

  if ($isHorizontalRuleNode(node)) return { type: 'horizontalRule' };

  if ($isCodeNode(node)) {
    const language = node.getLanguage();
    return { type: 'codeBlock', ...(language ? { language } : {}), text: node.getTextContent() };
  }

  if ($isTableNode(node)) return readTable(node);

  if ($isHeadingNode(node)) {
    const level = Number(node.getTag().slice(1)) as HeadingLevel;
    const align = readAlign(node);
    const indent = readIndent(node);
    return {
      type: 'heading',
      level,
      ...(align ? { align } : {}),
      ...(indent ? { indent } : {}),
      content: readInline(node),
    };
  }

  if ($isQuoteNode(node)) {
    const align = readAlign(node);
    const indent = readIndent(node);
    return {
      type: 'blockquote',
      ...(align ? { align } : {}),
      ...(indent ? { indent } : {}),
      // Lexical's quote holds inline content directly, so it becomes one paragraph.
      content: [{ type: 'paragraph', content: readInline(node) }],
    };
  }

  if ($isListNode(node)) return readList(node);

  if ($isParagraphNode(node)) {
    const align = readAlign(node);
    const indent = readIndent(node);
    return {
      type: 'paragraph',
      ...(align ? { align } : {}),
      ...(indent ? { indent } : {}),
      content: readInline(node),
    };
  }

  if ($isElementNode(node)) {
    // A block type this build does not know: keep its text as a paragraph rather than
    // dropping the author's words.
    return { type: 'paragraph', content: readInline(node) };
  }

  return null;
}

/**
 * Converts the current Lexical document to the portable model.
 *
 * Must be called inside `editor.getEditorState().read(...)`.
 *
 * @example
 * ```ts
 * const doc = editor.getEditorState().read(() => $rootToDocument($getRoot()));
 * ```
 */
export function $rootToDocument(root: ElementNode): EditorDocument {
  const blocks: BlockNode[] = [];
  for (const child of root.getChildren()) {
    const block = readBlock(child);
    if (block) blocks.push(block);
  }
  return createDocument(blocks);
}
