import {
  $createLineBreakNode,
  $createParagraphNode,
  $createTextNode,
  type ElementNode,
  type LexicalNode,
  type TextNode,
} from 'lexical';
import { $createHeadingNode, $createQuoteNode, type HeadingTagType } from '@lexical/rich-text';
import { $createListItemNode, $createListNode } from '@lexical/list';
import { $createLinkNode } from '@lexical/link';
import { $createCodeNode } from '@lexical/code';
import {
  $createTableCellNode,
  $createTableNode,
  $createTableRowNode,
  TableCellHeaderStates,
} from '@lexical/table';
import type {
  Align,
  BlockNode,
  EditorDocument,
  InlineNode,
  ListNode as RteListNode,
  TableNode as RteTableNode,
  Mark,
} from '../../../types/document.js';
import { serializeStyle, type CssDeclaration } from '../../../core/sanitize/css.js';
import { $createMergeTagNode } from '../nodes/merge-tag.js';
import { $createMentionNode } from '../nodes/mention.js';
import { $createImageNode } from '../nodes/image.js';
import { $createHorizontalRuleNode } from '../nodes/horizontal-rule.js';

/**
 * The portable document model to Lexical nodes.
 *
 * The inverse of `to-document.ts`. Both directions are deliberately explicit rather
 * than routed through HTML, so a `setContent` round-trip is stable.
 *
 * @module
 */

/** Marks that map onto Lexical's text-format flags. */
const FORMAT_BY_MARK: Partial<Record<Mark['type'], 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code' | 'subscript' | 'superscript'>> = {
  bold: 'bold',
  italic: 'italic',
  underline: 'underline',
  strike: 'strikethrough',
  code: 'code',
  subscript: 'subscript',
  superscript: 'superscript',
};

/** Marks that map onto an inline style declaration. */
const STYLE_BY_MARK: Partial<Record<Mark['type'], string>> = {
  color: 'color',
  backgroundColor: 'background-color',
  fontFamily: 'font-family',
  fontSize: 'font-size',
};

/** Applies a mark list to a freshly created text node. */
function applyMarks(node: TextNode, marks: Mark[] | undefined): TextNode {
  if (!marks || marks.length === 0) return node;
  const declarations: CssDeclaration[] = [];
  for (const mark of marks) {
    const format = FORMAT_BY_MARK[mark.type];
    if (format) {
      node.toggleFormat(format);
      continue;
    }
    const property = STYLE_BY_MARK[mark.type];
    if (property && 'value' in mark) declarations.push({ property, value: mark.value });
  }
  if (declarations.length > 0) node.setStyle(serializeStyle(declarations));
  return node;
}

/** Builds the Lexical nodes for a run of inline content. */
function createInline(nodes: InlineNode[]): LexicalNode[] {
  const out: LexicalNode[] = [];
  for (const node of nodes) {
    switch (node.type) {
      case 'text':
        out.push(applyMarks($createTextNode(node.text), node.marks));
        break;
      case 'lineBreak':
        out.push($createLineBreakNode());
        break;
      case 'mergeTag':
        out.push($createMergeTagNode(node.key, node.label ?? null));
        break;
      case 'mention':
        out.push($createMentionNode(node.id, node.label));
        break;
      case 'emoji':
        // An emoji is its character: a node type would add nothing a text node does
        // not already carry through copy, paste and every serializer.
        out.push($createTextNode(node.char));
        break;
      case 'link': {
        const link = $createLinkNode(node.href, {
          ...(node.target ? { target: node.target } : {}),
          ...(node.rel ? { rel: node.rel } : {}),
          ...(node.title ? { title: node.title } : {}),
        });
        link.append(...createInline(node.content));
        out.push(link);
        break;
      }
      default:
        break;
    }
  }
  return out;
}

/** Applies alignment and indent to a block element. */
function applyBlockAttrs(node: ElementNode, align?: Align, indent?: number): ElementNode {
  if (align && align !== 'left') node.setFormat(align);
  if (indent && indent > 0) node.setIndent(indent);
  return node;
}

