import type {
  BlockNode,
  EditorDocument,
  InlineNode,
  ListItemNode,
  TableCellNode,
  TableRowNode,
} from '../../types/document.js';

/**
 * The live document tree.
 *
 * `EditorDocument` is the shape everything outside the engine speaks: a plain nested
 * tree, ideal for storing, diffing in a test and handing to a serializer. It is the wrong
 * shape for editing. A caret lives *at* a node, an edit dirties a handful of nodes, and
 * the reconciler needs to know which DOM node corresponds to which model node after the
 * model has changed underneath it. None of that is expressible when a node's only
 * identity is its position in an array.
 *
 * So the editing representation is flat and keyed: every node has a stable `NodeKey`,
 * parents and children are references, and an update reports exactly which keys changed.
 * Converting between the two is cheap and lossless, and the conversion *preserves keys*
 * where the node is recognisably the same one — which is what lets the reconciler leave
 * untouched DOM alone and the caret where the user put it.
 *
 * Nothing here touches the DOM. This is a data structure with tests that run in Node.
 *
 * @module
 */

/** A node's stable identity for as long as it exists in one tree. */
export type NodeKey = string;

/** Any node the document model can hold. */
export type AnyNode = BlockNode | InlineNode | ListItemNode | TableRowNode | TableCellNode;

/**
 * The fields each container keeps children in, in the order they serialize.
 *
 * Usually one. `listItem` has two — its own inline `content` and the `children` lists
 * nested under it — and a tree that assumed one field per type would silently drop every
 * nested list on the way back out. Each node therefore remembers which of its parent's
 * slots it occupies.
 *
 * `TextNode.marks` is deliberately absent: marks are values on a node, not nodes.
 */
const CHILD_SLOTS: Record<string, readonly string[]> = {
  doc: ['content'],
  paragraph: ['content'],
  heading: ['content'],
  blockquote: ['content'],
  link: ['content'],
  tableCell: ['content'],
  listItem: ['content', 'children'],
  list: ['items'],
  table: ['rows'],
  tableRow: ['cells'],
};

/** The slot a child goes in by default: a container's first. */
function defaultSlot(type: string): string | undefined {
  return CHILD_SLOTS[type]?.[0];
}

/** Every child of `node`, paired with the slot it came out of. */
function childrenOf(node: AnyNode): { node: AnyNode; slot: string }[] {
  const slots = CHILD_SLOTS[node.type];
  if (slots === undefined) return [];
  const record = node as unknown as Record<string, unknown>;
  const out: { node: AnyNode; slot: string }[] = [];
  for (const slot of slots) {
    const value = record[slot];
    if (!Array.isArray(value)) continue;
    for (const child of value as AnyNode[]) out.push({ node: child, slot });
  }
  return out;
}

/** `node` with its child fields removed, which is what the tree stores. */
function withoutChildren(node: AnyNode): AnyNode {
  const slots = CHILD_SLOTS[node.type];
  if (slots === undefined) return { ...node };
  const copy: Record<string, unknown> = {};
  for (const [field, value] of Object.entries(node)) {
    if (!slots.includes(field)) copy[field] = value;
  }
  return copy as unknown as AnyNode;
}

/**
 * `node` with `grouped` put back in the fields its type expects.
 *
 * A required slot is written even when empty — a paragraph with no `content` at all stops
 * matching the schema and reaches a serializer as something it has to guess about —
 * while an optional one (`listItem.children`) is written only when it has something in it,
 * so a round trip does not invent `children: []` on every list item.
 */
function withChildren(node: AnyNode, grouped: Map<string, AnyNode[]>): AnyNode {
  const slots = CHILD_SLOTS[node.type];
  if (slots === undefined) return { ...node };
  const copy = { ...node } as unknown as Record<string, unknown>;
  for (const [index, slot] of slots.entries()) {
    const children = grouped.get(slot) ?? [];
    if (children.length > 0 || index === 0) copy[slot] = children;
  }
  return copy as unknown as AnyNode;
}

/** One node's place in the tree. */
export interface TreeEntry {
  /** This node's key. */
  readonly key: NodeKey;
  /** The parent's key; `null` for the root. */
  readonly parent: NodeKey | null;
  /** Which of the parent's child fields this node sits in; `null` at the root. */
  readonly slot: string | null;
  /** The node itself, without its children. */
  readonly value: AnyNode;
  /** The children's keys, in order. */
  readonly children: readonly NodeKey[];
}

/** The root's key. Fixed, because there is exactly one and callers need to name it. */
export const ROOT_KEY: NodeKey = 'root';

