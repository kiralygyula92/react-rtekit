import type { BlockNode } from '../../types/document.js';
import type { ModelSelection } from './selection.js';
import type { AnyNode, DocumentTree, NodeKey } from './tree.js';
import { insertBlock, insertInline, runsInRange, type EditContext } from './operations.js';

/**
 * Links and tables — the two structural features with enough rules to want their own
 * module.
 *
 * Both are the same kind of operation as the ones in `operations.ts`: a function from a
 * tree and a selection to a new selection, applied inside one `tree.update`. They live
 * apart only because a link that has to wrap an arbitrary range, and a table that has to
 * stay rectangular while rows and columns come and go, each carry more invariants than a
 * mark does.
 *
 * @module
 */

// ─── links ───────────────────────────────────────────────────────────────────

/** The link node `key` sits inside, if any. */
export function linkAt(tree: DocumentTree, key: NodeKey): NodeKey | null {
  for (const ancestor of tree.ancestors(key)) {
    if (tree.get(ancestor)?.value.type === 'link') return ancestor;
  }
  return null;
}

/** What `insertLink` accepts, which is the published `LinkAttrs` shape. */
export interface LinkSpec {
  href: string;
  text?: string;
  target?: string;
  rel?: string;
  title?: string;
}

/**
 * Wraps the selection in a link, or retargets the one it is already in.
 *
 * A caret rather than a range inserts the link's own text: "add a link here" has to
 * produce something clickable, and an empty anchor is not.
 */
export function insertLink(
  context: EditContext,
  selection: ModelSelection,
  attrs: LinkSpec,
): ModelSelection {
  const { tree, write } = context;
  const existing = linkAt(tree, selection.focus.key);
  if (existing !== null) {
    const value = tree.get(existing)?.value;
    if (value?.type === 'link') {
      write.setValue(existing, { ...value, ...withoutText(attrs) });
    }
    return selection;
  }

  if (selection.isCollapsed) {
    const text = attrs.text ?? attrs.href;
    return insertInline(context, selection, {
      type: 'link',
      ...withoutText(attrs),
      content: [{ type: 'text', text }],
    });
  }

  const keys = runsInRange(context, selection);
  const first = keys[0];
  if (first === undefined) return selection;
  const parent = tree.parent(first);
  if (parent === null || parent === undefined) return selection;

  const at = tree.children(parent).indexOf(first);
  const link = write.insert(
    parent,
    { type: 'link', ...withoutText(attrs), content: [] } as unknown as AnyNode,
    at,
  );
  for (const key of keys) write.move(key, link);
  return selection;
}

/** `text` is how the caller asks for a link's label; it is not an attribute of one. */
function withoutText(attrs: LinkSpec): Omit<LinkSpec, 'text'> {
  const { text: _text, ...rest } = attrs;
  return rest;
}

/** Unwraps the link the caret is in, leaving its text where it was. */
export function removeLink(context: EditContext, selection: ModelSelection): ModelSelection {
  const { tree, write } = context;
  const link = linkAt(tree, selection.focus.key);
  if (link === null) return selection;
  const parent = tree.parent(link);
  if (parent === null || parent === undefined) return selection;
  const at = tree.children(parent).indexOf(link);
  for (const [offset, child] of [...tree.children(link)].entries()) {
    write.move(child, parent, at + offset);
  }
  write.remove(link);
  return selection;
}

// ─── tables ──────────────────────────────────────────────────────────────────

/** One empty cell. Its content is a paragraph, so the caret has a block to stand in. */
function emptyCell(header = false): AnyNode {
  const cell: Record<string, unknown> = {
    type: 'tableCell',
    content: [{ type: 'paragraph', content: [] }],
  };
  if (header) cell.header = true;
  return cell as unknown as AnyNode;
}

/** Inserts a table of `rows` × `cols` after the caret's block. */
export function insertTable(
  context: EditContext,
  selection: ModelSelection,
  rows: number,
  cols: number,
  options: { headerRow?: boolean } = {},
): ModelSelection {
  const body: unknown[] = [];
  for (let row = 0; row < Math.max(1, rows); row += 1) {
    const cells: AnyNode[] = [];
    const header = options.headerRow === true && row === 0;
    for (let col = 0; col < Math.max(1, cols); col += 1) cells.push(emptyCell(header));
    body.push({ type: 'tableRow', cells });
  }
  return insertBlock(context, selection, { type: 'table', rows: body } as unknown as BlockNode);
}

