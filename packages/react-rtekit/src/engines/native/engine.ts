import type {
  ChangeSource,
  CountUnit,
  EditorValue,
  Unregister,
  ValueFormat,
} from '../../types/common.js';
import type { CommandHandler, CommandId, CommandPayload } from '../../types/commands.js';
import type { EditorDocument, HeadingLevel, Mark } from '../../types/document.js';
import type {
  EditorEngine,
  EngineEvents,
  EngineHandle,
  EngineMountOptions,
  MarkSpec,
  NodeSpec,
} from '../../types/engine.js';
import type { SerializeOptions } from '../../types/interop.js';
import type {
  EditorSelection,
  FormatState,
  Position,
  SelectionSnapshot,
} from '../../types/selection.js';
import { countDocument, documentToText, isEmptyDocument } from '../../core/document.js';
import { normalizeColor } from '../../core/utils/color.js';
import { documentToMarkdown, markdownToDocument } from '../../core/serialize/markdown.js';
import { textToDocument } from '../../core/serialize/text.js';
import { History, type HistoryCause } from './history.js';
import {
  blocksInRange,
  clearMarks,
  deleteBackward as deleteBackwardOp,
  deleteRange,
  hasMark,
  insertBlock,
  insertInline,
  insertText as insertTextOp,
  setAlign,
  setBlockType,
  setMark,
  shiftIndent,
  toggleList,
  toggleMark,
  type BlockType,
  type EditContext,
} from './operations.js';
import {
  addColumn,
  addRow,
  deleteColumn,
  deleteRow,
  deleteTable,
  insertLink,
  insertTable,
  linkAt,
  removeLink,
  tableAt,
  toggleHeaderRow,
  type LinkSpec,
} from './structure.js';
import { type RenderIndex, renderTree } from './render.js';
import { reconcile, signaturesOf } from './reconcile.js';
import {
  atEnd,
  atStart,
  fromEditorPoint,
  readSelection,
  selectAll,
  textBeforeCaret,
  textRuns,
  toEditorSelection,
  writeSelection,
  type ModelSelection,
} from './selection.js';
import { DocumentTree, ROOT_KEY, type NodeKey } from './tree.js';

/**
 * The in-house engine — stage 8 of ADR-006.
 *
 * Implements the same `EngineHandle` the Lexical adapter does, so it is graded by the
 * same conformance suite, and imports nothing outside this project.
 *
 * The shape of an edit is the same every time: read the selection out of the DOM, run a
 * model operation inside one `tree.update`, reconcile the change the update reports, put
 * the selection back, record history, tell listeners. Keeping every path through that one
 * pipeline is what stops the model and the DOM drifting apart.
 *
 * @module
 */

/** Which mark a toggle command applies. */
const MARK_COMMANDS: Partial<Record<CommandId, Mark['type']>> = {
  toggleBold: 'bold',
  toggleItalic: 'italic',
  toggleUnderline: 'underline',
  toggleStrike: 'strike',
  toggleCode: 'code',
  toggleSubscript: 'subscript',
  toggleSuperscript: 'superscript',
};

/** Which valued mark a setter command writes. */
const VALUE_COMMANDS: Partial<Record<CommandId, Mark['type']>> = {
  setColor: 'color',
  setBackgroundColor: 'backgroundColor',
  setFontFamily: 'fontFamily',
  setFontSize: 'fontSize',
};

/** Which list a toggle command makes. */
const LIST_COMMANDS: Partial<Record<CommandId, 'bullet' | 'ordered' | 'check'>> = {
  toggleBulletList: 'bullet',
  toggleOrderedList: 'ordered',
  toggleCheckList: 'check',
};

/** What each command does to the undo stack, for coalescing. */
function causeOf(command: CommandId): HistoryCause {
  if (command === 'insertText') return 'typing';
  if (command === 'insertHTML' || command === 'insertContent') return 'paste';
  if (MARK_COMMANDS[command] !== undefined || VALUE_COMMANDS[command] !== undefined) {
    return 'format';
  }
  return 'structure';
}

/** A minimal typed event emitter; the engine has five listeners' worth of traffic. */
class Emitter {
  #listeners = new Map<keyof EngineEvents, Set<(...args: never[]) => void>>();

  on<K extends keyof EngineEvents>(event: K, callback: EngineEvents[K]): Unregister {
    const set = this.#listeners.get(event) ?? new Set();
    set.add(callback);
    this.#listeners.set(event, set);
    return () => {
      set.delete(callback);
    };
  }

