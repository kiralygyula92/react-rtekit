import type { EditorDocument } from './document.js';
import type {
  ChangeSource,
  ContentWarning,
  CountUnit,
  EditorValue,
  Unregister,
  ValueFormat,
} from './common.js';
import type { EditorSelection, FormatState, LinkAttrs, Position, SelectionSnapshot } from './selection.js';
import type { CommandHandler, CommandId, CommandPayload, ImageAttrs, TableOptions } from './commands.js';
import type { EngineHandle } from './engine.js';
import type { SerializeOptions } from './interop.js';

/** The public editor handle. @group Editor */

/** Metadata passed alongside every `onChange`. */
export interface ChangeMeta {
  /** What caused the change, which is what keeps a controlled parent from looping. */
  source: ChangeSource;
  /** True for content that only looks non-empty, such as `<p><br></p>` (fixes R2). */
  isEmpty: boolean;
  /** Length in the configured `countUnit`. */
  length: number;
  /** Words in the document, whatever `countUnit` is set to. */
  wordCount: number;
  /** Lazily built — the getter only runs if the consumer reads it. */
  readonly document: EditorDocument;
}

/** Options for `setContent`. */
export interface SetContentOptions {
  /** What `value` is. @default the editor's `valueFormat` */
  format?: ValueFormat;
  /** The source reported by the resulting `onChange`. @default 'api' */
  source?: ChangeSource;
  /** Keep the caret where it is, which is what makes controlled mode caret-stable. @default false */
  keepSelection?: boolean;
  /** Record an undo entry. Pass `false` for content loaded from a server. @default true */
  history?: boolean;
}

/** Options for `insertContent`. */
export interface InsertOptions {
  /** What `value` is. @default the editor's `valueFormat` */
  format?: ValueFormat;
  /** Where to insert. @default the current selection */
  at?: Position;
  /** The source reported by the resulting `onChange`. @default 'api' */
  source?: ChangeSource;
}

/** Find & replace options. */
export interface FindOptions {
  /** Match the query's case. @default false */
  matchCase?: boolean;
  /** Only match whole words. @default false */
  wholeWord?: boolean;
  /** Treat the query as a regular expression. @default false */
  regex?: boolean;
  /** Search backwards from the current match. @default false */
  backwards?: boolean;
}

/** Result of a `find` call. */
export interface FindResult {
  /** Total number of matches in the document. */
  total: number;
  /** Zero-based index of the current match, or `-1` when there is none. */
  index: number;
}

/** A single in-flight or finished upload. */
export interface UploadState {
  /** Identity of this upload, which is also the placeholder's node key. */
  id: string;
  /** The file being uploaded. */
  file: File;
  /** Completion from 0 to 1, or 0 when the handler reports no progress. */
  progress: number;
  /** Where the upload has got to. */
  status: 'pending' | 'uploading' | 'done' | 'error' | 'cancelled';
  /** Whatever the handler threw, when the status is `error`. */
  error?: unknown;
  /** The final URL, once the handler has resolved. */
  url?: string;
}

/** What `onUpload` resolves to. */
export interface UploadResult {
  /** Where the uploaded file now lives. */
  url: string;
  /** Alternative text; an empty string marks the image as decorative. */
  alt?: string;
  /** Intrinsic width, which lets the editor reserve space before the image loads. */
  width?: number;
  /** Intrinsic height, for the same reason. */
  height?: number;
}

