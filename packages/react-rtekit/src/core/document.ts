import type {
  BlockNode,
  EditorDocument,
  InlineNode,
  ListItemNode,
  ListNode,
  Mark,
  MarkName,
  ParagraphNode,
} from '../types/document.js';
import type { CountUnit } from '../types/common.js';

/**
 * Document-model helpers.
 *
 * This is where the two most damaging bugs of the old editor are fixed: `isEmpty`
 * ignores empty blocks rather than trusting string truthiness (R2), and length counts
 * *text*, never markup (R3).
 *
 * @module
 */

/** How a merge tag contributes to the character count. */
export type MergeTagLengthMode = 'label' | 'key' | 'zero';

/** Options for {@link documentToText} and the counting helpers. */
export interface TextOptions {
  /** Inserted between blocks. @default '\n' */
  blockSeparator?: string;
  /** How a merge tag contributes to the count. @default 'label' */
  mergeTagLengthMode?: MergeTagLengthMode;
  /** Renders list items with a marker, as `getPlainTextAlternative` does. @default false */
  listMarkers?: boolean;
  /** Renders links as `text (url)`, as `getPlainTextAlternative` does. @default false */
  linkUrls?: boolean;
  /**
   * Renders merge tags with their delimiters, e.g. `{company_name}`.
   *
   * The e-mail `text/plain` part needs this, because the backend substitutes the same
   * tokens in both parts of the message. Counting does not: there, a tag is worth its
   * label.
   */
  mergeTagSyntax?: { open: string; close: string };
}

/**
 * Whitespace that does not count as content.
 *
 * `String.prototype.trim` also removes U+00A0, which would make `<p>&nbsp;</p>` look
 * empty — but the author typed that character and it renders, so emptiness has to be
 * decided on ASCII whitespace only.
 */
// eslint-disable-next-line no-control-regex -- matching whitespace control characters is the point
const BLANK = /^[\u0009\u000A\u000B\u000C\u000D\u0020\u2028\u2029]*$/;

/** True when a string holds nothing but collapsible whitespace. */
export function isBlank(text: string): boolean {
  return BLANK.test(text);
}

/** An empty document: one empty paragraph, which is what an empty editor holds. */
export function createEmptyDocument(): EditorDocument {
  return { type: 'doc', version: 1, content: [{ type: 'paragraph', content: [] }] };
}

/** Wraps blocks in a document envelope. */
export function createDocument(content: BlockNode[]): EditorDocument {
  return { type: 'doc', version: 1, content: content.length > 0 ? content : [{ type: 'paragraph', content: [] }] };
}

/** True for a well-formed document object. */
export function isEditorDocument(value: unknown): value is EditorDocument {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as EditorDocument).type === 'doc' &&
    Array.isArray((value as EditorDocument).content)
  );
}

// ─── traversal ───────────────────────────────────────────────────────────────

/** Every block in the document, including those nested in quotes, lists and tables. */
export function* walkBlocks(doc: EditorDocument): Generator<BlockNode> {
  function* visit(blocks: BlockNode[]): Generator<BlockNode> {
    for (const block of blocks) {
      yield block;
      if (block.type === 'blockquote') yield* visit(block.content);
      else if (block.type === 'table') {
        for (const row of block.rows) for (const cell of row.cells) yield* visit(cell.content);
      } else if (block.type === 'list') {
        for (const item of block.items) if (item.children) yield* visit(item.children);
      }
    }
  }
  yield* visit(doc.content);
}

/** Every inline node in the document, in document order. */
export function* walkInline(doc: EditorDocument): Generator<InlineNode> {
  function* fromInline(nodes: InlineNode[]): Generator<InlineNode> {
    for (const node of nodes) {
      yield node;
      if (node.type === 'link') yield* fromInline(node.content);
    }
  }
  for (const block of walkBlocks(doc)) {
    if ('content' in block && Array.isArray(block.content)) {
      const content = block.content as (InlineNode | BlockNode)[];
      // Blockquotes hold blocks; everything else with `content` holds inline nodes.
      if (block.type !== 'blockquote') yield* fromInline(content as InlineNode[]);
    }
    if (block.type === 'list') {
      for (const item of block.items) yield* fromInline(item.content);
    }
  }
}

// ─── emptiness ───────────────────────────────────────────────────────────────

