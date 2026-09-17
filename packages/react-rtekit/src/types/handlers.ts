import type { Middleware } from './common.js';
import type { CommandId, CommandPayload } from './commands.js';
import type { EditorInstance } from './editor.js';
import type { EditorSelection } from './selection.js';
import type { ToolbarItemSpec } from './toolbar.js';
import type { SanitizeViolation } from './sanitize.js';
import type { ChangeMeta } from './editor.js';
import type { EditorValue } from './common.js';

/** Interaction middleware (06 §4). @group Customization */

/** Every handler context carries the editor so middleware can read state. */
export interface BaseHandlerContext {
  /** The instance the interaction happened in. */
  editor: EditorInstance;
}

/** How a paste should be treated. */
export type PasteMode = 'rich' | 'clean' | 'text';

/** Context for `onBeforeChange`: the change that is about to be committed. */
export interface BeforeChangeContext extends BaseHandlerContext {
  /** The new value, in the editor's `valueFormat`. */
  value: EditorValue;
  /** The same metadata the resulting `onChange` would carry. */
  meta: ChangeMeta;
}

/** Context for `onPaste`: what is on the clipboard and how it will be treated. */
export interface PasteHandlerContext extends BaseHandlerContext {
  /** The originating event, or `null` for a programmatic paste. */
  event: ClipboardEvent | null;
  /** The clipboard's HTML, before sanitization. */
  html: string;
  /** The clipboard's plain-text alternative. */
  text: string;
  /** Files on the clipboard, such as a pasted screenshot. */
  files: File[];
  /** Detected origin of the payload. */
  source: 'word' | 'gdocs' | 'excel' | 'quill' | 'rtekit' | 'plain' | 'unknown';
  /** How the paste will be treated; override it through `next({ mode })`. */
  mode: PasteMode;
}

/** Context for `onDrop`: what was dropped onto the content element. */
export interface DropHandlerContext extends BaseHandlerContext {
  /** The originating event. */
  event: DragEvent;
  /** Dropped files, which go through the upload handler. */
  files: File[];
  /** Dropped HTML, before sanitization. */
  html: string;
  /** Dropped plain text. */
  text: string;
}

/** Context for `onUploadStart`: a file about to leave the browser. */
export interface UploadStartContext extends BaseHandlerContext {
  /** The file, already past the `uploadAccept` and `maxUploadSize` checks. */
  file: File;
}

/** Context for `onUploadError`: a rejected or failed upload. */
export interface UploadErrorContext extends BaseHandlerContext {
  /** The file the failure concerned. */
  file: File;
  /** Whatever the upload handler threw. */
  error: unknown;
}

/** Context for `onKeyDown`: a key, and the command the keymap matched. */
export interface KeyDownContext extends BaseHandlerContext {
  /** The originating event. */
  event: KeyboardEvent;
  /** The command the keymap matched, if any. */
  keymapMatch: CommandId | null;
}

/** Context for `onLinkClick`: a link inside the content was clicked. */
export interface LinkClickContext extends BaseHandlerContext {
  /** The originating event. */
  event: MouseEvent;
  /** The link's destination. */
  href: string;
  /** The anchor's other attributes, as rendered. */
  attrs: Record<string, string>;
}

/** Context for `onLinkOpen`: a link is about to be followed. */
export interface LinkOpenContext extends BaseHandlerContext {
  /** The destination; skipping `next()` is what cancels the navigation. */
  href: string;
}

/** Context for `onToolbarCommand`: a toolbar control was activated. */
export interface ToolbarCommandContext extends BaseHandlerContext {
  /** Which command the control runs. */
  command: CommandId;
  /** The payload it runs with. */
  payload: CommandPayload<CommandId>;
  /** The control itself, for analytics or per-item policy. */
  item: ToolbarItemSpec;
}

/** Context for `onFocus` and `onBlur`. */
export interface FocusHandlerContext extends BaseHandlerContext {
  /** The originating event. */
  event: FocusEvent;
}

