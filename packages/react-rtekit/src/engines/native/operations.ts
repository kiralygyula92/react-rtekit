import type {
  Align,
  BlockNode,
  HeadingLevel,
  InlineNode,
  Mark,
  MarkName,
  TextNode,
} from '../../types/document.js';
import { sortMarks } from '../../core/document.js';
import { previousGraphemeBoundary } from '../../core/utils/graphemes.js';
import type { ModelSelection } from './selection.js';
import { blockOf, textRuns } from './selection.js';
import type { AnyNode, DocumentTree, NodeKey, TreeWriter } from './tree.js';
import { ROOT_KEY } from './tree.js';

/**
 * Model edits.
 *
 * Every content change the editor can make, expressed as a function from a tree and a
 * selection to a new selection. Nothing here touches the DOM: the caller applies these
 * inside `tree.update`, and the reconciler turns the resulting `TreeChange` into the
 * smallest possible DOM change.
 *
 * The primitive everything rests on is splitting a text run at a character offset. A user
 * selecting three characters in the middle of a word and pressing bold is asking for a
 * run to become three runs, and every mark operation reduces to that plus a change to
 * each covered run's `marks`.
 *
 * @module
 */

/** A tree and the writer that is allowed to change it, for the duration of one update. */
export interface EditContext {
  tree: DocumentTree;
  write: TreeWriter;
}

/** The text of a run, or `''` for anything else. */
function runText(tree: DocumentTree, key: NodeKey): string {
  const value = tree.get(key)?.value;
  return value?.type === 'text' ? value.text : '';
}

/** A run's marks, always a fresh array so a caller cannot mutate the tree by accident. */
function runMarks(tree: DocumentTree, key: NodeKey): Mark[] {
  const value = tree.get(key)?.value;
  return value?.type === 'text' ? [...(value.marks ?? [])] : [];
}

/**
 * Splits the run `key` at `offset`, returning the key holding the text after it.
 *
 * Returns `key` itself when the offset is at the start, and `null` at the end — in both
 * cases no split is needed and the caller already has the run it wanted.
 */
export function splitRun(context: EditContext, key: NodeKey, offset: number): NodeKey | null {
  const { tree, write } = context;
  const entry = tree.get(key);
  if (entry?.value.type !== 'text') return null;
  const text = entry.value.text;
  if (offset <= 0) return key;
  if (offset >= text.length) return null;

  const parent = tree.parent(key);
  if (parent === null || parent === undefined) return null;
  const at = tree.children(parent).indexOf(key);

  const marks = entry.value.marks;
  write.setValue(key, { ...entry.value, text: text.slice(0, offset) });
  const tail: TextNode = { type: 'text', text: text.slice(offset) };
  if (marks !== undefined && marks.length > 0) tail.marks = [...marks];
  return write.insert(parent, tail, at + 1, entry.slot ?? undefined);
}

/**
 * Every run a selection covers, with the selection's ends split off first.
 *
 * After this the selection covers each returned run *entirely*, which is what lets a mark
 * operation be "set the marks on these runs" rather than an offset calculation repeated
 * at every call site.
 */
export function runsInRange(context: EditContext, selection: ModelSelection): NodeKey[] {
  const { tree } = context;
  const [start, end] = ordered(selection);
  if (start.key === end.key) {
    if (start.offset === end.offset) return [];
    if (tree.get(start.key)?.value.type !== 'text') return [];
    // Split the tail first: splitting the head would move the offsets in the tail.
    splitRun(context, start.key, end.offset);
    const middle = splitRun(context, start.key, start.offset);
    return middle === null ? [] : [middle];
  }

  // An endpoint can name an atomic chip rather than a run — a browser's select-all puts
  // it there when the message ends in one — so the ends are split where they are text
  // and the span is taken in document order either way. Asking `textRuns` for the index
  // of a chip answered -1, and formatting the whole message then applied to nothing.
  if (tree.get(end.key)?.value.type === 'text') splitRun(context, end.key, end.offset);
  const head =
    tree.get(start.key)?.value.type === 'text'
      ? (splitRun(context, start.key, start.offset) ?? start.key)
      : start.key;

  const order = documentOrder(tree);
  const fromAt = tree.positionOf(head);
  const toAt = tree.positionOf(end.key);
  if (fromAt === -1 || toAt === -1) return [];
  const span = order.slice(Math.min(fromAt, toAt), Math.max(fromAt, toAt) + 1);
  const runs = span.filter((key) => tree.get(key)?.value.type === 'text');
  return runs;
}

