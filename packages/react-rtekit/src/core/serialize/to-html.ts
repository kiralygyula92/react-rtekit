import type {
  Align,
  BlockNode,
  EditorDocument,
  InlineNode,
  ListNode,
  Mark,
  TableCellNode,
} from '../../types/document.js';
import type { HtmlProfile } from '../../types/common.js';
import type { EmailOutputOptions, SerializeOptions } from '../../types/interop.js';
import type { SanitizeOption } from '../../types/sanitize.js';
import { element, text as textNode, type HtmlElement, type HtmlNode } from '../html/nodes.js';
import { serializeHtmlNodes } from '../html/serialize.js';
import { sanitizeNodes } from '../sanitize/sanitize.js';
import { serializeStyle, type CssDeclaration } from '../sanitize/css.js';
import { sortMarks } from '../document.js';

/**
 * The portable document model to HTML, in four dialects.
 *
 * | Profile | Alignment | Lists | Styles |
 * |---|---|---|---|
 * | `standard` | `class="rte-align-…"` | plain `ul`/`ol` | colours and fonts only |
 * | `quill-compatible` | `class="ql-align-…"` | `data-list` attributes | as `standard` |
 * | `email` | `style="text-align:…"` | explicit margins | inline, e-mail-safe only |
 * | `minimal` | `class="rte-align-…"` | plain | merged marks, nothing empty |
 *
 * @module
 */

/** Options for {@link documentToHtml}. */
export interface DocumentToHtmlOptions extends SerializeOptions {
  /** Sanitization applied to the output. Pass `false` to skip it. @default 'standard' */
  sanitizeWith?: SanitizeOption;
  /** Absolute base URL used by `email.forceAbsoluteUrls`. */
  baseUrl?: string;
}

interface Ctx {
  profile: HtmlProfile;
  email: EmailOutputOptions;
  mergeTagPreview: Record<string, string>;
  mergeTagSyntax: { open: string; close: string };
}

/** Indent step used by the e-mail profile, where classes do not exist. */
const EMAIL_INDENT_STEP_EM = 3;

// ─── marks ───────────────────────────────────────────────────────────────────

/** Tag used for each boolean mark. */
const MARK_TAG: Record<string, string> = {
  bold: 'strong',
  italic: 'em',
  underline: 'u',
  strike: 's',
  code: 'code',
  subscript: 'sub',
  superscript: 'sup',
};

/** CSS property used for each valued mark. */
const MARK_STYLE: Record<string, string> = {
  color: 'color',
  backgroundColor: 'background-color',
  fontFamily: 'font-family',
  fontSize: 'font-size',
};

/** Wraps a node in the elements its marks require, innermost value marks first. */
function applyMarks(node: HtmlNode, marks: Mark[] | undefined): HtmlNode {
  if (!marks || marks.length === 0) return node;

  const ordered = sortMarks(marks);
  const declarations: CssDeclaration[] = [];
  let current = node;

  for (const mark of ordered) {
    const property = MARK_STYLE[mark.type];
    if (property && 'value' in mark) {
      declarations.push({ property, value: mark.value });
      continue;
    }
    const tag = MARK_TAG[mark.type];
    if (tag) current = element(tag, {}, [current]);
  }

  if (declarations.length > 0) {
    current = element('span', { style: serializeStyle(declarations) }, [current]);
  }
  return current;
}

// ─── inline ──────────────────────────────────────────────────────────────────

function mergeTagNode(node: Extract<InlineNode, { type: 'mergeTag' }>, ctx: Ctx): HtmlNode {
  const preview = ctx.mergeTagPreview[node.key];
  if (preview !== undefined) return textNode(preview);
  // Serialized as plain text, exactly as the backend expects it.
  return textNode(`${ctx.mergeTagSyntax.open}${node.key}${ctx.mergeTagSyntax.close}`);
}

