import type {
  BlockNode,
  EditorDocument,
  InlineNode,
  ListNode,
  Mark,
} from '../../types/document.js';
import { createDocument, normalizeDocument } from '../document.js';
import { htmlToDocument, type HtmlToDocumentOptions } from './from-html.js';
import { checkUrl, DEFAULT_PROTOCOLS, type UrlPolicy } from '../sanitize/url.js';

/**
 * Markdown.
 *
 * CommonMark plus the GFM extensions the editor can actually produce: tables,
 * strikethrough and task lists. Merge tags serialize to a configurable syntax
 * (`{{key}}` by default) so a Markdown round-trip does not destroy them.
 *
 * @module
 */

/** Options for {@link documentToMarkdown}. */
export interface MarkdownOptions {
  /** How a merge tag is written. `{key}` is interpolated. @default '{{key}}' */
  mergeTagSyntax?: string;
  /** Bullet character for unordered lists. @default '-' */
  bullet?: '-' | '*' | '+';
  /** Fence used for code blocks. @default '```' */
  fence?: string;
}

/**
 * Characters that are syntax wherever they appear.
 *
 * Deliberately short. Escaping every character that is *ever* special turned ordinary
 * prose into `The well\-known result \(see below\) is ready\.` — correct Markdown, and
 * not something anyone wants handed back from `valueFormat="markdown"`. A full stop, a
 * hyphen or a bracket is only syntax in a position, and those positions are handled
 * where the line is assembled.
 */
const ESCAPE_RE = /([\\`*_[\]])/g;

/** `!` only matters immediately before a link, where it makes an image. */
const IMAGE_BANG_RE = /!(?=\[)/g;

/**
 * A line that would be read back as a block marker rather than as text.
 *
 * A paragraph beginning "- " really is a list to a Markdown reader, so the marker is
 * escaped when it lands at the start of a line and left alone everywhere else.
 */
const LEADING_MARKER_RE = /^(\s*)(?:(#{1,6}|[-+>])|(\d{1,9})([.)]))(?=\s|$)/;

/** A line that is nothing but a thematic break: three or more `-`, `_` or `*`. */
const THEMATIC_BREAK_RE = /^(\s*)([-_*])(?:\s*\2){2,}\s*$/;

/** Escapes Markdown punctuation in a text run. */
function escapeMarkdown(value: string): string {
  return value.replace(ESCAPE_RE, '\\$1').replace(IMAGE_BANG_RE, '\\!');
}

/**
 * Escapes a block marker that a line happens to start with.
 *
 * A marker counts when it is followed by a space *or by the end of the line*: `-` alone
 * is a list item and `## #` is a heading, so requiring a space let both through and the
 * paragraph came back as a different block entirely.
 *
 * An ordered marker is escaped at its punctuation rather than at its digits — `1\.`, not
 * `\1.`. Escaping the digit does neutralize the list, but reading it back produces the
 * literal text `\1.`, which is escaped again on the next write.
 */
function escapeLeadingMarker(line: string): string {
  const thematic = line.replace(
    THEMATIC_BREAK_RE,
    (_match, indent: string, char: string) => `${indent}\\${char}${line.trimStart().slice(1)}`,
  );
  if (thematic !== line) return thematic;

  return line.replace(
    LEADING_MARKER_RE,
    (
      _match,
      indent: string,
      simple: string | undefined,
      digits: string | undefined,
      punctuation: string | undefined,
    ) => (simple === undefined ? `${indent}${digits!}\\${punctuation!}` : `${indent}\\${simple}`),
  );
}

function wrap(value: string, marks: Mark[] | undefined): string {
  if (!marks || marks.length === 0 || value.trim() === '') return value;
  let out = value;
  // `code` is innermost: its content is literal, so nothing else may be escaped inside.
  if (marks.some((mark) => mark.type === 'code')) out = `\`${out.replace(/`/g, '\\`')}\``;
  if (marks.some((mark) => mark.type === 'bold')) out = `**${out}**`;
  if (marks.some((mark) => mark.type === 'italic')) out = `*${out}*`;
  if (marks.some((mark) => mark.type === 'strike')) out = `~~${out}~~`;
  // Underline and colour have no Markdown form; they are dropped, which is the
  // documented lossy edge of this format.
  return out;
}

