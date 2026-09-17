import { useCallback, useDebugValue, useRef, useSyncExternalStore } from 'react';
import type { CountUnit } from '../types/common.js';
import type { CommandId, CommandPayload } from '../types/commands.js';
import type { EditorSnapshot, UploadState } from '../types/editor.js';
import type { FormatState } from '../types/selection.js';
import { useEditorContext, useEditorStore } from './context.js';
import { getRuntime } from './runtime.js';

/**
 * Subscription hooks (04 §5).
 *
 * Every hook here subscribes through one selector, so a component re-renders only when
 * the slice it reads changes. Toolbar buttons use `useCommand`, which is why typing
 * does not re-render the toolbar (02 §5).
 *
 * @module
 */

/**
 * Subscribes to a slice of editor state.
 *
 * @param selector picks the slice; keep it cheap and referentially stable
 * @param isEqual compares the previous and next slice; defaults to `Object.is`
 *
 * @example
 * ```tsx
 * const isBold = useEditorState((state) => state.format.marks.bold);
 * ```
 */
export function useEditorState<T>(
  selector: (snapshot: EditorSnapshot) => T,
  isEqual: (a: T, b: T) => boolean = Object.is,
): T {
  const store = useEditorStore();
  // The selected value is cached so `useSyncExternalStore` sees a stable reference
  // whenever `isEqual` says nothing changed; otherwise React would loop on any
  // selector that builds an object.
  const cache = useRef<{ snapshot: EditorSnapshot; value: T } | null>(null);

  const getSelection = useCallback(() => {
    const snapshot = store.getSnapshot();
    const cached = cache.current;
    if (cached?.snapshot === snapshot) return cached.value;
    const next = selector(snapshot);
    if (cached && isEqual(cached.value, next)) {
      cache.current = { snapshot, value: cached.value };
      return cached.value;
    }
    cache.current = { snapshot, value: next };
    return next;
  }, [isEqual, selector, store]);

  const value = useSyncExternalStore(store.subscribe, getSelection, getSelection);
  useDebugValue(value);
  return value;
}

/** Shallow comparison for the object-returning selectors below. */
function shallowEqual<T extends object>(a: T, b: T): boolean {
  if (Object.is(a, b)) return true;
  const keys = Object.keys(a) as (keyof T)[];
  if (keys.length !== Object.keys(b).length) return false;
  return keys.every((key) => Object.is(a[key], b[key]));
}

const selectFormat = (snapshot: EditorSnapshot): FormatState => snapshot.format;

/**
 * The formatting that applies to the current selection.
 *
 * @example
 * ```tsx
 * const { marks, block, list } = useFormatState();
 * ```
 */
export function useFormatState(): FormatState {
  return useEditorState(selectFormat);
}

/** What {@link useCommand} returns. */
export interface CommandBinding {
  /** Runs the command. */
  exec: () => boolean;
  /** False when the command cannot run right now, e.g. `undo` with an empty stack. */
  canExec: boolean;
  /** True when the command's formatting is already applied at the selection. */
  isActive: boolean;
}

/**
 * Binds a toolbar control to a command.
 *
 * @example
 * ```tsx
 * const bold = useCommand('toggleBold');
 * <button aria-pressed={bold.isActive} onMouseDown={(e) => e.preventDefault()} onClick={bold.exec} />
 * ```
 */
export function useCommand<Id extends CommandId>(
  id: Id,
  payload?: CommandPayload<Id>,
): CommandBinding {
  const editor = useEditorContext();
  const state = useEditorState(
    useCallback(
      (): { canExec: boolean; isActive: boolean } => ({
        canExec: editor.canExec(id, payload),
        isActive: editor.isActive(id, payload),
      }),
      [editor, id, payload],
    ),
    shallowEqual,
  );

  const exec = useCallback(() => editor.exec(id, payload), [editor, id, payload]);
  return { exec, canExec: state.canExec, isActive: state.isActive };
}

const selectEmpty = (snapshot: EditorSnapshot): boolean => snapshot.empty;

/** True when the editor holds nothing a reader would see (fixes R2). */
export function useIsEmpty(): boolean {
  return useEditorState(selectEmpty);
}

/**
 * The live character or word count.
 *
 * Counts text, never markup (fixes R3).
 */
export function useCharacterCount(unit: CountUnit = 'characters'): number {
  return useEditorState(
    useCallback(
      (snapshot: EditorSnapshot) => (unit === 'words' ? snapshot.wordCount : snapshot.length),
      [unit],
    ),
  );
}

const selectUploads = (snapshot: EditorSnapshot): UploadState[] => snapshot.uploads;

/** What {@link useUpload} returns. */
export interface UploadBinding {
  /** Runs files through the upload handler and inserts the results. */
  upload: (files: File[]) => Promise<void>;
  /** Every in-flight and recently finished upload. */
  uploads: UploadState[];
}

/** In-flight uploads plus the function that starts one (05 §7). */
export function useUpload(): UploadBinding {
  const editor = useEditorContext();
  const uploads = useEditorState(selectUploads);
  const upload = useCallback((files: File[]) => editor.uploadFiles(files), [editor]);
  return { upload, uploads };
}

const selectFocused = (snapshot: EditorSnapshot): boolean => snapshot.focused;

/** True while the editor has focus. Drives `:focus-within` styling (fixes R9). */
export function useIsFocused(): boolean {
  return useEditorState(selectFocused);
}

const selectError = (snapshot: EditorSnapshot): string | null => snapshot.error;

/** The current validation message, or `null`. */
export function useValidationError(): string | null {
  return useEditorState(selectError);
}

/**
 * True once the engine has mounted.
 *
 * Anything that calls the imperative API from an effect needs this: the chrome renders
 * before the engine exists — the content element is a callback ref, so mounting only
 * happens on the second pass — and `registerCommand` on an unmounted editor throws.
 *
 * Mounting sets a ref, which re-renders nothing, so this subscribes to the `ready`
 * event as well as to the store. A caller that only watched the store would work
 * inside `<RichTextEditor>`, where the chrome re-renders around it, and silently fail
 * under `<Rte.Root>`, where the children are elements the root does not re-create.
 */
export function useEditorReady(): boolean {
  const editor = useEditorContext();
  const store = useEditorStore();
  const isMounted = getRuntime(editor).isMounted;

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const offReady = editor.on('ready', onStoreChange);
      const offStore = store.subscribe(onStoreChange);
      return () => {
        offReady();
        offStore();
      };
    },
    [editor, store],
  );

  return useSyncExternalStore(subscribe, isMounted, isMounted);
}
