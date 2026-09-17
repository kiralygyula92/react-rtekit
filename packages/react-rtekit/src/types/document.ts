/**
 * The portable document model (02 §2.4).
 *
 * This shape is owned by the library and is independent of the engine, so it can be
 * stored, diffed, asserted against in tests and round-tripped through every
 * serializer without dragging Lexical types into the public API.
 *
 * @group Content model
 */

/** Block-level horizontal alignment. `left` is the default and serializes as no attribute. */
export type Align = 'left' | 'center' | 'right' | 'justify';

/** Heading level, 1–6. */
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/** Ordered-list numbering style, mirroring the HTML `type` attribute. */
export type OrderedListStyle = '1' | 'a' | 'A' | 'i' | 'I';

/**
 * An inline formatting mark.
 *
 * Boolean marks carry no value; the value-carrying marks (`color`, `fontSize`, …)
 * keep their value as a CSS-ready string.
 */
export type Mark =
  | { type: 'bold' }
  | { type: 'italic' }
  | { type: 'underline' }
  | { type: 'strike' }
  | { type: 'code' }
  | { type: 'subscript' }
  | { type: 'superscript' }
  | { type: 'color'; value: string }
  | { type: 'backgroundColor'; value: string }
  | { type: 'fontFamily'; value: string }
  | { type: 'fontSize'; value: string };

/** The `type` discriminator of every {@link Mark}. */
export type MarkName = Mark['type'];

/** A run of text plus the marks that apply to it. */
export interface TextNode {
  /** Discriminator. */
  type: 'text';
  /** The run's characters. Never HTML — escaping happens at serialization. */
  text: string;
  /** The marks that apply to the whole run, in no particular order. */
  marks?: Mark[];
}

/** An anchor. `rel` is normalized by the sanitizer when `target` is `_blank`. */
export interface LinkNode {
  /** Discriminator. */
  type: 'link';
  /** The destination, already sanitized; `javascript:` never survives parsing. */
  href: string;
  /** Where the link opens. */
  target?: string;
  /** The relationship, which gains `noopener noreferrer` for a `_blank` target. */
  rel?: string;
  /** The anchor's advisory title. */
  title?: string;
  /** What the link wraps; nested links are flattened on the way in. */
  content: InlineNode[];
}

/** An atomic `{key}` placeholder that the backend substitutes (03 §6). */
export interface MergeTagNode {
  /** Discriminator. */
  type: 'mergeTag';
  /** The substitution key, without its delimiters. */
  key: string;
  /** What the chip shows; the key is used when this is absent. */
  label?: string;
}

/** An atomic `@mention` chip. */
export interface MentionNode {
  /** Discriminator. */
  type: 'mention';
  /** The mentioned entity's identifier, as the provider gave it. */
  id: string;
  /** What the chip shows. */
  label: string;
}

/** A single emoji character. Emoji are plain text, never images. */
export interface EmojiNode {
  /** Discriminator. */
  type: 'emoji';
  /** The character itself, which may be more than one code unit. */
  char: string;
}

/** A soft line break (`<br>`), as opposed to a new block. */
export interface LineBreakNode {
  /** Discriminator. */
  type: 'lineBreak';
}

/** Anything that can live inside a block. */
export type InlineNode =
  | TextNode
  | LinkNode
  | MergeTagNode
  | MentionNode
  | EmojiNode
  | LineBreakNode;

/** A paragraph. */
export interface ParagraphNode {
  /** Discriminator. */
  type: 'paragraph';
  /** Horizontal alignment; `left` serializes as no attribute (fixes R6). */
  align?: Align;
  /** Indent level, in steps rather than pixels. */
  indent?: number;
  /** The paragraph's inline content. */
  content: InlineNode[];
}

/** A heading, `level` 1–6. */
export interface HeadingNode {
  /** Discriminator. */
  type: 'heading';
  /** Which heading level, which becomes the `h1`–`h6` tag. */
  level: HeadingLevel;
  /** Horizontal alignment. */
  align?: Align;
  /** Indent level, in steps rather than pixels. */
  indent?: number;
  /** The heading's inline content. */
  content: InlineNode[];
}

