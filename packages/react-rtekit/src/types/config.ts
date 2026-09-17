import type { ReactNode } from 'react';
import type { EditorInstance, UploadResult } from './editor.js';
import type { EditorValue, ValueFormat } from './common.js';
import type { EditorDocument } from './document.js';
import type { RteLocalization } from './localization.js';

/** Configuration object shapes referenced by props. @group Configuration */

/** The colour picker's palette and behaviour. */
export interface ColorPaletteConfig {
  /** Swatch colours, in render order. */
  palette?: readonly string[];
  /** How many recent colours to remember. @default 6 */
  recentCount?: number;
  /** `localStorage` key for the recent list. @default 'rte-recent-colors' */
  colorStorageKey?: string;
  /** Show a native `<input type="color">`. @default true */
  allowCustom?: boolean;
  /** Show the entry that removes the colour format (fixes R14). @default true */
  allowClear?: boolean;
  /** Swatches per row. @default 7 */
  columns?: number;
}

/** One substitutable `{key}` token. */
export interface MergeTagDefinition {
  /** The substitution key, without its delimiters. */
  key: string;
  /** What the chip shows; the key is used when this is absent. */
  label?: string;
  /** A second line in the insert menu. */
  description?: string;
  /** Shown in preview mode and in the insert menu. */
  sample?: string;
  /** Groups the insert menu. */
  group?: string;
}

/** Merge-tag behaviour. */
export interface MergeTagsConfig {
  /** The tags this editor knows; anything else is an unknown tag. */
  tags: MergeTagDefinition[];
  /** The delimiters a tag is written with. @default { open: '{', close: '}' } */
  syntax?: { open: string; close: string };
  /** Turn typed or pasted `{key}` into a tag node. @default true */
  parseOnInput?: boolean;
  /** Select and delete the tag as one unit (fixes R23). @default true */
  atomic?: boolean;
  /** Renders the chip; the default shows the label in the merge-tag style. */
  render?: (tag: MergeTagDefinition) => ReactNode;
  /** Show the toolbar insert dropdown. @default true */
  showMenu?: boolean;
  /** Inline autocomplete trigger. @default '{{' */
  trigger?: string;
  /** What to do with `{key}` tokens that are not in `tags`. @default 'warn' */
  unknownTagBehaviour?: 'keep' | 'warn' | 'strip';
  /** How a tag contributes to `getLength`. @default 'label' */
  lengthMode?: 'label' | 'key' | 'zero';
}

/** Mention behaviour. */
export interface MentionsConfig {
  /** The character that opens the menu. @default '@' */
  trigger?: string;
  /** Finds candidates; the signal aborts when the query moves on. */
  search: (query: string, signal: AbortSignal) => Promise<MentionCandidate[]>;
  /** Renders one row of the menu. */
  render?: (item: MentionCandidate) => ReactNode;
  /** Inserts the chosen candidate; the default inserts a mention node. */
  insert?: (item: MentionCandidate, editor: EditorInstance) => void;
  /** How a mention serializes. @default 'text' */
  serialize?: 'text' | 'link';
  /** Base URL used by `serialize: 'link'`, with `{id}` interpolated. */
  linkTemplate?: string;
}

/** One mention search result. */
export interface MentionCandidate {
  /** The entity's identifier, which the mention node keeps. */
  id: string;
  /** What the chip and the menu row show. */
  label: string;
  /** A second line in the menu, such as an e-mail address. */
  description?: string;
  /** An avatar for the menu row. */
  avatarUrl?: string;
}

/** Slash-menu behaviour. */
export interface SlashMenuConfig {
  /** The character that opens the palette. @default '/' */
  trigger?: string;
  /** Only open when the block is empty. @default true */
  emptyBlockOnly?: boolean;
  /** Restrict the palette to these item names. */
  items?: string[];
}

/** One markdown input rule. */
export interface MarkdownShortcutConfig {
  /** Matched against the text before the caret. */
  pattern: RegExp;
  /** Command run when the pattern matches. */
  command: string;
  /** Payload passed to the command; the match is available to it. */
  payload?: unknown;
}

/** Autosave / draft behaviour. */
export interface AutosaveConfig {
  /** Namespaces the draft. Required. */
  key: string;
  /** Where the draft is kept. @default window.localStorage */
  storage?: Storage;
  /** How long the typing has to stop before a draft is written. @default 1000 */
  debounceMs?: number;
  /** Ask before restoring rather than restoring silently. @default true */
  restorePrompt?: boolean;
  /** What the draft is stored as. @default 'json' */
  serialize?: 'html' | 'json';
  /** Drafts older than this are discarded. */
  ttlMs?: number;
  /** Inspects a draft before it is restored; return `false` to refuse it. */
  onRestore?: (draft: EditorValue, meta: { savedAt: number }) => void | false;
}

/** Floating / bubble toolbar behaviour. */
export interface FloatingToolbarConfig {
  /** Only show for non-collapsed selections. @default true */
  selectionOnly?: boolean;
  /** Distance from the selection rect, in pixels. @default 8 */
  offset?: number;
  /** Which side of the selection it prefers. @default 'auto' */
  placement?: 'top' | 'bottom' | 'auto';
}

/** Image behaviour. */
export interface ImageOptions {
  /** Drag handles on the selected image. @default true */
  resizable?: boolean;
  /** Offer the alignment controls. @default true */
  alignable?: boolean;
  /** Offer a caption, which serializes as a `<figcaption>`. @default true */
  captions?: boolean;
  /** Upper bound for the resize frame, in pixels. */
  maxWidth?: number;
  /** Offer the "paste a URL" tab in the insert dialog. @default true */
  allowExternalUrl?: boolean;
  /** Refuse to insert an image with no alt text. @default false */
  requireAltText?: boolean;
}

/** `onUpload` signature. */
export type UploadHandler = (
  file: File,
  ctx: { signal: AbortSignal; onProgress: (percent: number) => void },
) => Promise<UploadResult>;

/** What `validate` receives. */
export interface ValidateContext {
  /** The content, in the editor's `valueFormat`. */
  value: EditorValue;
  /** The content's text, which is what a length rule should look at. */
  text: string;
  /** True for content that only looks non-empty, such as `<p><br></p>` (fixes R2). */
  isEmpty: boolean;
  /** Length in the configured `countUnit`. */
  length: number;
  /** The portable document, for a rule that needs to look at structure. */
  document: EditorDocument;
}

/** What `footer` and `renderX` render props receive. */
export interface RenderContext {
  /** The instance being rendered. */
  editor: EditorInstance;
  /** The resolved message catalogue; never hard-code a string here (fixes R17). */
  t: RteLocalization;
  /** The editor's value format, for a render prop that serializes. */
  valueFormat: ValueFormat;
}