function createList(list: RteListNode): ElementNode {
  const listNode = $createListNode(
    list.listType === 'ordered' ? 'number' : list.listType === 'check' ? 'check' : 'bullet',
    list.start ?? 1,
  );
  if (list.indent && list.indent > 0) listNode.setIndent(list.indent);

  for (const item of list.items) {
    const itemNode = $createListItemNode(item.checked);
    if (item.align && item.align !== 'left') itemNode.setFormat(item.align);
    itemNode.append(...createInline(item.content));
    listNode.append(itemNode);

    // Lexical models nesting as a sibling list item holding the nested list.
    for (const nested of item.children ?? []) {
      const wrapper = $createListItemNode();
      wrapper.append(createList(nested));
      listNode.append(wrapper);
    }
  }

  return listNode;
}

/** Builds a Lexical table, cell by cell. */
function createTable(table: RteTableNode): ElementNode {
  const tableNode = $createTableNode();

  for (const row of table.rows) {
    const rowNode = $createTableRowNode();
    for (const cell of row.cells) {
      const cellNode = $createTableCellNode(
        cell.header ? TableCellHeaderStates.ROW : TableCellHeaderStates.NO_STATUS,
        cell.colSpan ?? 1,
        // Lexical stores the width in pixels and treats `undefined` as "auto".
        cell.width,
      );
      if (cell.rowSpan && cell.rowSpan > 1) cellNode.setRowSpan(cell.rowSpan);
      if (cell.align && cell.align !== 'left') cellNode.setFormat(cell.align);
      // A cell always holds at least one block, or there is nowhere to put the caret.
      const blocks = cell.content.flatMap(createBlock);
      cellNode.append(...(blocks.length > 0 ? blocks : [$createParagraphNode()]));
      rowNode.append(cellNode);
    }
    tableNode.append(rowNode);
  }

  return tableNode;
}

/** Builds the Lexical nodes for one block. */
function createBlock(block: BlockNode): ElementNode[] {
  switch (block.type) {
    case 'paragraph': {
      const paragraph = $createParagraphNode();
      paragraph.append(...createInline(block.content));
      return [applyBlockAttrs(paragraph, block.align, block.indent)];
    }
    case 'heading': {
      const heading = $createHeadingNode(`h${block.level}` as HeadingTagType);
      heading.append(...createInline(block.content));
      return [applyBlockAttrs(heading, block.align, block.indent)];
    }
    case 'list':
      return [createList(block)];
    case 'blockquote': {
      const quote = $createQuoteNode();
      // Lexical's quote holds inline content, so nested blocks are flattened with a
      // line break between them.
      const parts = block.content.flatMap((child, index) =>
        'content' in child && Array.isArray(child.content) && child.type !== 'blockquote'
          ? [
              ...(index > 0 ? [{ type: 'lineBreak' as const }] : []),
              ...(child.content),
            ]
          : [],
      );
      quote.append(...createInline(parts));
      return [applyBlockAttrs(quote, block.align, block.indent)];
    }
    case 'codeBlock': {
      const code = $createCodeNode(block.language);
      // One text node with the newlines intact: Lexical's code block splits them into
      // lines itself when the author edits, and splitting here would double it.
      code.append($createTextNode(block.text));
      return [code];
    }
    case 'image':
      return [$createImageNode(block) as unknown as ElementNode];
    case 'horizontalRule':
      return [$createHorizontalRuleNode() as unknown as ElementNode];
    case 'table':
      return [createTable(block)];
    case 'html': {
      // Raw HTML only reaches here from the `permissive` profile. It has no
      // editable representation, so it becomes its text — losing the markup is the
      // point of every other profile, and this keeps the words.
      const paragraph = $createParagraphNode();
      paragraph.append($createTextNode(block.html.replace(/<[^>]*>/g, '')));
      return [paragraph];
    }
    default:
      return [];
  }
}

/**
 * Replaces the root's children with the document's blocks.
 *
 * Must be called inside `editor.update(...)`.
 */
export function $documentToRoot(root: ElementNode, doc: EditorDocument): void {
  root.clear();
  const blocks = doc.content.flatMap(createBlock);
  if (blocks.length === 0) blocks.push($createParagraphNode());
  root.append(...blocks);
}

/** Builds detached Lexical nodes for a document, for insertion at the selection. */
export function $documentToNodes(doc: EditorDocument): LexicalNode[] {
  return doc.content.flatMap(createBlock);
}