function inlineToMarkdown(nodes: InlineNode[], options: Required<MarkdownOptions>): string {
  let out = '';
  for (const node of nodes) {
    switch (node.type) {
      case 'text': {
        const isCode = node.marks?.some((mark) => mark.type === 'code') ?? false;
        out += wrap(isCode ? node.text : escapeMarkdown(node.text), node.marks);
        break;
      }
      case 'lineBreak':
        out += '  \n';
        break;
      case 'link':
        out += `[${inlineToMarkdown(node.content, options)}](${node.href})`;
        break;
      case 'mergeTag':
        // The template's literal `key` is the placeholder, so the default `{{key}}`
        // yields `{{company_name}}` rather than eating one pair of braces.
        out += options.mergeTagSyntax.replace('key', node.key);
        break;
      case 'mention':
        out += `@${node.label}`;
        break;
      case 'emoji':
        out += node.char;
        break;
      default:
        break;
    }
  }
  return out;
}

function listToMarkdown(
  list: ListNode,
  options: Required<MarkdownOptions>,
  depth: number,
): string[] {
  const lines: string[] = [];
  const indent = '  '.repeat(depth);
  list.items.forEach((item, index) => {
    const marker =
      list.listType === 'ordered'
        ? `${(list.start ?? 1) + index}.`
        : list.listType === 'check'
          ? `${options.bullet} [${item.checked ? 'x' : ' '}]`
          : options.bullet;
    lines.push(`${indent}${marker} ${inlineToMarkdown(item.content, options)}`);
    for (const child of item.children ?? [])
      lines.push(...listToMarkdown(child, options, depth + 1));
  });
  return lines;
}

function blockToMarkdown(block: BlockNode, options: Required<MarkdownOptions>): string {
  switch (block.type) {
    case 'paragraph':
      return escapeLeadingMarker(inlineToMarkdown(block.content, options));
    case 'heading':
      return `${'#'.repeat(block.level)} ${inlineToMarkdown(block.content, options)}`;
    case 'list':
      return listToMarkdown(block, options, 0).join('\n');
    case 'blockquote':
      return block.content
        .map((child) => blockToMarkdown(child, options))
        .join('\n\n')
        .split('\n')
        .map((line) => `> ${line}`.trimEnd())
        .join('\n');
    case 'codeBlock':
      return `${options.fence}${block.language ?? ''}\n${block.text}\n${options.fence}`;
    case 'horizontalRule':
      return '---';
    case 'image':
      return `![${block.alt ?? ''}](${block.src}${block.title ? ` "${block.title}"` : ''})`;
    case 'table': {
      const rows = block.rows.map((row) =>
        row.cells.map((cell) =>
          cell.content
            .map((child) => blockToMarkdown(child, options))
            .join(' ')
            .replace(/\|/g, '\\|'),
        ),
      );
      if (rows.length === 0) return '';
      const width = Math.max(...rows.map((row) => row.length));
      const pad = (row: string[]): string =>
        `| ${[...row, ...new Array<string>(width - row.length).fill('')].join(' | ')} |`;
      const header = rows[0]!;
      const separator = `| ${new Array<string>(width).fill('---').join(' | ')} |`;
      return [pad(header), separator, ...rows.slice(1).map(pad)].join('\n');
    }
    case 'html':
      return block.html;
    default:
      return '';
  }
}

/**
 * Serializes a document to Markdown.
 *
 * @example
 * ```ts
 * documentToMarkdown(doc);
 * // '# Title\n\nHi **Jane**\n\n- one\n- two'
 * ```
 */
