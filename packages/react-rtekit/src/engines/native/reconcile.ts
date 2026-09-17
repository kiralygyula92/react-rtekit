import type { AnyNode, DocumentTree, NodeKey, TreeChange } from './tree.js';
import { ROOT_KEY } from './tree.js';
import { type RenderIndex, renderNode, signatureOf } from './render.js';

/**
 * Model diff to DOM — stage 3b of ADR-006.
 *
 * The whole reason an editor needs a reconciler rather than re-rendering: replacing a
 * DOM node destroys any selection inside it. Typing a character would move the caret back
 * to the start of the line, and an IME composition would be cancelled outright. So the
 * rule here is that the DOM is touched as little as the change allows, and in particular
 * a text node whose characters changed has its `data` assigned rather than being swapped
 * for a new one — the browser keeps the caret in a text node it still recognises.
 *
 * The `TreeChange` from `DocumentTree.update` says exactly what to look at, so the cost
 * of an edit is proportional to the edit rather than to the size of the document.
 *
 * @module
 */

/** Whether an element can stay, or has to be rebuilt because it is now a different thing. */
function canReuse(existing: Node, value: AnyNode): boolean {
  if (value.type === 'text' || value.type === 'emoji' || value.type === 'mergeTag') {
    return existing.nodeType === 3 /* Text */ || existing.nodeType === 1;
  }
  return existing.nodeType === 1;
}

/**
 * Updates one node's own DOM, reusing the element where that is safe.
 *
 * Returns the node now representing `key`, which is the old one whenever it could be
 * kept. A changed tag, or changed marks on a text run, means a new element: both change
 * what the DOM *is*, not just what it says.
 */
function updateNode(
  tree: DocumentTree,
  key: NodeKey,
  index: RenderIndex,
  document_: Document,
  signatures: Map<NodeKey, string>,
): Node | null {
  const entry = tree.get(key);
  if (entry === undefined) return null;
  const existing = index.byKey.get(key);
  const signature = signatureOf(entry.value);

  // The cheap, common case, and the one the caret depends on: the same text run with
  // different characters. Assigning `data` leaves the browser's idea of where the caret
  // is intact; replacing the node does not.
  if (entry.value.type === 'text' && existing !== undefined) {
    const text = index.textByKey.get(key);
    const before = signatures.get(key);
    const withoutText = (value: string): string => value.replace(/\|?text=("(?:[^"\\]|\\.)*")/, '');
    const sameMarks = before !== undefined && withoutText(before) === withoutText(signature);
    if (text !== undefined && sameMarks && entry.value.text !== '') {
      if (text.data !== entry.value.text) text.data = entry.value.text;
      signatures.set(key, signature);
      return existing;
    }
  }

  if (
    existing !== undefined &&
    signatures.get(key) === signature &&
    canReuse(existing, entry.value)
  ) {
    return existing;
  }

  // Rebuild this node alone, then move the existing children across rather than
  // re-rendering them — they are untouched by this change, and re-rendering would take
  // the caret with them.
  const replacement = renderNode(tree, key, index, document_);
  if (existing !== undefined && replacement !== null && existing.parentNode !== null) {
    existing.parentNode.replaceChild(replacement, existing);
  } else if (existing !== undefined && replacement === null && existing.parentNode !== null) {
    existing.parentNode.removeChild(existing);
    index.byKey.delete(key);
  }
  if (replacement === null) signatures.delete(key);
  else signatures.set(key, signature);
  return replacement;
}

/**
 * Makes `parent`'s DOM children match the model's, moving what already exists.
 *
 * Written as a walk rather than as `replaceChildren`, so a reorder moves the elements the
 * caret may be inside instead of rebuilding them.
 */
