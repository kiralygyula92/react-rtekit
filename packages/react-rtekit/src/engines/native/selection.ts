import type { EditorPoint, EditorSelection } from '../../types/selection.js';
import type { RenderIndex } from './render.js';
import type { DocumentTree, NodeKey } from './tree.js';
import { ROOT_KEY } from './tree.js';

/**
 * Selection mapping — stage 4 of ADR-006.
 *
 * Two representations have to agree. The DOM's is a node and a character offset inside
 * whatever the browser happens to have built. The model's is a `NodeKey` and an offset
 * into a text run, which is stable across re-renders and means the same thing in Chrome,
 * Firefox and Safari.
 *
 * The published `EditorSelection` uses a third form again — an index path from the root —
 * because that is serializable and engine-independent, which a key from a particular
 * tree instance is not.
 *
 * The normalization here is the part that browsers disagree about. A selection can land
 * on an element rather than a text node, with the offset counting *children* instead of
 * characters; it can land on a `<br>`; it can land on a wrapper element inside a mark
 * stack. All three are resolved to "a model text run and a character offset", which is
 * the only form the rest of the engine knows about.
 *
 * @module
 */

/** Where a caret is, in model terms. */
export interface ModelPoint {
  /** The text run the caret sits in. */
  key: NodeKey;
  /** The character offset into that run. */
  offset: number;
}

/** A selection in model terms. */
export interface ModelSelection {
  anchor: ModelPoint;
  focus: ModelPoint;
  isCollapsed: boolean;
  isBackward: boolean;
}

/** The text runs of the document, in document order. */
export function textRuns(tree: DocumentTree): NodeKey[] {
  const runs: NodeKey[] = [];
  const walk = (key: NodeKey): void => {
    for (const child of tree.children(key)) {
      const entry = tree.get(child);
      if (entry === undefined) continue;
      if (entry.value.type === 'text') runs.push(child);
      else walk(child);
    }
  };
  walk(ROOT_KEY);
  return runs;
}

/** The characters in a run, or `''` for a node that holds none. */
function runText(tree: DocumentTree, key: NodeKey): string {
  const value = tree.get(key)?.value;
  return value?.type === 'text' ? value.text : '';
}

/**
 * Resolves a DOM position to a model point.
 *
 * Returns `null` when the position is not inside the editor's content at all, which
 * happens whenever the selection is somewhere else on the page.
 */
export function toModelPoint(
  tree: DocumentTree,
  index: RenderIndex,
  node: Node,
  offset: number,
): ModelPoint | null {
  // A text node: the common case, and the only one where the offset already means
  // characters.
  if (node.nodeType === 3 /* Text */) {
    const key = index.byNode.get(node);
    if (key === undefined) return null;
    const entry = tree.get(key);
    if (entry?.value.type !== 'text') {
      /*
       * A mention or merge tag renders as text but is atomic in the model, so the caret
       * belongs beside it rather than inside it — and the point names the *node*, with
       * offset 0 before it and 1 after.
       *
       * Returning the nearest run instead put the end of a select-all one node too early
       * whenever the message ended in a chip: the chip fell outside the range, survived
       * being typed over, and went out in the e-mail unsubstituted.
       */
      return { key, offset: offset > 0 ? 1 : 0 };
    }
    return { key, offset: Math.min(offset, entry.value.text.length) };
  }

  if (node.nodeType !== 1 /* Element */) return null;

  // An element position counts children, not characters. Descend to the child the offset
  // names, then to the nearest run inside it.
  const element = node as HTMLElement;
  const child = element.childNodes[offset] ?? element.childNodes[element.childNodes.length - 1];
  const ownKey = index.byNode.get(element);

  // An empty block has no run to name, and the nearest one is in a *different* block —
  // so pressing Enter and typing put the new text back in the old paragraph. The block
  // itself is the answer; `insertText` knows how to give a block its first run.
  const empty = emptyBlockPoint(tree, ownKey);
  if (empty !== null) return empty;

  if (child !== undefined && child !== null) {
    const inner = deepestRun(tree, index, child, offset >= element.childNodes.length);
    if (inner !== null) return inner;
  }
  if (ownKey !== undefined) return nearestRun(tree, ownKey, offset > 0);
  return null;
}

/**
 * A point on `key` itself when it is a block with no text in it.
 *
 * The caret has to be able to rest in an empty paragraph, and every other answer puts it
 * in a neighbouring block.
 */
