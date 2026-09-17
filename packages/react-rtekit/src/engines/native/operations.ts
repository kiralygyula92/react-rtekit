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
 * Model edits — stages 5 to 7 of ADR-006.
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
    // Split the tail first: splitting the head would move the offsets in the tail.
    splitRun(context, start.key, end.offset);
    const middle = splitRun(context, start.key, start.offset);
    return middle === null ? [] : [middle];
  }

  splitRun(context, end.key, end.offset);
  const head = splitRun(context, start.key, start.offset);
  if (head === null) return collect(tree, start.key, end.key).slice(1);
  return collect(tree, head, end.key);
}

/** The runs from `from` to `to` inclusive, in document order. */
function collect(tree: DocumentTree, from: NodeKey, to: NodeKey): NodeKey[] {
  const runs = textRuns(tree);
  const start = runs.indexOf(from);
  const end = runs.indexOf(to);
  if (start === -1 || end === -1) return [];
  return runs.slice(Math.min(start, end), Math.max(start, end) + 1);
}

/** The selection's two ends, in document order. */
function ordered(selection: ModelSelection): [ModelSelection['anchor'], ModelSelection['focus']] {
  return selection.isBackward
    ? [selection.focus, selection.anchor]
    : [selection.anchor, selection.focus];
}

/** Whether every run in `keys` carries `mark`, which is what presses a toolbar toggle. */
export function hasMark(tree: DocumentTree, keys: NodeKey[], mark: MarkName): boolean {
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

/** Moves every touched block one indent step, never below zero. */
export function shiftIndent(
  context: EditContext,
  selection: ModelSelection,
  by: number,
): ModelSelection {
  for (const key of blocksInRange(context.tree, selection)) {
    const value = context.tree.get(key)?.value;
    if (value === undefined) continue;
    const current = 'indent' in value && value.indent !== undefined ? value.indent : 0;
    const next = Math.max(0, current + by);
    const updated = { ...value, indent: next === 0 ? undefined : next } as AnyNode;
    context.write.setValue(key, stripUndefined(updated));
  }
  return selection;
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

  // No run to type into: an empty block. Give it one.
  const block = blockOf(tree, caret.key) ?? tree.children(ROOT_KEY)[0];
  if (block === undefined) return at;
  const key = write.insert(block, { type: 'text', text });
  const point = { key, offset: text.length };
  return { anchor: point, focus: { ...point }, isCollapsed: true, isBackward: false };
}

/** Deletes everything a selection covers and returns the caret that remains. */
export function deleteRange(context: EditContext, selection: ModelSelection): ModelSelection {
  const { tree, write } = context;
  if (selection.isCollapsed) return selection;
  const keys = runsInRange(context, selection);
  if (keys.length === 0) return selection;

  // Where the caret lands: immediately before the first thing removed.
  const runs = textRuns(tree);
  const firstAt = runs.indexOf(keys[0]!);
  const previous = firstAt > 0 ? runs[firstAt - 1] : undefined;

  // Atomic inline nodes — merge tags, mentions, emoji, line breaks — sit between the
  // runs and are part of what the user selected, so they go too. Without this, selecting
  // everything and pressing delete left the chips behind.
  const removing = new Set<NodeKey>(keys);
  for (const key of keys) {
    const parent = tree.parent(key);
    if (parent === null || parent === undefined) continue;
    for (const sibling of tree.children(parent)) {
      const type = tree.get(sibling)?.value.type;
      if (type === 'text' || type === undefined) continue;
      if (between(tree, keys, sibling)) removing.add(sibling);
    }
  }
  for (const key of removing) write.remove(key);

  if (previous !== undefined) {
    const point = { key: previous, offset: runText(tree, previous).length };
    return { anchor: point, focus: { ...point }, isCollapsed: true, isBackward: false };
  }
  const remaining = textRuns(tree)[0];
  if (remaining === undefined) return { ...selection, isCollapsed: true };
  const point = { key: remaining, offset: 0 };
  return { anchor: point, focus: { ...point }, isCollapsed: true, isBackward: false };
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
        const before = previousRun(tree, at.key);
        write.remove(at.key);
        at =
          before === undefined
            ? { key: blockOf(tree, at.key) ?? at.key, offset: 0 }
            : { key: before, offset: runText(tree, before).length };
        if (left <= 0) break;
        continue;
      }
      write.setValue(at.key, { ...entry.value, text: remaining });
      at = { key: at.key, offset: start };
      if (left <= 0) break;
    }

    // At the start of a run: continue in the one before it, if there is one.
    const previous = previousRun(tree, at.key);
    if (previous === undefined) break;
    at = { key: previous, offset: runText(tree, previous).length };
  }

  return { anchor: at, focus: { ...at }, isCollapsed: true, isBackward: false };
}

/** Whether `key` falls between the first and last of `keys` in document order. */
function between(tree: DocumentTree, keys: NodeKey[], key: NodeKey): boolean {
  const order = documentOrder(tree);
  const first = order.indexOf(keys[0]!);
  const last = order.indexOf(keys[keys.length - 1]!);
  const at = order.indexOf(key);
  return at > first && at < last;
}

/** Every key in document order, which is what "between" is measured against. */
function documentOrder(tree: DocumentTree): NodeKey[] {
  const order: NodeKey[] = [];
  const walk = (key: NodeKey): void => {
    for (const child of tree.children(key)) {
      order.push(child);
      walk(child);
    }
  };
  walk(ROOT_KEY);
  return order;
}

/** The run before `key` in document order, or `undefined` at the start. */
function previousRun(tree: DocumentTree, key: NodeKey): NodeKey | undefined {
  const runs = textRuns(tree);
  const index = runs.indexOf(key);
  return index > 0 ? runs[index - 1] : undefined;
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
  write.insert(parent, node, index);
  return at;
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
