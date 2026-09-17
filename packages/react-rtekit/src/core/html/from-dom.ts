import type { HtmlElement, HtmlNode } from './nodes.js';

/**
 * The browser frontend: converts a `DOMParser` result into the internal tree.
 *
 * Parsing with the browser means we sanitize *the browser's own interpretation* of the
 * input rather than our approximation of it, which is the safest model for untrusted
 * markup. The server falls back to the in-house tokenizer, and both feed the same
 * sanitizer (ADR-003).
 *
 * @module
 */

/** How deep the tree may nest before conversion stops descending. */
const MAX_DEPTH = 256;

/** True when this environment can parse HTML with `DOMParser`. */
export function hasDomParser(): boolean {
  return typeof DOMParser !== 'undefined' && typeof document !== 'undefined';
}

function convert(node: Node, depth: number): HtmlNode | null {
  if (node.nodeType === 3 /* Node.TEXT_NODE */) {
    const value = node.nodeValue ?? '';
    return value === '' ? null : { type: 'text', text: value };
  }
  if (node.nodeType === 8 /* Node.COMMENT_NODE */) {
    return { type: 'comment', text: node.nodeValue ?? '' };
  }
  if (node.nodeType !== 1 /* Node.ELEMENT_NODE */) return null;

  const el = node as Element;
  // `localName` rather than `tagName`: SVG and MathML keep their original case in
  // `tagName`, and a case-sensitive comparison is exactly how `foreignObject` gets
  // past a naive allowlist.
  const tag = el.localName.toLowerCase();

  const attrs: Record<string, string> = {};
  for (const attr of Array.from(el.attributes)) {
    const name = attr.name.toLowerCase();
    if (!(name in attrs)) attrs[name] = attr.value;
  }

  const children: HtmlNode[] = [];
  if (depth < MAX_DEPTH) {
    for (const child of Array.from(el.childNodes)) {
      const converted = convert(child, depth + 1);
      if (converted) children.push(converted);
    }
  }

  const result: HtmlElement = { type: 'element', tag, attrs, children };
  return result;
}

/**
 * Parses an HTML fragment with the browser's parser.
 *
 * @throws if called where `DOMParser` is unavailable; callers should branch on
 * {@link hasDomParser} first.
 */
export function parseHtmlWithDom(html: string): HtmlNode[] {
  if (!hasDomParser()) throw new Error('DOMParser is not available in this environment');
  // `text/html` never executes anything: the document is inert, scripts do not run and
  // `img` sources are not fetched.
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const nodes: HtmlNode[] = [];
  for (const child of Array.from(doc.body.childNodes)) {
    const converted = convert(child, 0);
    if (converted) nodes.push(converted);
  }
  return nodes;
}