function emptyBlockPoint(tree: DocumentTree, key: NodeKey | undefined): ModelPoint | null {
  if (key === undefined) return null;
  const type = tree.get(key)?.value.type;
  if (type !== 'paragraph' && type !== 'heading' && type !== 'listItem' && type !== 'blockquote') {
    return null;
  }
  const hasRun = textRuns(tree).some((run) => run === key || tree.ancestors(run).includes(key));
  return hasRun ? null : { key, offset: 0 };
}

/** The first or last text run inside `node`'s subtree. */
function deepestRun(
  tree: DocumentTree,
  index: RenderIndex,
  node: Node,
  atEnd: boolean,
): ModelPoint | null {
  const key = index.byNode.get(node);
  const empty = emptyBlockPoint(tree, key);
  if (empty !== null) return empty;
  if (key !== undefined) {
    const entry = tree.get(key);
    if (entry?.value.type === 'text') {
      return { key, offset: atEnd ? entry.value.text.length : 0 };
    }
    return nearestRun(tree, key, atEnd);
  }
  const children = [...node.childNodes];
  for (const child of atEnd ? children.reverse() : children) {
    const found = deepestRun(tree, index, child, atEnd);
    if (found !== null) return found;
  }
  return null;
}

/**
 * The text run at or nearest to `key`, searching forwards from it or backwards.
 *
 * The fallback for every position that is not in a run: an empty paragraph, a `<br>`, an
 * atomic node. The caret has to end up *somewhere* a character could be typed.
 */
function nearestRun(tree: DocumentTree, key: NodeKey, after: boolean): ModelPoint | null {
  const runs = textRuns(tree);
  if (runs.length === 0) return null;

  // Inside the subtree first, which is where the caret visually is.
  const inside = runs.filter((run) => run === key || tree.ancestors(run).includes(key));
  if (inside.length > 0) {
    const chosen = after ? inside[inside.length - 1]! : inside[0]!;
    return { key: chosen, offset: after ? runText(tree, chosen).length : 0 };
  }

  // Otherwise the nearest run in document order, on the side the offset pointed at.
  const order = documentOrder(tree);
  const position = order.indexOf(key);
  if (position === -1) return null;
  let best: NodeKey | null = null;
  if (after) {
    for (let at = position - 1; at >= 0; at -= 1) {
      if (runs.includes(order[at]!)) {
        best = order[at]!;
        break;
      }
    }
  }
  if (best === null) {
    for (let at = position + 1; at < order.length; at += 1) {
      if (runs.includes(order[at]!)) {
        best = order[at]!;
        break;
      }
    }
  }
  best ??= after ? runs[runs.length - 1]! : runs[0]!;
  return { key: best, offset: after ? runText(tree, best).length : 0 };
}

/** Every key in document order, which is what "the next run" is measured against. */
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

/** The DOM position for a model point, ready to hand to a `Range`. */
export function toDomPoint(
  index: RenderIndex,
  point: ModelPoint,
): { node: Node; offset: number } | null {
  const text = index.textByKey.get(point.key);
  if (text !== undefined) {
    return { node: text, offset: Math.min(point.offset, text.data.length) };
  }
  const node = index.byKey.get(point.key);
  if (node === undefined) return null;
  return { node, offset: 0 };
}

/** Reads the browser's selection as a model selection, or `null` if it is elsewhere. */
export function readSelection(
  tree: DocumentTree,
  index: RenderIndex,
  container: HTMLElement,
): ModelSelection | null {
  const selection = container.ownerDocument.getSelection();
  if (selection === null || selection.rangeCount === 0) return null;
  const { anchorNode, anchorOffset, focusNode, focusOffset } = selection;
  if (anchorNode === null || focusNode === null) return null;
  if (!container.contains(anchorNode) || !container.contains(focusNode)) return null;

  const anchor = toModelPoint(tree, index, anchorNode, anchorOffset);
  const focus = toModelPoint(tree, index, focusNode, focusOffset);
  if (anchor === null || focus === null) return null;

  // Measured over every node in document order, not over text runs alone: an endpoint can
  // name an atomic chip, which is not a run, and `indexOf` answered -1 for it — so a
  // forward selection ending in a merge tag was reported as backward, the range came out
  // inside out, and select-all-and-type deleted nothing at all.
  const order = documentOrder(tree);
  const anchorAt = order.indexOf(anchor.key);
  const focusAt = order.indexOf(focus.key);
  const isBackward = focusAt < anchorAt || (focusAt === anchorAt && focus.offset < anchor.offset);
  const isCollapsed = anchor.key === focus.key && anchor.offset === focus.offset;
  return { anchor, focus, isCollapsed, isBackward };
}

