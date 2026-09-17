import type { Align, Mark } from '../../types/document.js';
import { sortMarks } from '../../core/document.js';
import type { AnyNode, DocumentTree, NodeKey } from './tree.js';
import { ROOT_KEY } from './tree.js';

/**
 * Model to DOM — stage 3a of ADR-006.
 *
 * The editor's DOM is the *same* DOM `documentToHtml` writes. That is a decision, not a
 * coincidence: `<RteContentView>` renders stored HTML, the editor renders the live model,
 * and the promise the library makes is that the two look identical. Lexical could not
 * quite keep it — it labels marks with classes (`rte-bold`) where the serializer emits
 * elements (`<strong>`), so the content stylesheet has to know both dialects. Rendering
 * the serializer's shape here retires that difference.
 *
 * `render.test.ts` holds the two representations to it: for a corpus of documents, the
 * HTML this produces must equal `documentToHtml(doc)` exactly. If the serializer changes
 * and this does not, that test fails rather than the two quietly drifting apart.
 *
 * Every element carries `data-rte-key`, which is how the reconciler finds the DOM for a
 * model node after an edit, and how selection mapping goes back the other way.
 *
 * @module
 */

/** The attribute that ties a DOM element to its model node. */
export const KEY_ATTRIBUTE = 'data-rte-key';

/** Which element each boolean mark becomes. Valued marks become a styled `span`. */
const MARK_TAG: Record<string, string> = {
  bold: 'strong',
  italic: 'em',
  underline: 'u',
  strike: 's',
  code: 'code',
  subscript: 'sub',
  superscript: 'sup',
};

/** The CSS property each valued mark writes. */
const MARK_STYLE: Record<string, string> = {
  color: 'color',
  backgroundColor: 'background-color',
  fontFamily: 'font-family',
  fontSize: 'font-size',
};

/** Both directions of the key map, built as a render walks. */
export interface RenderIndex {
  /** The outermost DOM node representing each model node. */
  readonly byKey: Map<NodeKey, Node>;
  /** The model node each DOM node belongs to, including the inner nodes of a mark stack. */
  readonly byNode: Map<Node, NodeKey>;
  /** The text node a model text node's characters live in, for selection mapping. */
  readonly textByKey: Map<NodeKey, Text>;
}

/** An empty index, which a render fills. */
export function createIndex(): RenderIndex {
  return { byKey: new Map(), byNode: new Map(), textByKey: new Map() };
}

/** Records `node` as the DOM for `key` in both directions. */
function link(index: RenderIndex, key: NodeKey, node: Node): void {
  index.byKey.set(key, node);
  index.byNode.set(node, key);
}

/** The alignment class, matching the serializer's standard profile. */
function alignClass(align: Align | undefined): string | null {
  return !align || align === 'left' ? null : `rte-align-${align}`;
}

/** Applies the class and indent attributes a block carries. */
function applyBlockAttrs(element: HTMLElement, value: { align?: Align; indent?: number }): void {
  const className = alignClass(value.align);
  if (className !== null) element.className = className;
  if (value.indent !== undefined && value.indent > 0) {
    element.setAttribute('data-indent', String(value.indent));
  }
}

/** Serializes valued marks into one `style` string, in the order the serializer uses. */
function markStyle(marks: Mark[]): string {
  const parts: string[] = [];
  for (const mark of marks) {
    const property = MARK_STYLE[mark.type];
    if (property !== undefined && 'value' in mark) parts.push(`${property}: ${mark.value}`);
  }
  return parts.join('; ');
}

/**
 * Wraps `inner` in the elements `marks` require and returns the outermost.
 *
 * The same order as the serializer: boolean marks innermost-first in `sortMarks` order,
 * then one `span` for everything valued. Two representations of the same text have to
 * produce byte-identical HTML or the round trip through storage is not a round trip.
 */
function wrapInMarks(document_: Document, inner: Node, marks: Mark[] | undefined): Node {
  if (marks === undefined || marks.length === 0) return inner;
  const ordered = sortMarks(marks);
  let current = inner;
  for (const mark of ordered) {
    if (MARK_STYLE[mark.type] !== undefined && 'value' in mark) continue;
    const tag = MARK_TAG[mark.type];
    if (tag === undefined) continue;
    const wrapper = document_.createElement(tag);
    wrapper.append(current);
    current = wrapper;
  }
  const style = markStyle(ordered);
  if (style !== '') {
    const span = document_.createElement('span');
    span.setAttribute('style', style);
    span.append(current);
    current = span;
  }
  return current;
}

/**
 * Builds the DOM for one model node, children included.
 *
 * Returns `null` for a node that renders to nothing, which is only an empty text run —
 * the serializer drops those too, and a zero-length text node in a contenteditable is a
 * place the caret can get stuck with no way out.
 */