/** True when an inline node contributes nothing visible. */
function isInlineEmpty(node: InlineNode): boolean {
  switch (node.type) {
    case 'text':
      // A non-breaking space is real content: the user typed it and it renders.
      return node.text === '';
    case 'lineBreak':
      return true;
    case 'link':
      return node.content.every(isInlineEmpty);
    case 'mergeTag':
    case 'mention':
    case 'emoji':
      return false;
    default:
      return false;
  }
}

/** True when a block contributes nothing visible. */
function isBlockEmpty(block: BlockNode): boolean {
  switch (block.type) {
    case 'paragraph':
    case 'heading':
      return block.content.every(isInlineEmpty);
    case 'blockquote':
      return block.content.every(isBlockEmpty);
    case 'list':
      return block.items.every(
        (item) => item.content.every(isInlineEmpty) && (item.children ?? []).every(isBlockEmpty),
      );
    case 'codeBlock':
      return block.text.trim() === '';
    case 'horizontalRule':
    case 'image':
    case 'table':
      return false;
    case 'html':
      return block.html.trim() === '';
    default:
      return true;
  }
}

/**
 * True when the document holds nothing a reader would see (fixes R2).
 *
 * `''`, `<p></p>`, `<p><br></p>`, whitespace-only content and a document of nothing but
 * empty blocks are all empty. `<p>&nbsp;</p>` is **not**: the author typed a character.
 *
 * @example
 * ```ts
 * isEmptyDocument(htmlToDocument('<p><br></p>'));   // true
 * isEmptyDocument(htmlToDocument('<p>&nbsp;</p>')); // false
 * ```
 */
export function isEmptyDocument(doc: EditorDocument): boolean {
  if (doc.content.length === 0) return true;

  // Anything atomic is content even with no text at all.
  for (const block of walkBlocks(doc)) {
    if (block.type === 'image' || block.type === 'horizontalRule' || block.type === 'table') return false;
    if (block.type === 'codeBlock' && !isBlank(block.text)) return false;
    if (block.type === 'html' && !isBlank(block.html)) return false;
  }
  for (const node of walkInline(doc)) {
    if (node.type === 'mergeTag' || node.type === 'mention' || node.type === 'emoji') return false;
  }

  // Everything else comes down to the text: whitespace-only content is empty, so
  // trailing spaces in an otherwise blank message do not pass a `required` check,
  // while a deliberate non-breaking space does.
  return isBlank(documentToText(doc));
}

// ─── text extraction ─────────────────────────────────────────────────────────

/** `TextOptions` with every default filled in. */
type ResolvedTextOptions = Required<Omit<TextOptions, 'mergeTagSyntax'>> &
  Pick<TextOptions, 'mergeTagSyntax'>;

function mergeTagText(
  node: Extract<InlineNode, { type: 'mergeTag' }>,
  options: ResolvedTextOptions,
): string {
  // With an explicit syntax the tag keeps its delimiters, because the backend has to
  // find the same token in the text part that it finds in the HTML part.
  if (options.mergeTagSyntax) {
    return options.mergeTagSyntax.open + node.key + options.mergeTagSyntax.close;
  }
  if (options.mergeTagLengthMode === 'zero') return '';
  if (options.mergeTagLengthMode === 'key') return node.key;
  return node.label ?? node.key;
}

function inlineToText(nodes: InlineNode[], options: ResolvedTextOptions): string {
  let out = '';
  for (const node of nodes) {
    switch (node.type) {
      case 'text':
        out += node.text;
        break;
      case 'lineBreak':
        out += '\n';
        break;
      case 'link': {
        const inner = inlineToText(node.content, options);
        out += options.linkUrls && node.href && inner !== node.href ? `${inner} (${node.href})` : inner;
        break;
      }
      case 'mergeTag':
        out += mergeTagText(node, options);
        break;
      case 'mention':
        out += node.label;
        break;
      case 'emoji':
        out += node.char;
        break;
      default:
        break;
    }
  }
  return out;
}

