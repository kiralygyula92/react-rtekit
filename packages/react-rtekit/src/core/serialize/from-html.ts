import type {
  Align,
  BlockNode,
  EditorDocument,
  HeadingLevel,
  InlineNode,
  ListItemNode,
  ListNode,
  Mark,
  TableCellNode,
  TableRowNode,
} from '../../types/document.js';
import type { ContentWarning } from '../../types/common.js';
import type { InteropOptions } from '../../types/interop.js';
import type { SanitizeOption, SanitizeViolation } from '../../types/sanitize.js';
import {
  parseHtml,
  textContent,
  type HtmlElement,
  type HtmlNode,
  type HtmlParserChoice,
} from '../html/index.js';
import { sanitizeNodes } from '../sanitize/sanitize.js';
import { readStyleProperty } from '../sanitize/css.js';
import { BLOCK_SCHEMA, MARK_SCHEMA, MAX_INDENT, createFeatureSet } from '../schema.js';
import {
  createDocument,
  isBlank,
  normalizeDocument,
  sortMarks,
  type NormalizeOptions,
} from '../document.js';
import { cleanOfficeMarkup, detectOfficeSource } from '../interop/office.js';
import { looksLikeQuill, parseQuillMarkup } from '../interop/quill.js';
import { normalizeColor } from '../utils/color.js';

/**
 * HTML to the portable document model (03 §3).
 *
 * The full input pipeline: parse, interop, sanitize, schema downgrade, normalize. Every
 * piece of content entering the editor goes through here, whether it came from the
 * `value` prop, a paste, a drop or `insertContent`.
 *
 * @module
 */

/** Merge-tag parsing settings used while reading HTML. */
export interface MergeTagParseOptions {
  /** The delimiters a tag is written with. @default { open: '{', close: '}' } */
  syntax?: { open: string; close: string };
  /** Turn `{key}` text into tag nodes. @default true */
  parseOnInput?: boolean;
  /** Keys that are known; unknown ones are reported through `onWarning`. */
  knownKeys?: string[];
  /** Human labels, used by `getLength` in `label` mode. */
  labels?: Record<string, string>;
}

/** Options for {@link htmlToDocument}. */
export interface HtmlToDocumentOptions {
  /** The profile applied before parsing; `false` is unsafe. @default 'standard' */
  sanitize?: SanitizeOption;
  /** Which dialects to recognize, and how to clean them. */
  interop?: InteropOptions;
  /** Active features; anything outside the set is downgraded (03 §2). */
  features?: ReadonlySet<string>;
  /** How `{key}` text becomes tag nodes. */
  mergeTags?: MergeTagParseOptions;
  /** Which frontend reads the markup; `auto` picks by environment. @default 'auto' */
  parser?: HtmlParserChoice;
  /** Receives everything that was dropped or downgraded. */
  onWarning?: (warning: ContentWarning) => void;
  /**
   * Receives each sanitizer removal, unconverted.
   *
   * `onWarning` flattens a violation into the schema's vocabulary; this one keeps the
   * sanitizer's own, which is what a security log wants (06 §4).
   */
  onViolation?: (violation: SanitizeViolation) => void;
  /** Normalization settings, or `false` to skip it. */
  normalize?: NormalizeOptions | false;
}

/**
 * Every feature, for callers that do not restrict the schema.
 *
 * `htmlToDocument` is used on its own — by `<RteContentView>`, by tests and by the
 * migration tooling — where there is no editor to ask, so the default has to be
 * everything rather than the schema of some particular preset.
 */
export const ALL_FEATURES: ReadonlySet<string> = createFeatureSet([
  ...Object.values(BLOCK_SCHEMA).map((entry) => entry.feature),
  ...Object.values(MARK_SCHEMA).map((entry) => entry.feature),
  'checkList',
  'align',
  'indent',
  'link',
  'mergeTag',
  'mention',
  'emoji',
]);

