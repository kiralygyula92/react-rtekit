import type { QuillInteropOptions } from '../../types/interop.js';
import { element, type HtmlElement, type HtmlNode } from '../html/nodes.js';
import { parseStyle, serializeStyle } from '../sanitize/css.js';
import { MAX_INDENT } from '../schema.js';

/**
 * Legacy Quill markup (ADR-004).
 *
 * Converts what Quill 2 emits into ordinary HTML that the generic tree-to-document
 * converter already understands: `ql-align-*` becomes `text-align`, flat list items
 * carrying `ql-indent-N` become real nested lists, `ql-size-*` becomes a `font-size`,
 * and Quill's own UI artefacts are removed.
 *
 * This transform reads class names and style properties and writes only fixed,
 * enumerated values, so it can safely run before sanitization — which it must, because
 * the sanitizer strips the very classes it needs to read.
 *
 * @module
 */

/** The default `ql-size-*` mapping. */
export const DEFAULT_SIZE_MAP: Record<string, string> = {
  small: '0.75em',
  large: '1.5em',
  huge: '2.5em',
};

/** Quill's own DOM artefacts, which are never content. */
const ARTEFACT_CLASSES = new Set(['ql-cursor', 'ql-ui']);

const ALIGNMENTS = new Set(['left', 'center', 'right', 'justify']);

function classList(el: HtmlElement): string[] {
  return (el.attrs.class ?? '').split(/\s+/).filter(Boolean);
}

function setClassList(el: HtmlElement, classes: string[]): void {
  if (classes.length > 0) el.attrs.class = classes.join(' ');
  else delete el.attrs.class;
}

function setStyleProperty(el: HtmlElement, property: string, value: string): void {
  const declarations = parseStyle(el.attrs.style ?? '').filter((d) => d.property !== property);
  declarations.push({ property, value });
  el.attrs.style = serializeStyle(declarations);
}

/** Reads and consumes `ql-indent-N`, returning the level. */
function takeIndent(el: HtmlElement): number {
  const classes = classList(el);
  let indent = 0;
  const remaining = classes.filter((cls) => {
    const match = /^ql-indent-(\d)$/.exec(cls);
    if (!match) return true;
    indent = Math.min(MAX_INDENT, Number(match[1]));
    return false;
  });
  if (indent > 0) setClassList(el, remaining);
  return indent;
}

/** Reads and consumes `ql-align-*`, returning the alignment. */
function takeAlign(el: HtmlElement): string | null {
  const classes = classList(el);
  let align: string | null = null;
  const remaining = classes.filter((cls) => {
    const match = /^ql-align-(\w+)$/.exec(cls);
    if (!match || !ALIGNMENTS.has(match[1]!)) return true;
    align = match[1]!;
    return false;
  });
  if (align !== null) setClassList(el, remaining);
  return align;
}

/** Reads and consumes `ql-size-*`, returning a CSS length. */
function takeSize(el: HtmlElement, sizeMap: Record<string, string>): string | null {
  const classes = classList(el);
  let size: string | null = null;
  const remaining = classes.filter((cls) => {
    const match = /^ql-size-(\w+)$/.exec(cls);
    if (!match) return true;
    const mapped = sizeMap[match[1]!];
    if (mapped) size = mapped;
    return false;
  });
  if (size !== null) setClassList(el, remaining);
  return size;
}

/** Maps Quill's `data-list` values onto a list type. */
function listTypeOf(value: string | undefined): 'bullet' | 'ordered' | 'check' | null {
  if (value === 'bullet') return 'bullet';
  if (value === 'ordered') return 'ordered';
  if (value === 'checked' || value === 'unchecked') return 'check';
  return null;
}

/**
 * Rebuilds nesting from Quill's flat list markup.
 *
 * Quill writes every item as a direct child of one `<ul>`, using `ql-indent-N` for
 * depth. The result is restructured into genuinely nested lists, and `data-list` on the
 * items decides each level's type — so `<ul><li data-list="ordered">` becomes an `<ol>`,
 * which is what it always meant.
 */