  emit<K extends keyof EngineEvents>(event: K, ...args: Parameters<EngineEvents[K]>): void {
    for (const callback of [...(this.#listeners.get(event) ?? [])]) {
      (callback as (...rest: unknown[]) => void)(...args);
    }
  }

  clear(): void {
    this.#listeners.clear();
  }
}

/** The engine's `EngineHandle`. */
class NativeEngineHandle implements EngineHandle {
  readonly contentElement: HTMLElement;
  readonly #options: EngineMountOptions;
  readonly #document: Document;
  readonly #events = new Emitter();
  readonly #history: History;
  readonly #commands = new Map<CommandId, Set<CommandHandler>>();
  #tree: DocumentTree;
  #index: RenderIndex;
  #signatures: Map<NodeKey, string>;
  /** The last selection seen inside the editor, so a command can run after a blur (R5). */
  #lastSelection: ModelSelection | null = null;
  /**
   * The same selection, but forgotten when the editor is blurred.
   *
   * Two readers want different answers. A *command* run from a menu must still apply to
   * what was selected, so it uses `#lastSelection` and does not care about focus (R5).
   * The *toolbar* must stop showing the formatting of text nobody is in any more, so it
   * uses this one, which a blur clears (R8). Reading the DOM selection instead does not
   * work: blurring leaves it exactly where it was.
   */
  #shownSelection: ModelSelection | null = null;
  #editable: boolean;
  #destroyed = false;
  /**
   * True between `compositionstart` and `compositionend`.
   *
   * An input method writes intermediate states into the document while the user is still
   * choosing characters — typing "nihon" shows "にほn" before it becomes "日本". Those are
   * not what anyone meant to type, so a form validating or autosaving against them is
   * validating against noise. No change event escapes while this is set.
   */
  #composing = false;
  readonly #cleanup: (() => void)[] = [];

  constructor(container: HTMLElement, options: EngineMountOptions) {
    this.#options = options;
    this.#document = container.ownerDocument;
    this.#editable = options.editable ?? true;

    this.contentElement = this.#document.createElement('div');
    this.contentElement.setAttribute('contenteditable', String(this.#editable));
    this.contentElement.setAttribute('role', 'textbox');
    this.contentElement.setAttribute('aria-multiline', 'true');
    this.contentElement.className = 'rte-content';
    container.append(this.contentElement);

    const document_ = this.#parse(options.initialValue ?? '', options.valueFormat ?? 'html');
    this.#tree = DocumentTree.fromDocument(document_);
    this.#index = renderTree(this.#tree, this.contentElement, this.#document);
    this.#signatures = signaturesOf(this.#tree);

    this.#history = new History({
      groupMs: options.historyGroupMs,
      limit: options.historyLimit,
    });
    this.#history.push(document_, null, 'api');

    this.#listen();
    if (options.autoFocus !== undefined && options.autoFocus !== false) {
      this.focus(options.autoFocus === true ? 'end' : options.autoFocus);
    }
  }

  // ── lifecycle ────────────────────────────────────────────────────────────

  destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    for (const off of this.#cleanup) off();
    this.#cleanup.length = 0;
    this.#events.clear();
    this.contentElement.remove();
  }

  get native(): unknown {
    // The tree is the engine, so this is what an escape hatch would want.
    return this.#tree;
  }

  // ── content ──────────────────────────────────────────────────────────────

  getJSON(): EditorDocument {
    return this.#tree.toDocument();
  }

  getHTML(options?: SerializeOptions): string {
    return this.#options.serializeHtml(this.getJSON(), options);
  }

  getMarkdown(_options?: SerializeOptions): string {
    // `SerializeOptions` is the HTML serializer's shape and the Markdown writer takes
    // its own; nothing a caller can currently set applies to both.
    return documentToMarkdown(this.getJSON());
  }

  getText(options?: { blockSeparator?: string }): string {
    return documentToText(this.getJSON(), options);
  }

  setContent(
    value: EditorValue,
    options?: {
      format?: ValueFormat;
      source?: ChangeSource;
      keepSelection?: boolean;
      history?: boolean;
    },
  ): void {
    const next = this.#parse(value, options?.format ?? this.#options.valueFormat ?? 'html');
    this.#tree = DocumentTree.fromDocument(next);
    this.#index = renderTree(this.#tree, this.contentElement, this.#document);
    this.#signatures = signaturesOf(this.#tree);
    this.#lastSelection = null;
    if (options?.history === false) this.#history.reset(next);
    else this.#history.push(next, null, 'api');
    this.#emitChange(options?.source ?? 'api');
    this.#emitFormat();
  }

  insertContent(
    value: EditorValue,
    options?: { format?: ValueFormat; at?: Position; source?: ChangeSource },
  ): void {
    const incoming = this.#parse(value, options?.format ?? 'html');
    this.#edit('paste', options?.source ?? 'api', (context, selection) => {
      let at = selection;
      for (const block of incoming.content) at = insertBlock(context, at, block);
      return at;
    });
  }

  isEmpty(): boolean {
    return isEmptyDocument(this.getJSON());
  }

  getLength(unit: CountUnit = 'characters'): number {
    return countDocument(this.getJSON(), unit);
  }

  // ── selection ────────────────────────────────────────────────────────────