/** One item of a {@link ListNode}; may itself contain nested lists. */
export interface ListItemNode {
  /** Discriminator. */
  type: 'listItem';
  /** Tick state, for an item of a check list. */
  checked?: boolean;
  /** Horizontal alignment of the item's own content. */
  align?: Align;
  /** The item's inline content. */
  content: InlineNode[];
  /** Lists nested inside this item. */
  children?: ListNode[];
}

/** A bullet, ordered or check list. */
export interface ListNode {
  /** Discriminator. */
  type: 'list';
  /** Which kind of list this is. */
  listType: 'bullet' | 'ordered' | 'check';
  /** The first number, for an ordered list that does not start at one. */
  start?: number;
  /** The numbering style, mirroring the HTML `type` attribute. */
  style?: OrderedListStyle;
  /** Indent level, for legacy markup that expresses nesting as an indent. */
  indent?: number;
  /** The list's items, in order. */
  items: ListItemNode[];
}

/** A block quote, which may contain other blocks. */
export interface BlockquoteNode {
  /** Discriminator. */
  type: 'blockquote';
  /** Horizontal alignment. */
  align?: Align;
  /** Indent level, in steps rather than pixels. */
  indent?: number;
  /** The blocks inside the quote. */
  content: BlockNode[];
}

/** A fenced code block. Rich marks are not allowed inside. */
export interface CodeBlockNode {
  /** Discriminator. */
  type: 'codeBlock';
  /** The highlighting language, when one was chosen. */
  language?: string;
  /** The code, verbatim, including its newlines. */
  text: string;
}

/** A thematic break. */
export interface HorizontalRuleNode {
  /** Discriminator. */
  type: 'horizontalRule';
}

/** An image. `width`/`height` are intrinsic pixels and serialize as attributes. */
export interface ImageNode {
  /** Discriminator. */
  type: 'image';
  /** The source, already sanitized; `data:` survives only when it is allowed. */
  src: string;
  /** Alternative text; an empty string marks the image as decorative and is kept. */
  alt?: string;
  /** The image's advisory title. */
  title?: string;
  /** Intrinsic width in pixels. */
  width?: number;
  /** Intrinsic height in pixels. */
  height?: number;
  /** How the image sits in the flow. */
  align?: Align;
  /** The caption, which serializes as a `<figure>` with a `<figcaption>`. */
  caption?: string;
}

/** One table cell. */
export interface TableCellNode {
  /** Discriminator. */
  type: 'tableCell';
  /** True for a `<th>`, false or absent for a `<td>`. */
  header?: boolean;
  /** How many columns the cell spans. */
  colSpan?: number;
  /** How many rows the cell spans. */
  rowSpan?: number;
  /** Horizontal alignment of the cell's content. */
  align?: Align;
  /** Column width, serialized as a percentage for e-mail robustness (05 §8). */
  width?: number;
  /** The blocks inside the cell. */
  content: BlockNode[];
}

/** One table row. */
export interface TableRowNode {
  /** Discriminator. */
  type: 'tableRow';
  /** The row's cells, left to right. */
  cells: TableCellNode[];
}

/** A table. Column widths serialize as percentages for e-mail robustness (05 §8). */
export interface TableNode {
  /** Discriminator. */
  type: 'table';
  /** The table's rows, top to bottom. */
  rows: TableRowNode[];
}

/**
 * Raw HTML preserved verbatim.
 *
 * Only produced by the `permissive` sanitization profile; every other profile drops
 * unknown markup instead (03 §4.2).
 */
export interface RawHtmlNode {
  /** Discriminator. */
  type: 'html';
  /** The markup, exactly as it arrived. It is still sanitized on output. */
  html: string;
}

/** Anything that can live at the top level of a document. */
export type BlockNode =
  | ParagraphNode
  | HeadingNode
  | ListNode
  | BlockquoteNode
  | CodeBlockNode
  | HorizontalRuleNode
  | ImageNode
  | TableNode
  | RawHtmlNode;

/** The `type` discriminator of every {@link BlockNode}. */
export type BlockNodeName = BlockNode['type'];

/**
 * A whole document.
 *
 * @example
 * ```ts
 * const doc: EditorDocument = {
 *   type: 'doc',
 *   version: 1,
 *   content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }],
 * };
 * ```
 */
export interface EditorDocument {
  /** Discriminator. */
  type: 'doc';
  /** Schema version, so stored documents can be migrated rather than guessed at. */
  version: 1;
  /** The document's top-level blocks. */
  content: BlockNode[];
}