/** Events emitted by the editor instance (a superset of the engine's). */
export interface EditorEvents {
  /** The content changed, with the same payload as the `onChange` prop. */
  change: (value: EditorValue, meta: ChangeMeta) => void;
  /** The selection moved, or collapsed to nothing. */
  selectionChange: (selection: EditorSelection | null) => void;
  /** The formats at the selection changed. */
  formatChange: (format: FormatState) => void;
  /** Focus entered the editor. */
  focus: () => void;
  /** Focus left the editor for something outside it. */
  blur: () => void;
  /** The engine has mounted and the instance is usable. */
  ready: () => void;
  /** The editor is unmounting; release anything held against it. */
  destroy: () => void;
  /** Content was dropped or downgraded on the way in. */
  contentWarning: (warnings: ContentWarning[]) => void;
  /** The engine, a plugin or a serializer threw. */
  error: (error: unknown) => void;
  /** Fullscreen was entered or left. */
  fullscreenChange: (open: boolean) => void;
  /** The HTML source view was opened or closed. */
  sourceViewToggle: (open: boolean) => void;
  /** The set of in-flight and finished uploads changed. */
  upload: (uploads: UploadState[]) => void;
  /** Something was sent to the polite live region. */
  announce: (message: string) => void;
}

/** The snapshot `useEditorState` selects from. */
export interface EditorSnapshot {
  /** Every mark and block format at the selection. */
  format: FormatState;
  /** Where the selection is, or `null` when the editor is not focused. */
  selection: EditorSelection | null;
  /** True while the caret is inside the content element. */
  focused: boolean;
  /** False when the editor is disabled or read-only. */
  editable: boolean;
  /** True when the document has no meaningful content (fixes R2). */
  empty: boolean;
  /** Length in the configured `countUnit`. */
  length: number;
  /** Words in the document. */
  wordCount: number;
  /** True while the editor is in fullscreen. */
  fullscreen: boolean;
  /** True while the HTML source view is open. */
  sourceView: boolean;
  /** Every in-flight and recently finished upload. */
  uploads: UploadState[];
  /** The current validation message, or `null`. */
  error: string | null;
  /** Bumped on every content change; lets selectors invalidate cheaply. */
  revision: number;
}

/**
 * The handle returned by `useEditor` and exposed through `editorRef` / `onReady`.
 *
 * @group Editor
 */
export interface EditorInstance {
  // ── content ──────────────────────────────────────────────────────────────
  /** The document as HTML, in the editor's profile unless one is given. */
  getHTML(options?: SerializeOptions): string;
  /** The document as the portable JSON shape. */
  getJSON(): EditorDocument;
  /** The document as Markdown; anything Markdown cannot express is downgraded. */
  getMarkdown(options?: SerializeOptions): string;
  /** The document's text, with blocks joined by `blockSeparator`. */
  getText(options?: { blockSeparator?: string }): string;
  /** The `text/plain` alternative for a multipart e-mail. */
  getPlainTextAlternative(): string;
  /** Replaces the whole document. */
  setContent(value: EditorValue, options?: SetContentOptions): void;
  /** Inserts content at the selection, or at `at`. */
  insertContent(value: EditorValue, options?: InsertOptions): void;
  /** Empties the document, optionally clearing the undo stack with it. */
  clear(options?: { history?: boolean }): void;
  /** True for `''`, `<p></p>`, `<p><br></p>` and whitespace-only content (fixes R2). */
  isEmpty(): boolean;
  /** The document's length in `unit`, defaulting to the configured `countUnit`. */
  getLength(unit?: CountUnit): number;

  // ── selection & focus ────────────────────────────────────────────────────
  /** Where the selection is, or `null` when the editor is not focused. */
  getSelection(): EditorSelection | null;
  /** Moves the selection, either to a range or to a named position. */
  setSelection(sel: EditorSelection | 'start' | 'end' | 'all'): void;
  /** Captures the selection so it survives focus moving to a popover. */
  saveSelection(): SelectionSnapshot;
  /** Puts back a selection captured by {@link EditorInstance.saveSelection}. */
  restoreSelection(snapshot: SelectionSnapshot): void;
  /** Every mark and block format at the selection. */
  getFormatState(): FormatState;
  /** Focuses the content element, optionally placing the caret. */
  focus(position?: 'start' | 'end' | 'restore'): void;
  /** Moves focus out of the content element. */
  blur(): void;
  /** True while the caret is inside the content element. */
  hasFocus(): boolean;