/** The selection's two ends, in document order. */
function ordered(selection: ModelSelection): [ModelSelection['anchor'], ModelSelection['focus']] {
  return selection.isBackward
    ? [selection.focus, selection.anchor]
    : [selection.anchor, selection.focus];
}

/** Whether every run in `keys` carries `mark`, which is what presses a toolbar toggle. */
export function hasMark(tree: DocumentTree, keys: readonly NodeKey[], mark: MarkName): boolean {
  if (keys.length === 0) return false;
  return keys.every((key) => runMarks(tree, key).some((one) => one.type === mark));
}

/**
 * Marks that cannot apply to the same text at once.
 *
 * Subscript and superscript put a character below or above the line; there is no position
 * that is both, so turning one on turns the other off rather than stacking.
 */
const EXCLUSIVE = new Map<MarkName, MarkName>([
  ['subscript', 'superscript'],
  ['superscript', 'subscript'],
]);

/** Adds, removes or replaces a mark across a selection, and reports the new selection. */
export function setMark(
  context: EditContext,
  selection: ModelSelection,
  mark: Mark,
  on: boolean,
): ModelSelection {
  const keys = runsInRange(context, selection);
  for (const key of keys) {
    const excluded = EXCLUSIVE.get(mark.type);
    const marks = runMarks(context.tree, key).filter(
      (one) => one.type !== mark.type && !(on && excluded === one.type),
    );
    if (on) marks.push(mark);
    const value = context.tree.get(key)?.value;
    if (value?.type !== 'text') continue;
    const next: TextNode = { type: 'text', text: value.text };
    if (marks.length > 0) next.marks = sortMarks(marks);
    context.write.setValue(key, next);
  }
  return spanning(context.tree, keys, selection);
}

/** Toggles a boolean mark: on unless every covered run already has it. */
export function toggleMark(
  context: EditContext,
  selection: ModelSelection,
  mark: MarkName,
): ModelSelection {
  const preview = runsInRange(context, selection);
  const on = !hasMark(context.tree, preview, mark);
  const next = spanning(context.tree, preview, selection);
  return setMark(context, next, { type: mark } as Mark, on);
}

/**
 * Strips every mark from the selection.
 *
 * With `blocks`, also returns each touched block to a plain, unaligned, unindented
 * paragraph — which is what "clear formatting" means to someone who has just turned a
 * line into a centred heading and wants it undone.
 */
export function clearMarks(
  context: EditContext,
  selection: ModelSelection,
  blocks = false,
): ModelSelection {
  const keys = runsInRange(context, selection);
  for (const key of keys) {
    const value = context.tree.get(key)?.value;
    if (value?.type !== 'text') continue;
    context.write.setValue(key, { type: 'text', text: value.text });
  }
  const next = spanning(context.tree, keys, selection);
  if (blocks) {
    for (const key of blocksInRange(context.tree, next)) {
      const value = context.tree.get(key)?.value;
      if (value === undefined || value.type === 'listItem' || value.type === 'tableCell') continue;
      context.write.setValue(key, { type: 'paragraph', content: [] });
    }
  }
  return next;
}

/** A selection covering exactly `keys`, falling back to the one passed in. */
function spanning(tree: DocumentTree, keys: NodeKey[], fallback: ModelSelection): ModelSelection {
  const first = keys[0];
  const last = keys[keys.length - 1];
  if (first === undefined || last === undefined) return fallback;
  return {
    anchor: { key: first, offset: 0 },
    focus: { key: last, offset: runText(tree, last).length },
    isCollapsed: false,
    isBackward: false,
  };
}