function inlineToHtml(nodes: InlineNode[], ctx: Ctx): HtmlNode[] {
  const out: HtmlNode[] = [];
  for (const node of nodes) {
    switch (node.type) {
      case 'text':
        if (node.text === '') break;
        out.push(applyMarks(textNode(node.text), node.marks));
        break;
      case 'lineBreak':
        out.push(element('br'));
        break;
      case 'link': {
        const attrs: Record<string, string> = { href: absolutize(node.href, ctx) };
        if (node.target) attrs.target = node.target;
        if (node.rel) attrs.rel = node.rel;
        else if (node.target === '_blank') attrs.rel = 'noopener noreferrer';
        if (node.title) attrs.title = node.title;
        out.push(element('a', attrs, inlineToHtml(node.content, ctx)));
        break;
      }
      case 'mergeTag':
        out.push(mergeTagNode(node, ctx));
        break;
      case 'mention':
        out.push(
          element('span', { 'data-mention-id': node.id, class: 'rte-mention' }, [
            textNode(node.label),
          ]),
        );
        break;
      case 'emoji':
        out.push(textNode(node.char));
        break;
      default:
        break;
    }
  }
  return out;
}

function absolutize(url: string, ctx: Ctx): string {
  const base = ctx.email.forceAbsoluteUrls;
  if (!base || /^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//') || url.startsWith('#')) {
    return url;
  }
  return `${base.replace(/\/+$/, '')}/${url.replace(/^\/+/, '')}`;
}

// ─── block attributes ────────────────────────────────────────────────────────

/** Writes alignment in the dialect the profile calls for. */
function alignAttrs(align: Align | undefined, ctx: Ctx): Record<string, string> {
  if (!align || align === 'left') return {};
  if (ctx.profile === 'email') return { style: `text-align: ${align}` };
  if (ctx.profile === 'quill-compatible') return { class: `ql-align-${align}` };
  return { class: `rte-align-${align}` };
}

/** Writes indentation in the dialect the profile calls for. */
function indentAttrs(indent: number | undefined, ctx: Ctx): Record<string, string> {
  if (!indent || indent <= 0) return {};
  if (ctx.profile === 'email') return { style: `padding-left: ${indent * EMAIL_INDENT_STEP_EM}em` };
  if (ctx.profile === 'quill-compatible') return { class: `ql-indent-${indent}` };
  return { 'data-indent': String(indent) };
}

/** Merges the class and style fragments the two helpers above produce. */
function mergeAttrs(...parts: Record<string, string>[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const part of parts) {
    for (const [name, value] of Object.entries(part)) {
      // An empty `alt` is meaningful — it marks an image decorative — so it is the one
      // attribute worth writing empty.
      if (value === '' && name !== 'alt') continue;
      const existing = result[name];
      if (!existing) {
        result[name] = value;
      } else if (name === 'class') {
        result[name] = `${existing} ${value}`;
      } else if (name === 'style') {
        result[name] = `${existing.replace(/;\s*$/, '')}; ${value}`;
      } else {
        result[name] = value;
      }
    }
  }
  return result;
}

// ─── lists ───────────────────────────────────────────────────────────────────

/** Extra styles the e-mail profile puts on lists so resetting clients still indent. */
const EMAIL_LIST_STYLE = 'margin: 0 0 0 1.5em; padding: 0';

function listToHtml(list: ListNode, ctx: Ctx, topLevel = true): HtmlElement {
  const tag = list.listType === 'ordered' ? 'ol' : 'ul';
  const attrs: Record<string, string> = {};
  if (list.start && list.start !== 1) attrs.start = String(list.start);
  if (list.style) attrs.type = list.style;
  if (ctx.profile === 'email') attrs.style = EMAIL_LIST_STYLE;
  if (ctx.profile === 'quill-compatible' && list.listType === 'check') {
    // Quill has no check-list element; the type lives on the items.
  }

  const items = list.items.map((item) => {
    const itemAttrs: Record<string, string> = {};

    if (list.listType === 'check') {
      itemAttrs['data-checked'] = String(item.checked === true);
      // `list-style: none` keeps the bullet from doubling up with the checkbox in
      // clients that ignore our stylesheet.
      itemAttrs.style = 'list-style-type: none';
    }
    if (ctx.profile === 'quill-compatible') {
      itemAttrs['data-list'] =
        list.listType === 'check'
          ? item.checked === true
            ? 'checked'
            : 'unchecked'
          : list.listType === 'ordered'
            ? 'ordered'
            : 'bullet';
    }

    const children: HtmlNode[] = inlineToHtml(item.content, ctx);
    for (const child of item.children ?? []) children.push(listToHtml(child, ctx, false));

    return element('li', mergeAttrs(itemAttrs, alignAttrs(item.align, ctx)), children);
  });

  // Quill's flat form: nested lists are siblings carrying `ql-indent-N`. Flattening
  // happens once, at the outermost list, so depths do not accumulate.
  if (ctx.profile === 'quill-compatible' && topLevel) {
    return element(tag, attrs, flattenForQuill(items, 0));
  }

  return element(tag, attrs, items);
}