function blockToText(block: BlockNode, options: ResolvedTextOptions, depth: number): string[] {
  switch (block.type) {
    case 'paragraph':
    case 'heading':
      return [inlineToText(block.content, options)];
    case 'blockquote':
      return block.content.flatMap((child) => blockToText(child, options, depth));
    case 'codeBlock':
      return [block.text];
    case 'horizontalRule':
      return options.listMarkers ? ['---'] : [''];
    case 'image':
      return options.listMarkers && block.alt ? [`[${block.alt}]`] : [''];
    case 'html':
      return [''];
    case 'table':
      return block.rows.flatMap((row) => [
        row.cells
          .map((cell) => cell.content.flatMap((child) => blockToText(child, options, depth)).join(' '))
          .join('\t'),
      ]);
    case 'list':
      return listToText(block, options, depth);
    default:
      return [''];
  }
}

function listToText(list: ListNode, options: ResolvedTextOptions, depth: number): string[] {
  const lines: string[] = [];
  list.items.forEach((item: ListItemNode, index) => {
    const text = inlineToText(item.content, options);
    if (options.listMarkers) {
      const indent = '  '.repeat(depth);
      const marker =
        list.listType === 'ordered'
          ? `${(list.start ?? 1) + index}.`
          : list.listType === 'check'
            ? item.checked
              ? '[x]'
              : '[ ]'
            : '-';
      lines.push(`${indent}${marker} ${text}`);
    } else {
      lines.push(text);
    }
    for (const child of item.children ?? []) lines.push(...blockToText(child, options, depth + 1));
  });
  return lines;
}

/**
 * Extracts the visible text of a document.
 *
 * @example
 * ```ts
 * documentToText(doc);                       // 'Hi Jane\nSecond line'
 * documentToText(doc, { listMarkers: true, linkUrls: true }); // e-mail text/plain part
 * ```
 */
export function documentToText(doc: EditorDocument, options: TextOptions = {}): string {
  const resolved: ResolvedTextOptions = {
    blockSeparator: options.blockSeparator ?? '\n',
    mergeTagLengthMode: options.mergeTagLengthMode ?? 'label',
    listMarkers: options.listMarkers ?? false,
    linkUrls: options.linkUrls ?? false,
    ...(options.mergeTagSyntax ? { mergeTagSyntax: options.mergeTagSyntax } : {}),
  };
  const lines = doc.content.flatMap((block) => blockToText(block, resolved, 0));
  return lines.join(resolved.blockSeparator);
}

// ─── counting ────────────────────────────────────────────────────────────────

/**
 * Counts characters or words in a string.
 *
 * Characters are counted by code point, so an emoji counts as one and not two.
 *
 * @example
 * ```ts
 * countText('hello world');            // 11
 * countText('hello world', 'words');   // 2
 * ```
 */
export function countText(text: string, unit: CountUnit = 'characters'): number {
  if (unit === 'words') {
    const trimmed = text.trim();
    return trimmed === '' ? 0 : trimmed.split(/\s+/).length;
  }
  // Code points, not UTF-16 units: an emoji is one character to the person typing it.
  // Code points, not UTF-16 units: an emoji is one character to the person typing it.
  // eslint-disable-next-line @typescript-eslint/no-misused-spread -- code points are intended
  return [...text].length;
}

/**
 * Counts a document's visible content, never its markup (fixes R3).
 *
 * @example
 * ```ts
 * // 2 000 characters of heavily formatted text still counts as 2 000.
 * countDocument(doc, 'characters');
 * ```
 */
export function countDocument(
  doc: EditorDocument,
  unit: CountUnit = 'characters',
  mergeTagLengthMode: MergeTagLengthMode = 'label',
): number {
  return countText(documentToText(doc, { mergeTagLengthMode }), unit);
}

// ─── merge tags ──────────────────────────────────────────────────────────────

/** Every merge-tag key present in the document, in document order, de-duplicated. */
export function collectMergeTags(doc: EditorDocument): string[] {
  const keys: string[] = [];
  for (const node of walkInline(doc)) {
    if (node.type === 'mergeTag' && !keys.includes(node.key)) keys.push(node.key);
  }
  return keys;
}

/**
 * Reports merge-tag keys that are not in the allowed list.
 *
 * @returns the unknown keys, in document order
 *
 * @example
 * ```ts
 * validateMergeTagKeys(doc, ['company_name']); // ['contact_frist_name']
 * ```
 */
export function validateMergeTagKeys(doc: EditorDocument, allowedKeys: string[]): string[] {
  const allowed = new Set(allowedKeys);
  return collectMergeTags(doc).filter((key) => !allowed.has(key));
}

// ─── marks ───────────────────────────────────────────────────────────────────