function syncChildren(
  tree: DocumentTree,
  key: NodeKey,
  index: RenderIndex,
  document_: Document,
  signatures: Map<NodeKey, string>,
): void {
  const container = index.byKey.get(key);
  if (container?.nodeType !== 1) return;
  const parent = container as HTMLElement;
  const entry = tree.get(key);

  // A `listItem` puts its inline content before its nested lists, and a `table` renders
  // its rows inside a `tbody` rather than directly. Both are handled by rendering into
  // the element the children actually live in.
  const host = entry?.value.type === 'table' ? (parent.querySelector('tbody') ?? parent) : parent;

  const wanted: Node[] = [];
  const order =
    entry?.value.type === 'listItem'
      ? [
          ...tree.children(key).filter((child) => tree.get(child)?.slot === 'content'),
          ...tree.children(key).filter((child) => tree.get(child)?.slot === 'children'),
        ]
      : tree.children(key);

  for (const child of order) {
    // The index is what says whether a node has DOM, not `isConnected`: an editor whose
    // container is not in the document yet — which is every editor during mount, and
    // every one of these tests — has `isConnected === false` on everything, and trusting
    // it re-rendered the whole subtree on each edit. That is precisely the caret-
    // destroying behaviour a reconciler exists to avoid.
    let node = index.byKey.get(child);
    if (node === undefined) {
      const rendered = renderNode(tree, child, index, document_);
      if (rendered === null) continue;
      signatures.set(child, signatureOf(tree.get(child)!.value));
      node = rendered;
    }
    wanted.push(node);
  }

  // An empty paragraph keeps the `<br>` that gives the caret somewhere to stand.
  if (wanted.length === 0 && entry?.value.type === 'paragraph') {
    const existing = host.firstChild;
    if (
      existing !== null &&
      (existing as HTMLElement).tagName === 'BR' &&
      host.childNodes.length === 1
    ) {
      return;
    }
    host.replaceChildren(document_.createElement('br'));
    return;
  }

  let at = host.firstChild;
  for (const node of wanted) {
    if (at === node) {
      at = at.nextSibling;
      continue;
    }
    host.insertBefore(node, at);
  }
  // Anything still after the last wanted child is no longer in the model.
  while (at !== null) {
    const next = at.nextSibling;
    // A `<br>` placeholder belongs to the renderer, not to the model, so it is dropped
    // rather than treated as an orphan.
    host.removeChild(at);
    at = next;
  }
}

/**
 * Applies `change` to the DOM under `container`.
 *
 * `signatures` is carried between calls so a node's own properties can be compared
 * against what was last rendered, rather than re-rendering on every touch.
 */
export function reconcile(
  tree: DocumentTree,
  change: TreeChange,
  index: RenderIndex,
  signatures: Map<NodeKey, string>,
  document_: Document = globalThis.document,
): void {
  // Removals first: a node that has gone must not be looked up by anything below.
  for (const key of change.removed) {
    const node = index.byKey.get(key);
    if (node !== undefined) {
      node.parentNode?.removeChild(node);
      index.byNode.delete(node);
    }
    index.byKey.delete(key);
    index.textByKey.delete(key);
    signatures.delete(key);
  }

  for (const key of change.updated) updateNode(tree, key, index, document_, signatures);

  // Rearrangements last, so every child they place has already been brought up to date.
  // Shallowest first: a parent that was itself rebuilt has to exist before its children
  // are hung off it.
  const parents = [...change.rearranged].filter((key) => tree.get(key) !== undefined);
  parents.sort((a, b) => tree.ancestors(a).length - tree.ancestors(b).length);
  for (const key of parents) syncChildren(tree, key, index, document_, signatures);

  // An added node whose parent was not reported — which a nested update can produce —
  // would otherwise never be placed.
  for (const key of change.added) {
    if (index.byKey.has(key)) continue;
    const parent = tree.parent(key);
    if (parent !== null && parent !== undefined) {
      syncChildren(tree, parent, index, document_, signatures);
    }
  }
}

/** The signature map for a freshly rendered tree, which reconciliation then maintains. */
export function signaturesOf(tree: DocumentTree): Map<NodeKey, string> {
  const signatures = new Map<NodeKey, string>();
  const walk = (key: NodeKey): void => {
    const entry = tree.get(key);
    if (entry !== undefined && key !== ROOT_KEY) signatures.set(key, signatureOf(entry.value));
    for (const child of tree.children(key)) walk(child);
  };
  walk(ROOT_KEY);
  return signatures;
}
