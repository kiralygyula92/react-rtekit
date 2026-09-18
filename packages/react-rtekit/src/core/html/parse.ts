import { decodeEntities } from './entities.js';
import {
  CLOSES_PARAGRAPH,
  IMPLIED_END_TAGS,
  RAW_TEXT_ELEMENTS,
  VOID_ELEMENTS,
  type HtmlElement,
  type HtmlNode,
} from './nodes.js';

/**
 * The in-house HTML parser.
 *
 * Small, dependency-free and environment-independent. It is deliberately *stricter*
 * than a browser: raw-text elements swallow their content as text, unbalanced tags are
 * closed at the nearest sensible ancestor, and nesting is depth-capped. Anything it
 * cannot make sense of becomes text, which fails closed.
 *
 * @module
 */

/** How deep the tree may nest before the parser stops opening new elements. */
const MAX_DEPTH = 256;

const TAG_NAME_RE = /^[a-zA-Z][a-zA-Z0-9:_.-]*/;

interface ParserState {
  input: string;
  pos: number;
}

function peek(state: ParserState, offset = 0): string {
  return state.input[state.pos + offset] ?? '';
}

/** Reads `<!-- … -->`, including the unterminated form browsers tolerate. */
function readComment(state: ParserState): string {
  // Called with state.pos on the `<` of `<!--`.
  const end = state.input.indexOf('-->', state.pos + 4);
  if (end === -1) {
    const body = state.input.slice(state.pos + 4);
    state.pos = state.input.length;
    return body;
  }
  const body = state.input.slice(state.pos + 4, end);
  state.pos = end + 3;
  return body;
}

/** Reads `<!doctype …>` or a bogus `<! …>` / `<? …>` construct. */
function skipBogus(state: ParserState): void {
  const end = state.input.indexOf('>', state.pos);
  state.pos = end === -1 ? state.input.length : end + 1;
}

/**
 * Reads attributes up to `>` or `/>`.
 *
 * Duplicate names keep the *first* value, matching the HTML spec — taking the last
 * would let `<a href="safe" href="javascript:…">` slip past a first-match check.
 */
function readAttributes(state: ParserState): {
  attrs: Record<string, string>;
  selfClosing: boolean;
} {
  const attrs: Record<string, string> = {};
  let selfClosing = false;

  for (;;) {
    while (/\s/.test(peek(state))) state.pos += 1;
    const ch = peek(state);
    if (ch === '') break;
    if (ch === '>') {
      state.pos += 1;
      break;
    }
    if (ch === '/' && peek(state, 1) === '>') {
      selfClosing = true;
      state.pos += 2;
      break;
    }
    if (ch === '/') {
      state.pos += 1;
      continue;
    }

    // Attribute name: everything up to whitespace, `=`, `/` or `>`.
    const start = state.pos;
    while (state.pos < state.input.length && !/[\s=/>]/.test(peek(state))) state.pos += 1;
    if (state.pos === start) {
      // Not a name character and not a terminator: consume it so we cannot loop.
      state.pos += 1;
      continue;
    }
    const name = state.input.slice(start, state.pos).toLowerCase();

    while (/\s/.test(peek(state))) state.pos += 1;
    let value = '';
    if (peek(state) === '=') {
      state.pos += 1;
      while (/\s/.test(peek(state))) state.pos += 1;
      const quote = peek(state);
      if (quote === '"' || quote === "'") {
        state.pos += 1;
        const end = state.input.indexOf(quote, state.pos);
        if (end === -1) {
          value = state.input.slice(state.pos);
          state.pos = state.input.length;
        } else {
          value = state.input.slice(state.pos, end);
          state.pos = end + 1;
        }
      } else {
        const valueStart = state.pos;
        while (state.pos < state.input.length && !/[\s>]/.test(peek(state))) state.pos += 1;
        value = state.input.slice(valueStart, state.pos);
      }
    }

    if (!(name in attrs)) attrs[name] = decodeEntities(value);
  }

  return { attrs, selfClosing };
}

/** Consumes everything up to the matching close tag, returning it verbatim. */
function readRawText(state: ParserState, tag: string): string {
  const closeRe = new RegExp(`</${tag}(?=[\\s/>])|</${tag}$`, 'i');
  const rest = state.input.slice(state.pos);
  const match = closeRe.exec(rest);
  if (!match) {
    state.pos = state.input.length;
    return rest;
  }
  const raw = rest.slice(0, match.index);
  state.pos += match.index;
  // Consume the close tag itself.
  const end = state.input.indexOf('>', state.pos);
  state.pos = end === -1 ? state.input.length : end + 1;
  return raw;
}

function appendText(parent: HtmlElement, value: string): void {
  if (value === '') return;
  const last = parent.children[parent.children.length - 1];
  if (last?.type === 'text') last.text += value;
  else parent.children.push({ type: 'text', text: value });
}