/** The blocks a selection touches, in document order. */
export function blocksInRange(tree: DocumentTree, selection: ModelSelection): NodeKey[] {
  const runs = textRuns(tree);
  const [start, end] = ordered(selection);
  const from = runs.indexOf(start.key);
  const to = runs.indexOf(end.key);
  if (from === -1 || to === -1) {
    const only = blockOf(tree, start.key);
    return only === null ? [] : [only];
  }
  const blocks: NodeKey[] = [];
  for (const run of runs.slice(Math.min(from, to), Math.max(from, to) + 1)) {
    const block = blockOf(tree, run);
    if (block !== null && !blocks.includes(block)) blocks.push(block);
  }
  return blocks;
}

/** What `setBlockType` can turn a block into. */
export type BlockType = 'paragraph' | 'heading' | 'blockquote' | 'codeBlock';

/**
 * Retypes each block the selection touches.
 *
 * The block keeps its key and its children, so the caret stays where it is — which is why
 * this is a `setValue` rather than a remove and an insert.
 */
export function setBlockType(
  context: EditContext,
  selection: ModelSelection,
  type: BlockType,
  level: HeadingLevel = 1,
): ModelSelection {
  const { tree, write } = context;
  for (const key of blocksInRange(tree, selection)) {
    const value = tree.get(key)?.value;
    if (value === undefined) continue;
    const align = 'align' in value ? value.align : undefined;
    const indent = 'indent' in value ? value.indent : undefined;

    if (type === 'codeBlock') {
      // A code block holds a string, not inline nodes, so its children go away and their
      // text comes with them.
      const text = tree
        .children(key)
        .map((child) => runText(tree, child))
        .join('');
      for (const child of [...tree.children(key)]) write.remove(child);
      write.setValue(key, { type: 'codeBlock', text });
      continue;
    }

    const next =
      type === 'heading'
        ? ({ type: 'heading', level, align, indent, content: [] } as BlockNode)
        : type === 'blockquote'
          ? ({ type: 'blockquote', align, indent, content: [] } as BlockNode)
          : ({ type: 'paragraph', align, indent, content: [] } as BlockNode);
    write.setValue(key, stripUndefined(next));
  }
  return selection;
}

/** Drops keys whose value is `undefined`, which would otherwise serialize as attributes. */
function stripUndefined(node: AnyNode): AnyNode {
  const copy: Record<string, unknown> = {};
  for (const [field, value] of Object.entries(node)) {
    if (value !== undefined) copy[field] = value;
  }
  return copy as unknown as AnyNode;
}

/** Sets the alignment of every block the selection touches. */
export function setAlign(
  context: EditContext,
  selection: ModelSelection,
  align: Align,
): ModelSelection {
  for (const key of blocksInRange(context.tree, selection)) {
    const value = context.tree.get(key)?.value;
    if (value === undefined || !('align' in value || value.type === 'paragraph')) continue;
    const next = { ...value, align } as AnyNode;
    context.write.setValue(key, align === 'left' ? stripAlign(next) : next);
  }
  return selection;
}

/** `left` is the default and serializes as no attribute, so it is an absence. */
function stripAlign(node: AnyNode): AnyNode {
  const copy = { ...node } as Record<string, unknown>;
  copy.align = undefined;
  return stripUndefined(copy as unknown as AnyNode);
}

/**
 * Moves every touched block one indent step.
 *
 * A list item indents by *nesting*, not by an attribute: a list inside a list is what the
 * markup means and what every reader of that HTML expects. Everything else carries an
 * `indent` count, never below zero.
 */
export function shiftIndent(
  context: EditContext,
  selection: ModelSelection,
  by: number,
): ModelSelection {
  const { tree, write } = context;
  for (const key of blocksInRange(tree, selection)) {
    const value = tree.get(key)?.value;
    if (value === undefined) continue;

    if (value.type === 'listItem') {
      if (by > 0) nestItem(context, key);
      else unnestItem(context, key);
      continue;
    }

    const current = 'indent' in value && value.indent !== undefined ? value.indent : 0;
    const next = Math.max(0, current + by);
    const updated = { ...value, indent: next === 0 ? undefined : next } as AnyNode;
    write.setValue(key, stripUndefined(updated));
  }
  return selection;
}