/** What changed in one update. */
export interface TreeChange {
  /** Keys whose `value` changed. */
  readonly updated: ReadonlySet<NodeKey>;
  /** Keys whose child list changed. */
  readonly rearranged: ReadonlySet<NodeKey>;
  /** Keys that entered the tree. */
  readonly added: ReadonlySet<NodeKey>;
  /** Keys that left it. */
  readonly removed: ReadonlySet<NodeKey>;
}

/** True when nothing at all changed, so a listener can return early. */
export function isEmptyChange(change: TreeChange): boolean {
  return (
    change.updated.size === 0 &&
    change.rearranged.size === 0 &&
    change.added.size === 0 &&
    change.removed.size === 0
  );
}

/** The editing surface handed to {@link DocumentTree.update}. */
export interface TreeWriter {
  /** The entry for `key`, or `undefined` if it is not in the tree. */
  get(key: NodeKey): TreeEntry | undefined;
  /** The children's keys, in order. */
  children(key: NodeKey): readonly NodeKey[];
  /** The parent's key, or `null` at the root. */
  parent(key: NodeKey): NodeKey | null;
  /** Replaces a node's own properties, leaving its children alone. */
  setValue(key: NodeKey, value: AnyNode): void;
  /**
   * Inserts `node` and its descendants as a child of `parent`.
   *
   * @param at index to insert before; appends when omitted or past the end
   * @param slot which of the parent's child fields to insert into; its first by default
   * @returns the new node's key
   */
  insert(parent: NodeKey, node: AnyNode, at?: number, slot?: string): NodeKey;
  /** Removes `key` and everything under it. The root cannot be removed. */
  remove(key: NodeKey): void;
  /** Moves `key` under `parent` at `at`, keeping its key and its subtree. */
  move(key: NodeKey, parent: NodeKey, at?: number, slot?: string): void;
}

/**
 * A keyed document tree.
 *
 * Updates go through {@link DocumentTree.update}, which is the only way to change it and
 * the only place a change is reported. Reads outside an update see the last committed
 * state, so a listener cannot observe a half-applied edit.
 */
export class DocumentTree {
  #entries = new Map<NodeKey, MutableEntry>();
  #counter = 0;
  #version = 0;
  #inUpdate = false;