/** Writes a model selection back to the browser. */
export function writeSelection(
  index: RenderIndex,
  container: HTMLElement,
  model: ModelSelection,
): void {
  const document_ = container.ownerDocument;
  const selection = document_.getSelection();
  if (selection === null) return;
  const anchor = toDomPoint(index, model.anchor);
  const focus = toDomPoint(index, model.focus);
  if (anchor === null || focus === null) return;
  const range = document_.createRange();
  try {
    range.setStart(anchor.node, anchor.offset);
    range.setEnd(focus.node, focus.offset);
  } catch {
    // An offset past the end of a node that has just been re-rendered. Collapsing to the
    // start of the anchor is wrong by a few characters and never throws, which is the
    // better failure: an exception here would abort the update that caused it.
    range.setStart(anchor.node, 0);
    range.collapse(true);
  }
  selection.removeAllRanges();
  selection.addRange(range);
}

/** The published, path-based form of a model point. */
export function toEditorPoint(tree: DocumentTree, point: ModelPoint): EditorPoint {
  const path: number[] = [];
  let at: NodeKey | null = point.key;
  while (at !== null && at !== ROOT_KEY) {
    const parent: NodeKey | null | undefined = tree.parent(at);
    if (parent === null || parent === undefined) break;
    path.unshift(tree.children(parent).indexOf(at));
    at = parent;
  }
  return { path, offset: point.offset };
}

/** The model point a published path addresses, or `null` if it addresses nothing. */
export function fromEditorPoint(tree: DocumentTree, point: EditorPoint): ModelPoint | null {
  let at: NodeKey = ROOT_KEY;
  for (const step of point.path) {
    const child = tree.children(at)[step];
    if (child === undefined) return null;
    at = child;
  }
  if (tree.get(at)?.value.type !== 'text') return null;
  return { key: at, offset: point.offset };
}

/** The published form of a whole selection. */
export function toEditorSelection(tree: DocumentTree, model: ModelSelection): EditorSelection {
  return {
    anchor: toEditorPoint(tree, model.anchor),
    focus: toEditorPoint(tree, model.focus),
    isCollapsed: model.isCollapsed,
    isBackward: model.isBackward,
  };
}

/** A caret at the very start of the document, or `null` in an empty one. */
export function atStart(tree: DocumentTree): ModelSelection | null {
  const runs = textRuns(tree);
  const first = runs[0];
  if (first === undefined) return null;
  const point = { key: first, offset: 0 };
  return { anchor: point, focus: { ...point }, isCollapsed: true, isBackward: false };
}

/** A caret at the very end of the document, or `null` in an empty one. */
export function atEnd(tree: DocumentTree): ModelSelection | null {
  const runs = textRuns(tree);
  const last = runs[runs.length - 1];
  if (last === undefined) return null;
  const point = { key: last, offset: runText(tree, last).length };
  return { anchor: point, focus: { ...point }, isCollapsed: true, isBackward: false };
}

/** Everything, or `null` in an empty document. */
export function selectAll(tree: DocumentTree): ModelSelection | null {
  const start = atStart(tree);
  const end = atEnd(tree);
  if (start === null || end === null) return null;
  return {
    anchor: start.anchor,
    focus: end.focus,
    isCollapsed: start.anchor.key === end.focus.key && start.anchor.offset === end.focus.offset,
    isBackward: false,
  };
}

/**
 * The text before the caret, back to the start of its block.
 *
 * What the trigger menus read to decide whether `@` or `/` started a query, so it stops
 * at the block boundary rather than running back through the whole document.
 */
export function textBeforeCaret(
  tree: DocumentTree,
  model: ModelSelection,
  maxLength = Number.POSITIVE_INFINITY,
): string {
  const runs = textRuns(tree);
  const caret = model.isBackward ? model.anchor : model.focus;
  const at = runs.indexOf(caret.key);
  if (at === -1) return '';
  const block = blockOf(tree, caret.key);

  let out = runText(tree, caret.key).slice(0, caret.offset);
  for (let index = at - 1; index >= 0 && out.length < maxLength; index -= 1) {
    if (blockOf(tree, runs[index]!) !== block) break;
    out = runText(tree, runs[index]!) + out;
  }
  return out.length > maxLength ? out.slice(out.length - maxLength) : out;
}

/** The nearest block ancestor of a run, which is what "this paragraph" means. */
export function blockOf(tree: DocumentTree, key: NodeKey): NodeKey | null {
  const BLOCKS = new Set([
    'paragraph',
    'heading',
    'listItem',
    'blockquote',
    'codeBlock',
    'tableCell',
  ]);
  for (const ancestor of [key, ...tree.ancestors(key)]) {
    const type = tree.get(ancestor)?.value.type;
    if (type !== undefined && BLOCKS.has(type)) return ancestor;
  }
  return null;
}