export function renderNode(
  tree: DocumentTree,
  key: NodeKey,
  index: RenderIndex,
  document_: Document = globalThis.document,
): Node | null {
  const entry = tree.get(key);
  if (entry === undefined) return null;
  const value = entry.value;
  const children = tree.children(key);

  /** Renders `key`'s children into `parent`, skipping the ones that render to nothing. */
  const appendChildren = (parent: Element, only?: (child: NodeKey) => boolean): void => {
    for (const child of children) {
      if (only !== undefined && !only(child)) continue;
      const rendered = renderNode(tree, child, index, document_);
      if (rendered !== null) parent.append(rendered);
    }
  };

  /** Creates an element, stamps it with the key, and indexes it. */
  const make = (tag: string): HTMLElement => {
    const element = document_.createElement(tag);
    element.setAttribute(KEY_ATTRIBUTE, key);
    link(index, key, element);
    return element;
  };

  switch (value.type) {
    case 'text': {
      if (value.text === '') return null;
      const text = document_.createTextNode(value.text);
      index.textByKey.set(key, text);
      index.byNode.set(text, key);
      const wrapped = wrapInMarks(document_, text, value.marks);
      if (wrapped !== text) {
        (wrapped as HTMLElement).setAttribute(KEY_ATTRIBUTE, key);
        // Every element in the stack maps back, so a selection landing on any of them
        // resolves to the same model node.
        for (let at: Node | null = wrapped; at !== null && at !== text; at = at.firstChild) {
          index.byNode.set(at, key);
        }
      }
      index.byKey.set(key, wrapped);
      return wrapped;
    }

    case 'lineBreak':
      return make('br');

    case 'link': {
      const anchor = make('a') as HTMLAnchorElement;
      anchor.setAttribute('href', value.href);
      if (value.target !== undefined) anchor.setAttribute('target', value.target);
      if (value.rel !== undefined) anchor.setAttribute('rel', value.rel);
      else if (value.target === '_blank') anchor.setAttribute('rel', 'noopener noreferrer');
      if (value.title !== undefined) anchor.setAttribute('title', value.title);
      appendChildren(anchor);
      return anchor;
    }

    case 'mergeTag': {
      /*
       * A chip in the editor, the bare token in storage.
       *
       * This is the one place the editor's DOM and `documentToHtml` differ on purpose.
       * The backend substitutes `{key}`, so that is what gets stored; the author has to
       * see a chip they can select and delete as one thing, so that is what gets
       * rendered. Rendering the token as plain text — which this did — made the tag
       * indistinguishable from the words around it, and "select all and type a new
       * message" left the old `{company_address}` in the text.
       *
       * Deliberately *not* `contenteditable="false"`: the node is already atomic in the
       * model, and the attribute breaks Safari, whose select-all stops at the edge of a
       * non-editable node — which is the bug it was meant to prevent.
       */
      const span = make('span');
      span.className = 'rte-merge-tag';
      span.setAttribute('data-merge-tag', value.key);
      // Not `aria-hidden`: the label is meaningful and a screen reader should read it.
      span.setAttribute('role', 'img');
      span.setAttribute('aria-label', value.label ?? value.key);
      const text = document_.createTextNode(value.label ?? `{${value.key}}`);
      index.textByKey.set(key, text);
      index.byNode.set(text, key);
      span.append(text);
      return span;
    }

    case 'mention': {
      const span = make('span');
      span.setAttribute('data-mention-id', value.id);
      span.className = 'rte-mention';
      const text = document_.createTextNode(value.label);
      index.textByKey.set(key, text);
      // The inner text node maps back too, or a selection landing inside the chip — which
      // is where a click puts it — resolves to nothing.
      index.byNode.set(text, key);
      span.append(text);
      return span;
    }

    case 'emoji': {
      const text = document_.createTextNode(value.char);
      index.textByKey.set(key, text);
      link(index, key, text);
      return text;
    }

    case 'paragraph': {
      const paragraph = make('p');
      applyBlockAttrs(paragraph, value);
      appendChildren(paragraph);
      // An empty paragraph needs a `<br>` or every browser collapses it to nothing and
      // the caret has nowhere to stand.
      if (paragraph.childNodes.length === 0) paragraph.append(document_.createElement('br'));
      return paragraph;
    }

    case 'heading': {
      const heading = make(`h${value.level}`);
      applyBlockAttrs(heading, value);
      appendChildren(heading);
      return heading;
    }

    case 'blockquote': {
      const quote = make('blockquote');
      applyBlockAttrs(quote, value);
      appendChildren(quote);
      return quote;
    }

    case 'list': {
      const list = make(value.listType === 'ordered' ? 'ol' : 'ul');
      if (value.start !== undefined && value.start !== 1) {
        list.setAttribute('start', String(value.start));
      }
      if (value.style !== undefined) list.setAttribute('type', value.style);
      // A check list is a group of checkboxes rather than a list of items, and saying so
      // is what lets each item carry `role="checkbox"`. Leaving the implicit `list` role
      // in place made every item a non-listitem child of a list, which is an accessibility
      // violation in its own right.
      if (value.listType === 'check') list.setAttribute('role', 'group');
      appendChildren(list);
      return list;
    }

    case 'listItem': {
      const item = make('li');
      const parent = entry.parent === null ? undefined : tree.get(entry.parent)?.value;
      if (parent?.type === 'list' && parent.listType === 'check') {
        item.setAttribute('data-checked', String(value.checked === true));
        item.setAttribute('style', 'list-style-type: none');
        // The box is drawn with `::before`, so the item *is* the checkbox as far as a
        // screen reader is concerned and has to say so. `data-checked` is what the
        // stylesheet and the serializer read; `aria-checked` is what a person hears.
        item.setAttribute('role', 'checkbox');
        item.setAttribute('aria-checked', String(value.checked === true));
      }
      const className = alignClass(value.align);
      if (className !== null) item.className = className;
      // Inline content first, then the lists nested under it — the order the serializer
      // writes and the order a reader expects.
      appendChildren(item, (child) => tree.get(child)?.slot === 'content');
      appendChildren(item, (child) => tree.get(child)?.slot === 'children');
      return item;
    }

    case 'codeBlock': {
      const pre = make('pre');
      const code = document_.createElement('code');
      if (value.language !== undefined) code.className = `language-${value.language}`;
      const codeText = document_.createTextNode(value.text);
      code.append(codeText);
      index.textByKey.set(key, codeText);
      index.byNode.set(codeText, key);
      index.byNode.set(code, key);
      pre.append(code);
      return pre;
    }

    case 'horizontalRule':
      return make('hr');

    case 'image': {
      const image = document_.createElement('img');
      image.setAttribute('src', value.src);
      image.setAttribute('alt', value.alt ?? '');
      if (value.title !== undefined) image.setAttribute('title', value.title);
      if (value.width !== undefined) image.setAttribute('width', String(value.width));
      if (value.height !== undefined) image.setAttribute('height', String(value.height));
      const className = alignClass(value.align);
      if (className !== null) image.className = className;
      if (value.caption === undefined) {
        image.setAttribute(KEY_ATTRIBUTE, key);
        link(index, key, image);
        return image;
      }
      const figure = make('figure');
      if (className !== null) figure.className = className;
      // The class belongs to whichever element is outermost, as the serializer does it.
      if (className !== null) image.removeAttribute('class');
      const caption = document_.createElement('figcaption');
      caption.append(document_.createTextNode(value.caption));
      figure.append(image, caption);
      return figure;
    }

    case 'table': {
      const table = make('table');
      const body = document_.createElement('tbody');
      appendChildren(body);
      table.append(body);
      return table;
    }

    case 'tableRow': {
      const row = make('tr');
      appendChildren(row);
      return row;
    }

    case 'tableCell': {
      const cell = make(value.header === true ? 'th' : 'td');
      if (value.colSpan !== undefined && value.colSpan > 1) {
        cell.setAttribute('colspan', String(value.colSpan));
      }
      if (value.rowSpan !== undefined && value.rowSpan > 1) {
        cell.setAttribute('rowspan', String(value.rowSpan));
      }
      if (value.width !== undefined) cell.setAttribute('width', `${value.width}%`);
      const className = alignClass(value.align);
      if (className !== null) cell.className = className;
      appendChildren(cell);
      return cell;
    }

    case 'html': {
      // Only the permissive profile produces these, and the sanitizer has already seen
      // the string by the time it reaches the model.
      const holder = make('div');
      holder.innerHTML = value.html;
      return holder;
    }

    default:
      return null;
  }
}

/** Renders the whole tree into `container`, replacing whatever was there. */
export function renderTree(
  tree: DocumentTree,
  container: HTMLElement,
  document_: Document = globalThis.document,
): RenderIndex {
  const index = createIndex();
  container.replaceChildren();
  link(index, ROOT_KEY, container);
  for (const key of tree.children(ROOT_KEY)) {
    const rendered = renderNode(tree, key, index, document_);
    if (rendered !== null) container.append(rendered);
  }
  return index;
}

/** The node's own properties, for a reconciler deciding whether an element can be reused. */
export function signatureOf(value: AnyNode): string {
  const parts: string[] = [value.type];
  for (const [field, own] of Object.entries(value)) {
    if (field === 'type') continue;
    parts.push(`${field}=${JSON.stringify(own)}`);
  }
  return parts.join('|');
}
