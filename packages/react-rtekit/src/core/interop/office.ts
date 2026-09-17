import type { OfficeCleanupOptions } from '../../types/interop.js';
import { element, textContent, type HtmlElement, type HtmlNode } from '../html/nodes.js';
import { parseStyle, readStyleProperty, serializeStyle } from '../sanitize/css.js';

/**
 * Word, Google Docs and Excel cleanup (03 §3).
 *
 * Office pastes are mostly noise: `mso-*` declarations, `<o:p>` fillers, conditional
 * comments, class-only spans, and lists that are not lists at all but styled
 * paragraphs. What matters is preserving the *structure and formatting the author
 * meant* while discarding the rest.
 *
 * @module
 */

/** Declarations that only mean something inside Office. */
const MSO_PROPERTY = /^mso-|^tab-stops$|^page-break|^layout-grid|^text-underline$|^font-variant-ligatures$/;

/** Word's list paragraph classes. */
const WORD_LIST_CLASS = /^MsoListParagraph/i;

/** Classes that carry no meaning outside Office. */
const OFFICE_CLASS = /^(Mso|xl\d|docs-internal-guid)/i;

function classList(el: HtmlElement): string[] {
  return (el.attrs.class ?? '').split(/\s+/).filter(Boolean);
}

/** True when the element is a Word list paragraph. */
function isWordListParagraph(el: HtmlElement): boolean {
  if (el.tag !== 'p') return false;
  if (classList(el).some((cls) => WORD_LIST_CLASS.test(cls))) return true;
  return /mso-list\s*:/i.test(el.attrs.style ?? '');
}

/** Reads `mso-list: l0 level2 lfo1` and returns the 1-based level. */
function wordListLevel(el: HtmlElement): number {
  const match = /level(\d+)/i.exec(el.attrs.style ?? '');
  if (match) return Math.max(1, Number(match[1]));
  // `margin-left` in inches is Word's other way of expressing depth.
  const marginLeft = readStyleProperty(el.attrs.style, 'margin-left');
  if (marginLeft) {
    const inches = /^([\d.]+)in$/.exec(marginLeft);
    if (inches) return Math.max(1, Math.round(Number(inches[1]) / 0.5));
  }
  return 1;
}

/**
 * Decides whether a Word list paragraph is a bullet or a number.
 *
 * Word writes the marker itself into an ignored span, so `1.` / `a)` means ordered and
 * a bullet glyph means unordered.
 */
function wordListType(el: HtmlElement): 'bullet' | 'ordered' {
  const marker = textContent(el.children).trim().slice(0, 6);
  return /^[\dA-Za-z][.)]/.test(marker) ? 'ordered' : 'bullet';
}

/** True when this subtree is one of Word's `mso-list: Ignore` marker runs. */
function isMarkerNode(node: HtmlNode): boolean {
  if (node.type !== 'element') return false;
  if (/mso-list\s*:\s*Ignore/i.test(node.attrs.style ?? '')) return true;
  // The marker is usually one span nested inside a font-carrying span, so an element
  // whose entire content is a marker is itself a marker.
  return node.children.length > 0 && node.children.every(isMarkerNode);
}

/**
 * The bullet glyph or number Word leaves at the start of a list item's text.
 *
 * Bullet characters, the section sign Word uses for Wingdings bullets, a `1.`/`a)`
 * number, and the run of non-breaking spaces that stands in for a tab.
 */
const LEADING_LIST_MARKER =
  /^[\s\u00A0]*(?:[\u2022\u00B7\u25CF\u25AA\u00A7o\-\u2013\u2014]|[\dA-Za-z][.)])?[\s\u00A0]*/;

/**
 * Removes the bullet or number Word writes into the item's own text.
 *
 * Word does not use list markup: it writes styled paragraphs whose first span holds
 * the glyph, wrapped in `<![if !supportLists]>` (dropped by the parser as a bogus
 * construct) and marked `mso-list: Ignore`.
 */
function stripListMarker(el: HtmlElement): HtmlNode[] {
  const children = el.children.filter((child) => !isMarkerNode(child));

  // Whatever the marker did not cover is stripped from the leading text: a bullet
  // glyph, a `1.`/`a)` number, and the tab of non-breaking spaces that follows.
  while (children.length > 0) {
    const first = children[0]!;
    if (first.type !== 'text') break;
    const cleaned = first.text.replace(LEADING_LIST_MARKER, '');
    if (cleaned === '') {
      children.shift();
      continue;
    }
    children[0] = { type: 'text', text: cleaned };
    break;
  }
  return children;
}

