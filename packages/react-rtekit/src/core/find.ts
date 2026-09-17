import type { BlockNode, EditorDocument, InlineNode } from '../types/document.js';
import type { FindOptions } from '../types/editor.js';

/**
 * Find and replace over the portable document (05 §16).
 *
 * Working on the document rather than the DOM means a match is found wherever it
 * really is — including one that straddles a formatting boundary, where the DOM has
 * `<strong>wa</strong>ter` and the author is looking for "water". Replacing such a
 * match keeps the first run's formatting, which is what every editor does and what
 * authors expect.
 *
 * @module
 */

/** Where a match sits: the block, and the offsets within that block's text. */
export interface FindMatch {
  /** Index of the block in `doc.content`. */
  block: number;
  /** Offset in the block's concatenated text. */
  start: number;
  end: number;
  /** The text that matched, for a case-preserving replacement. */
  text: string;
}

/** Escapes a literal query for use in a regular expression. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Builds the regular expression for a query.
 *
 * Returns `null` for a regex query that does not compile, so a half-typed pattern
 * shows "no results" rather than throwing while the author is still typing.
 */
export function buildFindPattern(query: string, options: FindOptions = {}): RegExp | null {
  if (query === '') return null;
  const source = options.regex ? query : escapeRegExp(query);
  const bounded = options.wholeWord ? `\\b(?:${source})\\b` : source;
  try {
    return new RegExp(bounded, options.matchCase ? 'g' : 'gi');
  } catch {
    return null;
  }
}

/** The inline nodes of a block, or an empty list for blocks that hold no text. */
function inlineContent(block: BlockNode): InlineNode[] {
  if ('content' in block && Array.isArray(block.content)) {
    return block.content.every((child) => 'type' in child && isInline(child))
      ? (block.content as InlineNode[])
      : [];
  }
  return [];
}

/** True for the inline node types that carry text. */
function isInline(node: { type: string }): boolean {
  return ['text', 'link', 'mergeTag', 'mention', 'emoji', 'lineBreak'].includes(node.type);
}

/** The text of one inline node, as it contributes to the block's text. */
function inlineText(node: InlineNode): string {
  switch (node.type) {
    case 'text':
      return node.text;
    case 'lineBreak':
      return '\n';
    case 'emoji':
      return node.char;
    case 'mention':
      return node.label;
    case 'mergeTag':
      return `{${node.key}}`;
    case 'link':
      return node.content.map(inlineText).join('');
    default:
      return '';
  }
}

/** A block's text, the coordinate space matches are expressed in. */
export function blockText(block: BlockNode): string {
  if (block.type === 'codeBlock') return block.text;
  if (block.type === 'list') {
    return block.items.map((item) => item.content.map(inlineText).join('')).join('\n');
  }
  if (block.type === 'blockquote') return block.content.map(blockText).join('\n');
  return inlineContent(block).map(inlineText).join('');
}

/**
 * Every match in the document, in reading order.
 *
 * @example
 * ```ts
 * findMatches(doc, 'water', { matchCase: false }).length; // 3
 * ```
 */
export function findMatches(
  doc: EditorDocument,
  query: string,
  options: FindOptions = {},
): FindMatch[] {
  const pattern = buildFindPattern(query, options);
  if (!pattern) return [];

  const matches: FindMatch[] = [];
  doc.content.forEach((block, index) => {
    const text = blockText(block);
    pattern.lastIndex = 0;
    for (let match = pattern.exec(text); match !== null; match = pattern.exec(text)) {
      // A zero-length match — `a*` against "bbb" — would loop forever.
      if (match[0] === '') {
        pattern.lastIndex += 1;
        continue;
      }
      matches.push({
        block: index,
        start: match.index,
        end: match.index + match[0].length,
        text: match[0],
      });
    }
  });
  return matches;
}

/**
 * Rewrites the text of one block, replacing the given ranges.
 *
 * Ranges are in the block's text coordinates and are applied from the end, so earlier
 * offsets stay valid. The formatting of the run a match starts in is what the
 * replacement inherits.
 */