/**
 * Parses an HTML fragment into the internal tree.
 *
 * @param html the fragment; a full document is accepted and its `<body>` content used
 * @returns the fragment's top-level nodes
 *
 * @example
 * ```ts
 * parseHtmlFragment('<p>hi<br>there');
 * // [{ type: 'element', tag: 'p', attrs: {}, children: [ … ] }]
 * ```
 */
export function parseHtmlFragment(html: string): HtmlNode[] {
  const root: HtmlElement = { type: 'element', tag: '#root', attrs: {}, children: [] };
  const stack: HtmlElement[] = [root];
  const state: ParserState = { input: html, pos: 0 };

  const top = (): HtmlElement => stack[stack.length - 1] ?? root;

  /**
   * Closes elements up to and including the *nearest* open `tag`.
   *
   * Nearest, not outermost: with `<ul><li><ul><li>` open, a `</ul>` closes the inner
   * list, and searching from the start would close the whole structure instead.
   */
  const closeUpTo = (tag: string): void => {
    for (let index = stack.length - 1; index > 0; index -= 1) {
      if (stack[index]!.tag === tag) {
        stack.length = index;
        return;
      }
    }
  };

  /** Closes any open element whose tag is in `tags`, nearest first. */
  const closeIfOpen = (tags: Set<string>): void => {
    while (stack.length > 1) {
      const current = top();
      if (!tags.has(current.tag)) break;
      stack.pop();
    }
  };

  while (state.pos < state.input.length) {
    const lt = state.input.indexOf('<', state.pos);
    if (lt === -1) {
      appendText(top(), decodeEntities(state.input.slice(state.pos)));
      break;
    }
    if (lt > state.pos) {
      appendText(top(), decodeEntities(state.input.slice(state.pos, lt)));
      state.pos = lt;
    }

    // `<` not followed by a plausible tag start is literal text.
    const next = peek(state, 1);
    if (next === '!') {
      if (state.input.startsWith('<!--', state.pos)) {
        const body = readComment(state);
        top().children.push({ type: 'comment', text: body });
      } else {
        skipBogus(state);
      }
      continue;
    }
    if (next === '?') {
      skipBogus(state);
      continue;
    }
    if (next === '/') {
      const rest = state.input.slice(state.pos + 2);
      const match = TAG_NAME_RE.exec(rest);
      if (!match) {
        // `</ …` with no name: browsers treat it as a bogus comment.
        skipBogus(state);
        continue;
      }
      const tag = match[0].toLowerCase();
      const end = state.input.indexOf('>', state.pos);
      state.pos = end === -1 ? state.input.length : end + 1;
      closeUpTo(tag);
      continue;
    }

    const match = TAG_NAME_RE.exec(state.input.slice(state.pos + 1));
    if (!match) {
      appendText(top(), '<');
      state.pos += 1;
      continue;
    }

    const tag = match[0].toLowerCase();
    state.pos += 1 + match[0].length;
    const { attrs, selfClosing } = readAttributes(state);

    if (CLOSES_PARAGRAPH.has(tag)) closeIfOpen(new Set(['p']));
    const implied = Object.hasOwn(IMPLIED_END_TAGS, tag) ? IMPLIED_END_TAGS[tag] : undefined;
    if (implied) closeIfOpen(implied);

    const el: HtmlElement = { type: 'element', tag, attrs, children: [] };
    top().children.push(el);

    if (VOID_ELEMENTS.has(tag) || selfClosing) continue;

    if (RAW_TEXT_ELEMENTS.has(tag)) {
      const raw = readRawText(state, tag);
      // Not entity-decoded: the content of a raw-text element is never markup, and
      // these elements are dropped by the sanitizer anyway.
      if (raw !== '') el.children.push({ type: 'text', text: raw });
      continue;
    }

    if (stack.length < MAX_DEPTH) stack.push(el);
  }

  return unwrapDocument(root.children);
}

/**
 * If the fragment was a whole document, returns the body's children.
 *
 * Word and Excel both paste a complete `<html>` document, so this is the common case
 * rather than an edge case.
 */
function unwrapDocument(nodes: HtmlNode[]): HtmlNode[] {
  const html = nodes.find((node) => node.type === 'element' && node.tag === 'html');
  if (html?.type === 'element') {
    const inner = html.children.find((node) => node.type === 'element' && node.tag === 'body');
    if (inner?.type === 'element') return inner.children;
    return html.children.filter((node) => !(node.type === 'element' && node.tag === 'head'));
  }
  const body = nodes.find((node) => node.type === 'element' && node.tag === 'body');
  if (body?.type === 'element') return body.children;
  return nodes;
}
