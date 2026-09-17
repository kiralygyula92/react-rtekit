import {
  $getRoot,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $setSelection,
  BLUR_COMMAND,
  COMMAND_PRIORITY_LOW,
  DROP_COMMAND,
  FOCUS_COMMAND,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  KEY_DOWN_COMMAND,
  PASTE_COMMAND,
  createEditor,
  type LexicalEditor,
} from 'lexical';
import { HeadingNode, QuoteNode, registerRichText } from '@lexical/rich-text';
import { ListItemNode, ListNode, registerCheckList, registerList } from '@lexical/list';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { CodeHighlightNode, CodeNode, registerCodeHighlighting } from '@lexical/code';
import {
  TableCellNode,
  TableNode,
  TableRowNode,
  registerTablePlugin,
  registerTableSelectionObserver,
} from '@lexical/table';
import { createEmptyHistoryState, registerHistory } from '@lexical/history';
import { $findMatchingParent, mergeRegister } from '@lexical/utils';
import type {
  EditorEngine,
  EngineEvents,
  EngineHandle,
  EngineMountOptions,
  MarkSpec,
  NodeSpec,
} from '../../types/engine.js';
import type { CommandHandler, CommandId, CommandPayload } from '../../types/commands.js';
import type { ChangeSource, CountUnit, EditorValue, Unregister, ValueFormat } from '../../types/common.js';
import type { EditorDocument } from '../../types/document.js';
import type { EditorSelection, FormatState, Position, SelectionSnapshot } from '../../types/selection.js';
import type { SerializeOptions } from '../../types/interop.js';
import {
  countDocument,
  documentToText,
  isEditorDocument,
  isEmptyDocument,
} from '../../core/document.js';
import { documentToMarkdown, markdownToDocument } from '../../core/serialize/markdown.js';
import { textToDocument } from '../../core/serialize/text.js';
import { $documentToRoot } from './convert/from-document.js';
import { $rootToDocument } from './convert/to-document.js';
import { ENGINE_COMMANDS, registerHistoryState, type EngineCommandContext } from './commands.js';
import { MergeTagNode } from './nodes/merge-tag.js';
import { MentionNode } from './nodes/mention.js';
import { ImageNode } from './nodes/image.js';
import { HorizontalRuleNode } from './nodes/horizontal-rule.js';
import { registerAutoLinking } from './autolink.js';
import { registerMarkdownInputRules } from './markdown-shortcuts.js';
import { $applySelection, $readFormatState, $readSelection, emptyFormatState } from './selection.js';
import { lexicalTheme } from './theme.js';

/**
 * The Lexical engine adapter (ADR-002).
 *
 * This is the only file in the library allowed to import Lexical. Everything above it
 * talks to {@link EngineHandle}, so replacing the engine is a contained change.
 *
 * @module
 */

/** Commits synchronously, so a caller reads the result on the next line (fixes R7). */
const DISCRETE_UPDATE = { discrete: true } as const;

/** Shared unregister for registrations this engine has nothing to undo for. */
/**
 * Removes a non-collapsed selection through the model.
 *
 * Safari does not remove a `contenteditable="false"` node that sits inside the range
 * it is deleting, so "select all, delete, write a new message" quietly kept every merge
 * tag — the placeholder survived into the sent e-mail, which is the whole class of bug
 * R23 exists to close. `removeText` is what the model means by deleting a selection,
 * on every browser.
 *
 * Returns `false` for a caret, which leaves Lexical's own character deletion in charge:
 * merging blocks, stepping over an atomic node and everything else it does for a
 * collapsed selection is right, and only the *range* case is what Safari gets wrong.
 */
function removeSelectedRange(): boolean {
  const selection = $getSelection();
  if (!$isRangeSelection(selection) || selection.isCollapsed()) return false;
  selection.removeText();
  return true;
}

const noop: Unregister = () => {
  /* nothing to undo */
};

