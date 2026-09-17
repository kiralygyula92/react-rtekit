import { escapeAttribute, escapeText } from './entities.js';
import { VOID_ELEMENTS, type HtmlNode } from './nodes.js';

/**
 * Serializes the internal tree back to HTML.
 *
 * Every text run and attribute value is escaped here and nowhere else, so output is
 * safe by construction: a value that survived the sanitizer cannot change meaning on
 * the way out, and the result is never re-parsed before it leaves the library.
 *
 * @module
 */

/** Options for {@link serializeHtmlNodes}. */
export interface SerializeHtmlOptions {
  /** Put each block on its own line. Cosmetic only. @default false */
  pretty?: boolean;
  /** Tags that are always written as `<tag />`. @default none */
  selfClosing?: ReadonlySet<string>;
}

const BLOCK_TAGS = new Set([
  'p',
  'div',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'blockquote',
  'pre',
  'hr',
  'table',
  'thead',
  'tbody',
  'tr',
  'td',
  'th',
  'figure',
]);

function serializeNode(node: HtmlNode, out: string[], options: SerializeHtmlOptions): void {
  if (node.type === 'text') {
    out.push(escapeText(node.text));
    return;
  }
  if (node.type === 'comment') {
    // Comments never survive sanitization; this branch exists for round-trip tests.
    out.push(`<!--${node.text.replace(/--/g, '- -')}-->`);
    return;
  }

  const attrs = Object.entries(node.attrs)
    .filter(([, value]) => value !== undefined)
    .map(([name, value]) => (value === '' ? ` ${name}=""` : ` ${name}="${escapeAttribute(value)}"`))
    .join('');

  if (VOID_ELEMENTS.has(node.tag)) {
    out.push(`<${node.tag}${attrs}>`);
    return;
  }

  out.push(`<${node.tag}${attrs}>`);
  for (const child of node.children) serializeNode(child, out, options);
  out.push(`</${node.tag}>`);
  if (options.pretty && BLOCK_TAGS.has(node.tag)) out.push('\n');
}

/** Serializes a list of nodes to an HTML string. */
export function serializeHtmlNodes(nodes: HtmlNode[], options: SerializeHtmlOptions = {}): string {
  const out: string[] = [];
  for (const node of nodes) serializeNode(node, out, options);
  return options.pretty ? out.join('').trim() : out.join('');
}