/** Looks a mark up on an inline node. */
export function findMark<T extends MarkName>(
  marks: Mark[] | undefined,
  type: T,
): Extract<Mark, { type: T }> | undefined {
  return marks?.find((mark): mark is Extract<Mark, { type: T }> => mark.type === type);
}

/** True when two mark lists are equivalent, ignoring order. */
export function marksEqual(a: Mark[] | undefined, b: Mark[] | undefined): boolean {
  const left = a ?? [];
  const right = b ?? [];
  if (left.length !== right.length) return false;
  return left.every((mark) => {
    const other = right.find((candidate) => candidate.type === mark.type);
    if (!other) return false;
    return 'value' in mark ? 'value' in other && mark.value === other.value : true;
  });
}

/** Sorts marks into a canonical order, so serialization is deterministic. */
const MARK_ORDER: MarkName[] = [
  'bold',
  'italic',
  'underline',
  'strike',
  'code',
  'subscript',
  'superscript',
  'color',
  'backgroundColor',
  'fontFamily',
  'fontSize',
];

/** Returns the marks in canonical order. */
export function sortMarks(marks: Mark[]): Mark[] {
  return [...marks].sort((a, b) => MARK_ORDER.indexOf(a.type) - MARK_ORDER.indexOf(b.type));
}

// ─── normalization ───────────────────────────────────────────────────────────

/** Merges adjacent text nodes carrying equivalent marks. */
function mergeInline(nodes: InlineNode[]): InlineNode[] {
  const out: InlineNode[] = [];
  for (const node of nodes) {
    const previous = out[out.length - 1];
    if (node.type === 'text' && previous?.type === 'text' && marksEqual(previous.marks, node.marks)) {
      previous.text += node.text;
      continue;
    }
    if (node.type === 'link') {
      out.push({ ...node, content: mergeInline(node.content) });
      continue;
    }
    out.push(node);
  }
  // Drop empty text runs, but keep a lone empty run so an empty paragraph survives.
  return out.filter((node) => !(node.type === 'text' && node.text === ''));
}

function normalizeBlock(block: BlockNode): BlockNode {
  switch (block.type) {
    case 'paragraph':
    case 'heading':
      return { ...block, content: mergeInline(block.content) };
    case 'blockquote':
      return { ...block, content: block.content.map(normalizeBlock) };
    case 'list':
      return {
        ...block,
        items: block.items.map((item) => ({
          ...item,
          content: mergeInline(item.content),
          ...(item.children ? { children: item.children.map(normalizeBlock) as ListNode[] } : {}),
        })),
      };
    case 'table':
      return {
        ...block,
        rows: block.rows.map((row) => ({
          ...row,
          cells: row.cells.map((cell) => ({ ...cell, content: cell.content.map(normalizeBlock) })),
        })),
      };
    default:
      return block;
  }
}

/** Options for {@link normalizeDocument}. */
export interface NormalizeOptions {
  /** Append a final empty paragraph so the caret can always escape. @default true */
  trailingParagraph?: boolean;
  /** Collapse runs of empty paragraphs into one. @default false */
  collapseEmptyBlocks?: boolean;
}

/**
 * Applies the schema normalization rules.
 *
 * Runs after every parse and paste: merges adjacent identical marks, drops empty inline
 * nodes, optionally collapses empty blocks, and keeps a trailing paragraph so the user
 * can always get out of a table or a quote.
 */
export function normalizeDocument(
  doc: EditorDocument,
  options: NormalizeOptions = {},
): EditorDocument {
  const trailingParagraph = options.trailingParagraph ?? true;
  const collapseEmptyBlocks = options.collapseEmptyBlocks ?? false;

  let content = doc.content.map(normalizeBlock);

  if (collapseEmptyBlocks) {
    content = content.filter((block, index) => {
      if (!isBlockEmpty(block) || block.type !== 'paragraph') return true;
      const previous = content[index - 1];
      return !(previous?.type === 'paragraph' && isBlockEmpty(previous));
    });
  }

  if (content.length === 0) {
    content = [{ type: 'paragraph', content: [] }];
  } else if (trailingParagraph) {
    const last = content[content.length - 1]!;
    if (last.type === 'table' || last.type === 'horizontalRule' || last.type === 'codeBlock') {
      const trailing: ParagraphNode = { type: 'paragraph', content: [] };
      content = [...content, trailing];
    }
  }

  return { type: 'doc', version: 1, content };
}