/**
 * Moves a list item into a list nested under the item before it.
 *
 * The first item of a list has nothing to nest under, so Tab there does nothing — which
 * is what every editor does, because an item with no parent is not a sub-item.
 */
function nestItem(context: EditContext, item: NodeKey): void {
  const { tree, write } = context;
  const list = tree.parent(item);
  if (list === null || list === undefined) return;
  const siblings = tree.children(list);
  const at = siblings.indexOf(item);
  if (at <= 0) return;
  const previous = siblings[at - 1]!;

  const listValue = tree.get(list)?.value;
  const listType = listValue?.type === 'list' ? listValue.listType : 'bullet';

  // Join the sub-list the previous item already has, rather than starting a second one
  // beside it — two adjacent nested lists render as two lists.
  const existing = tree.children(previous).find((child) => tree.get(child)?.value.type === 'list');
  const target =
    existing ??
    write.insert(previous, { type: 'list', listType, items: [] }, undefined, 'children');
  write.move(item, target);
}

/** Moves a nested list item back out to its grandparent list. */
function unnestItem(context: EditContext, item: NodeKey): void {
  const { tree, write } = context;
  const list = tree.parent(item);
  if (list === null || list === undefined) return;
  const parentItem = tree.parent(list);
  if (parentItem === null || parentItem === undefined) return;
  if (tree.get(parentItem)?.value.type !== 'listItem') return;
  const outer = tree.parent(parentItem);
  if (outer === null || outer === undefined) return;

  const at = tree.children(outer).indexOf(parentItem);
  write.move(item, outer, at + 1);
  // A nested list with nothing left in it is markup nobody asked for.
  if (tree.children(list).length === 0) write.remove(list);
}

/** Which list a block is in, if it is in one. */
function listOf(tree: DocumentTree, block: NodeKey): NodeKey | null {
  if (tree.get(block)?.value.type !== 'listItem') return null;
  return tree.parent(block) ?? null;
}

/**
 * Turns the touched blocks into a list of `listType`, or back into paragraphs.
 *
 * Toggling off is the same operation read backwards, which is why both directions live
 * here: a list whose items all become paragraphs has to disappear, and its items have to
 * be planted where it was.
 */
export function toggleList(
  context: EditContext,
  selection: ModelSelection,
  listType: 'bullet' | 'ordered' | 'check',
): ModelSelection {
  const { tree, write } = context;
  const blocks = blocksInRange(tree, selection);
  if (blocks.length === 0) return selection;

  const alreadyThisList = blocks.every((block) => {
    const list = listOf(tree, block);
    const value = list === null ? undefined : tree.get(list)?.value;
    return value?.type === 'list' && value.listType === listType;
  });

  if (alreadyThisList) {
    // Off: each item becomes a paragraph where its list stood.
    for (const block of blocks) {
      const list = listOf(tree, block)!;
      const parent = tree.parent(list);
      if (parent === null || parent === undefined) continue;
      const at = tree.children(parent).indexOf(list);
      write.setValue(block, { type: 'paragraph', content: [] });
      write.move(block, parent, at);
      if (tree.children(list).length === 0) write.remove(list);
    }
    return selection;
  }

  // On: a run of adjacent blocks becomes one list, so pressing the button with three
  // paragraphs selected produces one list of three rather than three lists of one.
  const first = blocks[0]!;
  const existing = listOf(tree, first);
  if (existing !== null) {
    // Already a list, of the wrong kind: retyping it keeps every item and the caret.
    const value = tree.get(existing)?.value;
    if (value?.type === 'list') write.setValue(existing, { ...value, listType, items: [] });
    return selection;
  }

  const parent = tree.parent(first);
  if (parent === null || parent === undefined) return selection;
  const at = tree.children(parent).indexOf(first);
  const list = write.insert(parent, { type: 'list', listType, items: [] }, at);
  for (const block of blocks) {
    write.setValue(block, { type: 'listItem', content: [] });
    // No slot: a list's only child field is `items`, and naming `content` instead put
    // every item in a slot the list does not serialize, so all but the first vanished.
    write.move(block, list);
  }
  return selection;
}