/** Structural comparison, so `formatChange` fires only when something really moved. */
function formatStateEqual(a: FormatState, b: FormatState): boolean {
  if (a === b) return true;
  if (
    a.canUndo !== b.canUndo ||
    a.canRedo !== b.canRedo ||
    a.isEmpty !== b.isEmpty ||
    a.isCollapsed !== b.isCollapsed
  ) {
    return false;
  }
  const marks = Object.keys(a.marks) as (keyof FormatState['marks'])[];
  if (marks.some((key) => a.marks[key] !== b.marks[key])) return false;
  if (
    a.block.type !== b.block.type ||
    a.block.align !== b.block.align ||
    a.block.indent !== b.block.indent ||
    a.block.headingLevel !== b.block.headingLevel
  ) {
    return false;
  }
  if (a.list.type !== b.list.type || a.list.depth !== b.list.depth) return false;
  return a.link?.href === b.link?.href && a.link?.target === b.link?.target;
}

/** A registered command handler plus its priority. */
interface RegisteredCommand {
  handler: CommandHandler;
  priority: number;
  order: number;
}

/** Internal event bus, so several listeners can share one Lexical registration. */
class Emitter {
  private readonly listeners = new Map<keyof EngineEvents, Set<(...args: never[]) => void>>();

  on<K extends keyof EngineEvents>(event: K, cb: EngineEvents[K]): Unregister {
    const set = this.listeners.get(event) ?? new Set();
    set.add(cb);
    this.listeners.set(event, set);
    return () => {
      set.delete(cb);
    };
  }

  emit<K extends keyof EngineEvents>(event: K, ...args: Parameters<EngineEvents[K]>): boolean {
    const set = this.listeners.get(event);
    if (!set) return false;
    let claimed = false;
    for (const listener of [...set]) {
      // A listener claims the event by returning true; the rest still run, because
      // "I handled this" is not "nobody else may look at it".
      if ((listener as (...a: unknown[]) => unknown)(...args) === true) claimed = true;
    }
    return claimed;
  }

  clear(): void {
    this.listeners.clear();
  }
}

class LexicalEngineHandle implements EngineHandle {
  readonly contentElement: HTMLElement;

  private readonly editor: LexicalEditor;
  private readonly emitter = new Emitter();
  private readonly options: EngineMountOptions;
  private readonly cleanups: Unregister[] = [];
  private readonly commands = new Map<CommandId, RegisteredCommand[]>();

  /** Source of the update currently being applied, for the `change` event. */
  private pendingSource: ChangeSource = 'api';
  private registrationOrder = 0;
  private canUndoState = false;
  private canRedoState = false;
  private focused = false;
  /** True between compositionstart and compositionend; no change may fire inside. */
  private composing = false;
  private destroyed = false;
  /** Cached so `getFormatState` outside a read is cheap and never throws. */
  private formatState: FormatState = emptyFormatState();
  /** The last non-null selection, restored before a toolbar command runs (fixes R5). */
  private lastSelection: EditorSelection | null = null;
  /** Commands whose middleware chain is currently running, to stop it recursing. */
  private readonly running = new Set<CommandId>();

