import { useCallback, useEffect, useRef, useState } from 'react';
import type { AutosaveConfig } from '../../types/config.js';
import type { DraftContext, RteHandlers } from '../../types/handlers.js';
import type { EditorValue } from '../../types/common.js';
import { useEditorContext, useLocalization, useRteSlots } from '../context.js';
import { useEditorState } from '../hooks.js';
import { getRuntime } from '../runtime.js';
import { runHandler } from '../useEditor.js';
import { resolveMessage } from '../localization.js';

/**
 * Fullscreen, printing and autosave.
 *
 * Three small pieces of chrome that share one property: they are all about the
 * editor's relationship with the page around it rather than with its content.
 *
 * @module
 */

/** Props for {@link FullscreenUi}. */
export interface FullscreenUiProps {
  /** Controlled fullscreen, when the consumer owns the state. */
  fullscreen?: boolean;
}

/**
 * Fullscreen mode.
 *
 * The root element is promoted in place rather than moved into a portal: moving it
 * would unmount the engine's content element and lose the selection, the undo stack
 * and every listener attached to it.
 */
export function FullscreenUi({ fullscreen }: FullscreenUiProps) {
  const editor = useEditorContext();
  const active = useEditorState((snapshot) => snapshot.fullscreen);

  // A controlled prop wins over the internal state, as everywhere else.
  useEffect(() => {
    if (fullscreen === undefined || fullscreen === active) return;
    editor.setFullscreen(fullscreen);
  }, [active, editor, fullscreen]);

  useEffect(
    () =>
      editor.registerCommand('toggleFullscreen', (_ctx, next) => {
        editor.setFullscreen(!editor.isFullscreen());
        next();
        return true;
      }),
    [editor],
  );

  // Scroll lock and Escape belong to whichever element is actually fullscreen.
  useEffect(() => {
    if (!active) return;
    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      editor.setFullscreen(false);
      editor.focus('restore');
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [active, editor]);

  return null;
}

/**
 * Printing.
 *
 * Prints the content, not the page: the editor's chrome, the surrounding form and the
 * site's navigation are all irrelevant to what the author wants on paper. A hidden
 * frame carrying the content stylesheet is the one approach that works without
 * touching the host page's styles.
 */
export function PrintUi() {
  const editor = useEditorContext();

  useEffect(
    () =>
      editor.registerCommand('print', (_ctx, next) => {
        const frame = document.createElement('iframe');
        frame.setAttribute('aria-hidden', 'true');
        frame.style.position = 'fixed';
        frame.style.inset = '0';
        frame.style.width = '0';
        frame.style.height = '0';
        frame.style.border = '0';
        document.body.appendChild(frame);

        const doc = frame.contentDocument;
        if (!doc) {
          frame.remove();
          return true;
        }

        // The content styles come from the page, so what prints matches what the
        // author was looking at.
        const styles = [...document.querySelectorAll('link[rel="stylesheet"], style')]
          .map((node) => node.outerHTML)
          .join('');
        // Built node by node rather than with `document.write`, which is deprecated
        // and which browsers treat differently inside a same-origin frame.
        doc.head.innerHTML = `<meta charset="utf-8">${styles}`;
        doc.body.className = 'rte-print';
        const view = doc.createElement('div');
        view.className = 'rte-view';
        view.innerHTML = editor.getHTML();
        doc.body.appendChild(view);

        frame.contentWindow?.focus();
        frame.contentWindow?.print();
        // Removing it synchronously cancels the dialog in some browsers.
        setTimeout(() => {
          frame.remove();
        }, 1000);

        next();
        return true;
      }),
    [editor],
  );

  return null;
}

/** Props for {@link AutosaveUi}. */
export interface AutosaveUiProps {
  config: AutosaveConfig;
  /** Interaction middleware. */
  handlers?: Partial<RteHandlers>;
}

/** A stored draft, with the metadata the restore prompt shows. */
interface StoredDraft {
  value: EditorValue;
  savedAt: number;
}

/** Reads a draft, tolerating blocked storage and anything that is not one. */
function readDraft(storage: Storage | null, key: string): StoredDraft | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredDraft;
    return typeof parsed.savedAt === 'number' ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Autosave and drafts.
 *
 * The draft is written on a debounce and read once on mount. Restoring is a prompt
 * rather than a silent overwrite: content appearing out of nowhere is alarming, and
 * the draft may well be older than what the server just sent.
 */
export function AutosaveUi({ config, handlers }: AutosaveUiProps) {
  const editor = useEditorContext();
  const t = useLocalization();
  const { slots } = useRteSlots();
  const revision = useEditorState((snapshot) => snapshot.revision);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** The draft question is asked once, however many times this re-renders. */
  const decided = useRef(false);

  const storageKey = `rte-draft:${config.key}`;
  const storage = config.storage ?? (typeof localStorage === 'undefined' ? null : localStorage);

  /**
   * The stored draft, read once during the first render.
   *
   * Reading it in an effect instead would mean rendering the editor, then rendering
   * it again with a prompt — a flash of the wrong state for something already
   * known before the first paint.
   */
  const [pending, setPending] = useState<StoredDraft | null>(() => readDraft(storage, storageKey));

  const save = useCallback(() => {
    if (!storage) return;
    const value = config.serialize === 'html' ? editor.getHTML() : editor.getJSON();
    const draft: StoredDraft = { value, savedAt: Date.now() };

    runHandler<DraftContext>(handlers?.onDraftSave, { editor, draft }, (ctx) => {
      try {
        storage.setItem(storageKey, JSON.stringify(ctx.draft));
      } catch {
        // A full or blocked storage is not worth breaking editing over.
      }
    });
  }, [config.serialize, editor, handlers?.onDraftSave, storage, storageKey]);

  const clear = useCallback(() => {
    try {
      storage?.removeItem(storageKey);
    } catch {
      // Same: clearing is best-effort.
    }
  }, [storage, storageKey]);

  // `editor.saveDraft()` and `editor.clearDraft()` are public API; this is where they
  // get their behaviour.
  useEffect(() => {
    getRuntime(editor).setDraftHandlers({ save, clear });
    return () => {
      getRuntime(editor).setDraftHandlers(null);
    };
  }, [clear, editor, save]);

  // Debounced save on every change.
  useEffect(() => {
    if (revision === 0) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(save, config.debounceMs ?? 1000);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [config.debounceMs, revision, save]);

  // Decide what to do with that draft once, after the engine has mounted: an
  // expired one is dropped, a vetoed one is dropped, and `restorePrompt: false`
  // restores without asking. It runs once — `decided` guards it — so the state
  // update it may make is a single transition, not a cascade.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!pending || decided.current) return;
    decided.current = true;

    const expired = config.ttlMs !== undefined && Date.now() - pending.savedAt > config.ttlMs;
    const vetoed = config.onRestore?.(pending.value, { savedAt: pending.savedAt }) === false;
    if (expired || vetoed) {
      clear();
      setPending(null);
      return;
    }
    if (config.restorePrompt === false) {
      editor.setContent(pending.value, { source: 'api' });
      editor.announce(resolveMessage(t.announce.draftRestored));
      setPending(null);
    }
  }, [clear, config, editor, pending, t.announce.draftRestored]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!pending) return null;

  const RestoreDraftPrompt = slots.RestoreDraftPrompt;
  return (
    <RestoreDraftPrompt
      savedAt={pending.savedAt}
      restore={() => {
        runHandler<DraftContext>(handlers?.onDraftRestore, { editor, draft: pending }, (ctx) => {
          editor.setContent(ctx.draft.value, { source: 'api' });
          editor.announce(resolveMessage(t.announce.draftRestored));
        });
        setPending(null);
      }}
      discard={() => {
        clear();
        setPending(null);
      }}
    />
  );
}
