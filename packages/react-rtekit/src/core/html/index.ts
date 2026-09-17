import { hasDomParser, parseHtmlWithDom } from './from-dom.js';
import { parseHtmlFragment } from './parse.js';
import type { HtmlNode } from './nodes.js';

/**
 * The HTML layer: one tree, two frontends (ADR-003).
 *
 * @module
 */

export * from './nodes.js';
export * from './entities.js';
export { parseHtmlFragment } from './parse.js';
export { parseHtmlWithDom, hasDomParser } from './from-dom.js';
export { serializeHtmlNodes, type SerializeHtmlOptions } from './serialize.js';

/** Which parser {@link parseHtml} should use. */
export type HtmlParserChoice = 'auto' | 'dom' | 'builtin';

/**
 * Parses an HTML fragment into the internal tree.
 *
 * `auto` (the default) uses the browser's `DOMParser` when one exists and the in-house
 * tokenizer otherwise. Passing `builtin` explicitly forces the portable path, which is
 * what the security tests use to exercise it inside a browser-like environment.
 *
 * @example
 * ```ts
 * const nodes = parseHtml('<p class="ql-align-center">hi</p>');
 * ```
 */
export function parseHtml(html: string, parser: HtmlParserChoice = 'auto'): HtmlNode[] {
  if (parser === 'builtin') return parseHtmlFragment(html);
  if (parser === 'dom') return parseHtmlWithDom(html);
  return hasDomParser() ? parseHtmlWithDom(html) : parseHtmlFragment(html);
}
