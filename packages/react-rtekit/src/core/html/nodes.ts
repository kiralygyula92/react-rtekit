/**
 * The internal HTML tree.
 *
 * Both frontends — the browser's `DOMParser` and the in-house tokenizer used on the
 * server — produce this shape, so the sanitizer and the interop parsers have exactly
 * one code path and cannot diverge between environments.
 *
 * @module
 */

/** A text run. Already entity-decoded. */
export interface HtmlText {
  /** Discriminator. */
  type: 'text';
  /** The run’s characters, already entity-decoded. */
  text: string;
}

/** A comment. Kept during parsing so conditional comments can be recognized. */
export interface HtmlComment {
  /** Discriminator. */
  type: 'comment';
  /** The comment’s text, without its delimiters. */
  text: string;
}

/** An element. `tag` is always lower-case; attribute names are always lower-case. */
export interface HtmlElement {
  /** Discriminator. */
  type: 'element';
  /** The element name, always lower-case. */
  tag: string;
  /** Attributes, with lower-case names and decoded values. */
  attrs: Record<string, string>;
  /** The element’s children, in document order. */
  children: HtmlNode[];
}

/** Anything in the tree. */
export type HtmlNode = HtmlElement | HtmlText | HtmlComment;

/** Elements that never have children and never need a closing tag. */
export const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

/**
 * Elements whose content is text, not markup.
 *
 * Parsing these as raw text is a security property, not a convenience: it stops
 * `<noscript><p title="</noscript><img src=x onerror=alert(1)>">` from smuggling an
 * element past the sanitizer. Every tag in this set is also hard-blocked, so its
 * content is discarded wholesale.
 */
export const RAW_TEXT_ELEMENTS = new Set([
  'script',
  'style',
  'textarea',
  'title',
  'xmp',
  'iframe',
  'noembed',
  'noframes',
  'noscript',
  'plaintext',
]);

/** Elements that close an open element of the same kind, per the HTML parsing rules. */
export const IMPLIED_END_TAGS: Record<string, Set<string>> = {
  li: new Set(['li']),
  dt: new Set(['dt', 'dd']),
  dd: new Set(['dt', 'dd']),
  p: new Set(['p']),
  rt: new Set(['rt', 'rp']),
  rp: new Set(['rt', 'rp']),
  option: new Set(['option']),
  optgroup: new Set(['option', 'optgroup']),
  thead: new Set(['tr', 'td', 'th', 'tbody', 'thead', 'tfoot']),
  tbody: new Set(['tr', 'td', 'th', 'tbody', 'thead', 'tfoot']),
  tfoot: new Set(['tr', 'td', 'th', 'tbody', 'thead', 'tfoot']),
  tr: new Set(['tr', 'td', 'th']),
  td: new Set(['td', 'th']),
  th: new Set(['td', 'th']),
};

/**
 * Block-level tags that implicitly close an open `<p>`.
 *
 * Word and Google Docs both emit unbalanced paragraphs, so this matters in practice.
 */
export const CLOSES_PARAGRAPH = new Set([
  'address',
  'article',
  'aside',
  'blockquote',
  'details',
  'div',
  'dl',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'hr',
  'main',
  'nav',
  'ol',
  'p',
  'pre',
  'section',
  'table',
  'ul',
]);

/** Type guard for elements. */
export function isElement(node: HtmlNode): node is HtmlElement {
  return node.type === 'element';
}

/** Type guard for text nodes. */
export function isText(node: HtmlNode): node is HtmlText {
  return node.type === 'text';
}

/** Builds an element node. */
export function element(
  tag: string,
  attrs: Record<string, string> = {},
  children: HtmlNode[] = [],
): HtmlElement {
  return { type: 'element', tag: tag.toLowerCase(), attrs, children };
}

/** Builds a text node. */
export function text(value: string): HtmlText {
  return { type: 'text', text: value };
}

/** Concatenates every text descendant of a node, in document order. */
export function textContent(node: HtmlNode | HtmlNode[]): string {
  const nodes = Array.isArray(node) ? node : [node];
  let out = '';
  for (const current of nodes) {
    if (current.type === 'text') out += current.text;
    else if (current.type === 'element') out += textContent(current.children);
  }
  return out;
}

/** Depth-first walk over every element in a tree. */
export function walkElements(
  nodes: HtmlNode[],
  visit: (el: HtmlElement, parent: HtmlElement | null) => void,
  parent: HtmlElement | null = null,
): void {
  for (const node of nodes) {
    if (node.type !== 'element') continue;
    visit(node, parent);
    walkElements(node.children, visit, node);
  }
}

/** The first descendant element matching `tag`, in document order. */
export function findElement(nodes: HtmlNode[], tag: string): HtmlElement | null {
  for (const node of nodes) {
    if (node.type !== 'element') continue;
    if (node.tag === tag) return node;
    const nested = findElement(node.children, tag);
    if (nested) return nested;
  }
  return null;
}