  constructor(container: HTMLElement, options: EngineMountOptions) {
    this.options = options;

    const content = container.ownerDocument.createElement('div');
    content.className = 'rte-content';
    content.setAttribute('contenteditable', 'true');
    content.setAttribute('role', 'textbox');
    content.setAttribute('aria-multiline', 'true');
    content.spellcheck = true;
    container.appendChild(content);
    this.contentElement = content;

    this.editor = createEditor({
      namespace: options.namespace,
      theme: lexicalTheme,
      editable: options.editable ?? true,
      nodes: [
        HeadingNode,
        QuoteNode,
        ListNode,
        ListItemNode,
        LinkNode,
        AutoLinkNode,
        CodeNode,
        CodeHighlightNode,
        TableNode,
        TableRowNode,
        TableCellNode,
        MergeTagNode,
        MentionNode,
        ImageNode,
        HorizontalRuleNode,
      ],
      onError: (error) => {
        options.onError?.(error);
        this.emitter.emit('error', error);
      },
    });

    this.editor.setRootElement(content);

    this.cleanups.push(
      mergeRegister(
        registerRichText(this.editor),
        registerList(this.editor),
        registerCheckList(this.editor),
        registerCodeHighlighting(this.editor),
        // Table keyboard navigation and the cell-selection overlay. Registered even
        // when the preset has no table plugin: a table can still arrive by paste, and
        // an unnavigable one would be worse than no table at all.
        registerTablePlugin(this.editor),
        registerTableSelectionObserver(this.editor),
        registerAutoLinking(this.editor, options.autoLink ?? {}),
        registerMarkdownInputRules(this.editor, {
          enabled: options.markdownShortcuts === true,
          ...(options.enabledFeatures ? { features: options.enabledFeatures } : {}),
        }),
        registerHistoryState(this.editor, ({ canUndo, canRedo }) => {
          if (canUndo !== undefined) this.canUndoState = canUndo;
          if (canRedo !== undefined) this.canRedoState = canRedo;
          this.refreshFormatState();
        }),
      ),
    );

    // History is registered separately because `clearHistory` re-registers it with a
    // fresh state, which is Lexical's only way to drop the undo stack (05 §9).
    this.historyCleanup = registerHistory(
      this.editor,
      createEmptyHistoryState(),
      options.historyGroupMs ?? 300,
    );

    this.registerBridges();

    if (options.initialValue !== undefined) {
      this.setContent(options.initialValue, {
        format: options.valueFormat ?? 'html',
        source: 'init',
        history: false,
      });
    } else {
      this.refreshFormatState();
    }

    if (options.autoFocus) {
      const position = options.autoFocus === true ? 'end' : options.autoFocus;
      queueMicrotask(() => {
        if (!this.destroyed) this.focus(position);
      });
    }
  }

  // ── wiring ───────────────────────────────────────────────────────────────

