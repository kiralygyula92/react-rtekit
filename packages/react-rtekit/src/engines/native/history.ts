import type { EditorDocument } from '../../types/document.js';
import type { EditorSelection } from '../../types/selection.js';

/**
 * Undo — stage 6 of ADR-006.
 *
 * The thing that makes an undo stack feel right is not the stack, it is the coalescing:
 * a typed sentence has to come back as one entry, not as forty. So entries record *why*
 * they were made, and two adjacent typing entries inside the grouping window merge into
 * one. A format change, a paste or a block change always starts a new entry, because
 * those are the boundaries a user thinks in.
 *
 * Whole documents are stored rather than diffs. A reversible-operation log would be
 * smaller, but it has to be right about the inverse of every operation, and a wrong
 * inverse silently corrupts the document several steps later. Documents are plain data,
 * bounded by `limit`, and cannot be wrong.
 *
 * @module
 */

/** What caused an entry, which is what decides whether two of them merge. */
export type HistoryCause = 'typing' | 'deleting' | 'format' | 'structure' | 'paste' | 'api';

/** One point the editor can be returned to. */
export interface HistoryEntry {
  readonly document: EditorDocument;
  readonly selection: EditorSelection | null;
  readonly cause: HistoryCause;
  readonly at: number;
}

/** How the stack behaves. */
export interface HistoryOptions {
  /** How long two entries of the same cause may be apart and still merge, in ms. */
  groupMs?: number;
  /** How many entries to keep before dropping the oldest. */
  limit?: number;
  /** The clock, so tests are not at the mercy of timing. */
  now?: () => number;
}

/** Only these merge: a format change is a boundary a user expects to step back to. */
const MERGEABLE = new Set<HistoryCause>(['typing', 'deleting']);

/**
 * An undo stack with coalescing.
 *
 * `push` records a new state. `undo` and `redo` return the state to move to, or `null`
 * when there is nowhere to go — the caller applies it, because this class knows nothing
 * about trees or the DOM.
 */
export class History {
  #entries: HistoryEntry[] = [];
  /** Index of the entry the editor is currently showing. */
  #at = -1;
  readonly #groupMs: number;
  readonly #limit: number;
  readonly #now: () => number;

  constructor(options: HistoryOptions = {}) {
    this.#groupMs = options.groupMs ?? 300;
    this.#limit = Math.max(1, options.limit ?? 200);
    this.#now = options.now ?? (() => Date.now());
  }

  /** The state the editor is showing, or `null` before anything was recorded. */
  get current(): HistoryEntry | null {
    return this.#entries[this.#at] ?? null;
  }

  /** How many entries are held, for tests and for a debug panel. */
  get size(): number {
    return this.#entries.length;
  }

  canUndo(): boolean {
    return this.#at > 0;
  }

  canRedo(): boolean {
    return this.#at < this.#entries.length - 1;
  }

  /**
   * Records a state.
   *
   * The first push is the baseline: it is what the first undo returns to, and on its own
   * it leaves `canUndo` false, so freshly loaded content cannot be undone away.
   */
  push(
    document: EditorDocument,
    selection: EditorSelection | null,
    cause: HistoryCause = 'api',
  ): void {
    const at = this.#now();
    const previous = this.current;

    // A redo branch that is no longer reachable: once the user edits after undoing,
    // the future they undid out of is gone.
    if (this.#at < this.#entries.length - 1) this.#entries.length = this.#at + 1;

    if (
      previous !== null &&
      MERGEABLE.has(cause) &&
      previous.cause === cause &&
      at - previous.at <= this.#groupMs
    ) {
      // Merge: the entry keeps its original timestamp, so a continuous stream of typing
      // does not coalesce for ever — the window is measured from where the run started.
      this.#entries[this.#at] = { document, selection, cause, at: previous.at };
      return;
    }

    this.#entries.push({ document, selection, cause, at });
    if (this.#entries.length > this.#limit) this.#entries.shift();
    this.#at = this.#entries.length - 1;
  }

  /** Steps back, returning the state to apply, or `null` if there is none. */
  undo(): HistoryEntry | null {
    if (!this.canUndo()) return null;
    this.#at -= 1;
    return this.#entries[this.#at] ?? null;
  }

  /** Steps forward, returning the state to apply, or `null` if there is none. */
  redo(): HistoryEntry | null {
    if (!this.canRedo()) return null;
    this.#at += 1;
    return this.#entries[this.#at] ?? null;
  }

  /**
   * Drops everything before the current state.
   *
   * What `setContent` calls when it loads a document: the content that has just arrived
   * should not be undoable, because there is nothing sensible to undo *to*.
   */
  reset(document?: EditorDocument, selection: EditorSelection | null = null): void {
    const baseline = document ?? this.current?.document;
    this.#entries = [];
    this.#at = -1;
    if (baseline !== undefined) {
      this.#entries.push({ document: baseline, selection, cause: 'api', at: this.#now() });
      this.#at = 0;
    }
  }
}
