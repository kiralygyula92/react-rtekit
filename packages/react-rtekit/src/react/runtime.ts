import type { EditorInstance } from '../types/editor.js';
import type { EditorStore } from './store.js';

/**
 * The private bridge between `useEditor` and the components that render it.
 *
 * `useEditor` returns an {@link EditorInstance} — the documented public shape — but
 * `<Rte.Content>` also needs the container callback and the subscription store. Rather
 * than widening the public type, the runtime is attached under a symbol, which keeps it
 * out of the API surface, out of TSDoc and out of anything a consumer can depend on.
 *
 * @module
 */

const RUNTIME = Symbol.for('react-rtekit.runtime');

/** What the React components need beyond the public instance. @internal */
export interface EditorRuntime {
  store: EditorStore;
  /** Callback ref for the element the engine mounts into. */
  attachContent: (container: HTMLElement | null) => void;
  /** True once the engine has mounted. */
  isMounted: () => boolean;
  /**
   * Sets attributes on the contenteditable element the engine created.
   *
   * The engine owns that element, and child effects run before parent ones, so
   * `<Rte.Content>` cannot reach it directly on the first pass. Attributes are stored
   * and applied as soon as the engine mounts, and again whenever they change.
   */
  setContentAttributes: (attributes: Record<string, string | null>) => void;
  /** Ids derived from the instance id, so several editors never collide (fixes R4). */
  ids: {
    root: string;
    content: string;
    label: string;
    helper: string;
    error: string;
    counter: string;
    announcer: string;
  };
  /**
   * Installs the autosave chrome's save and clear functions.
   *
   * `editor.saveDraft()` and `editor.clearDraft()` are public API, but the storage,
   * the debounce and the key live in the autosave chrome, which mounts later.
   */
  setDraftHandlers: (handlers: { save: () => void; clear: () => void } | null) => void;
  /** Pushes a message into the polite live region. */
  announce: (message: string) => void;
}

/** Attaches the runtime to an instance. @internal */
export function setRuntime(editor: EditorInstance, runtime: EditorRuntime): void {
  Object.defineProperty(editor, RUNTIME, {
    value: runtime,
    enumerable: false,
    writable: false,
    configurable: true,
  });
}

/**
 * Reads the runtime off an instance.
 *
 * @throws when the instance did not come from `useEditor`.
 * @internal
 */
export function getRuntime(editor: EditorInstance): EditorRuntime {
  const runtime = (editor as unknown as Record<symbol, EditorRuntime | undefined>)[RUNTIME];
  if (!runtime) {
    throw new Error('This editor instance was not created by useEditor().');
  }
  return runtime;
}