/** Inserts `text` at a collapsed selection, or over a range. */
export function insertText(
  context: EditContext,
  selection: ModelSelection,
  text: string,
): ModelSelection {
  const { tree, write } = context;
  let at = selection;
  if (!at.isCollapsed) at = deleteRange(context, at);

  const caret = at.focus;
  const entry = tree.get(caret.key);
  if (entry?.value.type === 'text') {
    const before = entry.value.text;
    const next = before.slice(0, caret.offset) + text + before.slice(caret.offset);
    write.setValue(caret.key, { ...entry.value, text: next });
    const point = { key: caret.key, offset: caret.offset + text.length };
    return { anchor: point, focus: { ...point }, isCollapsed: true, isBackward: false };
  }

  // The caret is beside something that is not text — a line break, a chip — so the run
  // to type into does not exist yet and goes next to it.
  const parent = tree.parent(caret.key);
  if (entry !== undefined && parent !== null && parent !== undefined && isInline(tree, caret.key)) {
    const at_ = tree.children(parent).indexOf(caret.key) + (caret.offset > 0 ? 1 : 0);
    const key = write.insert(parent, { type: 'text', text }, at_);
    const point = { key, offset: text.length };
    return { anchor: point, focus: { ...point }, isCollapsed: true, isBackward: false };
  }

  // No run to type into: an empty block. Give it one.
  const block = blockOf(tree, caret.key) ?? tree.children(ROOT_KEY)[0];
  if (block === undefined) return at;
  const key = write.insert(block, { type: 'text', text });
  const point = { key, offset: text.length };
  return { anchor: point, focus: { ...point }, isCollapsed: true, isBackward: false };
}

/**
 * Deletes everything a selection covers and returns the caret that remains.
 *
 * Works in document order over *every* inline node, not over text runs alone. A run-only
 * version could not express a selection that ends inside a merge tag — which is exactly
 * where a browser's select-all puts it when the message ends in one — so the chip fell
 * outside the range and survived being typed over.
 *
 * Blocks the selection empties are merged rather than left behind: selecting four
 * paragraphs and deleting has to leave one, not four empty ones.
 */
export function deleteRange(context: EditContext, selection: ModelSelection): ModelSelection {
  const { tree, write } = context;
  if (selection.isCollapsed) return selection;
  const [from, to] = ordered(selection);

  // Split the ends so the boundary nodes are wholly in or wholly out. The tail first:
  // splitting the head would move the offsets in the tail.
  const endEntry = tree.get(to.key);
  if (endEntry?.value.type === 'text') splitRun(context, to.key, to.offset);
  const startEntry = tree.get(from.key);
  const firstKey =
    startEntry?.value.type === 'text'
      ? (splitRun(context, from.key, from.offset) ?? nextInline(tree, from.key))
      : from.offset > 0
        ? nextInline(tree, from.key)
        : from.key;
  /*
   * The last node to delete is whichever now ends at `to.offset`.
   *
   * When both ends are in the same run the two splits leave three nodes and the original
   * key keeps the *head* — the part before the selection — so naming `to.key` here
   * pointed at a node in front of the first one and the range came out empty. In that
   * case the single middle node is both ends of the range.
   *
   * An atomic end point with offset 0 sits *before* its node, so that node survives.
   */
  const sameRun = from.key === to.key && startEntry?.value.type === 'text';
  const lastKey = sameRun
    ? firstKey
    : endEntry?.value.type === 'text'
      ? to.key
      : to.offset > 0
        ? to.key
        : previousInline(tree, to.key);

  if (firstKey === undefined || lastKey === undefined) return collapseTo(tree, from);

  const order = documentOrder(tree);
  const firstAt = tree.positionOf(firstKey);
  const lastAt = tree.positionOf(lastKey);
  if (firstAt === -1 || lastAt === -1 || lastAt < firstAt) return collapseTo(tree, from);

  const startBlock = blockOf(tree, firstKey);
  const endBlock = blockOf(tree, lastKey);

  // Where the caret ends up: immediately before the first thing removed.
  const before = previousInline(tree, firstKey);

  const removing = order.slice(firstAt, lastAt + 1).filter((key) => isInline(tree, key));
  for (const key of removing) write.remove(key);

  // Merge what is left of the last block into the first, and drop the blocks between.
  if (startBlock !== null && endBlock !== null && startBlock !== endBlock) {
    const between = blocksBetween(tree, startBlock, endBlock);
    for (const key of tree.children(endBlock)) write.move(key, startBlock);
    for (const key of between) if (tree.get(key) !== undefined) write.remove(key);
    if (tree.get(endBlock) !== undefined) write.remove(endBlock);
  }

  if (before !== undefined && tree.get(before) !== undefined) {
    const entry = tree.get(before);
    const offset = entry?.value.type === 'text' ? entry.value.text.length : 1;
    return collapseTo(tree, { key: before, offset });
  }
  const block = startBlock ?? blockOf(tree, from.key);
  if (block !== null && tree.get(block) !== undefined)
    return collapseTo(tree, { key: block, offset: 0 });
  const remaining = textRuns(tree)[0];
  return remaining === undefined
    ? { ...selection, isCollapsed: true }
    : collapseTo(tree, { key: remaining, offset: 0 });
}