function restructureList(list: HtmlElement): HtmlElement {
  const items = list.children.filter(
    (child): child is HtmlElement => child.type === 'element' && child.tag === 'li',
  );
  if (items.length === 0) return list;

  interface Entry {
    indent: number;
    type: 'bullet' | 'ordered' | 'check' | null;
    checked: boolean | null;
    el: HtmlElement;
  }

  const entries: Entry[] = items.map((item) => {
    const indent = takeIndent(item);
    const dataList = item.attrs['data-list'];
    const type = listTypeOf(dataList);
    const checked = dataList === 'checked' ? true : dataList === 'unchecked' ? false : null;
    delete item.attrs['data-list'];
    const align = takeAlign(item);
    if (align) setStyleProperty(item, 'text-align', align);
    if (checked !== null) item.attrs['data-checked'] = String(checked);
    return { indent, type, checked, el: item };
  });

  const rootType = entries[0]!.type ?? (list.tag === 'ol' ? 'ordered' : 'bullet');
  const root = element(rootType === 'ordered' ? 'ol' : 'ul', { ...list.attrs }, []);
  delete root.attrs['data-list'];

  /** The list element currently open at each indent level. */
  const open: HtmlElement[] = [root];

  for (const entry of entries) {
    const level = Math.min(entry.indent, open.length - 1 + 1);
    while (open.length - 1 > level) open.pop();

    if (open.length - 1 < level) {
      // A new level: nest it inside the previous item, which is where HTML wants it.
      const parent = open[open.length - 1]!;
      const previousItem = [...parent.children]
        .reverse()
        .find((child): child is HtmlElement => child.type === 'element' && child.tag === 'li');
      const nested = element(entry.type === 'ordered' ? 'ol' : 'ul', {}, []);
      if (previousItem) previousItem.children.push(nested);
      else parent.children.push(nested);
      open.push(nested);
    }

    const current = open[open.length - 1]!;
    // A level whose type changes mid-run (bullets becoming numbers) starts a new list.
    const wantedTag = entry.type === 'ordered' ? 'ol' : 'ul';
    if (current !== root && current.tag !== wantedTag) current.tag = wantedTag;
    current.children.push(entry.el);
  }

  return root;
}

function transformNode(
  node: HtmlNode,
  options: Required<Pick<QuillInteropOptions, 'sizeMap'>>,
): HtmlNode | HtmlNode[] | null {
  if (node.type !== 'element') return node;

  // Drop Quill's UI artefacts wholesale.
  if (classList(node).some((cls) => ARTEFACT_CLASSES.has(cls))) return null;

  const el: HtmlElement = { ...node, attrs: { ...node.attrs }, children: [...node.children] };

  const align = takeAlign(el);
  if (align) setStyleProperty(el, 'text-align', align);

  if (el.tag !== 'li') {
    const indent = takeIndent(el);
    if (indent > 0) el.attrs['data-indent'] = String(indent);
  }

  const size = takeSize(el, options.sizeMap);
  if (size) setStyleProperty(el, 'font-size', size);

  el.children = el.children.flatMap((child) => {
    const transformed = transformNode(child, options);
    if (transformed === null) return [];
    return Array.isArray(transformed) ? transformed : [transformed];
  });

  if (el.tag === 'ul' || el.tag === 'ol') return restructureList(el);

  return el;
}

/**
 * True when the markup looks like it came from Quill.
 *
 * Used by source detection so a paste from the old editor is cleaned rather than
 * treated as arbitrary HTML.
 */
export function looksLikeQuill(html: string): boolean {
  return /\bql-(align|indent|size|font|cursor|ui)-?/.test(html) || /\bdata-list=/.test(html);
}

/**
 * Converts legacy Quill markup into ordinary HTML.
 *
 * @param nodes the parsed tree, before sanitization
 * @param options `sizeMap` and friends, from the `interop.quill` prop
 *
 * @example
 * ```ts
 * const nodes = parseHtml('<ul><li data-list="bullet">a</li><li data-list="bullet" class="ql-indent-1">b</li></ul>');
 * parseQuillMarkup(nodes);
 * // <ul><li>a<ul><li>b</li></ul></li></ul>
 * ```
 */
export function parseQuillMarkup(nodes: HtmlNode[], options: QuillInteropOptions = {}): HtmlNode[] {
  const resolved = { sizeMap: { ...DEFAULT_SIZE_MAP, ...options.sizeMap } };
  return nodes.flatMap((node) => {
    const transformed = transformNode(node, resolved);
    if (transformed === null) return [];
    return Array.isArray(transformed) ? transformed : [transformed];
  });
}