  getSelection(): EditorSelection | null {
    const model = this.#readSelection();
    return model === null ? null : toEditorSelection(this.#tree, model);
  }

  setSelection(selection: EditorSelection | 'start' | 'end' | 'all'): void {
    const model =
      selection === 'start'
        ? atStart(this.#tree)
        : selection === 'end'
          ? atEnd(this.#tree)
          : selection === 'all'
            ? selectAll(this.#tree)
            : this.#fromEditorSelection(selection);
    if (model === null) return;
    this.#lastSelection = model;
    this.#shownSelection = model;
    writeSelection(this.#index, this.contentElement, model);
  }

  saveSelection(): SelectionSnapshot {
    const model = this.#readSelection();
    return { __brand: 'rte-selection-snapshot', value: model } as unknown as SelectionSnapshot;
  }

  restoreSelection(snapshot: SelectionSnapshot): void {
    const model = (snapshot as unknown as { value: ModelSelection | null }).value;
    if (model === null || model === undefined) return;
    this.#lastSelection = model;
    this.#shownSelection = model;
    writeSelection(this.#index, this.contentElement, model);
  }

  getFormatState(): FormatState {
    return this.#formatState();
  }

  getTextBeforeCaret(maxLength?: number): string {
    const model = this.#readSelection();
    return model === null ? '' : textBeforeCaret(this.#tree, model, maxLength);
  }

  getCaretRect(): DOMRect | null {
    const selection = this.#document.getSelection();
    if (selection === null || selection.rangeCount === 0) return null;
    const range = selection.getRangeAt(0);
    // jsdom has no layout, so this is `null` there rather than a rectangle of zeroes
    // pretending to be a position.
    const rect = range.getBoundingClientRect?.();
    return rect ?? null;
  }

  deleteBackward(length: number): void {
    if (length <= 0) return;
    this.#edit('deleting', 'api', (context, selection) =>
      deleteBackwardOp(context, selection, length),
    );
  }

  // ── commands ─────────────────────────────────────────────────────────────

  exec<Id extends CommandId>(command: Id, payload?: CommandPayload<Id>): boolean {
    if (this.#destroyed) return false;
    // A toolbar click keeps the caret because its mousedown is prevented, but a command
    // run from a menu or a dialog may have lost it. The last selection stands in, which
    // is what makes formatting apply to the text the user selected (fixes R5).
    if (!this.hasFocus() && this.#lastSelection !== null) {
      writeSelection(this.#index, this.contentElement, this.#lastSelection);
    }

    const handlers = [...(this.#commands.get(command) ?? [])] as unknown as CommandHandler<Id>[];

    /**
     * The middleware chain. Each handler may amend the payload, call on to the next, or
     * simply not call `next` — which cancels, and is how an override replaces a command
     * rather than adding to it.
     */
    const invoke = (index: number, current: CommandPayload<Id>): boolean => {
      const handler = handlers[index];
      if (handler === undefined) return this.#runBuiltIn(command, current);
      const result = handler(
        {
          // The editor instance is injected by the product layer; the engine owns only
          // the payload and the chain, exactly as the Lexical adapter has it.
          editor: undefined as never,
          command,
          payload: current,
          source: 'api',
        },
        (override) => invoke(index + 1, override ?? current),
      );
      return result !== false;
    };

    // A handler that runs its own command again must reach the built-in rather than
    // itself, or an override recurses until the stack gives out.
    if (this.#running.has(command)) return this.#runBuiltIn(command, payload!);
    this.#running.add(command);
    try {
      return invoke(0, payload!);
    } finally {
      this.#running.delete(command);
    }
  }

  canExec(command: CommandId): boolean {
    if (this.#destroyed) return false;
    if (!this.#editable) return command === 'selectAll';
    if (command === 'undo') return this.#history.canUndo();
    if (command === 'redo') return this.#history.canRedo();
    if (TABLE_COMMANDS.has(command)) {
      return tableAt(this.#tree, this.#editPoint()?.focus.key ?? '').table !== null;
    }
    if (command === 'removeLink') {
      const at = this.#editPoint();
      return at !== null && linkAt(this.#tree, at.focus.key) !== null;
    }
    return this.#commands.has(command) || this.#isKnown(command);
  }

  registerCommand<Id extends CommandId>(id: Id, handler: CommandHandler<Id>): Unregister {
    const set = this.#commands.get(id) ?? new Set<CommandHandler>();
    set.add(handler as unknown as CommandHandler);
    this.#commands.set(id, set);
    return () => {
      set.delete(handler as unknown as CommandHandler);
    };
  }

  /** Commands currently mid-chain, so an override cannot call itself for ever. */
  readonly #running = new Set<CommandId>();

  // ── schema ───────────────────────────────────────────────────────────────

  registerNode(node: NodeSpec): Unregister {
    this.#nodes.set(node.name, node);
    return () => {
      this.#nodes.delete(node.name);
    };
  }

  registerMark(mark: MarkSpec): Unregister {
    this.#marks.set(mark.name, mark);
    return () => {
      this.#marks.delete(mark.name);
    };
  }

  readonly #nodes = new Map<string, NodeSpec>();
  readonly #marks = new Map<string, MarkSpec>();

  // ── history ──────────────────────────────────────────────────────────────

  undo(): void {
    const entry = this.#history.undo();
    if (entry === null) return;
    this.#applyHistory(entry.document, entry.selection);
  }

  redo(): void {
    const entry = this.#history.redo();
    if (entry === null) return;
    this.#applyHistory(entry.document, entry.selection);
  }

  canUndo(): boolean {
    return this.#history.canUndo();
  }

  canRedo(): boolean {
    return this.#history.canRedo();
  }

  clearHistory(): void {
    this.#history.reset(this.getJSON());
    this.#emitFormat();
  }

  // ── focus and editability ────────────────────────────────────────────────

  focus(position?: 'start' | 'end' | 'restore'): void {
    this.contentElement.focus();
    if (position === 'start') this.setSelection('start');
    else if (position === 'end') this.setSelection('end');
    else if (position === 'restore' && this.#lastSelection !== null) {
      writeSelection(this.#index, this.contentElement, this.#lastSelection);
    }
  }

  blur(): void {
    this.contentElement.blur();
  }

  hasFocus(): boolean {
    return this.#document.activeElement === this.contentElement;
  }

  setEditable(editable: boolean): void {
    this.#editable = editable;
    this.contentElement.setAttribute('contenteditable', String(editable));
  }

  isEditable(): boolean {
    return this.#editable;
  }

  // ── events ───────────────────────────────────────────────────────────────

  on<K extends keyof EngineEvents>(event: K, callback: EngineEvents[K]): Unregister {
    return this.#events.on(event, callback);
  }

  // ── internals ────────────────────────────────────────────────────────────

  /** Parses any accepted value shape into the portable document. */
  #parse(value: EditorValue, format: ValueFormat): EditorDocument {
    if (typeof value !== 'string') return value;
    if (format === 'json') return JSON.parse(value) as EditorDocument;
    if (format === 'markdown') return markdownToDocument(value);
    if (format === 'text') return textToDocument(value);
    return this.#options.parseHtml(value);
  }

  /** The selection to edit at: the live one, or the last one seen (fixes R5). */
  #readSelection(): ModelSelection | null {
    const live = readSelection(this.#tree, this.#index, this.contentElement);
    if (live !== null) {
      this.#lastSelection = live;
      this.#shownSelection = live;
    }
    return live ?? this.#lastSelection;
  }

  /**
   * Where an edit happens when nothing is selected.
   *
   * A programmatic insert — a paste into an editor that was never focused, an
   * `insertContent` from application code — has to land somewhere. The end of the
   * document is the answer users expect, and refusing instead (which is what returning
   * `null` here used to do) made every such call silently do nothing.
   *
   * The last resort is a point on the first block: an empty document has no text run to
   * name, and `insertText` knows how to give a block its first one.
   */
  #editPoint(): ModelSelection | null {
    const known = this.#readSelection();
    if (known !== null) return known;
    const end = atEnd(this.#tree);
    if (end !== null) return end;
    const block = this.#tree.children(ROOT_KEY)[0];
    if (block === undefined) return null;
    const point = { key: block, offset: 0 };
    return { anchor: point, focus: { ...point }, isCollapsed: true, isBackward: false };
  }

  /** A published selection resolved against this tree. */
  #fromEditorSelection(selection: EditorSelection): ModelSelection | null {
    const anchor = fromEditorPoint(this.#tree, selection.anchor);
    const focus = fromEditorPoint(this.#tree, selection.focus);
    if (anchor === null || focus === null) return null;
    return {
      anchor,
      focus,
      isCollapsed: anchor.key === focus.key && anchor.offset === focus.offset,
      isBackward: selection.isBackward,
    };
  }

  /**
   * The one pipeline every content change goes through.
   *
   * Read the selection, run the operation in a single update, reconcile what it reports,
   * put the selection back, record it, announce it. A change made any other way would be
   * one the DOM, the history or the listeners did not hear about.
   */
  #edit(
    cause: HistoryCause,
    source: ChangeSource,
    operation: (context: EditContext, selection: ModelSelection) => ModelSelection,
  ): boolean {
    if (this.#destroyed || !this.#editable) return false;
    const before = this.#editPoint();
    if (before === null) return false;

    let after = before;
    const change = this.#tree.update((write) => {
      after = operation({ tree: this.#tree, write }, before);
    });

    reconcile(this.#tree, change, this.#index, this.#signatures, this.#document);
    this.#lastSelection = after;
    this.#shownSelection = after;
    if (this.hasFocus()) writeSelection(this.#index, this.contentElement, after);

    const document_ = this.getJSON();
    this.#history.push(document_, toEditorSelection(this.#tree, after), cause);
    this.#events.emit('change', { source });
    this.#emitFormat();
    return true;
  }

  /** Replaces the document wholesale, which is what undo and redo do. */
  #applyHistory(document_: EditorDocument, selection: EditorSelection | null): void {
    this.#tree = DocumentTree.fromDocument(document_);
    this.#index = renderTree(this.#tree, this.contentElement, this.#document);
    this.#signatures = signaturesOf(this.#tree);
    this.#lastSelection = selection === null ? null : this.#fromEditorSelection(selection);
    if (this.#lastSelection !== null && this.hasFocus()) {
      writeSelection(this.#index, this.contentElement, this.#lastSelection);
    }
    this.#emitChange('history');
    this.#emitFormat();
  }

  /** Whether a command is one this engine knows how to run at all. */
  #isKnown(command: CommandId): boolean {
    return (
      MARK_COMMANDS[command] !== undefined ||
      VALUE_COMMANDS[command] !== undefined ||
      LIST_COMMANDS[command] !== undefined ||
      BUILT_INS.has(command)
    );
  }

  /** Runs the engine's own implementation of a command. */
  #runBuiltIn<Id extends CommandId>(command: Id, payload: CommandPayload<Id>): boolean {
    // A command that cannot apply reports that it did nothing, rather than running an
    // operation that finds nothing to do and reporting success.
    if (!this.canExec(command)) return false;
    const cause = causeOf(command);
    const mark = MARK_COMMANDS[command];
    if (mark !== undefined) {
      return this.#edit(cause, 'api', (context, selection) => toggleMark(context, selection, mark));
    }

    const valued = VALUE_COMMANDS[command];
    if (valued !== undefined) {
      // Each valued command names its payload after what it sets — `color` for the two
      // colour commands, `family`, `size` — and `null` means "back to the default",
      // which is the absence of the mark rather than a mark with an empty value.
      const spec = payload as
        | { color?: string | null; family?: string | null; size?: string | null; value?: string | null }
        | undefined;
      const raw = spec?.color ?? spec?.family ?? spec?.size ?? spec?.value ?? null;
      // A colour is normalized so `#FF0000`, `#f00` and `rgb(255 0 0)` produce one
      // stored value; stored markup that differs only in case is markup that diffs.
      const value =
        raw !== null && (valued === 'color' || valued === 'backgroundColor')
          ? normalizeColor(raw)
          : raw;
      return this.#edit(cause, 'api', (context, selection) =>
        value === null || value === ''
          ? setMark(context, selection, { type: valued, value: '' }, false)
          : setMark(context, selection, { type: valued, value }, true),
      );
    }

    const list = LIST_COMMANDS[command];
    if (list !== undefined) {
      return this.#edit(cause, 'api', (context, selection) => toggleList(context, selection, list));
    }

    switch (command) {
      case 'clearFormatting': {
        const spec = payload as { blocks?: boolean } | undefined;
        return this.#edit(cause, 'api', (context, selection) =>
          clearMarks(context, selection, spec?.blocks === true),
        );
      }
      case 'setBlockType': {
        const spec = payload as { type?: BlockType; level?: HeadingLevel } | undefined;
        return this.#edit(cause, 'api', (context, selection) =>
          setBlockType(context, selection, spec?.type ?? 'paragraph', spec?.level ?? 1),
        );
      }
      case 'setAlign': {
        const spec = payload as { align?: 'left' | 'center' | 'right' | 'justify' | null } | undefined;
        return this.#edit(cause, 'api', (context, selection) =>
          setAlign(context, selection, spec?.align ?? 'left'),
        );
      }
      case 'indent':
        return this.#edit(cause, 'api', (context, selection) => shiftIndent(context, selection, 1));
      case 'outdent':
        return this.#edit(cause, 'api', (context, selection) =>
          shiftIndent(context, selection, -1),
        );
      case 'insertText': {
        const text = (payload as { text?: string } | undefined)?.text ?? '';
        if (text === '') return false;
        return this.#edit(cause, 'api', (context, selection) =>
          insertTextOp(context, selection, text),
        );
      }
      case 'insertLineBreak':
        return this.#edit(cause, 'api', (context, selection) =>
          insertInline(context, selection, { type: 'lineBreak' }),
        );
      case 'insertEmoji': {
        const char = (payload as { char?: string } | undefined)?.char;
        if (char === undefined) return false;
        return this.#edit(cause, 'api', (context, selection) =>
          insertInline(context, selection, { type: 'emoji', char }),
        );
      }
      case 'insertHorizontalRule':
        return this.#edit(cause, 'api', (context, selection) => {
          // A rule is atomic: with nothing after it the caret has nowhere to land. The
          // paragraph goes in first because both inserts target the same index, so the
          // second one lands in front of it.
          const at = insertBlock(context, selection, { type: 'paragraph', content: [] });
          return insertBlock(context, at, { type: 'horizontalRule' });
        });
      case 'insertMergeTag': {
        const key = (payload as { key?: string } | undefined)?.key;
        if (key === undefined) return false;
        return this.#edit(cause, 'api', (context, selection) =>
          insertInline(context, selection, { type: 'mergeTag', key }),
        );
      }
      case 'insertMention': {
        const spec = payload as { id?: string; label?: string } | undefined;
        if (spec?.id === undefined || spec.label === undefined) return false;
        return this.#edit(cause, 'api', (context, selection) =>
          insertInline(context, selection, { type: 'mention', id: spec.id!, label: spec.label! }),
        );
      }
      case 'insertImage': {
        const attrs = payload as { src?: string } | undefined;
        if (attrs?.src === undefined) return false;
        return this.#edit(cause, 'api', (context, selection) =>
          insertBlock(context, selection, { ...attrs, type: 'image', src: attrs.src! }),
        );
      }
      case 'insertHTML': {
        // The host has already sanitized; the engine parses with the parser it was given
        // and inserts the blocks, which is what keeps paste on one code path.
        const html = (payload as { html?: string } | undefined)?.html;
        if (html === undefined || html === '') return false;
        return this.#insertDocument(this.#options.parseHtml(html), 'paste');
      }
      case 'pastePlainText': {
        const text = (payload as { text?: string } | undefined)?.text;
        if (text === undefined || text === '') return false;
        return this.#insertDocument(textToDocument(text), 'paste');
      }
      case 'insertContent': {
        const value = (payload as { value?: EditorValue } | undefined)?.value;
        if (value === undefined) return false;
        return this.#insertDocument(this.#parse(value, 'html'), 'paste');
      }
      case 'insertLink': {
        const attrs = payload as LinkSpec | undefined;
        if (attrs?.href === undefined) return false;
        return this.#edit(cause, 'api', (context, selection) =>
          insertLink(context, selection, attrs),
        );
      }
      case 'updateLink': {
        const attrs = payload as LinkSpec | undefined;
        if (attrs?.href === undefined) return false;
        return this.#edit(cause, 'api', (context, selection) =>
          insertLink(context, selection, attrs),
        );
      }
      case 'removeLink':
        return this.#edit(cause, 'api', (context, selection) => removeLink(context, selection));
      case 'insertTable': {
        const spec = payload as
          | { rows?: number; cols?: number; options?: { headerRow?: boolean } }
          | undefined;
        return this.#edit(cause, 'api', (context, selection) =>
          insertTable(context, selection, spec?.rows ?? 2, spec?.cols ?? 2, spec?.options ?? {}),
        );
      }
      case 'addRowBefore':
        return this.#edit(cause, 'api', (context, selection) => addRow(context, selection, 'before'));
      case 'addRowAfter':
        return this.#edit(cause, 'api', (context, selection) => addRow(context, selection, 'after'));
      case 'addColumnBefore':
        return this.#edit(cause, 'api', (context, selection) =>
          addColumn(context, selection, 'before'),
        );
      case 'addColumnAfter':
        return this.#edit(cause, 'api', (context, selection) =>
          addColumn(context, selection, 'after'),
        );
      case 'deleteRow':
        return this.#edit(cause, 'api', (context, selection) => deleteRow(context, selection));
      case 'deleteColumn':
        return this.#edit(cause, 'api', (context, selection) => deleteColumn(context, selection));
      case 'deleteTable':
        return this.#edit(cause, 'api', (context, selection) => deleteTable(context, selection));
      case 'toggleHeaderRow':
        return this.#edit(cause, 'api', (context, selection) =>
          toggleHeaderRow(context, selection),
        );
      case 'undo':
        if (!this.#history.canUndo()) return false;
        this.undo();
        return true;
      case 'redo':
        if (!this.#history.canRedo()) return false;
        this.redo();
        return true;
      case 'selectAll':
        this.setSelection('all');
        return true;
      case 'focusStart':
        this.focus('start');
        return true;
      case 'focusEnd':
        this.focus('end');
        return true;
      default:
        // Commands the host owns — opening a dialog, going fullscreen, printing — reach
        // the engine and are declined rather than swallowed, so a caller can tell the
        // difference between "did nothing" and "not mine".
        return false;
    }
  }

  /**
   * Inserts a parsed document at the selection.
   *
   * Shared by paste, drop and `insertContent`. A single leading paragraph merges into the
   * block the caret is in — pasting a few words in the middle of a sentence should not
   * break the sentence in two — while anything longer arrives as its own blocks.
   */
  #insertDocument(incoming: EditorDocument, source: ChangeSource): boolean {
    const blocks = incoming.content;
    if (blocks.length === 0) return false;

    return this.#edit('paste', source, (context, selection) => {
      let at = selection;
      const [first, ...rest] = blocks;
      if (first?.type === 'paragraph') {
        for (const inline of first.content) {
          at =
            inline.type === 'text'
              ? insertTextOp(context, at, inline.text)
              : insertInline(context, at, inline);
          // Text with marks has to keep them, which typing plainly would lose.
          if (inline.type === 'text' && inline.marks !== undefined) {
            for (const mark of inline.marks) {
              const span: ModelSelection = {
                anchor: { key: at.focus.key, offset: at.focus.offset - inline.text.length },
                focus: at.focus,
                isCollapsed: false,
                isBackward: false,
              };
              setMark(context, span, mark, true);
            }
          }
        }
      } else if (first !== undefined) {
        at = insertBlock(context, at, first);
      }
      for (const block of rest) at = insertBlock(context, at, block);
      return at;
    });
  }

  /** Everything the toolbar reads to draw itself. */
  #formatState(): FormatState {
    // The shown selection, which a blur clears: the toolbar must not keep describing
    // text nobody is in any more (fixes R8).
    this.#readSelection();
    const model = this.#shownSelection;
    const runs =
      model === null ? [] : model.isCollapsed ? [model.focus.key] : this.#runsBetween(model);
    const blocks = model === null ? [] : blocksInRange(this.#tree, model);
    const block = blocks[0];
    const blockValue = block === undefined ? undefined : this.#tree.get(block)?.value;
    const listKey =
      blockValue?.type === 'listItem' && block !== undefined ? this.#tree.parent(block) : null;
    const listValue =
      listKey === null || listKey === undefined ? undefined : this.#tree.get(listKey)?.value;

    const valued = (name: Mark['type']): string | null => {
      for (const key of runs) {
        const value = this.#tree.get(key)?.value;
        if (value?.type !== 'text') continue;
        const found = value.marks?.find((one) => one.type === name);
        if (found !== undefined && 'value' in found) return found.value;
      }
      return null;
    };

    return {
      marks: {
        bold: hasMark(this.#tree, runs, 'bold'),
        italic: hasMark(this.#tree, runs, 'italic'),
        underline: hasMark(this.#tree, runs, 'underline'),
        strike: hasMark(this.#tree, runs, 'strike'),
        code: hasMark(this.#tree, runs, 'code'),
        subscript: hasMark(this.#tree, runs, 'subscript'),
        superscript: hasMark(this.#tree, runs, 'superscript'),
        color: valued('color'),
        backgroundColor: valued('backgroundColor'),
        fontFamily: valued('fontFamily'),
        fontSize: valued('fontSize'),
      },
      block: {
        type: (blockValue?.type ?? 'paragraph') as FormatState['block']['type'],
        headingLevel: blockValue?.type === 'heading' ? blockValue.level : undefined,
        align:
          blockValue !== undefined && 'align' in blockValue ? (blockValue.align ?? 'left') : 'left',
        indent: blockValue !== undefined && 'indent' in blockValue ? (blockValue.indent ?? 0) : 0,
      },
      list: {
        type: listValue?.type === 'list' ? listValue.listType : null,
        depth:
          listKey === null || listKey === undefined
            ? 0
            : this.#tree
                .ancestors(listKey)
                .filter((key) => this.#tree.get(key)?.value.type === 'list').length + 1,
      },
      link: this.#linkAttrs(model),
      canUndo: this.#history.canUndo(),
      canRedo: this.#history.canRedo(),
      isEmpty: this.isEmpty(),
      isCollapsed: model?.isCollapsed ?? true,
    };
  }

  /** The link the caret is in, as the toolbar wants it, or null outside one. */
  #linkAttrs(model: ModelSelection | null): FormatState['link'] {
    if (model === null) return null;
    const key = linkAt(this.#tree, model.focus.key);
    if (key === null) return null;
    const value = this.#tree.get(key)?.value;
    if (value?.type !== 'link') return null;
    const { content: _content, type: _type, ...attrs } = value;
    return attrs;
  }

  /** The runs a selection covers, read-only — no splitting, so no edit. */
  #runsBetween(model: ModelSelection): NodeKey[] {
    const runs = textRuns(this.#tree);
    const [start, end] = model.isBackward
      ? [model.focus, model.anchor]
      : [model.anchor, model.focus];
    const from = runs.indexOf(start.key);
    const to = runs.indexOf(end.key);
    if (from === -1 || to === -1) return [];
    return runs.slice(Math.min(from, to), Math.max(from, to) + 1);
  }

  /**
   * Announces a change, unless a composition is in progress.
   *
   * The suppressed events are not queued: the one emitted at `compositionend` carries
   * the committed document, which is the only state a listener wanted.
   */
  #emitChange(source: ChangeSource): void {
    if (this.#composing) return;
    this.#events.emit('change', { source });
  }

  #emitFormat(): void {
    this.#events.emit('formatChange', this.#formatState());
  }

  /** DOM listeners: focus, blur, selection, and the clipboard events the host claims. */
  #listen(): void {
    const on = <K extends keyof HTMLElementEventMap>(
      target: HTMLElement | Document,
      event: K,
      handler: (payload: HTMLElementEventMap[K]) => void,
    ): void => {
      target.addEventListener(event, handler as EventListener);
      this.#cleanup.push(() => {
        target.removeEventListener(event, handler as EventListener);
      });
    };

    on(this.contentElement, 'focus', () => {
      this.#events.emit('focus');
    });
    on(this.contentElement, 'blur', () => {
      // The command path keeps its copy; only what the toolbar shows is given up.
      this.#shownSelection = null;
      this.#events.emit('blur');
    });
    on(this.contentElement, 'paste', (event) => {
      this.#events.emit('paste', event);
    });
    on(this.contentElement, 'copy', (event) => {
      this.#events.emit('copy', event);
    });
    on(this.contentElement, 'cut', (event) => {
      this.#events.emit('cut', event);
    });
    on(this.contentElement, 'drop', (event) => {
      this.#events.emit('drop', event);
    });
    on(this.contentElement, 'keydown', (event) => {
      this.#events.emit('keydown', event);
    });

    on(this.#document as unknown as HTMLElement, 'selectionchange', () => {
      if (!this.hasFocus()) return;
      const model = this.#readSelection();
      this.#events.emit(
        'selectionChange',
        model === null ? null : toEditorSelection(this.#tree, model),
      );
      this.#emitFormat();
    });

    on(this.contentElement, 'compositionstart', () => {
      this.#composing = true;
      this.#events.emit('compositionStart');
    });
    on(this.contentElement, 'compositionend', (event) => {
      this.#composing = false;
      this.#events.emit('compositionEnd');
      const text = (event).data;
      if (text === undefined || text === '') {
        this.#emitChange('user');
        return;
      }
      // The browser has already put the composed text in the DOM. Applying it to the
      // model and reconciling puts the two back in step, and emits the one change event
      // the whole composition is worth.
      this.#edit('typing', 'user', (context, selection) =>
        insertTextOp(context, selection, text),
      );
    });

    // `beforeinput` is where typing is intercepted: the browser is told not to edit the
    // DOM itself, and the model is changed instead. Everything the DOM shows afterwards
    // comes from the reconciler, so the two cannot disagree.
    on(this.contentElement, 'beforeinput', (event) => {
      const input = event;
      if (!this.#editable) {
        input.preventDefault();
        return;
      }
      const handled = this.#handleBeforeInput(input);
      if (handled) input.preventDefault();
    });
  }

  /** Applies one `beforeinput`, or declines it and lets the browser proceed. */
  #handleBeforeInput(event: InputEvent): boolean {
    switch (event.inputType) {
      case 'insertText':
      case 'insertReplacementText': {
        const text = event.data;
        if (text === null || text === '') return false;
        return this.#edit('typing', 'user', (context, selection) =>
          insertTextOp(context, selection, text),
        );
      }
      case 'insertParagraph':
        return this.#edit('structure', 'user', (context, selection) =>
          insertBlock(context, selection, { type: 'paragraph', content: [] }),
        );
      case 'insertLineBreak':
        return this.#edit('structure', 'user', (context, selection) =>
          insertInline(context, selection, { type: 'lineBreak' }),
        );
      case 'deleteContentBackward':
        return this.#edit('deleting', 'user', (context, selection) =>
          selection.isCollapsed
            ? deleteBackwardOp(context, selection, 1)
            : deleteRange(context, selection),
        );
      case 'deleteByCut':
      case 'deleteContentForward':
        return this.#edit('deleting', 'user', (context, selection) =>
          deleteRange(context, selection),
        );
      case 'formatBold':
        return this.exec('toggleBold');
      case 'formatItalic':
        return this.exec('toggleItalic');
      case 'formatUnderline':
        return this.exec('toggleUnderline');
      case 'historyUndo':
        this.undo();
        return true;
      case 'historyRedo':
        this.redo();
        return true;
      default:
        // Composition and anything else unrecognised is left to the browser, and the
        // model is re-read from the DOM afterwards rather than guessed at.
        return false;
    }
  }
}