  private registerBridges(): void {
    const { editor, emitter } = this;

    this.cleanups.push(
      editor.registerUpdateListener(({ dirtyElements, dirtyLeaves, editorState, prevEditorState }) => {
        const contentChanged =
          (dirtyElements.size > 0 || dirtyLeaves.size > 0) && prevEditorState !== editorState;
        editorState.read(() => {
          this.lastSelection = $readSelection() ?? this.lastSelection;
        });
        this.refreshFormatState();
        // No change event mid-composition: an IME emits intermediate states that are
        // not what the user meant to type, and forms would validate against them
        // (05 §15).
        if (contentChanged && !this.composing) {
          emitter.emit('change', { source: this.pendingSource });
          this.pendingSource = 'user';
        }
      }),
    );

    this.cleanups.push(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          emitter.emit('selectionChange', $readSelection());
        });
        this.normalizeCheckLists();
      }),
    );

    this.cleanups.push(
      mergeRegister(
        editor.registerCommand(
          FOCUS_COMMAND,
          () => {
            this.focused = true;
            emitter.emit('focus');
            return false;
          },
          COMMAND_PRIORITY_LOW,
        ),
        editor.registerCommand(
          BLUR_COMMAND,
          () => {
            this.focused = false;
            emitter.emit('blur');
            return false;
          },
          COMMAND_PRIORITY_LOW,
        ),
        // Paste and drop are claimed the moment a listener calls `preventDefault()`.
        // The engine's own handler would otherwise import the clipboard's HTML with
        // Lexical's DOM importer, which never sees our sanitizer — the one thing
        // 03 §4 says must not happen.
        editor.registerCommand(
          PASTE_COMMAND,
          (event: ClipboardEvent) => {
            emitter.emit('paste', event);
            return event.defaultPrevented;
          },
          COMMAND_PRIORITY_LOW,
        ),
        editor.registerCommand(
          DROP_COMMAND,
          (event: DragEvent) => {
            emitter.emit('drop', event);
            return event.defaultPrevented;
          },
          COMMAND_PRIORITY_LOW,
        ),
        editor.registerCommand(
          KEY_DELETE_COMMAND,
          () => removeSelectedRange(),
          COMMAND_PRIORITY_LOW,
        ),
        editor.registerCommand(
          KEY_BACKSPACE_COMMAND,
          () => removeSelectedRange(),
          COMMAND_PRIORITY_LOW,
        ),
        // Not a plain bridge. Lexical's own key handling — `Mod+B`, `Mod+I`, `Mod+U`
        // and the rest — runs *after* this command and only if no handler claimed the
        // event, so a listener that calls `preventDefault()` has to stop it here.
        // Otherwise our keymap and Lexical's both fire and the format toggles twice,
        // which looks exactly like the shortcut doing nothing (05 §13).
        editor.registerCommand(
          KEY_DOWN_COMMAND,
          (event: KeyboardEvent) => {
            const claimed = emitter.emit('keydown', event);
            return claimed || event.defaultPrevented;
          },
          COMMAND_PRIORITY_LOW,
        ),
      ),
    );

    // Lexical exposes no composition command, so IME boundaries come from the DOM.
    // They matter because no change event may fire mid-composition (05 §15).
    const onCopy = (event: Event): void => {
      emitter.emit('copy', event as ClipboardEvent);
    };
    const onCut = (event: Event): void => {
      emitter.emit('cut', event as ClipboardEvent);
    };
    const onCompositionStart = (): void => {
      this.composing = true;
      emitter.emit('compositionStart');
    };
    const onCompositionEnd = (): void => {
      this.composing = false;
      emitter.emit('compositionEnd');
      // The composed text landed during the suppressed window, so announce it now.
      emitter.emit('change', { source: 'user' });
    };
    this.contentElement.addEventListener('copy', onCopy);
    this.contentElement.addEventListener('cut', onCut);
    this.contentElement.addEventListener('compositionstart', onCompositionStart);
    this.contentElement.addEventListener('compositionend', onCompositionEnd);
    this.cleanups.push(() => {
      this.contentElement.removeEventListener('copy', onCopy);
      this.contentElement.removeEventListener('cut', onCut);
      this.contentElement.removeEventListener('compositionstart', onCompositionStart);
      this.contentElement.removeEventListener('compositionend', onCompositionEnd);
    });
  }

  private refreshFormatState(): void {
    if (this.destroyed) return;
    const previous = this.formatState;
    this.editor.getEditorState().read(() => {
      this.formatState = $readFormatState({
        canUndo: this.canUndoState,
        canRedo: this.canRedoState,
        isEmpty: this.isEmpty(),
      });
    });
    // Emitting only on a real change keeps a toolbar of individually-subscribed
    // buttons from re-rendering on every keystroke (02 §7).
    if (!formatStateEqual(previous, this.formatState)) {
      this.emitter.emit('formatChange', this.formatState);
    }
  }

  /** Reads the document without leaving a Lexical read scope open. */
  private readDocument(): EditorDocument {
    return this.editor.getEditorState().read(() => $rootToDocument($getRoot()));
  }

  private toDocument(value: EditorValue, format: ValueFormat): EditorDocument {
    // A document object is already in the portable model, whatever `format` says.
    if (isEditorDocument(value)) return value;
    if (format === 'markdown') return markdownToDocument(value);
    if (format === 'text') return textToDocument(value);
    return this.options.parseHtml(value);
  }

  private get commandContext(): EngineCommandContext {
    return {
      editor: this.editor,
      parse: (html: string) => this.options.parseHtml(html),
      mergeTagLabels: {},
    };
  }

  // ── content ──────────────────────────────────────────────────────────────

  getHTML(options?: SerializeOptions): string {
    return this.options.serializeHtml(this.readDocument(), options);
  }

  getJSON(): EditorDocument {
    return this.readDocument();
  }

  getMarkdown(): string {
    return documentToMarkdown(this.readDocument());
  }

  getText(options?: { blockSeparator?: string }): string {
    return documentToText(this.readDocument(), options);
  }

  setContent(
    value: EditorValue,
    options: {
      format?: ValueFormat;
      source?: ChangeSource;
      keepSelection?: boolean;
      history?: boolean;
    } = {},
  ): void {
    const doc = this.toDocument(value, options.format ?? this.options.valueFormat ?? 'html');
    this.pendingSource = options.source ?? 'api';

    const snapshot = options.keepSelection ? this.saveSelection() : null;

    this.editor.update(
      () => {
        $documentToRoot($getRoot(), doc);
      },
      // Discrete so `getHTML()` on the next line already sees the new content: 05 §4
      // requires content and command APIs to be synchronous (fixes R7).
      { discrete: true, ...(options.history === false ? { tag: 'history-merge' } : {}) },
    );

    if (snapshot) this.restoreSelection(snapshot);
    if (options.history === false) this.clearHistory();
    this.refreshFormatState();
  }

  insertContent(
    value: EditorValue,
    options: { format?: ValueFormat; at?: Position; source?: ChangeSource } = {},
  ): void {
    const doc = this.toDocument(value, options.format ?? this.options.valueFormat ?? 'html');
    this.pendingSource = options.source ?? 'api';
    if (options.at === 'start') this.exec('focusStart');
    if (options.at === 'end') this.exec('focusEnd');
    this.exec('insertHTML', { html: this.options.serializeHtml(doc) });
  }

  isEmpty(): boolean {
    return isEmptyDocument(this.readDocument());
  }

  getLength(unit: CountUnit = 'characters'): number {
    return countDocument(this.readDocument(), unit);
  }

  // ── selection ────────────────────────────────────────────────────────────

  getSelection(): EditorSelection | null {
    return this.editor.getEditorState().read(() => $readSelection());
  }

  setSelection(selection: EditorSelection | 'start' | 'end' | 'all'): void {
    if (selection === 'start') {
      this.exec('focusStart');
      return;
    }
    if (selection === 'end') {
      this.exec('focusEnd');
      return;
    }
    if (selection === 'all') {
      this.exec('selectAll');
      return;
    }
    this.editor.update(() => {
      $applySelection(selection);
    });
  }

  saveSelection(): SelectionSnapshot {
    const selection = this.getSelection() ?? this.lastSelection;
    return { __brand: 'rte-selection-snapshot', selection, native: null };
  }

  restoreSelection(snapshot: SelectionSnapshot): void {
    const { selection } = snapshot;
    if (!selection) return;
    this.editor.update(() => {
      $applySelection(selection);
    });
  }

  /**
   * Gives a check list a role its children are valid under.
   *
   * The items are checkboxes, and a checkbox is not a list item: a `<ul>` whose
   * children carry `role="checkbox"` is an ARIA violation, and screen readers
   * announce the mismatch. `group` is what a set of related checkboxes is, so the
   * element says that instead of claiming to be a list (05 §14).
   */
  private normalizeCheckLists(): void {
    for (const list of this.contentElement.querySelectorAll('ul.rte-list--check')) {
      if (list.getAttribute('role') === 'group') continue;
      list.setAttribute('role', 'group');
    }
  }

  getTextBeforeCaret(maxLength = 120): string {
    let text = '';
    this.editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection) || !selection.isCollapsed()) return;
      const anchor = selection.anchor;
      const node = anchor.getNode();
      // Everything in this block up to the caret: a trigger can be preceded by text
      // in an earlier sibling node, which reading only the anchor node would miss.
      const block = $findMatchingParent(node, (candidate) => $isElementNode(candidate) && !candidate.isInline());
      if (!block || !$isElementNode(block)) {
        text = node.getTextContent().slice(0, anchor.offset);
        return;
      }
      let collected = '';
      for (const child of block.getChildren()) {
        if (child.getKey() === node.getKey()) {
          collected += child.getTextContent().slice(0, anchor.offset);
          break;
        }
        collected += child.getTextContent();
      }
      text = collected;
    });
    return maxLength > 0 ? text.slice(-maxLength) : text;
  }

  getCaretRect(): DOMRect | null {
    if (typeof window === 'undefined') return null;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    const range = selection.getRangeAt(0);
    if (!this.contentElement.contains(range.startContainer)) return null;
    const rect = range.getBoundingClientRect();
    // A collapsed range at the start of an empty block measures as nothing; the
    // element's own box is the honest fallback.
    if (rect.width === 0 && rect.height === 0) {
      const element = range.startContainer instanceof Element ? range.startContainer : range.startContainer.parentElement;
      return element?.getBoundingClientRect() ?? null;
    }
    return rect;
  }

  deleteBackward(length: number): void {
    if (length <= 0) return;
    this.editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      for (let index = 0; index < length; index += 1) selection.deleteCharacter(true);
    }, DISCRETE_UPDATE);
  }

  getFormatState(): FormatState {
    return this.formatState;
  }

  // ── commands ─────────────────────────────────────────────────────────────

  exec<Id extends CommandId>(command: Id, payload?: CommandPayload<Id>): boolean {
    // A toolbar click blurs nothing (its mousedown is prevented), but a command run
    // from a menu or a dialog may have lost the caret. Restoring first is what makes
    // formatting apply to the text the user selected (fixes R5).
    if (!this.hasFocus() && this.lastSelection) {
      this.editor.update(() => {
        $applySelection(this.lastSelection!);
      });
    }

    const registered = this.commands.get(command);
    const builtIn = ENGINE_COMMANDS[command];

    const runBuiltIn = (finalPayload: CommandPayload<Id>): boolean =>
      builtIn ? builtIn(this.commandContext, finalPayload) : false;

    if (!registered || registered.length === 0) return runBuiltIn(payload!);

    // A handler that runs its own command again — which is how 06 §3 shows replacing
    // one — must reach the built-in rather than itself.
    if (this.running.has(command)) return runBuiltIn(payload!);

    // Handlers are middleware: the last registered with the highest priority runs
    // first and may call `next` to reach the one before it (06 §3).
    const ordered = [...registered].sort(
      (a, b) => b.priority - a.priority || b.order - a.order,
    );

    const invoke = (index: number, currentPayload: CommandPayload<Id>): boolean => {
      const entry = ordered[index];
      if (!entry) return runBuiltIn(currentPayload);
      const result = entry.handler(
        {
          // The editor instance is injected by the product layer; the engine only owns
          // the payload and the chain.
          editor: undefined as never,
          command,
          payload: currentPayload,
          source: 'api',
        },
        (override) => invoke(index + 1, (override ?? currentPayload) as CommandPayload<Id>),
      );
      return result !== false;
    };

    this.running.add(command);
    try {
      return invoke(0, payload!);
    } finally {
      this.running.delete(command);
    }
  }

  canExec(command: CommandId): boolean {
    if (!this.editor.isEditable()) return command === 'selectAll';
    if (command === 'undo') return this.canUndoState;
    if (command === 'redo') return this.canRedoState;
    return this.commands.has(command) || command in ENGINE_COMMANDS;
  }

  registerCommand<Id extends CommandId>(
    id: Id,
    handler: CommandHandler<Id>,
    priority = 0,
  ): Unregister {
    const list = this.commands.get(id) ?? [];
    this.registrationOrder += 1;
    const entry: RegisteredCommand = {
      handler: handler as unknown as CommandHandler,
      priority,
      order: this.registrationOrder,
    };
    list.push(entry);
    this.commands.set(id, list);
    return () => {
      const current = this.commands.get(id);
      if (!current) return;
      const index = current.indexOf(entry);
      if (index >= 0) current.splice(index, 1);
    };
  }

  // ── schema ───────────────────────────────────────────────────────────────

  registerNode(_node: NodeSpec): Unregister {
    // Lexical's node list is fixed when the editor is created, so plugin nodes are
    // supplied through the `nodes` option at mount time instead. This method exists so
    // the plugin API stays engine-independent; for Lexical it has nothing to undo.
    return noop;
  }

  registerMark(_mark: MarkSpec): Unregister {
    return noop;
  }

  // ── history ──────────────────────────────────────────────────────────────

  undo(): void {
    this.pendingSource = 'history';
    this.exec('undo');
  }

  redo(): void {
    this.pendingSource = 'history';
    this.exec('redo');
  }

  canUndo(): boolean {
    return this.canUndoState;
  }

  canRedo(): boolean {
    return this.canRedoState;
  }

  clearHistory(): void {
    // Re-registering history with a fresh state is Lexical's way of clearing it, and
    // is what stops a user undoing into content the server loaded (05 §9).
    this.canUndoState = false;
    this.canRedoState = false;
    this.historyCleanup?.();
    this.historyCleanup = registerHistory(
      this.editor,
      createEmptyHistoryState(),
      this.options.historyGroupMs ?? 300,
    );
    this.refreshFormatState();
  }

  private historyCleanup: Unregister | undefined;

  // ── focus and state ──────────────────────────────────────────────────────

  focus(position: 'start' | 'end' | 'restore' = 'restore'): void {
    this.editor.focus(
      () => {
        this.focused = true;
      },
      { defaultSelection: position === 'start' ? 'rootStart' : 'rootEnd' },
    );
    // Lexical focuses by writing the selection into the DOM, and a browser moves
    // focus along with it. Asking the element directly makes that explicit, so the
    // editor is the active element — and the focus event fires — even where placing
    // a selection does not imply focus.
    if (typeof document !== 'undefined' && document.activeElement !== this.contentElement) {
      this.contentElement.focus({ preventScroll: true });
    }
    if (position === 'restore' && this.lastSelection) {
      this.editor.update(() => {
        $applySelection(this.lastSelection!);
      });
    }
  }

  blur(): void {
    this.editor.blur();
    this.editor.update(() => {
      $setSelection(null);
    });
    this.focused = false;
  }

  hasFocus(): boolean {
    if (typeof document === 'undefined') return this.focused;
    return this.focused || document.activeElement === this.contentElement;
  }

  setEditable(editable: boolean): void {
    this.editor.setEditable(editable);
    this.contentElement.setAttribute('contenteditable', String(editable));
  }

  isEditable(): boolean {
    return this.editor.isEditable();
  }

  // ── events and teardown ──────────────────────────────────────────────────

  on<K extends keyof EngineEvents>(event: K, cb: EngineEvents[K]): Unregister {
    return this.emitter.on(event, cb);
  }

  get native(): unknown {
    return this.editor;
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.historyCleanup?.();
    for (const cleanup of this.cleanups.splice(0)) cleanup();
    this.emitter.clear();
    this.editor.setRootElement(null);
    this.contentElement.remove();
  }

  /** True when the caret sits inside a collapsed range. Used by the paste pipeline. */
  isCollapsed(): boolean {
    return this.editor.getEditorState().read(() => {
      const selection = $getSelection();
      return $isRangeSelection(selection) ? selection.isCollapsed() : true;
    });
  }
}

/**
 * The default engine adapter.
 *
 * @example
 * ```tsx
 * import { lexicalEngine } from 'react-rtekit/engines/lexical';
 * <RichTextEditor engine={lexicalEngine} />
 * ```
 */
export const lexicalEngine: EditorEngine = {
  id: 'lexical',
  mount(container: HTMLElement, options: EngineMountOptions): EngineHandle {
    return new LexicalEngineHandle(container, options);
  },
};
