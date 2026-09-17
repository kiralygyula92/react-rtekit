import type { EditorSnapshot } from '../types/editor.js';
import { emptyFormatState } from '../core/format-state.js';

/**
 * The subscription store behind `useEditorState`.
 *
 * Derived state lives in one immutable snapshot and components subscribe with a
 * selector, so a toolbar button re-renders only when the piece of state it reads
 * actually changes. That is what keeps typing from re-rendering the whole editor tree
 * (fixes R26).
 *
 * @module
 */

/** The initial snapshot, before the engine has mounted. */
export function createInitialSnapshot(): EditorSnapshot {
  return {
    format: emptyFormatState(),
    selection: null,
    focused: false,
    editable: true,
    empty: true,
    length: 0,
    wordCount: 0,
    fullscreen: false,
    sourceView: false,
    uploads: [],
    error: null,
    revision: 0,
  };
}

/** A tiny external store, compatible with `useSyncExternalStore`. */
export class EditorStore {
  private snapshot: EditorSnapshot = createInitialSnapshot();
  private readonly listeners = new Set<() => void>();

  /** Registers a listener and returns its unsubscribe function. */
  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /** The current snapshot. Stable between notifications, so selectors can memoize. */
  readonly getSnapshot = (): EditorSnapshot => this.snapshot;

  /**
   * Shallow-merges a patch and notifies subscribers.
   *
   * A patch that changes nothing is dropped, so an engine event that happens not to
   * move any state costs no renders at all.
   */
  update(patch: Partial<EditorSnapshot>, options: { bumpRevision?: boolean } = {}): void {
    let changed = options.bumpRevision === true;
    for (const [key, value] of Object.entries(patch) as [keyof EditorSnapshot, unknown][]) {
      if (!Object.is(this.snapshot[key], value)) {
        changed = true;
        break;
      }
    }
    if (!changed) return;

    this.snapshot = {
      ...this.snapshot,
      ...patch,
      revision: options.bumpRevision === true ? this.snapshot.revision + 1 : this.snapshot.revision,
    };
    for (const listener of [...this.listeners]) listener();
  }

  /** Drops every listener. Called when the editor is destroyed. */
  clear(): void {
    this.listeners.clear();
  }
}