/** Commands the engine implements beyond the mark, value and list tables. */
/** Commands that need a table to act on, so they are disabled outside one. */
const TABLE_COMMANDS = new Set<CommandId>([
  'addRowBefore',
  'addRowAfter',
  'addColumnBefore',
  'addColumnAfter',
  'deleteRow',
  'deleteColumn',
  'deleteTable',
  'toggleHeaderRow',
]);

const BUILT_INS = new Set<CommandId>([
  'insertLink',
  'updateLink',
  'removeLink',
  'insertTable',
  'addRowBefore',
  'addRowAfter',
  'addColumnBefore',
  'addColumnAfter',
  'deleteRow',
  'deleteColumn',
  'deleteTable',
  'toggleHeaderRow',
  'insertHTML',
  'pastePlainText',
  'insertContent',
  'insertMergeTag',
  'insertMention',
  'insertImage',
  'clearFormatting',
  'setBlockType',
  'setAlign',
  'indent',
  'outdent',
  'insertText',
  'insertLineBreak',
  'insertEmoji',
  'insertHorizontalRule',
  'undo',
  'redo',
  'selectAll',
  'focusStart',
  'focusEnd',
]);

/**
 * The in-house engine.
 *
 * @example
 * ```tsx
 * <RichTextEditor engine={nativeEngine} />
 * ```
 *
 * @group Engine
 */
export const nativeEngine: EditorEngine = {
  id: 'native',
  mount(container: HTMLElement, options: EngineMountOptions): EngineHandle {
    return new NativeEngineHandle(container, options);
  },
};