/** Flattens nested `<li><ul>…</ul></li>` into Quill's indent-class form. */
function flattenForQuill(items: HtmlNode[], depth: number): HtmlNode[] {
  const out: HtmlNode[] = [];
  for (const item of items) {
    if (item.type !== 'element') {
      out.push(item);
      continue;
    }
    const nestedLists = item.children.filter(
      (child): child is HtmlElement =>
        child.type === 'element' && (child.tag === 'ul' || child.tag === 'ol'),
    );
    const own = item.children.filter(
      (child) => !(child.type === 'element' && (child.tag === 'ul' || child.tag === 'ol')),
    );
    const attrs = { ...item.attrs };
    if (depth > 0) {
      attrs.class = [attrs.class, `ql-indent-${Math.min(8, depth)}`].filter(Boolean).join(' ');
    }
    out.push(element('li', attrs, own));
    for (const nested of nestedLists) out.push(...flattenForQuill(nested.children, depth + 1));
  }
  return out;
}

// ─── blocks ──────────────────────────────────────────────────────────────────

const EMAIL_TABLE_STYLE = 'border-collapse: collapse; width: 100%';
const EMAIL_CELL_STYLE = 'border: 1px solid #E9EAEB; padding: 6px 8px; vertical-align: top';

function cellToHtml(cell: TableCellNode, ctx: Ctx): HtmlElement {
  const attrs: Record<string, string> = {};
  if (cell.colSpan && cell.colSpan > 1) attrs.colspan = String(cell.colSpan);
  if (cell.rowSpan && cell.rowSpan > 1) attrs.rowspan = String(cell.rowSpan);
  // Widths serialize as percentages so e-mail clients keep the proportions.
  if (cell.width) attrs.width = `${cell.width}%`;
  if (ctx.profile === 'email') attrs.style = EMAIL_CELL_STYLE;
  return element(
    cell.header ? 'th' : 'td',
    mergeAttrs(attrs, alignAttrs(cell.align, ctx)),
    blocksToHtml(cell.content, ctx),
  );
}

function blockToHtml(block: BlockNode, ctx: Ctx): HtmlNode | null {
  switch (block.type) {
    case 'paragraph': {
      const children = inlineToHtml(block.content, ctx);
      return element(
        'p',
        mergeAttrs(alignAttrs(block.align, ctx), indentAttrs(block.indent, ctx)),
        // An empty paragraph needs a `<br>` or browsers collapse it to nothing.
        children.length > 0 ? children : [element('br')],
      );
    }
    case 'heading':
      return element(
        `h${block.level}`,
        mergeAttrs(alignAttrs(block.align, ctx), indentAttrs(block.indent, ctx)),
        inlineToHtml(block.content, ctx),
      );
    case 'list':
      return listToHtml(block, ctx);
    case 'blockquote':
      return element(
        'blockquote',
        mergeAttrs(
          alignAttrs(block.align, ctx),
          indentAttrs(block.indent, ctx),
          ctx.profile === 'email'
            ? { style: 'margin: 0 0 0 1em; padding-left: 12px; border-left: 3px solid #D5D7DA' }
            : {},
        ),
        blocksToHtml(block.content, ctx),
      );
    case 'codeBlock': {
      const code = element('code', block.language ? { class: `language-${block.language}` } : {}, [
        textNode(block.text),
      ]);
      return element('pre', {}, [code]);
    }
    case 'horizontalRule':
      return element('hr');
    case 'image': {
      const attrs: Record<string, string> = { src: absolutize(block.src, ctx) };
      attrs.alt = block.alt ?? '';
      if (block.title) attrs.title = block.title;
      if (block.width) attrs.width = String(block.width);
      if (block.height) attrs.height = String(block.height);
      if (ctx.profile === 'email') attrs.style = 'max-width: 100%';
      const img = element('img', mergeAttrs(attrs, alignAttrs(block.align, ctx)));
      if (block.caption) {
        return element('figure', alignAttrs(block.align, ctx), [
          img,
          element('figcaption', {}, [textNode(block.caption)]),
        ]);
      }
      return img;
    }
    case 'table':
      return element(
        'table',
        ctx.profile === 'email'
          ? { style: EMAIL_TABLE_STYLE, cellpadding: '0', cellspacing: '0' }
          : {},
        [
          element(
            'tbody',
            {},
            block.rows.map((row) =>
              element(
                'tr',
                {},
                row.cells.map((cell) => cellToHtml(cell, ctx)),
              ),
            ),
          ),
        ],
      );
    case 'html':
      // Only the `permissive` profile produces these, and the sanitizer still sees them.
      return { type: 'text', text: block.html };
    default:
      return null;
  }
}