/** A collapsed selection at one point. */
function collapseTo(_tree: DocumentTree, point: { key: NodeKey; offset: number }): ModelSelection {
  return { anchor: point, focus: { ...point }, isCollapsed: true, isBackward: false };
}

/** True for a leaf that lives inside a block: text, and the atomic inline nodes. */
function isInline(tree: DocumentTree, key: NodeKey): boolean {
  const type = tree.get(key)?.value.type;
  return (
    type === 'text' ||
    type === 'mergeTag' ||
    type === 'mention' ||
    type === 'emoji' ||
    type === 'lineBreak'
  );
}

/**
 * The inline node before `key`, or `undefined` at the start of the document.
 *
 * Steps through the cached document order from `key`'s own position rather than building
 * a filtered copy and searching it. Deleting a selection asks for a neighbour per
 * character, and the filtered copy made that O(n) each time.
 */
function previousInline(tree: DocumentTree, key: NodeKey): NodeKey | undefined {
  const order = documentOrder(tree);
  for (let at = tree.positionOf(key) - 1; at >= 0; at -= 1) {
    const candidate = order[at]!;
    if (isInline(tree, candidate)) return candidate;
  }
  return undefined;
}

/** The inline node after `key`, or `undefined` at the end. */
function nextInline(tree: DocumentTree, key: NodeKey): NodeKey | undefined {
  const order = documentOrder(tree);
  const from = tree.positionOf(key);
  if (from === -1) return undefined;
  for (let at = from + 1; at < order.length; at += 1) {
    const candidate = order[at]!;
    if (isInline(tree, candidate)) return candidate;
  }
  return undefined;
}

/** The blocks strictly between two others, in document order. */
function blocksBetween(tree: DocumentTree, first: NodeKey, last: NodeKey): NodeKey[] {
  const order = documentOrder(tree);
  const from = tree.positionOf(first);
  const to = tree.positionOf(last);
  if (from === -1 || to === -1) return [];
  return order.slice(from + 1, to).filter((key) => blockOf(tree, key) === key);
}

/** Every key in document order, from the tree's per-version cache. */
function documentOrder(tree: DocumentTree): readonly NodeKey[] {
  return tree.documentOrder();
}

/**
 * Deletes `count` grapheme clusters before a collapsed caret.
 *
 * Grapheme clusters rather than code units, so one press removes one thing the reader can
 * see; `previousGraphemeBoundary` is the shared implementation both engines use.
 */