export function documentToMarkdown(doc: EditorDocument, options: MarkdownOptions = {}): string {
  const resolved: Required<MarkdownOptions> = {
    mergeTagSyntax: options.mergeTagSyntax ?? '{{key}}',
    bullet: options.bullet ?? '-',
    fence: options.fence ?? '```',
  };
  return doc.content
    .map((block) => blockToMarkdown(block, resolved))
    .filter((chunk, index, all) => chunk !== '' || index === all.length - 1)
    .join('\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ─── parsing ─────────────────────────────────────────────────────────────────

/**
 * Inline rules, applied in order.
 *
 * `_` emphasis requires a non-word boundary on both sides, as CommonMark does, so a
 * merge tag like `{{first_name}}` is not shredded into italics.
 */
/**
 * What a Markdown link or image may point at: the `standard` profile's rules, so
 * `markdownToHtml` and the HTML sanitizer agree about what a URL may be.
 *
 * `markdownToHtml` is a public export and its output is HTML. Before this it wrote any
 * destination straight into `href` and `src`, so `[x](javascript:alert(1))` produced a
 * working script link — safe inside the editor only because `markdownToDocument` sends
 * the result through the sanitizer afterwards, and not at all for anyone who rendered
 * the HTML themselves.
 */
const LINK_POLICY: UrlPolicy = {
  allowProtocols: DEFAULT_PROTOCOLS,
  allowDataUrls: false,
  allowRelative: true,
};
const IMAGE_POLICY: UrlPolicy = {
  allowProtocols: DEFAULT_PROTOCOLS,
  allowDataUrls: { mimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'] },
  allowRelative: true,
};

/**
 * A link destination: anything but whitespace and parentheses, plus balanced pairs of
 * them, so `https://en.wikipedia.org/wiki/Foo_(bar)` is one URL rather than being cut
 * at the first `)`.
 */
const DESTINATION = String.raw`((?:[^()\s]|\([^()\s]*\))+)`;

const INLINE_RULES: { pattern: RegExp; render: (groups: string[]) => string }[] = [
  {
    pattern: new RegExp(String.raw`!\[([^[\]]*)\]\(${DESTINATION}(?:\s+"([^"]*)")?\)`, 'g'),
    // `alt` and `title` are quote-escaped as well as the URL: an unescaped `"` in the alt
    // text closed the attribute, and `![a" onerror="…](x.png)` became an event handler.
    render: ([alt, src, title]) => {
      const url = safeUrl(src ?? '', IMAGE_POLICY);
      if (url === null) return alt ?? '';
      return `<img src="${escapeAttr(url)}" alt="${quoteAttr(alt ?? '')}"${title ? ` title="${quoteAttr(title)}"` : ''}>`;
    },
  },
  {
    pattern: new RegExp(String.raw`\[([^[\]]+)\]\(${DESTINATION}\)`, 'g'),
    // A refused destination keeps the label as plain text, which is what the document
    // path already did.
    render: ([label, href]) => {
      const url = safeUrl(href ?? '', LINK_POLICY);
      return url === null ? (label ?? '') : `<a href="${escapeAttr(url)}">${label ?? ''}</a>`;
    },
  },
  /*
   * No body may run past its own delimiter, and no label past a `[`.
   *
   * The bodies were `[\s\S]*?`: from every opener, a lazy scan to the end of the text
   * whenever no valid closer followed — and in `**a **a **a …` every `**` is preceded by
   * a space, so none is. That is quadratic, and since the same text reaches
   * `markdownToDocument` it was a way to hold a server rendering Markdown for minutes
   * with a megabyte of asterisks. Stopping each scan at the next delimiter makes every
   * rule linear, and matches CommonMark where the two differ: `**a **b**` is
   * `**a <strong>b</strong>`, the nearest opener closing, not `<strong>a **b</strong>`.
   */
  {
    pattern: /\*\*(?=\S)((?:[^*]|\*(?!\*))*?\S)\*\*/g,
    render: ([body]) => `<strong>${body}</strong>`,
  },
  {
    pattern: /(^|[^\w_])__(?=\S)((?:[^_]|_(?!_))*?\S)__(?!\w)/g,
    render: ([before, body]) => `${before}<strong>${body}</strong>`,
  },
  { pattern: /~~(?=\S)((?:[^~]|~(?!~))*?\S)~~/g, render: ([body]) => `<s>${body}</s>` },
  { pattern: /\*(?=\S)([^*\n]*?\S)\*/g, render: ([body]) => `<em>${body}</em>` },
  {
    pattern: /(^|[^\w_])_(?=\S)([^_\n]*?\S)_(?!\w)/g,
    render: ([before, body]) => `${before}<em>${body}</em>`,
  },
];

/** Escapes text for HTML output. */
function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Escapes a value for a double-quoted HTML attribute. */
function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/"/g, '&quot;');
}

/**
 * Quotes text the inline pass has already HTML-escaped, for use inside an attribute.
 *
 * The rules run on escaped text, so `&`, `<` and `>` are done and only `"` is left.
 * Running `escapeAttr` on it again turned every `&amp;` into `&amp;amp;`.
 */
function quoteAttr(escaped: string): string {
  return escaped.replace(/"/g, '&quot;');
}

/**
 * The raw URL behind an escaped destination, checked against `policy`.
 *
 * The inline pass has already escaped the text, so the captured URL reads
 * `?a=1&amp;b=2`. It is unescaped before the check and escaped exactly once on the way
 * out: escaping it a second time is what made every Markdown link with a query string
 * point at `?a=1&amp;b=2`.
 */
function safeUrl(escaped: string, policy: UrlPolicy): string | null {
  const raw = escaped.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  return checkUrl(raw, policy).value;
}

/**
 * The placeholder that stands in for already-final output while the rules run.
 *
 * U+0000 cannot occur in the input: the HTML parser replaces it with U+FFFD, and the
 * document model never produces one.
 */
// eslint-disable-next-line no-control-regex -- the placeholder is deliberate
const PLACEHOLDER = /\u0000(\d+)\u0000/g;

/**
 * Converts inline Markdown to HTML.
 *
 * Code spans and backslash escapes are lifted out *before* the emphasis rules run and
 * put back afterwards. Both have to be invisible to those rules: without it the escaped
 * text `\\_\\_` is read as emphasis around a backslash rather than as the two literal
 * underscores the author wrote.
 */
function inlineMarkdownToHtml(input: string): string {
  const literals: string[] = [];
  const stash = (value: string): string => `\u0000${String(literals.push(value) - 1)}\u0000`;

  let working = input.replace(/`([^`]+)`/g, (_match, code: string) =>
    stash(`<code>${escapeHtml(code)}</code>`),
  );
  working = working.replace(/\\([\\`*_{}[\]()#+\-.!>|~])/g, (_match, char: string) =>
    stash(escapeHtml(char)),
  );
  working = escapeHtml(working);

  for (const rule of INLINE_RULES) {
    working = working.replace(rule.pattern, (...args: unknown[]): string => {
      // `replace` passes (match, ...groups, offset, string); drop the match and the tail.
      const groups: string[] = args
        .slice(1, -2)
        .map((value) => (typeof value === 'string' ? value : ''));
      return rule.render(groups);
    });
  }

  return working.replace(PLACEHOLDER, (_match, index: string) => literals[Number(index)] ?? '');
}

/**
 * Parses Markdown into a document.
 *
 * Implemented by converting to HTML and reusing the HTML pipeline, so Markdown input
 * gets the same sanitization, interop and schema downgrade as everything else.
 *
 * @example
 * ```ts
 * markdownToDocument('# Title\n\n- one\n- two');
 * ```
 */
export function markdownToDocument(
  markdown: string,
  options: HtmlToDocumentOptions & MarkdownOptions = {},
): EditorDocument {
  const html = markdownToHtml(markdown, options);

  // The reader has to look for the delimiters the writer uses. They disagreed by
  // default — `documentToMarkdown` writes `{{key}}` and the HTML parser looks for
  // `{key}` — so a merge tag gained a pair of braces on every save-and-load cycle:
  // `{{name}}` became `{` + tag + `}`, then `{{{name}}}`, and the backend stopped
  // substituting it.
  const syntax = mergeTagSyntaxOf(options.mergeTagSyntax ?? '{{key}}');

  return htmlToDocument(html, {
    ...options,
    mergeTags: { ...options.mergeTags, ...(syntax ? { syntax } : {}) },
  });
}

/**
 * Splits a `{{key}}`-style template into the delimiters the HTML parser wants.
 *
 * Returns `undefined` for a template that does not contain `key`, which leaves the
 * parser on its own default rather than guessing.
 */
function mergeTagSyntaxOf(template: string): { open: string; close: string } | undefined {
  const at = template.indexOf('key');
  if (at < 0) return undefined;
  return { open: template.slice(0, at), close: template.slice(at + 3) };
}

/** Converts Markdown to HTML. Exported for the interop demo's before/after view. */
export function markdownToHtml(markdown: string, options: MarkdownOptions = {}): string {
  const fence = options.fence ?? '```';
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const out: string[] = [];
  let paragraph: string[] = [];
  /** The list nesting currently open, as tag names. */
  const openLists: { tag: 'ul' | 'ol'; indent: number }[] = [];

  const closeParagraph = (): void => {
    if (paragraph.length === 0) return;
    out.push(`<p>${inlineMarkdownToHtml(paragraph.join('\n')).replace(/\n/g, '<br>')}</p>`);
    paragraph = [];
  };
  const closeLists = (toIndent = -1): void => {
    while (openLists.length > 0 && openLists[openLists.length - 1]!.indent > toIndent) {
      out.push(`</${openLists.pop()!.tag}>`);
    }
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]!;

    if (line.trimStart().startsWith(fence)) {
      closeParagraph();
      closeLists();
      const language = line.trimStart().slice(fence.length).trim();
      const body: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index]!.trimStart().startsWith(fence)) {
        body.push(lines[index]!);
        index += 1;
      }
      const escaped = body
        .join('\n')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      out.push(
        `<pre><code${language ? ` class="language-${language}"` : ''}>${escaped}</code></pre>`,
      );
      continue;
    }

    if (line.trim() === '') {
      closeParagraph();
      closeLists();
      continue;
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      closeParagraph();
      closeLists();
      const level = heading[1]!.length;
      out.push(`<h${level}>${inlineMarkdownToHtml(heading[2]!)}</h${level}>`);
      continue;
    }

    if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      closeParagraph();
      closeLists();
      out.push('<hr>');
      continue;
    }

    const quote = /^>\s?(.*)$/.exec(line);
    if (quote) {
      closeParagraph();
      closeLists();
      const body: string[] = [quote[1]!];
      while (index + 1 < lines.length && /^>\s?/.test(lines[index + 1]!)) {
        index += 1;
        body.push(lines[index]!.replace(/^>\s?/, ''));
      }
      out.push(`<blockquote>${markdownToHtml(body.join('\n'), options)}</blockquote>`);
      continue;
    }

    const listItem = /^(\s*)([-*+]|\d+\.)\s+(?:\[([ xX])\]\s+)?(.*)$/.exec(line);
    if (listItem) {
      closeParagraph();
      const indent = Math.floor(listItem[1]!.length / 2);
      const ordered = /^\d+\./.test(listItem[2]!);
      const tag = ordered ? 'ol' : 'ul';
      closeLists(indent);
      if (openLists.length === 0 || openLists[openLists.length - 1]!.indent < indent) {
        openLists.push({ tag, indent });
        out.push(`<${tag}>`);
      }
      const checked = listItem[3];
      const attrs = checked === undefined ? '' : ` data-checked="${checked.toLowerCase() === 'x'}"`;
      out.push(`<li${attrs}>${inlineMarkdownToHtml(listItem[4]!)}</li>`);
      continue;
    }

    const tableRow = /^\s*\|(.+)\|\s*$/.exec(line);
    if (tableRow && index + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[index + 1]!)) {
      closeParagraph();
      closeLists();
      const cells = (row: string): string[] =>
        row
          .split('|')
          .slice(1, -1)
          .map((cell) => cell.trim());
      const header = cells(line);
      index += 2;
      const bodyRows: string[][] = [];
      while (index < lines.length && /^\s*\|(.+)\|\s*$/.test(lines[index]!)) {
        bodyRows.push(cells(lines[index]!));
        index += 1;
      }
      index -= 1;
      const th = header.map((cell) => `<th>${inlineMarkdownToHtml(cell)}</th>`).join('');
      const tr = bodyRows
        .map(
          (row) =>
            `<tr>${row.map((cell) => `<td>${inlineMarkdownToHtml(cell)}</td>`).join('')}</tr>`,
        )
        .join('');
      out.push(`<table><tbody><tr>${th}</tr>${tr}</tbody></table>`);
      continue;
    }

    closeLists();
    paragraph.push(line);
  }

  closeParagraph();
  closeLists();
  return out.join('');
}

/** Builds an empty document. Re-exported here so Markdown callers need one import. */
export { createDocument, normalizeDocument };