/** The table, row and cell the caret is in; nulls when it is outside one. */
export function tableAt(
  tree: DocumentTree,
  key: NodeKey,
): { table: NodeKey | null; row: NodeKey | null; cell: NodeKey | null } {
  let table: NodeKey | null = null;
  let row: NodeKey | null = null;
  let cell: NodeKey | null = null;
  for (const ancestor of [key, ...tree.ancestors(key)]) {
    const type = tree.get(ancestor)?.value.type;
    if (type === 'tableCell' && cell === null) cell = ancestor;
    else if (type === 'tableRow' && row === null) row = ancestor;
    else if (type === 'table' && table === null) table = ancestor;
  }
  return { table, row, cell };
}

/** Adds a row above or below the caret's. */
export function addRow(
  context: EditContext,
  selection: ModelSelection,
  where: 'before' | 'after',
): ModelSelection {
  const { tree, write } = context;
  const { table, row } = tableAt(tree, selection.focus.key);
  if (table === null || row === null) return selection;
  const at = tree.children(table).indexOf(row) + (where === 'after' ? 1 : 0);
  const width = tree.children(row).length;
  const cells: AnyNode[] = [];
  for (let col = 0; col < width; col += 1) cells.push(emptyCell());
  write.insert(table, { type: 'tableRow', cells } as unknown as AnyNode, at);
  return selection;
}

/**
 * Adds a column on one side of the caret's cell, in every row.
 *
 * Every row, not just this one: a table that is not rectangular renders as a table with a
 * hole in it, and nothing downstream expects one.
 */
export function addColumn(
  context: EditContext,
  selection: ModelSelection,
  where: 'before' | 'after',
): ModelSelection {
  const { tree, write } = context;
  const { table, row, cell } = tableAt(tree, selection.focus.key);
  if (table === null || row === null || cell === null) return selection;
  const at = tree.children(row).indexOf(cell) + (where === 'after' ? 1 : 0);
  for (const each of [...tree.children(table)]) {
    const firstCell = tree.children(each)[0];
    const value = firstCell === undefined ? undefined : tree.get(firstCell)?.value;
    write.insert(each, emptyCell(value?.type === 'tableCell' && value.header === true), at);
  }
  return selection;
}

/** Deletes the caret's row, or the whole table if that was the last row. */
export function deleteRow(context: EditContext, selection: ModelSelection): ModelSelection {
  const { tree, write } = context;
  const { table, row } = tableAt(tree, selection.focus.key);
  if (table === null || row === null) return selection;
  if (tree.children(table).length <= 1) {
    write.remove(table);
    return selection;
  }
  write.remove(row);
  return selection;
}

/** Deletes the caret's column from every row, or the table if that was the last column. */
export function deleteColumn(context: EditContext, selection: ModelSelection): ModelSelection {
  const { tree, write } = context;
  const { table, row, cell } = tableAt(tree, selection.focus.key);
  if (table === null || row === null || cell === null) return selection;
  const at = tree.children(row).indexOf(cell);
  if (tree.children(row).length <= 1) {
    write.remove(table);
    return selection;
  }
  for (const each of [...tree.children(table)]) {
    const target = tree.children(each)[at];
    if (target !== undefined) write.remove(target);
  }
  return selection;
}

/** Deletes the whole table the caret is in. */
export function deleteTable(context: EditContext, selection: ModelSelection): ModelSelection {
  const { table } = tableAt(context.tree, selection.focus.key);
  if (table !== null) context.write.remove(table);
  return selection;
}

/** Turns the first row into header cells, or back into ordinary ones. */
export function toggleHeaderRow(context: EditContext, selection: ModelSelection): ModelSelection {
  const { tree, write } = context;
  const { table } = tableAt(tree, selection.focus.key);
  if (table === null) return selection;
  const first = tree.children(table)[0];
  if (first === undefined) return selection;
  const cells = tree.children(first);
  const on = !cells.every((key) => {
    const value = tree.get(key)?.value;
    return value?.type === 'tableCell' && value.header === true;
  });
  for (const key of cells) {
    const value = tree.get(key)?.value;
    if (value?.type !== 'tableCell') continue;
    const next: Record<string, unknown> = { ...value };
    if (on) next.header = true;
    else delete next.header;
    write.setValue(key, next as unknown as AnyNode);
  }
  return selection;
}