export function deleteBackward(
  context: EditContext,
  selection: ModelSelection,
  count: number,
): ModelSelection {
  const { tree, write } = context;
  if (count <= 0) return selection;
  if (!selection.isCollapsed) return deleteRange(context, selection);

  let at = selection.focus;
  let left = count;
  while (left > 0) {
    const entry = tree.get(at.key);

    // An atomic node goes as one, which is what makes it atomic.
    if (entry !== undefined && entry.value.type !== 'text' && isInline(tree, at.key)) {
      const before = previousInline(tree, at.key);
      write.remove(at.key);
      left -= 1;
      at =
        before === undefined
          ? { key: blockOf(tree, at.key) ?? at.key, offset: 0 }
          : { key: before, offset: lengthOf(tree, before) };
      if (left <= 0) break;
      continue;
    }

    if (entry?.value.type !== 'text') break;
    const text = entry.value.text;

    if (at.offset > 0) {
      const start = previousGraphemeBoundary(text, at.offset, left);
      const removed = countClusters(text.slice(start, at.offset));
      const remaining = text.slice(0, start) + text.slice(at.offset);
      left -= removed;
      if (remaining === '') {
        // An empty run renders to nothing but would sit in the model for ever, so the
        // caret moves to the end of what comes before and the run goes.
        const before = previousInline(tree, at.key);
        write.remove(at.key);
        at =
          before === undefined
            ? { key: blockOf(tree, at.key) ?? at.key, offset: 0 }
            : { key: before, offset: lengthOf(tree, before) };
        if (left <= 0) break;
        continue;
      }
      write.setValue(at.key, { ...entry.value, text: remaining });
      at = { key: at.key, offset: start };
      if (left <= 0) break;
    }

    // At the start of a node: continue in the one before it, if there is one.
    const before = previousInline(tree, at.key);
    if (before === undefined) break;
    at = { key: before, offset: lengthOf(tree, before) };
  }

  return { anchor: at, focus: { ...at }, isCollapsed: true, isBackward: false };
}

/** How far into a node an offset can go: its characters, or 1 for an atomic node. */
function lengthOf(tree: DocumentTree, key: NodeKey): number {
  const value = tree.get(key)?.value;
  return value?.type === 'text' ? value.text.length : 1;
}

/** How many clusters a string holds, used to count what a delete actually removed. */
function countClusters(text: string): number {
  let count = 0;
  let at = text.length;
  while (at > 0) {
    at = previousGraphemeBoundary(text, at, 1);
    count += 1;
  }
  return count;
}

/** Inserts an inline node at the caret, splitting the run it sits in. */
export function insertInline(
  context: EditContext,
  selection: ModelSelection,
  node: InlineNode,
): ModelSelection {
  const { tree, write } = context;
  let at = selection;
  if (!at.isCollapsed) at = deleteRange(context, at);

  const caret = at.focus;
  const parent = tree.parent(caret.key);
  if (parent === null || parent === undefined) return at;

  const tail = splitRun(context, caret.key, caret.offset);
  const index =
    tail === null || tail === caret.key
      ? tree.children(parent).indexOf(caret.key) + (tail === null ? 1 : 0)
      : tree.children(parent).indexOf(tail);
  const inserted = write.insert(parent, node, index);

  // After the new node, not where the caret was: typing "second", Shift+Enter, "third"
  // produced "secondthird<br>" while this returned the old caret.
  const after = tree.children(parent)[tree.children(parent).indexOf(inserted) + 1];
  const point =
    after !== undefined && tree.get(after)?.value.type === 'text'
      ? { key: after, offset: 0 }
      : // Offset 1 means *after* the node. Offset 0 put the caret in front of the line
        // break just inserted, so Shift+Enter then typing produced "secondthird<br>".
        { key: inserted, offset: 1 };
  return { anchor: point, focus: { ...point }, isCollapsed: true, isBackward: false };
}

/** Inserts a block after the block the caret is in. */
export function insertBlock(
  context: EditContext,
  selection: ModelSelection,
  node: BlockNode,
): ModelSelection {
  const { tree, write } = context;
  const block = blockOf(tree, selection.focus.key);
  const parent = block === null ? ROOT_KEY : (tree.parent(block) ?? ROOT_KEY);
  const at = block === null ? undefined : tree.children(parent).indexOf(block) + 1;
  write.insert(parent, node, at);
  return selection;
}

/**
 * Deletes `count` grapheme clusters after a collapsed caret.
 *
 * The Delete key, and the mirror of `deleteBackward`. Running past the end of a run
 * continues in the next one, so deleting forward at a run boundary works the way holding
 * the key down implies.
 */