const HEADING_TAGS: Record<string, HeadingLevel> = { h1: 1, h2: 2, h3: 3, h4: 4, h5: 5, h6: 6 };

/** Inline tags that add a mark, keyed by tag. */
const MARK_TAGS: Record<string, Mark['type']> = {
  strong: 'bold',
  b: 'bold',
  em: 'italic',
  i: 'italic',
  u: 'underline',
  ins: 'underline',
  s: 'strike',
  strike: 'strike',
  del: 'strike',
  code: 'code',
  kbd: 'code',
  samp: 'code',
  sub: 'subscript',
  sup: 'superscript',
};

interface Context {
  features: ReadonlySet<string>;
  mergeTags: Required<MergeTagParseOptions>;
  warn: (warning: ContentWarning) => void;
}

// ─── attribute readers ───────────────────────────────────────────────────────

function readAlign(el: HtmlElement): Align | undefined {
  const fromStyle = readStyleProperty(el.attrs.style, 'text-align');
  const candidate =
    fromStyle ??
    /(?:^|\s)(?:rte|ql)-align-(left|center|right|justify)(?:\s|$)/.exec(el.attrs.class ?? '')?.[1] ??
    el.attrs.align;
  if (candidate === 'center' || candidate === 'right' || candidate === 'justify') return candidate;
  if (candidate === 'left') return 'left';
  return undefined;
}

function readIndent(el: HtmlElement): number | undefined {
  const raw = el.attrs['data-indent'];
  if (!raw) return undefined;
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value <= 0) return undefined;
  return Math.min(MAX_INDENT, value);
}