function blocksToHtml(blocks: BlockNode[], ctx: Ctx): HtmlNode[] {
  const out: HtmlNode[] = [];
  for (const block of blocks) {
    const node = blockToHtml(block, ctx);
    if (node) out.push(node);
  }
  return out;
}

// ─── minimal profile ─────────────────────────────────────────────────────────

/** Drops empty attributes and empty inline wrappers for the `minimal` profile. */
function minimize(nodes: HtmlNode[]): HtmlNode[] {
  const out: HtmlNode[] = [];
  for (const node of nodes) {
    if (node.type !== 'element') {
      out.push(node);
      continue;
    }
    const attrs: Record<string, string> = {};
    for (const [name, value] of Object.entries(node.attrs)) {
      if (value === '' && name !== 'alt') continue;
      attrs[name] = value;
    }
    const children = minimize(node.children);
    // A span with nothing left to say is not worth the bytes.
    if (node.tag === 'span' && Object.keys(attrs).length === 0) {
      out.push(...children);
      continue;
    }
    out.push({ type: 'element', tag: node.tag, attrs, children });
  }
  return out;
}

// ─── entry point ─────────────────────────────────────────────────────────────

/**
 * Serializes a document to HTML.
 *
 * @example
 * ```ts
 * documentToHtml(doc);                              // standard
 * documentToHtml(doc, { profile: 'quill-compatible' });
 * documentToHtml(doc, { profile: 'email', sanitizeWith: 'email' });
 * ```
 */
export function documentToHtml(doc: EditorDocument, options: DocumentToHtmlOptions = {}): string {
  const profile = options.profile ?? 'standard';
  const ctx: Ctx = {
    profile,
    email: options.email ?? {},
    mergeTagPreview: options.mergeTagPreview ?? {},
    mergeTagSyntax: { open: '{', close: '}' },
  };

  let nodes = blocksToHtml(doc.content, ctx);
  if (profile === 'minimal') nodes = minimize(nodes);

  if (profile === 'email' && ctx.email.wrapInTable) {
    const width = ctx.email.containerWidth ?? 600;
    const font = ctx.email.fontFallback ?? 'Arial, Helvetica, sans-serif';
    nodes = [
      element(
        'table',
        { style: 'width: 100%; border-collapse: collapse', cellpadding: '0', cellspacing: '0' },
        [
          element('tbody', {}, [
            element('tr', {}, [
              element('td', { align: 'center', style: 'padding: 0' }, [
                element(
                  'table',
                  {
                    style: `width: ${width}px; max-width: 100%; border-collapse: collapse`,
                    cellpadding: '0',
                    cellspacing: '0',
                  },
                  [
                    element('tbody', {}, [
                      element('tr', {}, [
                        element('td', { style: `font-family: ${font}; text-align: left` }, nodes),
                      ]),
                    ]),
                  ],
                ),
              ]),
            ]),
          ]),
        ],
      ),
    ];
  }

  const sanitizeWith =
    options.sanitizeWith ??
    (options.sanitize === false ? false : profile === 'email' ? 'email' : 'standard');
  if (sanitizeWith !== false) {
    nodes = sanitizeNodes(nodes, { sanitize: sanitizeWith });
  }

  return serializeHtmlNodes(nodes, { pretty: options.pretty ?? false });
}