export function deleteForward(
  context: EditContext,
  selection: ModelSelection,
  count: number,
): ModelSelection {
  const { tree, write } = context;
  if (count <= 0) return selection;
  if (!selection.isCollapsed) return deleteRange(context, selection);

  let at = selection.focus;
  let left = count;
  while (left > 0) {
    const entry = tree.get(at.key);
    if (entry?.value.type !== 'text') break;
    const text = entry.value.text;

    if (at.offset < text.length) {
      const end = nextGraphemeBoundary(text, at.offset, left);
      const removed = countClusters(text.slice(at.offset, end));
      const remaining = text.slice(0, at.offset) + text.slice(end);
      left -= removed;
      if (remaining === '') {
        const after = nextRun(tree, at.key);
        write.remove(at.key);
        at =
          after === undefined
            ? { key: blockOf(tree, at.key) ?? at.key, offset: 0 }
            : { key: after, offset: 0 };
        if (left <= 0) break;
        continue;
      }
      write.setValue(at.key, { ...entry.value, text: remaining });
      if (left <= 0) break;
    }

    const after = nextRun(tree, at.key);
    if (after === undefined) break;
    at = { key: after, offset: 0 };
  }

  return { anchor: at, focus: { ...at }, isCollapsed: true, isBackward: false };
}

/** The run after `key` in document order, or `undefined` at the end. */
function nextRun(tree: DocumentTree, key: NodeKey): NodeKey | undefined {
  const runs = textRuns(tree);
  const index = runs.indexOf(key);
  return index >= 0 && index < runs.length - 1 ? runs[index + 1] : undefined;
}

/** The offset `count` grapheme clusters after `offset`, clamped to the end. */
function nextGraphemeBoundary(text: string, offset: number, count: number): number {
  let at = Math.max(0, Math.min(offset, text.length));
  for (let step = 0; step < count && at < text.length; step += 1) {
    // Walk forward one code point, then absorb whatever cannot stand alone after it.
    // `previousGraphemeBoundary` run from the far end would be O(n) per press.
    const code = text.codePointAt(at);
    at += code !== undefined && code > 0xffff ? 2 : 1;
    while (at < text.length && previousGraphemeBoundary(text, at + 1, 1) <= offset) at += 1;
  }
  return at;
}

/**
 * Splits the caret's block in two — what Enter does.
 *
 * The new block is the same kind as the old one, so Enter inside a heading makes another
 * heading and Enter inside a list item makes another item, which is what every editor
 * does and what the markup has to keep meaning.
 */
export function splitBlock(context: EditContext, selection: ModelSelection): ModelSelection {
  const { tree, write } = context;
  let at = selection;
  if (!at.isCollapsed) at = deleteRange(context, at);

  const caret = at.focus;
  const block = blockOf(tree, caret.key);
  if (block === null) return at;
  const value = tree.get(block)?.value;
  if (value === undefined) return at;

  const parent = tree.parent(block);
  if (parent === null || parent === undefined) return at;
  const index = tree.children(parent).indexOf(block);

  // A code block holds a string rather than inline nodes, so Enter adds a newline to it.
  if (value.type === 'codeBlock') {
    write.setValue(block, { ...value, text: `${value.text}\n` });
    return at;
  }

  // Everything after the caret moves into the new block, starting with the tail of the
  // run the caret is in.
  const tail = splitRun(context, caret.key, caret.offset);
  const siblings = tree.children(block);
  const from =
    tail !== null && tail !== caret.key
      ? siblings.indexOf(tail)
      : siblings.indexOf(caret.key) + (caret.offset > 0 ? 1 : 0);
  const moving = from < 0 ? [] : siblings.slice(from);

  const fresh = write.insert(parent, blankLike(value), index + 1);
  for (const [offset, key] of moving.entries()) write.move(key, fresh, offset);

  const first = moving[0];
  const point = first === undefined ? { key: fresh, offset: 0 } : { key: first, offset: 0 };
  return { anchor: point, focus: { ...point }, isCollapsed: true, isBackward: false };
}

/** An empty block of the same kind, keeping only what describes the block itself. */
function blankLike(value: AnyNode): AnyNode {
  if (value.type === 'heading') {
    return { type: 'heading', level: value.level, content: [] };
  }
  if (value.type === 'listItem') return { type: 'listItem', content: [] };
  return { type: 'paragraph', content: [] };
}
