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
import { DocumentTree, type NodeKey } from './tree.js';

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
  #editable: boolean;
  #destroyed = false;
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
    this.#events.emit('change', { source: options?.source ?? 'api' });
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
    if (live !== null) this.#lastSelection = live;
    return live ?? this.#lastSelection;
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
    const before = this.#readSelection();
    if (before === null) return false;

    let after = before;
    const change = this.#tree.update((write) => {
      after = operation({ tree: this.#tree, write }, before);
    });

    reconcile(this.#tree, change, this.#index, this.#signatures, this.#document);
    this.#lastSelection = after;
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
    this.#events.emit('change', { source: 'history' });
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
    const cause = causeOf(command);
    const mark = MARK_COMMANDS[command];
    if (mark !== undefined) {
      return this.#edit(cause, 'api', (context, selection) => toggleMark(context, selection, mark));
    }

    const valued = VALUE_COMMANDS[command];
    if (valued !== undefined) {
      const value = (payload as { value?: string } | undefined)?.value;
      return this.#edit(cause, 'api', (context, selection) =>
        value === undefined || value === ''
          ? setMark(context, selection, { type: valued, value: '' }, false)
          : setMark(context, selection, { type: valued, value }, true),
      );
    }

    const list = LIST_COMMANDS[command];
    if (list !== undefined) {
      return this.#edit(cause, 'api', (context, selection) => toggleList(context, selection, list));
    }

    switch (command) {
      case 'clearFormatting':
        return this.#edit(cause, 'api', (context, selection) => clearMarks(context, selection));
      case 'setBlockType': {
        const spec = payload as { type?: BlockType; level?: HeadingLevel } | undefined;
        return this.#edit(cause, 'api', (context, selection) =>
          setBlockType(context, selection, spec?.type ?? 'paragraph', spec?.level ?? 1),
        );
      }
      case 'setAlign': {
        const spec = payload as { align?: 'left' | 'center' | 'right' | 'justify' } | undefined;
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
        return this.#edit(cause, 'api', (context, selection) =>
          insertBlock(context, selection, { type: 'horizontalRule' }),
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

  /** Everything the toolbar reads to draw itself. */
  #formatState(): FormatState {
    const model = this.#readSelection();
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
      link: null,
      canUndo: this.#history.canUndo(),
      canRedo: this.#history.canRedo(),
      isEmpty: this.isEmpty(),
      isCollapsed: model?.isCollapsed ?? true,
    };
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
const BUILT_INS = new Set<CommandId>([
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