/** Context for `onSelectionChange`. */
export interface SelectionChangeContext extends BaseHandlerContext {
  /** Where the selection now is, or `null` when there is none (fixes R8). */
  selection: EditorSelection | null;
}

/** Context for `onMaxLengthExceeded`: input that would pass the limit. */
export interface MaxLengthContext extends BaseHandlerContext {
  /** The length the content would have reached. */
  attempted: number;
  /** The configured limit, in the configured `countUnit`. */
  max: number;
}

/** Context for `onSanitizeViolation`: something the sanitizer refused. */
export interface SanitizeViolationContext extends BaseHandlerContext {
  /** What was removed, and why. */
  violation: SanitizeViolation;
}

/** Context for the handlers that wrap an open/closed transition. */
export interface OpenStateContext extends BaseHandlerContext {
  /** The state being moved into. */
  open: boolean;
}

/** Context for `onDraftSave` and `onDraftRestore`. */
export interface DraftContext extends BaseHandlerContext {
  /** The draft being written or read, and when it was saved. */
  draft: { value: EditorValue; savedAt: number };
}

/**
 * The overridable interaction surface.
 *
 * Each handler is `(ctx, next) => void`. Call `next()` (optionally with a partial
 * context override) to run the built-in behaviour; skip it to cancel.
 *
 * @example
 * ```tsx
 * handlers={{
 *   onToolbarCommand: (ctx, next) => { track('rte', ctx.command); next(); },
 *   onPaste: (ctx, next) => next({ mode: 'text' }),
 * }}
 * ```
 */
export interface RteHandlers {
  /** Wraps every content change; skipping `next()` vetoes it. */
  onBeforeChange: Middleware<BeforeChangeContext>;
  /** Wraps every paste, including the sanitization that follows it. */
  onPaste: Middleware<PasteHandlerContext>;
  /** Wraps every drop onto the content element. */
  onDrop: Middleware<DropHandlerContext>;
  /** Wraps each upload before the file leaves the browser. */
  onUploadStart: Middleware<UploadStartContext>;
  /** Wraps the reporting of a rejected or failed upload. */
  onUploadError: Middleware<UploadErrorContext>;
  /** Wraps every keydown, before the keymap acts on it. */
  onKeyDown: Middleware<KeyDownContext>;
  /** Wraps a click on a link inside the content. */
  onLinkClick: Middleware<LinkClickContext>;
  /** Wraps following a link, which is where a confirmation belongs. */
  onLinkOpen: Middleware<LinkOpenContext>;
  /** Wraps every toolbar activation, which is where analytics belongs. */
  onToolbarCommand: Middleware<ToolbarCommandContext>;
  /** Wraps focus entering the editor. */
  onFocus: Middleware<FocusHandlerContext>;
  /** Wraps focus leaving the editor (fixes R9). */
  onBlur: Middleware<FocusHandlerContext>;
  /** Wraps every selection change. */
  onSelectionChange: Middleware<SelectionChangeContext>;
  /** Wraps what happens when input would pass `maxLength`. */
  onMaxLengthExceeded: Middleware<MaxLengthContext>;
  /** Wraps the reporting of something the sanitizer refused (03 §4). */
  onSanitizeViolation: Middleware<SanitizeViolationContext>;
  /** Wraps entering and leaving fullscreen. */
  onFullscreenChange: Middleware<OpenStateContext>;
  /** Wraps opening and closing the HTML source view. */
  onSourceViewToggle: Middleware<OpenStateContext>;
  /** Wraps restoring an autosaved draft. */
  onDraftRestore: Middleware<DraftContext>;
  /** Wraps writing an autosave draft. */
  onDraftSave: Middleware<DraftContext>;
}

/** The name of any handler in {@link RteHandlers}. */
export type HandlerName = keyof RteHandlers;

/** The context type a given handler receives. */
export type HandlerContext<K extends HandlerName> =
  RteHandlers[K] extends Middleware<infer Ctx> ? Ctx : never;