function cleanStyle(el: HtmlElement, options: Required<OfficeCleanupOptions>): void {
  const style = el.attrs.style;
  if (!style) return;
  const kept = parseStyle(style).filter(({ property, value }) => {
    if (options.stripMsoStyles && MSO_PROPERTY.test(property)) return false;
    if (property === 'font-family') return options.keepFontFamily;
    if (property === 'color' || property === 'background-color') {
      // Word writes `color: windowtext` and `background: white` on everything.
      if (/^(windowtext|auto|inherit|initial|transparent|white|#ffffff)$/i.test(value)) return false;
      return options.keepColors;
    }
    if (property === 'font-size' && options.stripFixedFontSizes && /\d+(px|pt)$/.test(value)) {
      return false;
    }
    if (property === 'font-weight' && /^400$|^normal$/.test(value)) return false;
    if (property === 'font-style' && /^normal$/.test(value)) return false;
    if (property === 'text-decoration' && /^none$/.test(value)) return false;
    if (property === 'font-variant' && /^normal$/.test(value)) return false;
    if (property === 'white-space' && /^pre-wrap$/.test(value)) return false;
    if (property === 'vertical-align' && /^baseline$/.test(value)) return false;
    if (property === 'line-height') return false;
    if (property === 'margin' || property.startsWith('margin-')) return false;
    if (property === 'text-indent') return false;
    return true;
  });
  const serialized = serializeStyle(kept);
  if (serialized === '') delete el.attrs.style;
  else el.attrs.style = serialized;
}

function cleanClasses(el: HtmlElement): void {
  const kept = classList(el).filter((cls) => !OFFICE_CLASS.test(cls));
  if (kept.length > 0) el.attrs.class = kept.join(' ');
  else delete el.attrs.class;
}

/** True when a span or font carries no surviving formatting and can be unwrapped. */
function isEmptyWrapper(el: HtmlElement): boolean {
  if (el.tag !== 'span' && el.tag !== 'font') return false;
  const meaningful = Object.keys(el.attrs).filter(
    (name) => name !== 'class' && name !== 'lang' && name !== 'id',
  );
  return meaningful.length === 0;
}

/** The style that cancels each formatting tag's own meaning. */
const CANCELLED_BY: Record<string, { property: string; value: RegExp }> = {
  b: { property: 'font-weight', value: /^(normal|400)$/i },
  strong: { property: 'font-weight', value: /^(normal|400)$/i },
  i: { property: 'font-style', value: /^normal$/i },
  em: { property: 'font-style', value: /^normal$/i },
  u: { property: 'text-decoration', value: /^none$/i },
};

/**
 * True when a formatting tag explicitly cancels its own formatting.
 *
 * Google Docs wraps every copy in `<b style="font-weight:normal" id="docs-internal-guid-…">`.
 * Taking that at face value would make a whole pasted document bold, and — because the
 * wrapper contains block elements — would also collapse it into a single paragraph.
 */
function isCancelledFormatting(el: HtmlElement, rawStyle: string | undefined): boolean {
  const rule = CANCELLED_BY[el.tag];
  if (!rule) return false;
  const value = readStyleProperty(rawStyle, rule.property);
  return value !== null && rule.value.test(value);
}

/** Unwraps a Google Docs redirect so the real destination survives the paste. */
function unwrapGoogleRedirect(href: string): string {
  const match = /^https?:\/\/www\.google\.com\/url\?(?:.*&)?q=([^&]+)/.exec(href);
  if (!match) return href;
  try {
    return decodeURIComponent(match[1]!);
  } catch {
    return href;
  }
}

function cleanNode(node: HtmlNode, options: Required<OfficeCleanupOptions>): HtmlNode[] {
  if (node.type === 'comment') return [];
  if (node.type === 'text') return [node];

  const el: HtmlElement = { ...node, attrs: { ...node.attrs }, children: [] };

  // Office namespace elements carry no content of their own.
  if (el.tag === 'o:p' || el.tag.startsWith('v:') || el.tag.startsWith('w:') || el.tag === 'xml') {
    return node.children.flatMap((child) => cleanNode(child, options));
  }

  el.children = node.children.flatMap((child) => cleanNode(child, options));

  // Checked before the style is filtered, since filtering removes the very declaration
  // that cancels the tag.
  if (isCancelledFormatting(el, el.attrs.style)) return el.children;

  if (options.stripMsoStyles) cleanStyle(el, options);
  cleanClasses(el);
  delete el.attrs.lang;
  delete el.attrs.id;
  delete el.attrs.align;
  // Namespaced attributes (`x:num`, `v:shapes`, `o:spid`) mean nothing outside Office.
  el.attrs = Object.fromEntries(
    Object.entries(el.attrs).filter(
      ([name]) => !name.startsWith('x:') && !name.startsWith('v:') && !name.startsWith('o:'),
    ),
  );

  if (el.tag === 'a' && el.attrs.href) {
    el.attrs.href = unwrapGoogleRedirect(el.attrs.href);
  }

  if (options.stripEmptySpans && isEmptyWrapper(el)) return el.children;

  return [el];
}

/**
 * Turns Word's run of list paragraphs into real lists.
 *
 * Each paragraph carries its level, so consecutive ones are folded into a tree in the
 * same way Quill's flat lists are (03 §5.1).
 */
function buildWordLists(nodes: HtmlNode[]): HtmlNode[] {
  const out: HtmlNode[] = [];
  let index = 0;

  while (index < nodes.length) {
    const node = nodes[index]!;
    if (node.type !== 'element' || !isWordListParagraph(node)) {
      if (node.type === 'element') {
        out.push({ ...node, children: buildWordLists(node.children) });
      } else {
        out.push(node);
      }
      index += 1;
      continue;
    }

    // Collect the run of consecutive list paragraphs. Whitespace and comments between
    // them are part of Word's formatting, not a break in the list.
    const run: { level: number; type: 'bullet' | 'ordered'; children: HtmlNode[] }[] = [];
    while (index < nodes.length) {
      const candidate = nodes[index];
      if (!candidate) break;
      if (candidate.type === 'comment' || (candidate.type === 'text' && candidate.text.trim() === '')) {
        index += 1;
        continue;
      }
      if (candidate.type !== 'element' || !isWordListParagraph(candidate)) break;
      run.push({
        level: wordListLevel(candidate),
        type: wordListType(candidate),
        children: stripListMarker(candidate),
      });
      index += 1;
    }

    const root = element(run[0]!.type === 'ordered' ? 'ol' : 'ul');
    const open: HtmlElement[] = [root];
    for (const item of run) {
      // `level` is 1-based and `open[0]` is level 1, so a run may descend at most one
      // level at a time — Word never skips one, and clamping keeps malformed input sane.
      const level = Math.min(item.level, open.length + 1);
      while (open.length > level) open.pop();
      if (open.length < level) {
        const parent = open[open.length - 1]!;
        const previous = [...parent.children]
          .reverse()
          .find((child): child is HtmlElement => child.type === 'element' && child.tag === 'li');
        const nested = element(item.type === 'ordered' ? 'ol' : 'ul');
        if (previous) previous.children.push(nested);
        else parent.children.push(nested);
        open.push(nested);
      }
      open[open.length - 1]!.children.push(element('li', {}, item.children));
    }
    out.push(root);
  }

  return out;
}

/**
 * True when the markup came from Word, Google Docs or Excel.
 *
 * @example
 * ```ts
 * detectOfficeSource('<p class=MsoNormal>x</p>'); // 'word'
 * ```
 */
export function detectOfficeSource(html: string): 'word' | 'gdocs' | 'excel' | null {
  // A Docs copy that starts mid-paragraph carries no wrapper, but its links keep the
  // `google.com/url?q=` redirect, which is just as reliable a fingerprint.
  if (/docs-internal-guid|google\.com\/url\?[^"']*\bq=/.test(html)) return 'gdocs';
  if (/xmlns:x=|urn:schemas-microsoft-com:office:excel|\bx:num\b/.test(html)) return 'excel';
  if (/mso-|MsoNormal|urn:schemas-microsoft-com:office|<o:p|ProgId=Word/.test(html)) return 'word';
  return null;
}

/**
 * Cleans an Office paste.
 *
 * @param nodes the parsed tree, before sanitization
 * @param options the `interop.office` prop
 *
 * @example
 * ```ts
 * cleanOfficeMarkup(parseHtml(wordHtml));
 * // mso-* declarations, <o:p>, empty spans and Mso classes are gone; lists are real lists
 * ```
 */
export function cleanOfficeMarkup(nodes: HtmlNode[], options: OfficeCleanupOptions = {}): HtmlNode[] {
  const resolved: Required<OfficeCleanupOptions> = {
    stripMsoStyles: options.stripMsoStyles ?? true,
    convertWordLists: options.convertWordLists ?? true,
    stripEmptySpans: options.stripEmptySpans ?? true,
    stripFixedFontSizes: options.stripFixedFontSizes ?? true,
    keepFontFamily: options.keepFontFamily ?? false,
    keepColors: options.keepColors ?? true,
  };

  // Lists are rebuilt first, while the `mso-list` declarations that describe them are
  // still present.
  const withLists = resolved.convertWordLists ? buildWordLists(nodes) : nodes;
  return withLists.flatMap((node) => cleanNode(node, resolved));
}