function replaceInInline(
  nodes: InlineNode[],
  ranges: { start: number; end: number; replacement: string }[],
): InlineNode[] {
  if (ranges.length === 0) return nodes;

  // Flatten to (node, offset) so a match spanning several runs can be handled.
  const result: InlineNode[] = nodes.map((node) => ({ ...node }));
  const ordered = [...ranges].sort((a, b) => b.start - a.start);

  for (const range of ordered) {
    let cursor = 0;
    let startNode = -1;
    let startOffset = 0;
    let endNode = -1;
    let endOffset = 0;

    result.forEach((node, index) => {
      const length = inlineText(node).length;
      if (startNode < 0 && cursor + length > range.start) {
        startNode = index;
        startOffset = range.start - cursor;
      }
      if (endNode < 0 && cursor + length >= range.end) {
        endNode = index;
        endOffset = range.end - cursor;
      }
      cursor += length;
    });

    if (startNode < 0 || endNode < 0) continue;
    const first = result[startNode]!;
    const last = result[endNode]!;
    // Only plain text runs are rewritten: replacing half of a merge tag or a mention
    // would produce a chip whose label no longer matches its key (03 §6).
    if (first.type !== 'text' || last.type !== 'text') continue;

    const head = first.text.slice(0, startOffset);
    const tail = last.text.slice(endOffset);
    const merged: InlineNode = { ...first, text: `${head}${range.replacement}${tail}` };
    result.splice(startNode, endNode - startNode + 1, merged);
  }

  return result.filter((node) => node.type !== 'text' || node.text !== '');
}

/**
 * Replaces matches in a document, returning a new one.
 *
 * `which` is a match index, or `'all'`. The document is not mutated.
 *
 * @example
 * ```ts
 * const next = replaceMatches(doc, 'water', 'Water', { matchCase: true }, 'all');
 * ```
 */
export function replaceMatches(
  doc: EditorDocument,
  query: string,
  replacement: string,
  options: FindOptions = {},
  which: number | 'all' = 'all',
): { document: EditorDocument; replaced: number } {
  const matches = findMatches(doc, query, options);
  const targets = which === 'all' ? matches : matches.filter((_match, index) => index === which);
  if (targets.length === 0) return { document: doc, replaced: 0 };

  const byBlock = new Map<number, { start: number; end: number; replacement: string }[]>();
  for (const match of targets) {
    const list = byBlock.get(match.block) ?? [];
    list.push({ start: match.start, end: match.end, replacement });
    byBlock.set(match.block, list);
  }

  let replaced = 0;
  const content = doc.content.map((block, index) => {
    const ranges = byBlock.get(index);
    if (!ranges) return block;

    if (block.type === 'codeBlock') {
      let text = block.text;
      for (const range of [...ranges].sort((a, b) => b.start - a.start)) {
        text = text.slice(0, range.start) + range.replacement + text.slice(range.end);
        replaced += 1;
      }
      return { ...block, text };
    }

    if (block.type === 'list') {
      // List items are joined with newlines, so each item's ranges are its own slice
      // of the block's coordinate space.
      let offset = 0;
      const items = block.items.map((item) => {
        const length = item.content.map(inlineText).join('').length;
        const itemRanges = ranges
          .filter((range) => range.start >= offset && range.end <= offset + length)
          .map((range) => ({ ...range, start: range.start - offset, end: range.end - offset }));
        offset += length + 1;
        if (itemRanges.length === 0) return item;
        replaced += itemRanges.length;
        return { ...item, content: replaceInInline(item.content, itemRanges) };
      });
      return { ...block, items };
    }

    const nodes = inlineContent(block);
    if (nodes.length === 0) return block;
    replaced += ranges.length;
    // Narrowed by `inlineContent`: only blocks whose content is inline reach here,
    // and rewriting their runs cannot change which kind of block it is.
    return { ...block, content: replaceInInline(nodes, ranges) } as BlockNode;
  });

  return { document: { ...doc, content }, replaced };
}