  private constructor() {
    // The root is a `doc`, which has one slot and no properties of its own. Storing it as
    // an entry rather than as a special case means every walk, insert and move has one
    // code path.
    this.#entries.set(ROOT_KEY, {
      key: ROOT_KEY,
      parent: null,
      slot: null,
      value: { type: 'doc' } as unknown as AnyNode,
      children: [],
    });
  }

  /** An empty tree: a root with nothing in it. */
  static empty(): DocumentTree {
    return new DocumentTree();
  }

  /** Builds a tree from a portable document. */
  static fromDocument(doc: EditorDocument): DocumentTree {
    const tree = new DocumentTree();
    tree.#inUpdate = true;
    try {
      for (const block of doc.content) tree.#build(ROOT_KEY, block, 'content');
    } finally {
      tree.#inUpdate = false;
    }
    return tree;
  }

  /** How many commits this tree has seen. Useful for cheap staleness checks. */
  get version(): number {
    return this.#version;
  }

  /** How many nodes it holds, root included. */
  get size(): number {
    return this.#entries.size;
  }

  /** The entry for `key`, or `undefined`. */
  get(key: NodeKey): TreeEntry | undefined {
    return this.#entries.get(key);
  }

  /** The children's keys, in order; empty for a leaf or an unknown key. */
  children(key: NodeKey): readonly NodeKey[] {
    return this.#entries.get(key)?.children ?? [];
  }

  /** The parent's key, `null` at the root, `undefined` for an unknown key. */
  parent(key: NodeKey): NodeKey | null | undefined {
    return this.#entries.get(key)?.parent;
  }

  /**
   * Whether `ancestor` is above `key`.
   *
   * Walks up from `key` rather than building its ancestor list and searching it, which is
   * what a hot loop needs: `ancestors(x).includes(y)` allocates an array per node, and
   * the callers that ask this question ask it once per node in the document.
   */
  isUnder(key: NodeKey, ancestor: NodeKey): boolean {
    let at = this.#entries.get(key)?.parent ?? null;
    while (at !== null) {
      if (at === ancestor) return true;
      at = this.#entries.get(at)?.parent ?? null;
    }
    return false;
  }

  /**
   * Every key in document order, and every text run, computed once per version.
   *
   * These are the two walks the engine asks for constantly — selection mapping, range
   * arithmetic, format state — and each is O(n) in the size of the document. Recomputing
   * them per call made a keystroke O(n²): typing sixty characters into a 50 kB document
   * took longer than a minute, because a single keystroke walks the tree dozens of times
   * and each walk is the whole document.
   *
   * Keyed on `#revision`, which every structural change bumps — not on `version`, which
   * only moves when an update *commits*. An operation runs inside an update and reads
   * these walks between its own mutations: `runsInRange` splits a run and immediately
   * asks where the new one sits. Keyed on the committed version, the cache handed back a
   * walk from before the split and the new node was invisible.
   */
  #walks: {
    revision: number;
    order: NodeKey[];
    runs: NodeKey[];
    position: Map<NodeKey, number>;
  } | null = null;

  /** Bumped by every structural change, committed or not. */
  #revision = 0;

  #computeWalks(): { order: NodeKey[]; runs: NodeKey[]; position: Map<NodeKey, number> } {
    if (this.#walks !== null && this.#walks.revision === this.#revision) return this.#walks;
    const order: NodeKey[] = [];
    const runs: NodeKey[] = [];
    const walk = (key: NodeKey): void => {
      for (const child of this.#entries.get(key)?.children ?? []) {
        order.push(child);
        if (this.#entries.get(child)?.value.type === 'text') runs.push(child);
        walk(child);
      }
    };
    walk(ROOT_KEY);
    const position = new Map<NodeKey, number>();
    for (const [index, key] of order.entries()) position.set(key, index);
    this.#walks = { revision: this.#revision, order, runs, position };
    return this.#walks;
  }

  /** Every key in document order. Shared, so callers must not mutate it. */
  documentOrder(): readonly NodeKey[] {
    return this.#computeWalks().order;
  }

  /** Every text run, in document order. Shared, so callers must not mutate it. */
  textRuns(): readonly NodeKey[] {
    return this.#computeWalks().runs;
  }

  /** Where `key` sits in document order, or -1. O(1) rather than a scan. */
  positionOf(key: NodeKey): number {
    return this.#computeWalks().position.get(key) ?? -1;
  }

  /** Every ancestor of `key`, nearest first, ending at the root. */
  ancestors(key: NodeKey): NodeKey[] {
    const trail: NodeKey[] = [];
    let at = this.#entries.get(key)?.parent ?? null;
    while (at !== null) {
      trail.push(at);
      at = this.#entries.get(at)?.parent ?? null;
    }
    return trail;
  }

  /** The tree as a portable document, which is what every serializer takes. */
  toDocument(): EditorDocument {
    return {
      type: 'doc',
      version: 1,
      content: this.children(ROOT_KEY).map((key) => this.#rebuild(key) as BlockNode),
    };
  }

  /**
   * Applies `edit` as one transaction and reports what changed.
   *
   * Nested updates are flattened rather than rejected: a behaviour that edits inside
   * another behaviour's edit is ordinary, and one change report for the whole thing is
   * what the reconciler wants.
   */
  update(edit: (writer: TreeWriter) => void): TreeChange {
    if (this.#inUpdate) {
      edit(this.#writer(this.#collector));
      return EMPTY_CHANGE;
    }

    const collector: Collector = {
      updated: new Set(),
      rearranged: new Set(),
      added: new Set(),
      removed: new Set(),
    };
    this.#collector = collector;
    this.#inUpdate = true;
    try {
      edit(this.#writer(collector));
    } finally {
      this.#inUpdate = false;
    }

    // A node added and removed within one transaction never existed as far as anybody
    // outside is concerned, and reporting it would have the reconciler look for DOM that
    // was never built.
    for (const key of collector.added) {
      if (collector.removed.has(key)) {
        collector.added.delete(key);
        collector.removed.delete(key);
        collector.updated.delete(key);
        collector.rearranged.delete(key);
      }
    }
    // Likewise a node reported as updated *and* added: "added" already says everything.
    for (const key of collector.added) collector.updated.delete(key);
    // And one that is gone cannot also have been updated.
    for (const key of collector.removed) {
      collector.updated.delete(key);
      collector.rearranged.delete(key);
    }

    const change: TreeChange = collector;
    if (!isEmptyChange(change)) this.#version += 1;
    return change;
  }

  // ── internals ────────────────────────────────────────────────────────────

  #collector: Collector = {
    updated: new Set(),
    rearranged: new Set(),
    added: new Set(),
    removed: new Set(),
  };

  #nextKey(): NodeKey {
    this.#counter += 1;
    return `n${this.#counter.toString(36)}`;
  }

  /** Adds `node` and its descendants under `parent`, returning the new key. */
  #build(parent: NodeKey, node: AnyNode, slot: string, at?: number): NodeKey {
    const key = this.#nextKey();
    const entry: MutableEntry = {
      key,
      parent,
      slot,
      value: withoutChildren(node),
      children: [],
    };
    this.#entries.set(key, entry);
    this.#revision += 1;

    const siblings = this.#entries.get(parent)!.children;
    const index = at === undefined || at > siblings.length ? siblings.length : Math.max(0, at);
    siblings.splice(index, 0, key);

    for (const child of childrenOf(node)) this.#build(key, child.node, child.slot);
    return key;
  }

  /** Reassembles the nested node rooted at `key`, each child back in its own slot. */
  #rebuild(key: NodeKey): AnyNode {
    const entry = this.#entries.get(key)!;
    const grouped = new Map<string, AnyNode[]>();
    for (const child of entry.children) {
      const childEntry = this.#entries.get(child);
      if (childEntry === undefined) continue;
      const slot = childEntry.slot ?? defaultSlot(entry.value.type) ?? 'content';
      const bucket = grouped.get(slot);
      if (bucket === undefined) grouped.set(slot, [this.#rebuild(child)]);
      else bucket.push(this.#rebuild(child));
    }
    return withChildren(entry.value, grouped);
  }

  /** Every key in the subtree rooted at `key`, `key` included. */
  #subtree(key: NodeKey, into: NodeKey[] = []): NodeKey[] {
    into.push(key);
    for (const child of this.#entries.get(key)?.children ?? []) this.#subtree(child, into);
    return into;
  }

  #writer(collector: Collector): TreeWriter {
    return {
      get: (key) => this.#entries.get(key),
      children: (key) => this.children(key),
      parent: (key) => this.parent(key) ?? null,

      setValue: (key, value) => {
        const entry = this.#entries.get(key);
        if (entry === undefined) return;
        entry.value = withoutChildren(value);
        // A type change moves a node between "is a run" and "is not", which the walks
        // record, so even a value-only edit invalidates them.
        this.#revision += 1;
        collector.updated.add(key);
      },

      insert: (parent, node, at, slot) => {
        const target = this.#entries.get(parent);
        if (target === undefined) throw new Error(`insert: no such parent ${parent}`);
        const field = slot ?? defaultSlot(target.value.type);
        if (field === undefined) {
          throw new Error(`insert: ${target.value.type} takes no children`);
        }
        const key = this.#build(parent, node, field, at);
        for (const added of this.#subtree(key)) collector.added.add(added);
        collector.rearranged.add(parent);
        return key;
      },

      remove: (key) => {
        if (key === ROOT_KEY) throw new Error('remove: the root cannot be removed');
        const entry = this.#entries.get(key);
        if (entry === undefined) return;
        const gone = this.#subtree(key);
        for (const removed of gone) {
          this.#entries.delete(removed);
          collector.removed.add(removed);
        }
        this.#revision += 1;
        if (entry.parent !== null) {
          const siblings = this.#entries.get(entry.parent);
          if (siblings !== undefined) {
            const index = siblings.children.indexOf(key);
            if (index !== -1) siblings.children.splice(index, 1);
            collector.rearranged.add(entry.parent);
          }
        }
      },

      move: (key, parent, at, slot) => {
        if (key === ROOT_KEY) throw new Error('move: the root cannot be moved');
        const entry = this.#entries.get(key);
        const target = this.#entries.get(parent);
        if (entry === undefined || target === undefined) return;
        // Moving a node into its own subtree would detach that subtree from the root and
        // leave a cycle behind, which every later walk would follow forever.
        if (key === parent || this.#subtree(key).includes(parent)) {
          throw new Error('move: cannot move a node inside itself');
        }

        if (entry.parent !== null) {
          const from = this.#entries.get(entry.parent);
          if (from !== undefined) {
            const index = from.children.indexOf(key);
            if (index !== -1) from.children.splice(index, 1);
            collector.rearranged.add(entry.parent);
          }
        }
        const index =
          at === undefined || at > target.children.length
            ? target.children.length
            : Math.max(0, at);
        target.children.splice(index, 0, key);
        entry.parent = parent;
        entry.slot = slot ?? defaultSlot(target.value.type) ?? 'content';
        this.#revision += 1;
        collector.rearranged.add(parent);
      },
    };
  }
}

/** The internal, writable shape of {@link TreeEntry}. */
interface MutableEntry {
  key: NodeKey;
  parent: NodeKey | null;
  slot: string | null;
  value: AnyNode;
  children: NodeKey[];
}

/** The internal, writable shape of {@link TreeChange}. */
interface Collector {
  updated: Set<NodeKey>;
  rearranged: Set<NodeKey>;
  added: Set<NodeKey>;
  removed: Set<NodeKey>;
}

/** Returned by a nested update, whose changes belong to the outer one. */
const EMPTY_CHANGE: TreeChange = {
  updated: new Set(),
  rearranged: new Set(),
  added: new Set(),
  removed: new Set(),
};
