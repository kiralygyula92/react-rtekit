import type { EditorDocument } from './document.js';
import type { ChangeSource, CountUnit, EditorValue, Unregister, ValueFormat } from './common.js';
import type { EditorSelection, FormatState, Position, SelectionSnapshot } from './selection.js';
import type { CommandHandler, CommandId, CommandPayload } from './commands.js';
import type { SerializeOptions } from './interop.js';

/** The engine adapter boundary (02 §2). @group Engine */

/** Declares a custom node type to the engine and the serializers. */
export interface NodeSpec {
  /** The node's name, which is also its `type` in the portable document. */
  name: string;
  /** Rendered element. */
  tag: string;
  /** Attribute defaults, keyed by attribute name. */
  attrs?: Record<string, { default?: unknown }>;
  /** True for nodes that select and delete as one unit (merge tags, images, rules). */
  atomic?: boolean;
  /** True for inline nodes; false (default) for blocks. */
  inline?: boolean;
  /** How foreign HTML is recognized as this node. */
  parseHTML?: HtmlParserRule[];
  /** How this node is written back out; the default renders `tag` with `attrs`. */
  toHTML?: (attrs: Record<string, unknown>) => HtmlOutputSpec;
}

/** Declares a custom inline mark. */
export interface MarkSpec {
  /** The mark's name, which is also its `type` in the portable document. */
  name: string;
  /** Rendered element. */
  tag: string;
  /** Attribute defaults, keyed by attribute name. */
  attrs?: Record<string, { default?: unknown }>;
  /** How foreign HTML is recognized as this mark. */
  parseHTML?: HtmlParserRule[];
  /** How this mark is written back out; the default renders `tag` with `attrs`. */
  toHTML?: (attrs: Record<string, unknown>) => HtmlOutputSpec;
}

/** A DOM match used when parsing foreign HTML. */
export interface HtmlParserRule {
  /** CSS-ish tag selector, e.g. `'mark'` or `'span[data-x]'`. */
  tag?: string;
  /** Inline-style property that implies this node/mark, e.g. `'background-color'`. */
  style?: string;
  /** Class name that implies this node/mark. */
  class?: string;
  /** Higher wins when several rules match. @default 0 */
  priority?: number;
  /** Extract attributes from the matched element. */
  getAttrs?: (el: Element) => Record<string, unknown> | false;
}

/** `['tag', attrs, ...children]`, mirroring the ProseMirror/TipTap convention. */
export type HtmlOutputSpec = [string, Record<string, string>?, ...unknown[]];

/** Rules for a serializer contributed by a plugin. */
export interface HtmlSerializerRule {
  /** The node or mark name this rule renders. */
  match: string;
  /** Produces the markup; a plain string is inserted verbatim and must be safe. */
  render: (node: unknown) => HtmlOutputSpec | string;
}

/** Rules for a Markdown serializer contributed by a plugin. */
export interface MarkdownRule {
  /** The node or mark name this rule concerns. */
  match: string;
  /** Produces the Markdown for the node. */
  render?: (node: unknown) => string;
  /** Recognizes the node when reading Markdown back in. */
  parse?: RegExp;
}

/**
 * Events the engine emits.
 *
 * 02 §2.2 lists all of these except `formatChange`, `copy`, `cut`, `compositionStart`
 * and `compositionEnd`. Those exist because the product layer genuinely needs them:
 * undo availability changes without the content or the selection changing, the
 * clipboard needs its own hooks, and no change event may fire mid-composition
 * (05 §15).
 */
export interface EngineEvents {
  /** The document changed, tagged with what caused it. */
  change: (payload: { source: ChangeSource }) => void;
  /** The selection moved, or collapsed to nothing. */
  selectionChange: (selection: EditorSelection | null) => void;
  /** The formatting or history availability at the selection changed. */
  formatChange: (format: FormatState) => void;
  /** The content element took focus. */
  focus: () => void;
  /** The content element lost focus. */
  blur: () => void;
  /** Something was pasted; claiming it is what routes paste through the sanitizer. */
  paste: (event: ClipboardEvent) => void;
  /** Something was copied. */
  copy: (event: ClipboardEvent) => void;
  /** Something was cut. */
  cut: (event: ClipboardEvent) => void;
  /** Something was dropped onto the content element. */
  drop: (event: DragEvent) => void;
  /**
   * A key went down.
   *
   * Return `true` to claim the key without preventing the browser's default — which
   * is what Tab needs when it should move focus rather than indent.
   */
  keydown: (event: KeyboardEvent) => boolean | void;
  /** An IME composition started; no change event fires until it ends (05 §15). */
  compositionStart: () => void;
  /** An IME composition finished. */
  compositionEnd: () => void;
  /** The engine caught something rather than throwing across the boundary. */
  error: (error: unknown) => void;
}