  // ── commands ─────────────────────────────────────────────────────────────
  /** Runs a command through its middleware chain; returns whether it did anything. */
  exec<Id extends CommandId>(command: Id, payload?: CommandPayload<Id>): boolean;
  /** Whether the command could run right now, which is what disables a control. */
  canExec<Id extends CommandId>(command: Id, payload?: CommandPayload<Id>): boolean;
  /** Whether the command's effect is already applied, which is what presses a toggle. */
  isActive<Id extends CommandId>(command: Id, payload?: CommandPayload<Id>): boolean;
  /** Adds a handler to a command's middleware chain; returns its unregister function. */
  registerCommand<Id extends CommandId>(
    id: Id,
    handler: CommandHandler<Id>,
    priority?: number,
  ): Unregister;

  // ── history ──────────────────────────────────────────────────────────────
  /** Steps back one undo entry. */
  undo(): void;
  /** Steps forward one undo entry. */
  redo(): void;
  /** Whether there is anything to undo. */
  canUndo(): boolean;
  /** Whether there is anything to redo. */
  canRedo(): boolean;
  /** Drops the undo stack, so loaded content cannot be undone away. */
  clearHistory(): void;

  // ── links, media, tags ───────────────────────────────────────────────────
  /** Links the selection, or inserts a new link when it is collapsed. */
  insertLink(attrs: LinkAttrs): void;
  /** Unwraps the link at the selection, leaving its text. */
  removeLink(): void;
  /** The link the caret is inside, or `null`. */
  getLinkAtSelection(): LinkAttrs | null;
  /** Inserts an image from attributes you already have. */
  insertImage(attrs: ImageAttrs): void;
  /** Runs files through the upload handler and inserts the results. */
  uploadFiles(files: File[]): Promise<void>;
  /** Inserts a merge tag as an atomic node (fixes R23). */
  insertMergeTag(key: string): void;
  /** The keys of every merge tag currently in the document. */
  getMergeTags(): string[];
  /** Inserts a table and places the caret in its first cell. */
  insertTable(rows: number, cols: number, options?: TableOptions): void;

  // ── state & misc ─────────────────────────────────────────────────────────
  /** Turns editing on or off without changing the disabled or read-only props. */
  setEditable(editable: boolean): void;
  /** Whether the content can currently be edited. */
  isEditable(): boolean;
  /** Enters or leaves fullscreen. */
  setFullscreen(on: boolean): void;
  /** Whether the editor is in fullscreen. */
  isFullscreen(): boolean;
  /** Opens or closes the HTML source view. */
  toggleSourceView(): void;
  /** Whether the HTML source view is open. */
  isSourceView(): boolean;
  /** Searches the document and selects the first match from the caret. */
  find(query: string, options?: FindOptions): FindResult;
  /** Replaces every match in one undo step; returns how many were replaced. */
  replace(query: string, replacement: string, options?: FindOptions): number;
  /** Removes the autosaved draft, which is what a successful submit should do. */
  clearDraft(): void;
  /** Writes an autosave draft now rather than waiting for the interval. */
  saveDraft(): void;
  /** Runs `required`, `maxLength` and the `validate` prop. Returns the message or `null`. */
  validate(): string | null;
  /** Announce a message through the editor's polite live region. */
  announce(message: string): void;
  /** Subscribes to one editor event; returns its unregister function. */
  on<K extends keyof EditorEvents>(event: K, cb: EditorEvents[K]): Unregister;
  /** Current derived state; the same object `useEditorState` selects from. */
  getSnapshot(): EditorSnapshot;

  /** The engine adapter. Escape hatch. */
  readonly engine: EngineHandle;
  /** Stable per-instance id, used to namespace DOM ids (fixes R4). */
  readonly id: string;
}