function readDimension(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

/** Collects the marks an inline element contributes. */
function marksFromElement(el: HtmlElement, ctx: Context): Mark[] {
  const marks: Mark[] = [];
  const add = (mark: Mark): void => {
    if (ctx.features.has(MARK_SCHEMA[mark.type].feature)) marks.push(mark);
    else ctx.warn({ code: 'feature-disabled', message: `Mark "${mark.type}" is disabled`, tag: el.tag });
  };

  const tagMark = MARK_TAGS[el.tag];
  if (tagMark) add({ type: tagMark } as Mark);

  const style = el.attrs.style;
  if (style) {
    const color = normalizeColor(readStyleProperty(style, 'color'));
    if (color) add({ type: 'color', value: color });

    const background =
      normalizeColor(readStyleProperty(style, 'background-color')) ??
      normalizeColor(readStyleProperty(style, 'background'));
    if (background) add({ type: 'backgroundColor', value: background });

    const fontFamily = readStyleProperty(style, 'font-family');
    if (fontFamily) add({ type: 'fontFamily', value: fontFamily });

    const fontSize = readStyleProperty(style, 'font-size');
    if (fontSize) add({ type: 'fontSize', value: fontSize });

    const weight = readStyleProperty(style, 'font-weight');
    if (weight && (weight === 'bold' || Number.parseInt(weight, 10) >= 600)) add({ type: 'bold' });

    const fontStyle = readStyleProperty(style, 'font-style');
    if (fontStyle === 'italic' || fontStyle === 'oblique') add({ type: 'italic' });

    const decoration = readStyleProperty(style, 'text-decoration');
    if (decoration?.includes('underline')) add({ type: 'underline' });
    if (decoration?.includes('line-through')) add({ type: 'strike' });
  }

  return marks;
}

// ─── merge tags ──────────────────────────────────────────────────────────────

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Splits a text run into text and merge-tag nodes. */
function splitMergeTags(text: string, marks: Mark[], ctx: Context): InlineNode[] {
  const { syntax, parseOnInput, knownKeys, labels } = ctx.mergeTags;
  if (!parseOnInput || !ctx.features.has('mergeTag') || text === '') {
    return text === '' ? [] : [{ type: 'text', text, ...(marks.length ? { marks } : {}) }];
  }

  const pattern = new RegExp(
    `${escapeRegExp(syntax.open)}\\s*([A-Za-z_][A-Za-z0-9_.-]*)\\s*${escapeRegExp(syntax.close)}`,
    'g',
  );

  const out: InlineNode[] = [];
  let lastIndex = 0;
  for (let match = pattern.exec(text); match !== null; match = pattern.exec(text)) {
    const key = match[1]!;
    if (knownKeys.length > 0 && !knownKeys.includes(key)) {
      ctx.warn({ code: 'schema-violation', message: `Unknown merge tag "${key}"` });
    }
    if (match.index > lastIndex) {
      out.push({
        type: 'text',
        text: text.slice(lastIndex, match.index),
        ...(marks.length ? { marks } : {}),
      });
    }
    const label = labels[key];
    out.push({ type: 'mergeTag', key, ...(label ? { label } : {}) });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex === 0) return [{ type: 'text', text, ...(marks.length ? { marks } : {}) }];
  if (lastIndex < text.length) {
    out.push({ type: 'text', text: text.slice(lastIndex), ...(marks.length ? { marks } : {}) });
  }
  return out;
}

// ─── inline conversion ───────────────────────────────────────────────────────

interface InlineResult {
  inline: InlineNode[];
  /** Blocks found in inline position, emitted as siblings of the containing block. */
  extracted: BlockNode[];
}

function convertInline(nodes: HtmlNode[], marks: Mark[], ctx: Context): InlineResult {
  const inline: InlineNode[] = [];
  const extracted: BlockNode[] = [];

  for (const node of nodes) {
    if (node.type === 'comment') continue;

    if (node.type === 'text') {
      inline.push(...splitMergeTags(node.text, marks, ctx));
      continue;
    }

    const el = node;

    if (el.tag === 'br') {
      if (ctx.features.has('lineBreak')) inline.push({ type: 'lineBreak' });
      continue;
    }

    if (el.tag === 'img') {
      // The document model has images as blocks, so an inline image becomes a sibling.
      const block = convertImage(el, ctx);
      if (block) extracted.push(block);
      continue;
    }

    if (el.tag === 'hr') {
      if (ctx.features.has('horizontalRule')) extracted.push({ type: 'horizontalRule' });
      continue;
    }

    if (el.tag === 'a') {
      const href = el.attrs.href ?? '';
      const nested = convertInline(el.children, [...marks, ...marksFromElement(el, ctx)], ctx);
      extracted.push(...nested.extracted);
      if (!ctx.features.has('link') || href === '') {
        if (!ctx.features.has('link')) {
          ctx.warn({ code: 'feature-disabled', message: 'Links are disabled', tag: 'a' });
        }
        inline.push(...nested.inline);
        continue;
      }
      inline.push({
        type: 'link',
        href,
        ...(el.attrs.target ? { target: el.attrs.target } : {}),
        ...(el.attrs.rel ? { rel: el.attrs.rel } : {}),
        ...(el.attrs.title ? { title: el.attrs.title } : {}),
        content: nested.inline,
      });
      continue;
    }

    if (el.tag === 'span') {
      const tagKey = el.attrs['data-merge-tag'];
      if (tagKey && ctx.features.has('mergeTag')) {
        const label = ctx.mergeTags.labels[tagKey];
        inline.push({ type: 'mergeTag', key: tagKey, ...(label ? { label } : {}) });
        continue;
      }
      const mentionId = el.attrs['data-mention-id'];
      if (mentionId && ctx.features.has('mention')) {
        inline.push({ type: 'mention', id: mentionId, label: textContent(el.children) });
        continue;
      }
      if (el.attrs['data-emoji'] && ctx.features.has('emoji')) {
        inline.push({ type: 'emoji', char: textContent(el.children) });
        continue;
      }
    }

    // Any other element contributes its marks and its children.
    const nested = convertInline(el.children, [...marks, ...marksFromElement(el, ctx)], ctx);
    inline.push(...nested.inline);
    extracted.push(...nested.extracted);
  }

  return { inline: dedupeMarks(inline), extracted };
}

/** Removes duplicate marks introduced by nesting, keeping the innermost value. */
function dedupeMarks(nodes: InlineNode[]): InlineNode[] {
  return nodes.map((node) => {
    if (node.type === 'link') return { ...node, content: dedupeMarks(node.content) };
    if (node.type !== 'text' || !node.marks) return node;
    const seen = new Map<Mark['type'], Mark>();
    for (const mark of node.marks) seen.set(mark.type, mark);
    return { ...node, marks: sortMarks([...seen.values()]) };
  });
}

// ─── block conversion ────────────────────────────────────────────────────────

function convertImage(el: HtmlElement, ctx: Context): BlockNode | null {
  if (!ctx.features.has('image')) {
    ctx.warn({ code: 'feature-disabled', message: 'Images are disabled', tag: 'img' });
    return null;
  }
  const src = el.attrs.src;
  if (!src) return null;
  const width = readDimension(el.attrs.width) ?? readDimension(readStyleProperty(el.attrs.style, 'width') ?? undefined);
  const height = readDimension(el.attrs.height);
  const align = readAlign(el);
  return {
    type: 'image',
    src,
    ...(el.attrs.alt ? { alt: el.attrs.alt } : {}),
    ...(el.attrs.title ? { title: el.attrs.title } : {}),
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
    ...(align && align !== 'left' ? { align } : {}),
  };
}

/**
 * Converts `<figure><img><figcaption>` into one captioned image.
 *
 * Without this the caption lands in a paragraph of its own: a figure is otherwise a
 * transparent container, and the two halves would drift apart on the next edit.
 * Returns `null` for a figure that holds anything other than a single image, which is
 * then handled as an ordinary container.
 */
function convertFigure(el: HtmlElement, ctx: Context): BlockNode | null {
  const elements = el.children.filter((child): child is HtmlElement => child.type === 'element');
  const image = elements.find((child) => child.tag === 'img');
  if (!image || elements.some((child) => child.tag !== 'img' && child.tag !== 'figcaption')) {
    return null;
  }

  const block = convertImage(image, ctx);
  if (block?.type !== 'image') return block;

  const figcaption = elements.find((child) => child.tag === 'figcaption');
  const caption = figcaption ? textContent(figcaption).trim() : '';
  const align = readAlign(el);
  return {
    ...block,
    ...(align && align !== 'left' ? { align } : {}),
    ...(caption ? { caption } : {}),
  };
}

/** Applies the schema downgrade rules to a block that a disabled feature produced. */
function downgrade(block: BlockNode, ctx: Context): BlockNode[] {
  const entry = BLOCK_SCHEMA[block.type];
  if (ctx.features.has(entry.feature)) return [block];

  ctx.warn({
    code: 'feature-disabled',
    message: `Block "${block.type}" is disabled and was downgraded`,
  });

  if (entry.downgradeTo === null) return [];

  switch (block.type) {
    case 'heading':
      return [{ type: 'paragraph', content: block.content, ...(block.align ? { align: block.align } : {}) }];
    case 'blockquote':
      return block.content.flatMap((child) => downgrade(child, ctx));
    case 'codeBlock':
      return [{ type: 'paragraph', content: [{ type: 'text', text: block.text }] }];
    case 'list':
      return block.items.map((item) => ({ type: 'paragraph', content: item.content }));
    case 'table':
      return block.rows.flatMap((row) =>
        row.cells.flatMap((cell) => cell.content.flatMap((child) => downgrade(child, ctx))),
      );
    default:
      return [{ type: 'paragraph', content: [] }];
  }
}

function convertListItem(el: HtmlElement, ctx: Context): ListItemNode {
  const blockChildren: HtmlElement[] = [];
  const inlineChildren: HtmlNode[] = [];
  for (const child of el.children) {
    if (child.type === 'element' && (child.tag === 'ul' || child.tag === 'ol')) blockChildren.push(child);
    else inlineChildren.push(child);
  }

  const { inline } = convertInline(inlineChildren, [], ctx);
  const checkedAttr = el.attrs['data-checked'];
  const children = blockChildren
    .map((child) => convertList(child, ctx))
    .filter((list): list is ListNode => list !== null);

  return {
    type: 'listItem',
    ...(checkedAttr !== undefined ? { checked: checkedAttr === 'true' || checkedAttr === '' } : {}),
    ...(readAlign(el) && readAlign(el) !== 'left' ? { align: readAlign(el) } : {}),
    content: inline,
    ...(children.length > 0 ? { children } : {}),
  };
}

function convertList(el: HtmlElement, ctx: Context): ListNode | null {
  const items = el.children.filter(
    (child): child is HtmlElement => child.type === 'element' && child.tag === 'li',
  );
  if (items.length === 0) return null;

  const converted = items.map((item) => convertListItem(item, ctx));
  const isCheck = converted.some((item) => item.checked !== undefined);
  const listType = isCheck ? 'check' : el.tag === 'ol' ? 'ordered' : 'bullet';

  if (listType === 'check' && !ctx.features.has('checkList')) {
    ctx.warn({ code: 'feature-disabled', message: 'Check lists are disabled' });
    return { type: 'list', listType: 'bullet', items: converted.map(({ checked: _checked, ...rest }) => rest) };
  }

  const start = readDimension(el.attrs.start);
  const style = el.attrs.type;
  return {
    type: 'list',
    listType,
    ...(start && start !== 1 ? { start } : {}),
    ...(style && /^[1aAiI]$/.test(style) ? { style: style as ListNode['style'] } : {}),
    items: converted,
  };
}

function convertTable(el: HtmlElement, ctx: Context): BlockNode | null {
  const rows: TableRowNode[] = [];
  const collectRows = (nodes: HtmlNode[]): void => {
    for (const node of nodes) {
      if (node.type !== 'element') continue;
      if (node.tag === 'tr') {
        const cells: TableCellNode[] = [];
        for (const cellNode of node.children) {
          if (cellNode.type !== 'element') continue;
          if (cellNode.tag !== 'td' && cellNode.tag !== 'th') continue;
          cells.push({
            type: 'tableCell',
            ...(cellNode.tag === 'th' ? { header: true } : {}),
            ...(readDimension(cellNode.attrs.colspan) ? { colSpan: readDimension(cellNode.attrs.colspan) } : {}),
            ...(readDimension(cellNode.attrs.rowspan) ? { rowSpan: readDimension(cellNode.attrs.rowspan) } : {}),
            ...(readAlign(cellNode) ? { align: readAlign(cellNode) } : {}),
            content: convertBlocks(cellNode.children, ctx),
          });
        }
        if (cells.length > 0) rows.push({ type: 'tableRow', cells });
        continue;
      }
      if (['thead', 'tbody', 'tfoot'].includes(node.tag)) collectRows(node.children);
    }
  };
  collectRows(el.children);
  if (rows.length === 0) return null;
  return { type: 'table', rows };
}

/** Tags that are containers rather than blocks in their own right. */
const TRANSPARENT_BLOCK_TAGS = new Set(['div', 'figure', 'colgroup', 'caption']);

/** Tags that force a new block when they appear. */
const BLOCK_TAGS = new Set([
  'p',
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
  'div',
  'figure',
]);

/**
 * True when an inline element wraps block-level content.
 *
 * Office pastes do this constantly — Google Docs wraps whole documents in a `<b>` —
 * and treating such an element as inline would fold every paragraph it contains into
 * one. Recursing into it instead keeps the structure.
 */
function containsBlock(el: HtmlElement): boolean {
  return el.children.some(
    (child) => child.type === 'element' && (BLOCK_TAGS.has(child.tag) || containsBlock(child)),
  );
}

function convertBlocks(nodes: HtmlNode[], ctx: Context): BlockNode[] {
  const out: BlockNode[] = [];
  /** Inline runs between block elements are gathered into an implicit paragraph. */
  let pending: HtmlNode[] = [];

  const flush = (): void => {
    if (pending.length === 0) return;
    const { inline, extracted } = convertInline(pending, [], ctx);
    pending = [];
    if (inline.length > 0) out.push({ type: 'paragraph', content: inline });
    for (const block of extracted) out.push(...downgrade(block, ctx));
  };

  for (const node of nodes) {
    if (node.type === 'comment') continue;
    if (node.type === 'text') {
      if (node.text.trim() !== '') pending.push(node);
      continue;
    }

    const el = node;
    const align = readAlign(el);
    const indent = readIndent(el);

    if (el.tag === 'figure') {
      const figure = convertFigure(el, ctx);
      if (figure) {
        flush();
        out.push(...downgrade(figure, ctx));
        continue;
      }
      // Not an image figure: fall through and treat it as the transparent container
      // it is, so its blocks are kept.
    }

    if (el.tag === 'p') {
      flush();
      const { inline, extracted } = convertInline(el.children, [], ctx);
      out.push({
        type: 'paragraph',
        ...(align && align !== 'left' ? { align } : {}),
        ...(indent ? { indent } : {}),
        content: inline,
      });
      for (const block of extracted) out.push(...downgrade(block, ctx));
      continue;
    }

    const headingLevel = HEADING_TAGS[el.tag];
    if (headingLevel) {
      flush();
      const { inline, extracted } = convertInline(el.children, [], ctx);
      out.push(
        ...downgrade(
          {
            type: 'heading',
            level: headingLevel,
            ...(align && align !== 'left' ? { align } : {}),
            ...(indent ? { indent } : {}),
            content: inline,
          },
          ctx,
        ),
      );
      for (const block of extracted) out.push(...downgrade(block, ctx));
      continue;
    }

    if (el.tag === 'ul' || el.tag === 'ol') {
      flush();
      const list = convertList(el, ctx);
      if (list) out.push(...downgrade(list, ctx));
      continue;
    }

    if (el.tag === 'blockquote') {
      flush();
      out.push(
        ...downgrade(
          {
            type: 'blockquote',
            ...(align && align !== 'left' ? { align } : {}),
            ...(indent ? { indent } : {}),
            content: convertBlocks(el.children, ctx),
          },
          ctx,
        ),
      );
      continue;
    }

    if (el.tag === 'pre') {
      flush();
      const codeEl = el.children.find(
        (child): child is HtmlElement => child.type === 'element' && child.tag === 'code',
      );
      const language = /(?:^|\s)language-([\w+-]+)/.exec(codeEl?.attrs.class ?? '')?.[1];
      out.push(
        ...downgrade(
          {
            type: 'codeBlock',
            ...(language ? { language } : {}),
            text: textContent(codeEl ? codeEl.children : el.children),
          },
          ctx,
        ),
      );
      continue;
    }

    if (el.tag === 'hr') {
      flush();
      out.push(...downgrade({ type: 'horizontalRule' }, ctx));
      continue;
    }

    if (el.tag === 'img') {
      flush();
      const image = convertImage(el, ctx);
      if (image) out.push(...downgrade(image, ctx));
      continue;
    }

    if (el.tag === 'table') {
      flush();
      const table = convertTable(el, ctx);
      if (table) out.push(...downgrade(table, ctx));
      continue;
    }

    if (TRANSPARENT_BLOCK_TAGS.has(el.tag) || containsBlock(el)) {
      flush();
      const nested = convertBlocks(el.children, ctx);
      // A `div` wrapping only inline content is a paragraph.
      if (nested.length === 0) {
        const { inline } = convertInline(el.children, [], ctx);
        if (inline.length > 0) {
          out.push({
            type: 'paragraph',
            ...(align && align !== 'left' ? { align } : {}),
            content: inline,
          });
        }
      } else {
        out.push(...nested);
      }
      continue;
    }

    // Everything else is inline.
    pending.push(el);
  }

  flush();
  return out;
}

// ─── entry point ─────────────────────────────────────────────────────────────

/**
 * Parses HTML into the portable document model.
 *
 * Runs the whole input pipeline from 03 §3: source detection, interop, sanitization,
 * schema downgrade and normalization.
 *
 * @example
 * ```ts
 * htmlToDocument('<p class="ql-align-center">hi</p>');
 * // { type: 'doc', version: 1, content: [{ type: 'paragraph', align: 'center', … }] }
 * ```
 */
export function htmlToDocument(html: string, options: HtmlToDocumentOptions = {}): EditorDocument {
  const warnings: ContentWarning[] = [];
  const ctx: Context = {
    features: options.features ?? ALL_FEATURES,
    mergeTags: {
      syntax: options.mergeTags?.syntax ?? { open: '{', close: '}' },
      parseOnInput: options.mergeTags?.parseOnInput ?? true,
      knownKeys: options.mergeTags?.knownKeys ?? [],
      labels: options.mergeTags?.labels ?? {},
    },
    warn: (warning) => {
      warnings.push(warning);
      options.onWarning?.(warning);
    },
  };

  if (html.trim() === '') return createDocument([]);

  let nodes: HtmlNode[] = parseHtml(html, options.parser ?? 'auto');

  // 1. interop, while the dialect's own classes and styles are still present
  const inputs = options.interop?.input ?? ['quill', 'office', 'standard'];
  if (inputs.includes('office') && detectOfficeSource(html) !== null) {
    nodes = cleanOfficeMarkup(nodes, options.interop?.office);
  }
  if (inputs.includes('quill') && looksLikeQuill(html)) {
    nodes = parseQuillMarkup(nodes, options.interop?.quill);
  }

  // 2. sanitize
  nodes = sanitizeNodes(nodes, {
    sanitize: options.sanitize ?? 'standard',
    parser: options.parser,
    onViolation: (violation) => {
      options.onViolation?.(violation);
      ctx.warn({
        code:
          violation.reason === 'protocol-not-allowed' || violation.reason === 'data-url-not-allowed'
            ? 'disallowed-protocol'
            : violation.attribute
              ? 'unknown-attribute'
              : 'unknown-tag',
        message: `Removed ${violation.attribute ? `${violation.tag}[${violation.attribute}]` : violation.tag}: ${violation.reason}`,
        tag: violation.tag,
        ...(violation.attribute ? { attribute: violation.attribute } : {}),
      });
    },
  });

  // 3. schema downgrade happens inside the conversion, 4. normalization after it
  const doc = createDocument(convertBlocks(nodes, ctx));
  return options.normalize === false ? doc : normalizeDocument(doc, options.normalize ?? {});
}

/**
 * True when an HTML string holds no visible content (fixes R2).
 *
 * The cheap path for callers that only need the boolean and do not want to build a
 * document: `''`, `'<p></p>'`, `'<p><br></p>'` and whitespace-only markup are empty,
 * while `'<p>&nbsp;</p>'` is not.
 *
 * @example
 * ```ts
 * isEmptyHtml('<p><br></p>');   // true
 * isEmptyHtml('<p>&nbsp;</p>'); // false
 * ```
 */
export function isEmptyHtml(html: string): boolean {
  if (isBlank(html)) return true;
  // Images, rules and tables are content even with no text.
  if (/<(img|hr|table|iframe|video|audio)\b/i.test(html)) return false;
  const nodes = parseHtml(html, 'builtin');
  // `isBlank` rather than `trim`, so a deliberate `&nbsp;` still counts as content.
  return isBlank(textContent(nodes));
}