/** What the host hands the engine when mounting it. */
export interface EngineMountOptions {
  /** Initial content, already sanitized by the host. */
  initialValue?: EditorValue;
  /** Format of `initialValue`. @default 'html' */
  valueFormat?: ValueFormat;
  /** Whether the content starts editable. @default true */
  editable?: boolean;
  /** Take focus on mount, optionally placing the caret. @default false */
  autoFocus?: boolean | 'start' | 'end';
  /** Feature names the schema should accept; everything else is downgraded (03 §2). */
  enabledFeatures?: ReadonlySet<string>;
  /** Grouping window for undo coalescing, in ms. @default 300 */
  historyGroupMs?: number;
  /** Maximum number of history entries. @default 200 */
  historyLimit?: number;
  /** Parses HTML into the portable document model. Supplied by the host (03 §3). */
  parseHtml: (html: string) => EditorDocument;
  /** Serializes the portable document model to HTML. Supplied by the host. */
  serializeHtml: (doc: EditorDocument, options?: SerializeOptions) => string;
  /** Reports an internal error without throwing through the engine boundary. */
  onError?: (error: unknown) => void;
  /** Namespace used for engine-internal ids; keeps multiple editors independent (fixes R4). */
  namespace: string;
  /** Markdown input rules (05 §5). Off unless the host turns them on. */
  markdownShortcuts?: boolean;
  /** Automatic linking of typed URLs and e-mail addresses (05 §6). */
  autoLink?: {
    /** @default true */
    enabled?: boolean;
    /** Protocols a bare URL may be given. @default ['https', 'http', 'mailto'] */
    protocols?: string[];
    /** Protocol added to a bare host. @default 'https' */
    defaultProtocol?: string;
  };
}

/** A mounted engine. Everything the product layer is allowed to call. */
export interface EngineHandle {
  /** Tears the engine down and releases its listeners. */
  destroy(): void;

  // ── content ──────────────────────────────────────────────────────────────
  /** The document as HTML. */
  getHTML(options?: SerializeOptions): string;
  /** The document as the portable JSON shape. */
  getJSON(): EditorDocument;
  /** The document as Markdown. */
  getMarkdown(options?: SerializeOptions): string;
  /** The document's text, with blocks joined by `blockSeparator`. */
  getText(options?: { blockSeparator?: string }): string;
  /** Replaces the whole document. */
  setContent(
    value: EditorValue,
    options?: {
      format?: ValueFormat;
      source?: ChangeSource;
      keepSelection?: boolean;
      history?: boolean;
    },
  ): void;
  /** Inserts content at the selection, or at `at`. */
  insertContent(
    value: EditorValue,
    options?: { format?: ValueFormat; at?: Position; source?: ChangeSource },
  ): void;
  /** True for content that only looks non-empty, such as `<p><br></p>` (fixes R2). */
  isEmpty(): boolean;
  /** The document's length in `unit`. */
  getLength(unit?: CountUnit): number;

  // ── selection ────────────────────────────────────────────────────────────
  /** Where the selection is, or `null` when the editor is not focused. */
  getSelection(): EditorSelection | null;
  /** Moves the selection, either to a range or to a named position. */
  setSelection(selection: EditorSelection | 'start' | 'end' | 'all'): void;
  /** Captures the selection so it survives focus moving to a popover (fixes R5). */
  saveSelection(): SelectionSnapshot;
  /** Puts back a selection captured by {@link EngineHandle.saveSelection}. */
  restoreSelection(snapshot: SelectionSnapshot): void;
  /** Every mark and block format at the selection. */
  getFormatState(): FormatState;
  /**
   * The text between the start of the current block and the caret.
   *
   * What every trigger menu needs: `{{`, `@`, `:` and `/` are all decided by looking
   * back from the caret, and doing that through the DOM would mean the React layer
   * reaching into the engine's element (05 §10).
   */
  getTextBeforeCaret(maxLength?: number): string;
  /** The caret's viewport rectangle, for positioning a menu. `null` with no caret. */
  getCaretRect(): DOMRect | null;
  /** Deletes `length` characters immediately before the caret. */
  deleteBackward(length: number): void;

  // ── commands ─────────────────────────────────────────────────────────────
  /** Runs a command; returns whether it did anything. */
  exec<Id extends CommandId>(command: Id, payload?: CommandPayload<Id>): boolean;
  /** Whether the command could run right now. */
  canExec<Id extends CommandId>(command: Id, payload?: CommandPayload<Id>): boolean;
  /** Adds a handler to a command's middleware chain. */
  registerCommand<Id extends CommandId>(
    id: Id,
    handler: CommandHandler<Id>,
    priority?: number,
  ): Unregister;

  // ── schema ───────────────────────────────────────────────────────────────
  /** Teaches the engine a custom node type. */
  registerNode(node: NodeSpec): Unregister;
  /** Teaches the engine a custom inline mark. */
  registerMark(mark: MarkSpec): Unregister;

  // ── history, focus, state ────────────────────────────────────────────────
  /** Steps back one undo entry. */
  undo(): void;
  /** Steps forward one undo entry. */
  redo(): void;
  /** Whether there is anything to undo. */
  canUndo(): boolean;
  /** Whether there is anything to redo. */
  canRedo(): boolean;
  /** Drops the undo stack, so loaded content cannot be undone away (05 §9). */
  clearHistory(): void;
  /** Focuses the content element, optionally placing the caret. */
  focus(position?: 'start' | 'end' | 'restore'): void;
  /** Moves focus out of the content element. */
  blur(): void;
  /** True while the caret is inside the content element. */
  hasFocus(): boolean;
  /** Turns editing on or off. */
  setEditable(editable: boolean): void;
  /** Whether the content can currently be edited. */
  isEditable(): boolean;

  // ── events ───────────────────────────────────────────────────────────────
  /** Subscribes to one engine event; returns its unregister function. */
  on<K extends keyof EngineEvents>(event: K, cb: EngineEvents[K]): Unregister;

  /** The underlying engine instance. Documented escape hatch; use sparingly. */
  readonly native: unknown;

  /** The contenteditable element the engine drives. */
  readonly contentElement: HTMLElement;
}

/** An engine implementation. The default is the Lexical adapter. @group Engine */
export interface EditorEngine {
  /** Identifies the adapter, e.g. `'lexical'`. */
  readonly id: string;
  /** Mounts the engine into a container and returns its handle. */
  mount(container: HTMLElement, options: EngineMountOptions): EngineHandle;
}
