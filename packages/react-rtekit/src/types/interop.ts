import type { HtmlProfile } from './common.js';

/** HTML interop types (03 §5). @group Interop */

/** Which foreign dialects the input parser recognizes. */
export type InteropInput = 'quill' | 'office' | 'standard';

/** Word / Google Docs / Excel paste cleanup knobs (03 §3). */
export interface OfficeCleanupOptions {
  /** Strip `mso-*` CSS declarations and `<o:p>` elements. @default true */
  stripMsoStyles?: boolean;
  /** Convert `mso-list` paragraphs into real lists. @default true */
  convertWordLists?: boolean;
  /** Drop `<span>`/`<font>` wrappers that carry no surviving formatting. @default true */
  stripEmptySpans?: boolean;
  /** Drop pixel `font-size` declarations, which rarely match the host typography. @default true */
  stripFixedFontSizes?: boolean;
  /** Keep `font-family` declarations. @default false */
  keepFontFamily?: boolean;
  /** Keep text colours. @default true */
  keepColors?: boolean;
}

/** Legacy Quill parsing / emitting knobs (03 §5.1). */
export interface QuillInteropOptions {
  /**
   * `ql-size-*` class → CSS length.
   * @default { small: '0.75em', large: '1.5em', huge: '2.5em' }
   */
  sizeMap?: Record<string, string>;
  /**
   * Width of one `ql-indent-N` step in Quill's output.
   * @default '3em'
   */
  indentStep?: string;
  /** Emit `data-list` attributes on list items in `quill-compatible` output. @default true */
  emitDataList?: boolean;
}

/** `interop` prop (04 §2.4). */
export interface InteropOptions {
  /** Dialects recognized on input. @default ['quill','office','standard'] */
  input?: InteropInput[];
  /** Word, Google Docs and Excel cleanup. */
  office?: OfficeCleanupOptions;
  /** Legacy Quill parsing and emitting. */
  quill?: QuillInteropOptions;
}

/** Extra shaping applied by the `email` HTML profile (03 §5.3). */
export interface EmailOutputOptions {
  /** Wrap the body in a fixed-width centring table. @default false */
  wrapInTable?: boolean;
  /** Container width in pixels when `wrapInTable` is on. @default 600 */
  containerWidth?: number;
  /** Font stack written onto the container. */
  fontFallback?: string;
  /** Base URL used to absolutize relative `src`/`href` values. */
  forceAbsoluteUrls?: string;
  /** Rewrite image sources to `cid:` references. Requires matching attachments. @default false */
  inlineImagesAsCid?: boolean;
}

/** Options accepted by every HTML/Markdown serializer entry point. */
export interface SerializeOptions {
  /** Output dialect. Defaults to the editor's `htmlProfile`. */
  profile?: HtmlProfile;
  /** Run the output through the sanitizer. Defaults to the editor's `sanitizeOutput`. */
  sanitize?: boolean;
  /** Extra shaping for `profile: 'email'`. */
  email?: EmailOutputOptions;
  /** Pretty-print with newlines between blocks. @default false */
  pretty?: boolean;
  /** Replace merge tags with these sample values (preview only, never stored). */
  mergeTagPreview?: Record<string, string>;
}
