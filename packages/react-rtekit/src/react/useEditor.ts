import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type {
  ChangeMeta,
  EditorEvents,
  EditorInstance,
  FindOptions,
  FindResult,
  SetContentOptions,
  InsertOptions,
  UploadState,
} from '../types/editor.js';
import type { CommandHandler, CommandId, CommandPayload, ImageAttrs, TableOptions } from '../types/commands.js';
import type {
  DropHandlerContext,
  FocusHandlerContext,
  KeyDownContext,
  OpenStateContext,
  PasteHandlerContext,
  SanitizeViolationContext,
  SelectionChangeContext,
  UploadErrorContext,
  UploadStartContext,
} from '../types/handlers.js';
import type { ChangeSource, ContentWarning, CountUnit, EditorValue, Unregister } from '../types/common.js';
import type { EditorDocument } from '../types/document.js';
import type { EditorSelection, FormatState, LinkAttrs, SelectionSnapshot } from '../types/selection.js';
import type { EngineHandle } from '../types/engine.js';
import type { SerializeOptions } from '../types/interop.js';
import type { UseEditorOptions } from '../types/props.js';
import type { RteHandlers } from '../types/handlers.js';
import {
  collectMergeTags,
  countDocument,
  createEmptyDocument,
  documentToText,
  isEditorDocument,
  isEmptyDocument,
} from '../core/document.js';
import { documentToHtml } from '../core/serialize/to-html.js';
import { htmlToDocument } from '../core/serialize/from-html.js';
import { documentToMarkdown } from '../core/serialize/markdown.js';
import { plainTextAlternative } from '../core/serialize/text.js';
import { createFeatureSet } from '../core/schema.js';
import { findMatches, replaceMatches } from '../core/find.js';
import { detectOfficeSource } from '../core/interop/office.js';
import { looksLikeQuill } from '../core/interop/quill.js';
import { buildKeymap, findKeymapMatch, payloadForShortcut } from '../core/utils/keymap.js';
import { nativeEngine } from '../engines/native/engine.js';
import { EditorStore } from './store.js';
import { setRuntime, type EditorRuntime } from './runtime.js';
import { useLocalization } from './context.js';
import { resolveMessage } from './localization.js';

/**
 * The headless editor.
 *
 * Creates the engine, owns the derived-state store, and exposes the documented
 * {@link EditorInstance}. `<RichTextEditor>` uses this internally; consumers who want
 * their own UI use it directly.
 *
 * @module
 */

/** Runs a middleware chain, ending in the built-in behaviour. */
function runHandler<Ctx extends object>(
  handler: ((ctx: Ctx, next: (override?: Partial<Ctx>) => void) => void | Promise<void>) | undefined,
  ctx: Ctx,
  fallback: (ctx: Ctx) => void,
): void {
  if (!handler) {
    fallback(ctx);
    return;
  }
  // Not calling `next` cancels the default behaviour, which is the documented way to
  // veto an interaction. The promise is not awaited: an async handler that
  // calls `next` later still reaches the fallback.
  void handler(ctx, (override) => {
    fallback(override ? { ...ctx, ...override } : ctx);
  });
}

/** Where a pasted payload came from, for the middleware context. */
function detectSource(html: string): PasteHandlerContext['source'] {
  if (html === '') return 'plain';
  if (html.includes('data-rtekit')) return 'rtekit';
  const office = detectOfficeSource(html);
  if (office) return office;
  if (looksLikeQuill(html)) return 'quill';
  return 'unknown';
}

/**
 * Removes inline styles and classes, for `pasteMode: 'clean'`.
 *
 * Structure is kept — paragraphs, lists, links and the semantic marks all survive —
 * and only the source's own look is dropped, which is what "paste without formatting"
 * means to an author who still wants their bullet list.
 */
function stripInlineStyles(html: string): string {
  return html.replace(/\s(?:style|class|align|bgcolor|face|color)="[^"]*"/gi, '');
}

/** Default upload ceiling: 5 MB. */
const DEFAULT_MAX_UPLOAD_SIZE = 5 * 1024 * 1024;

/**
 * Checks a file against `uploadAccept` and `maxUploadSize`.
 *
 * Returns the reason it was refused, or `null` when it is acceptable.
 */
/**
 * Reads a file into a `data:` URL.
 *
 * Used when there is no `onUpload` to send it to, so the only place the bytes can live
 * is the document itself.
 */
function readAsDataUrl(file: File, signal: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const onAbort = (): void => {
      reader.abort();
    };
    signal.addEventListener('abort', onAbort);
    const done = (): void => {
      signal.removeEventListener('abort', onAbort);
    };
    reader.onload = () => {
      done();
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error(`"${file.name}" could not be read`));
    };
    reader.onerror = () => {
      done();
      reject(reader.error ?? new Error(`"${file.name}" could not be read`));
    };
    reader.onabort = () => {
      done();
      reject(new Error(`Reading "${file.name}" was cancelled`));
    };
    reader.readAsDataURL(file);
  });
}

function checkUploadable(file: File, options: UseEditorOptions): string | null {
  const max = options.maxUploadSize ?? DEFAULT_MAX_UPLOAD_SIZE;
  if (file.size > max) {
    return `"${file.name}" is larger than the ${Math.round(max / 1024 / 1024)} MB limit`;
  }

  const accept = options.uploadAccept ?? 'image/*';
  const patterns = accept.split(',').map((entry) => entry.trim().toLowerCase()).filter(Boolean);
  if (patterns.length === 0) return null;

  const type = file.type.toLowerCase();
  const extension = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}`;
  const allowed = patterns.some((pattern) => {
    if (pattern === '*/*' || pattern === '*') return true;
    if (pattern.startsWith('.')) return pattern === extension;
    if (pattern.endsWith('/*')) return type.startsWith(pattern.slice(0, -1));
    return pattern === type;
  });
  return allowed ? null : `"${file.name}" is not an accepted file type`;
}

/** The features a set of options enables, for the schema downgrade. */
function resolveFeatures(options: UseEditorOptions): ReadonlySet<string> {
  const enabled: string[] = [];
  const flag = (value: boolean | undefined, ...features: string[]): void => {
    if (value !== false) enabled.push(...features);
  };
  // Milestone 2 derives this from the resolved plugin list. Until the presets exist,
  // every feature the schema knows is on unless a flag explicitly turns it off.
  flag(options.enableBold, 'bold');
  flag(options.enableItalic, 'italic');
  flag(options.enableUnderline, 'underline');
  flag(options.enableStrike, 'strike');
  flag(options.enableCode, 'code');
  flag(options.enableSubSup, 'subscript', 'superscript');
  flag(options.enableColor, 'color');
  flag(options.enableBackgroundColor, 'backgroundColor');
  flag(options.enableFontFamily, 'fontFamily');
  flag(options.enableFontSize, 'fontSize');
  flag(options.enableHeadings, 'heading');
  flag(options.enableAlign, 'align');
  flag(options.enableIndent, 'indent');
  flag(options.enableLists, 'list');
  flag(options.enableCheckList, 'checkList');
  flag(options.enableBlockquote, 'blockquote');
  flag(options.enableCodeBlock, 'codeBlock');
  flag(options.enableLinks, 'link');
  flag(options.enableImages, 'image');
  flag(options.enableTables, 'table');
  flag(options.enableHorizontalRule, 'horizontalRule');
  flag(options.enableEmoji, 'emoji');
  flag(options.enableMentions, 'mention');
  flag(options.enableMergeTags, 'mergeTag');
  return createFeatureSet(enabled);
}

/**
 * Creates an editor.
 *
 * @example
 * ```tsx
 * const editor = useEditor({ defaultValue: '<p>Hi</p>', valueFormat: 'html' });
 * return <Rte.Root editor={editor}><Rte.Content /></Rte.Root>;
 * ```
 */
export function useEditor(options: UseEditorOptions): EditorInstance {
  const reactId = useId();
  const instanceId = useMemo(() => `rte-${reactId.replace(/[:«»]/g, '')}`, [reactId]);

  const [store] = useState(() => new EditorStore());
  const engineRef = useRef<EngineHandle | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);
  const announcerRef = useRef<HTMLElement | null>(null);
  const uploadsRef = useRef<UploadState[]>([]);
  const cleanupsRef = useRef<Unregister[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** The value most recently handed to `onChange`, for controlled-mode diffing. */
  const lastEmittedRef = useRef<string | null>(null);
  /** The instance, for callbacks created before it exists. */
  const instanceRef = useRef<EditorInstance | null>(null);
  /** Installed by the autosave chrome; `null` when autosave is off. */
  const draftRef = useRef<{ save: () => void; clear: () => void } | null>(null);
  /** Attributes `<Rte.Content>` wants on the engine's contenteditable element. */
  const contentAttributesRef = useRef<Record<string, string | null>>({});
  const localization = useLocalization();

  // Options change on every render; a ref keeps the engine callbacks stable without
  // stale closures.
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const localizationRef = useRef(localization);
  localizationRef.current = localization;

  const valueFormat = options.valueFormat ?? 'html';

  // ── serialization closures handed to the engine ─────────────────────────
  const parseHtml = useCallback((html: string): EditorDocument => {
    const current = optionsRef.current;
    const warnings: ContentWarning[] = [];
    const doc = htmlToDocument(html, {
      sanitize: current.sanitize ?? 'standard',
      ...(current.interop ? { interop: current.interop } : {}),
      features: resolveFeatures(current),
      mergeTags: {
        ...(current.mergeTags?.syntax ? { syntax: current.mergeTags.syntax } : {}),
        parseOnInput: current.mergeTags?.parseOnInput ?? current.mergeTags !== undefined,
        knownKeys: current.mergeTags?.tags.map((tag) => tag.key) ?? [],
        labels: Object.fromEntries(
          (current.mergeTags?.tags ?? []).map((tag) => [tag.key, tag.label ?? tag.key]),
        ),
      },
      onWarning: (warning) => {
        warnings.push(warning);
      },
      // Every removal is a chance for a consumer to notice that content is being
      // refused — a security log, a metric, a message to the author.
      onViolation: (violation) => {
        const editor = instanceRef.current;
        if (!editor) return;
        runHandler<SanitizeViolationContext>(
          current.handlers?.onSanitizeViolation,
          { editor, violation },
          () => {
            // The built-in behaviour is the removal itself, which has already
            // happened by the time this runs.
          },
        );
      },
    });
    if (warnings.length > 0) current.onContentWarning?.(warnings);
    return doc;
  }, []);

  const serializeHtml = useCallback((doc: EditorDocument, serializeOptions?: SerializeOptions): string => {
    const current = optionsRef.current;
    return documentToHtml(doc, {
      profile: serializeOptions?.profile ?? current.htmlProfile ?? 'standard',
      ...(serializeOptions?.email ?? current.emailOptions
        ? { email: serializeOptions?.email ?? current.emailOptions }
        : {}),
      ...(serializeOptions?.mergeTagPreview ? { mergeTagPreview: serializeOptions.mergeTagPreview } : {}),
      ...(serializeOptions?.pretty !== undefined ? { pretty: serializeOptions.pretty } : {}),
      sanitizeWith:
        (serializeOptions?.sanitize ?? current.sanitizeOutput ?? true)
          ? (current.sanitize ?? 'standard')
          : false,
    });
  }, []);

  // ── the instance ─────────────────────────────────────────────────────────
  const listenersRef = useRef(new Map<keyof EditorEvents, Set<(...args: never[]) => void>>());

  const emit = useCallback(<K extends keyof EditorEvents>(event: K, ...args: Parameters<EditorEvents[K]>) => {
    const set = listenersRef.current.get(event);
    if (!set) return;
    for (const listener of [...set]) (listener as (...a: unknown[]) => void)(...args);
  }, []);

  const requireEngine = useCallback((): EngineHandle => {
    const engine = engineRef.current;
    if (!engine) {
      throw new Error(
        'The editor is not mounted yet. Wait for onReady, or render <Rte.Content /> before calling this.',
      );
    }
    return engine;
  }, []);

  /** Reads the current document, or an empty one before the engine mounts. */
  const readDocument = useCallback(
    (): EditorDocument => engineRef.current?.getJSON() ?? createEmptyDocument(),
    [],
  );

  const getValue = useCallback((): EditorValue => {
    const engine = engineRef.current;
    if (!engine) return valueFormat === 'json' ? createEmptyDocument() : '';
    switch (valueFormat) {
      case 'json':
        return engine.getJSON();
      case 'markdown':
        return engine.getMarkdown();
      case 'text':
        return engine.getText();
      default:
        return engine.getHTML();
    }
  }, [valueFormat]);

  const buildMeta = useCallback(
    (source: ChangeSource): ChangeMeta => {
      const doc = readDocument();
      const countUnit: CountUnit = optionsRef.current.countUnit ?? 'characters';
      const lengthMode = optionsRef.current.mergeTags?.lengthMode ?? 'label';
      return {
        source,
        isEmpty: isEmptyDocument(doc),
        length: countDocument(doc, countUnit, lengthMode),
        wordCount: countDocument(doc, 'words', lengthMode),
        // Lazy by contract; the document is already built here, so reading it
        // is free and the getter keeps the documented shape.
        get document(): EditorDocument {
          return doc;
        },
      };
    },
    [readDocument],
  );

  const validate = useCallback((): string | null => {
    const current = optionsRef.current;
    const t = localizationRef.current;
    const doc = readDocument();
    const empty = isEmptyDocument(doc);
    const countUnit: CountUnit = current.countUnit ?? 'characters';
    const length = countDocument(doc, countUnit, current.mergeTags?.lengthMode ?? 'label');

    // `isEmpty()` rather than string truthiness, so `<p><br></p>` fails (fixes R2).
    if (current.required === true && empty) return resolveMessage(t.validation.required);
    if (current.maxLength !== undefined && length > current.maxLength) {
      return resolveMessage(t.validation.maxLength, { max: current.maxLength, count: length });
    }
    if (current.validate) {
      return current.validate({
        value: getValue(),
        text: documentToText(doc),
        isEmpty: empty,
        length,
        document: doc,
      });
    }
    return null;
  }, [getValue, readDocument]);

  const instance = useMemo<EditorInstance>(() => {
    const api: EditorInstance = {
      // ── content ──────────────────────────────────────────────────────────
      // The readers tolerate an unmounted engine and report an empty document, which is
      // what `isEmpty()` and `getLength()` already do. Writers still throw: quietly
      // dropping a `setContent` would be a real bug, while reading early is just early.
      getHTML: (serializeOptions) => engineRef.current?.getHTML(serializeOptions) ?? '',
      getJSON: () => engineRef.current?.getJSON() ?? createEmptyDocument(),
      getMarkdown: () => documentToMarkdown(engineRef.current?.getJSON() ?? createEmptyDocument()),
      getText: (textOptions) => engineRef.current?.getText(textOptions) ?? '',
      getPlainTextAlternative: () =>
        plainTextAlternative(engineRef.current?.getJSON() ?? createEmptyDocument()),
      setContent: (value: EditorValue, setOptions?: SetContentOptions) => {
        requireEngine().setContent(value, { format: valueFormat, ...setOptions });
      },
      insertContent: (value: EditorValue, insertOptions?: InsertOptions) => {
        requireEngine().insertContent(value, { format: valueFormat, ...insertOptions });
      },
      clear: (clearOptions) => {
        requireEngine().setContent(createEmptyDocument(), {
          format: 'json',
          source: 'api',
          ...(clearOptions?.history === false ? { history: false } : {}),
        });
      },
      isEmpty: () => (engineRef.current ? engineRef.current.isEmpty() : true),
      getLength: (unit) => (engineRef.current ? engineRef.current.getLength(unit) : 0),

      // ── selection and focus ──────────────────────────────────────────────
      getSelection: (): EditorSelection | null => engineRef.current?.getSelection() ?? null,
      setSelection: (selection) => {
        requireEngine().setSelection(selection);
      },
      saveSelection: (): SelectionSnapshot => requireEngine().saveSelection(),
      restoreSelection: (snapshot) => {
        requireEngine().restoreSelection(snapshot);
      },
      getFormatState: (): FormatState => store.getSnapshot().format,
      focus: (position) => {
        requireEngine().focus(position);
      },
      blur: () => {
        requireEngine().blur();
      },
      hasFocus: () => engineRef.current?.hasFocus() ?? false,

      // ── commands ─────────────────────────────────────────────────────────
      exec: <Id extends CommandId>(command: Id, payload?: CommandPayload<Id>) =>
        requireEngine().exec(command, payload),
      canExec: <Id extends CommandId>(command: Id, payload?: CommandPayload<Id>) =>
        engineRef.current?.canExec(command, payload) ?? false,
      isActive: (command) => {
        const format = store.getSnapshot().format;
        switch (command) {
          case 'toggleBold':
            return format.marks.bold;
          case 'toggleItalic':
            return format.marks.italic;
          case 'toggleUnderline':
            return format.marks.underline;
          case 'toggleStrike':
            return format.marks.strike;
          case 'toggleCode':
            return format.marks.code;
          case 'toggleSubscript':
            return format.marks.subscript;
          case 'toggleSuperscript':
            return format.marks.superscript;
          case 'toggleBulletList':
            return format.list.type === 'bullet';
          case 'toggleOrderedList':
            return format.list.type === 'ordered';
          case 'toggleCheckList':
            return format.list.type === 'check';
          case 'insertLink':
            return format.link !== null;
          default:
            return false;
        }
      },
      registerCommand: <Id extends CommandId>(
        id: Id,
        handler: CommandHandler<Id>,
        priority?: number,
      ) =>
        requireEngine().registerCommand(
          id,
          // The engine has no editor instance to put in the context — it is one layer
          // below that — so the handler is wrapped here, where one exists.
          (ctx, next) => handler({ ...ctx, editor: api }, next),
          priority,
        ),

      // ── history ──────────────────────────────────────────────────────────
      undo: () => {
        requireEngine().undo();
      },
      redo: () => {
        requireEngine().redo();
      },
      canUndo: () => store.getSnapshot().format.canUndo,
      canRedo: () => store.getSnapshot().format.canRedo,
      clearHistory: () => {
        requireEngine().clearHistory();
      },

      // ── links, media, tags ───────────────────────────────────────────────
      insertLink: (attrs: LinkAttrs) => {
        requireEngine().exec('insertLink', attrs);
      },
      removeLink: () => {
        requireEngine().exec('removeLink');
      },
      getLinkAtSelection: () => store.getSnapshot().format.link,
      insertImage: (attrs: ImageAttrs) => {
        requireEngine().exec('insertImage', attrs);
      },
      uploadFiles: async (files: File[]) => {
        const upload = optionsRef.current.onUpload;
        for (const file of files) {
          // The constraints are checked before the upload starts, not after it
          // returns: a 30 MB file should never leave the browser.
          const rejection = checkUploadable(file, optionsRef.current);
          if (rejection) {
            optionsRef.current.onUploadError?.(new Error(rejection), file);
            continue;
          }
          const controller = new AbortController();
          const entry: UploadState = {
            id: `${instanceId}-upload-${uploadsRef.current.length + 1}`,
            file,
            progress: 0,
            status: 'uploading',
          };
          uploadsRef.current = [...uploadsRef.current, entry];
          store.update({ uploads: uploadsRef.current });

          // A veto here is how a consumer refuses a file for a reason of its own —
          // a quota, a filename policy, a virus scan that has not come back yet.
          let proceed = false;
          runHandler<UploadStartContext>(
            optionsRef.current.handlers?.onUploadStart,
            { editor: api, file },
            () => {
              proceed = true;
            },
          );
          if (!proceed) {
            uploadsRef.current = uploadsRef.current.filter((current) => current.id !== entry.id);
            store.update({ uploads: uploadsRef.current });
            continue;
          }

          // No `onUpload`, so there is nowhere to put the file but the document. The
          // picture the author chose is embedded as a data URL, which is what makes
          // "insert an image from this device" work without a backend behind it. The
          // size and type checks above have already run, and the sanitizer keeps only
          // the raster types — `data:image/svg+xml` stays blocked in every profile,
          // because an SVG is a document that can carry script.
          if (!upload) {
            try {
              const src = await readAsDataUrl(file, controller.signal);
              uploadsRef.current = uploadsRef.current.map((current) =>
                current.id === entry.id
                  ? { ...current, status: 'done', progress: 100, url: src }
                  : current,
              );
              store.update({ uploads: uploadsRef.current });
              api.insertImage({ src, alt: file.name });
            } catch (error) {
              uploadsRef.current = uploadsRef.current.map((current) =>
                current.id === entry.id ? { ...current, status: 'error', error } : current,
              );
              store.update({ uploads: uploadsRef.current });
              runHandler<UploadErrorContext>(
                optionsRef.current.handlers?.onUploadError,
                { editor: api, file, error },
                (ctx) => {
                  optionsRef.current.onUploadError?.(ctx.error, ctx.file);
                },
              );
            }
            continue;
          }

          try {
            const result = await upload(file, {
              signal: controller.signal,
              onProgress: (progress) => {
                uploadsRef.current = uploadsRef.current.map((current) =>
                  current.id === entry.id ? { ...current, progress } : current,
                );
                store.update({ uploads: uploadsRef.current });
              },
            });
            uploadsRef.current = uploadsRef.current.map((current) =>
              current.id === entry.id
                ? { ...current, status: 'done', progress: 100, url: result.url }
                : current,
            );
            store.update({ uploads: uploadsRef.current });
            api.insertImage({
              src: result.url,
              ...(result.alt ? { alt: result.alt } : {}),
              ...(result.width ? { width: result.width } : {}),
              ...(result.height ? { height: result.height } : {}),
            });
          } catch (error) {
            uploadsRef.current = uploadsRef.current.map((current) =>
              current.id === entry.id ? { ...current, status: 'error', error } : current,
            );
            store.update({ uploads: uploadsRef.current });
            runHandler<UploadErrorContext>(
              optionsRef.current.handlers?.onUploadError,
              { editor: api, file, error },
              (ctx) => {
                optionsRef.current.onUploadError?.(ctx.error, ctx.file);
              },
            );
          }
        }
      },
      insertMergeTag: (key: string) => {
        requireEngine().exec('insertMergeTag', { key });
      },
      getMergeTags: () => collectMergeTags(readDocument()),
      insertTable: (rows: number, cols: number, tableOptions?: TableOptions) => {
        requireEngine().exec('insertTable', {
          rows,
          cols,
          ...(tableOptions ? { options: tableOptions } : {}),
        });
      },

      // ── state and misc ───────────────────────────────────────────────────
      setEditable: (editable) => {
        requireEngine().setEditable(editable);
        store.update({ editable });
      },
      isEditable: () => store.getSnapshot().editable,
      setFullscreen: (on) => {
        runHandler<OpenStateContext>(
          optionsRef.current.handlers?.onFullscreenChange,
          { editor: api, open: on },
          (ctx) => {
            store.update({ fullscreen: ctx.open });
            emit('fullscreenChange', ctx.open);
          },
        );
      },
      isFullscreen: () => store.getSnapshot().fullscreen,
      toggleSourceView: () => {
        const open = !store.getSnapshot().sourceView;
        runHandler<OpenStateContext>(
          optionsRef.current.handlers?.onSourceViewToggle,
          { editor: api, open },
          (ctx) => {
            store.update({ sourceView: ctx.open });
            emit('sourceViewToggle', ctx.open);
          },
        );
      },
      isSourceView: () => store.getSnapshot().sourceView,
      find: (query: string, findOptions?: FindOptions): FindResult => {
        // Counting is the whole of the public contract; moving between
        // matches and highlighting them belongs to the panel, which owns that state.
        const matches = findMatches(readDocument(), query, findOptions ?? {});
        return { total: matches.length, index: matches.length > 0 ? 0 : -1 };
      },
      replace: (query: string, replacement: string, findOptions?: FindOptions): number => {
        const { document, replaced } = replaceMatches(
          readDocument(),
          query,
          replacement,
          findOptions ?? {},
          'all',
        );
        if (replaced > 0) api.setContent(document, { format: 'json', source: 'api' });
        return replaced;
      },
      clearDraft: () => {
        draftRef.current?.clear();
      },
      saveDraft: () => {
        draftRef.current?.save();
      },
      validate,
      announce: (message: string) => {
        const node = announcerRef.current;
        if (node) node.textContent = message;
        emit('announce', message);
      },
      on: <K extends keyof EditorEvents>(event: K, cb: EditorEvents[K]): Unregister => {
        const set = listenersRef.current.get(event) ?? new Set<(...args: never[]) => void>();
        const listener: (...args: never[]) => void = cb;
        set.add(listener);
        listenersRef.current.set(event, set);
        return () => {
          set.delete(listener);
        };
      },
      getSnapshot: () => store.getSnapshot(),

      get engine(): EngineHandle {
        return requireEngine();
      },
      id: instanceId,
    };
    // Callbacks built before this point — the HTML parser among them — reach the
    // instance through the ref rather than closing over a value that did not exist.
    instanceRef.current = api;
    return api;
  }, [emit, instanceId, readDocument, requireEngine, store, validate, valueFormat]);

  // ── mounting ─────────────────────────────────────────────────────────────
  const [mounted, setMounted] = useState(false);

  const setContentAttributes = useCallback((attributes: Record<string, string | null>) => {
    contentAttributesRef.current = { ...contentAttributesRef.current, ...attributes };
    const element = engineRef.current?.contentElement;
    if (!element) return;
    for (const [name, value] of Object.entries(attributes)) {
      if (value === null) element.removeAttribute(name);
      else element.setAttribute(name, value);
    }
  }, []);

  const attachContent = useCallback((container: HTMLElement | null) => {
    // Clearing removes the server-rendered preview, which React does not track because
    // it came from `dangerouslySetInnerHTML`.
    if (container) container.replaceChildren();
    containerRef.current = container;
    // A ref callback runs during commit, so this is not a setState-in-effect: it is the
    // signal that the host element now exists and the engine can mount.
    setMounted(container !== null);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!mounted || !container || engineRef.current) return undefined;

    const current = optionsRef.current;
    const engine = (current.engine ?? nativeEngine).mount(container, {
      ...(current.value !== undefined
        ? { initialValue: current.value }
        : current.defaultValue !== undefined
          ? { initialValue: current.defaultValue }
          : {}),
      valueFormat,
      editable: current.disabled !== true && current.readOnly !== true,
      ...(current.autoFocus ? { autoFocus: current.autoFocus } : {}),
      enabledFeatures: resolveFeatures(current),
      markdownShortcuts: current.enableMarkdownShortcuts === true || current.markdownShortcuts === true,
      autoLink: {
        // Autolinking is on unless the consumer says otherwise or links are off.
        enabled: current.autoLink !== false && current.enableLinks !== false,
        ...(current.autoLinkProtocols ? { protocols: current.autoLinkProtocols } : {}),
        ...(current.defaultProtocol ? { defaultProtocol: current.defaultProtocol } : {}),
      },
      namespace: instanceId,
      parseHtml,
      serializeHtml,
      ...(current.onError ? { onError: current.onError } : {}),
    });
    engineRef.current = engine;
    engine.contentElement.id = `${instanceId}-content-editable`;
    for (const [name, value] of Object.entries(contentAttributesRef.current)) {
      if (value !== null) engine.contentElement.setAttribute(name, value);
    }

    const refreshState = (source: ChangeSource): void => {
      const format = engine.getFormatState();
      const doc = engine.getJSON();
      const countUnit: CountUnit = optionsRef.current.countUnit ?? 'characters';
      const lengthMode = optionsRef.current.mergeTags?.lengthMode ?? 'label';
      store.update(
        {
          format,
          editable: engine.isEditable(),
          empty: isEmptyDocument(doc),
          length: countDocument(doc, countUnit, lengthMode),
          wordCount: countDocument(doc, 'words', lengthMode),
          error: validate(),
        },
        { bumpRevision: source !== 'init' },
      );
    };

    const emitChange = (source: ChangeSource): void => {
      const value = getValue();
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      // A controlled parent re-rendering with an equivalent value must not loop
      // (fixes R21).
      if (serialized === lastEmittedRef.current && source !== 'user') return;
      lastEmittedRef.current = serialized;

      const meta = buildMeta(source);
      const config = optionsRef.current;

      runHandler<{ value: EditorValue; meta: ChangeMeta; editor: EditorInstance }>(
        config.handlers?.onBeforeChange,
        { value, meta, editor: instance },
        (ctx) => {
          config.onChange?.(ctx.value, ctx.meta);
          emit('change', ctx.value, ctx.meta);
          if (config.onChangeDebounced) {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
              config.onChangeDebounced?.(ctx.value, ctx.meta);
            }, config.changeDebounceMs ?? 300);
          }
        },
      );
    };

    cleanupsRef.current.push(
      engine.on('change', ({ source }) => {
        refreshState(source);
        emitChange(source);
      }),
      engine.on('formatChange', (format) => {
        store.update({ format });
      }),
      engine.on('selectionChange', (selection) => {
        runHandler<SelectionChangeContext>(
          optionsRef.current.handlers?.onSelectionChange,
          { editor: instance, selection },
          (ctx) => {
            store.update({ selection: ctx.selection, format: engine.getFormatState() });
            optionsRef.current.onSelectionChange?.(ctx.selection);
            emit('selectionChange', ctx.selection);
          },
        );
      }),
      engine.on('focus', () => {
        runHandler<FocusHandlerContext>(
          optionsRef.current.handlers?.onFocus,
          { editor: instance, event: new FocusEvent('focus') },
          () => {
            store.update({ focused: true });
            emit('focus');
          },
        );
      }),
      engine.on('blur', () => {
        runHandler<FocusHandlerContext>(
          optionsRef.current.handlers?.onBlur,
          { editor: instance, event: new FocusEvent('blur') },
          () => {
            store.update({ focused: false, error: validate() });
            emit('blur');
          },
        );
      }),
      engine.on('error', (error) => {
        optionsRef.current.onError?.(error);
        emit('error', error);
      }),
      engine.on('paste', (event) => {
        handlePaste(event);
      }),
      engine.on('drop', (event) => {
        handleDrop(event);
      }),
    );

    /**
     * The paste pipeline.
     *
     * Everything the clipboard carries goes through `insertHTML` or `pastePlainText`,
     * both of which parse and sanitize first. Claiming the event is what stops the
     * engine importing the raw markup itself.
     */
    function handlePaste(event: ClipboardEvent): void {
      const config = optionsRef.current;
      const data = event.clipboardData;
      if (!data) return;

      const html = data.getData('text/html');
      const text = data.getData('text/plain');
      const files = [...data.files];
      if (html === '' && text === '' && files.length === 0) return;

      const requested =
        typeof config.pasteMode === 'function'
          ? config.pasteMode({ editor: instance, event, html, text, files, source: detectSource(html), mode: 'rich' })
          : (config.pasteMode ?? 'rich');

      event.preventDefault();

      runHandler<PasteHandlerContext>(
        config.handlers?.onPaste,
        { editor: instance, event, html, text, files, source: detectSource(html), mode: requested },
        (ctx) => {
          if (ctx.files.length > 0 && (config.enableImages ?? true) && config.onUpload) {
            void instance.uploadFiles(ctx.files);
            return;
          }
          if (ctx.mode === 'text' || ctx.html === '') {
            engine.exec('pastePlainText', { text: ctx.text });
            return;
          }
          // `clean` drops the source's own formatting and keeps the structure, which
          // is what the office profiles already do on the way in.
          engine.exec('insertHTML', { html: ctx.mode === 'clean' ? stripInlineStyles(ctx.html) : ctx.html });
        },
      );
    }

    /** Drop: files upload, markup goes through the same pipeline as a paste. */
    function handleDrop(event: DragEvent): void {
      const config = optionsRef.current;
      const data = event.dataTransfer;
      if (!data) return;

      const files = [...data.files];
      const html = data.getData('text/html');
      const text = data.getData('text/plain');
      if (files.length === 0 && html === '' && text === '') return;

      event.preventDefault();

      runHandler<DropHandlerContext>(
        config.handlers?.onDrop,
        { editor: instance, event, files, html, text },
        (ctx) => {
          if (ctx.files.length > 0 && (config.enableImages ?? true) && config.onUpload) {
            void instance.uploadFiles(ctx.files);
            return;
          }
          if (ctx.html !== '') engine.exec('insertHTML', { html: ctx.html });
          else engine.exec('pastePlainText', { text: ctx.text });
        },
      );
    }

    // `maxLengthBehaviour: 'block'` has to stop the character before it lands, which
    // means intercepting the input rather than reacting to the change.
    const onBeforeInput = (event: Event): void => {
      const config = optionsRef.current;
      if (config.maxLength === undefined || config.maxLengthBehaviour === 'warn') return;
      const inputEvent = event as InputEvent;
      if (!inputEvent.inputType.startsWith('insert')) return;
      const selection = engine.getSelection();
      if (selection && !selection.isCollapsed) return;
      const unit: CountUnit = config.countUnit ?? 'characters';
      if (engine.getLength(unit) < config.maxLength) return;
      event.preventDefault();
      runHandler<{ attempted: number; max: number; editor: EditorInstance }>(
        config.handlers?.onMaxLengthExceeded,
        { attempted: engine.getLength(unit) + 1, max: config.maxLength, editor: instance },
        () => {
          instance.announce(resolveMessage(localizationRef.current.announce.overLimit));
        },
      );
    };
    engine.contentElement.addEventListener('beforeinput', onBeforeInput);
    cleanupsRef.current.push(() => {
      engine.contentElement.removeEventListener('beforeinput', onBeforeInput);
    });

    // The keymap listener lives here rather than in the component because only this
    // scope knows the engine has mounted; a component effect would run a render too
    // early. It listens to the engine rather than the DOM so that it runs
    // *before* the engine's own shortcut handling, which would otherwise toggle the
    // same format straight back.
    const onKeyDown = (event: KeyboardEvent): boolean | void => {
      const config = optionsRef.current;
      const entries = buildKeymap(
        (config.keymap ?? {}) as Record<string, CommandId>,
        config.disableShortcuts ?? [],
      );
      const match = findKeymapMatch(entries, event);
      // `disableShortcuts` has to disable the shortcut, not just unbind our command:
      // the engine binds `Mod+B` and friends itself, so a key we merely ignore would
      // still format the selection.
      const disabled = findKeymapMatch(
        buildKeymap(Object.fromEntries((config.disableShortcuts ?? []).map((key) => [key, true]))),
        event,
      );
      /** Set by the structural handler when the browser's default must survive. */
      let claimed = false;
      /**
       * Whether the middleware reached the default at all.
       *
       * An `onKeyDown` handler vetoes by not calling `next`, and a veto has to stop the
       * *engine's* own bindings too — it binds Mod+B and friends itself, so a key that
       * merely went unhandled here would still format the selection.
       */
      let reached = false;

      runHandler<KeyDownContext>(
        config.handlers?.onKeyDown,
        { editor: instance, event, keymapMatch: match?.handler ?? null },
        (ctx) => {
          reached = true;
          if (disabled) {
            ctx.event.preventDefault();
            return;
          }
          if (match) {
            ctx.event.preventDefault();
            engine.exec(match.handler, payloadForShortcut(match.source) as never);
            return;
          }
          claimed = handleStructuralKey(ctx.event);
        },
      );

      return claimed || !reached;
    };

    /**
     * The keys that are not commands: Tab, Enter, Escape and the two
     * accessibility shortcuts.
     *
     * They are handled here rather than in the keymap because what they do depends on
     * where the caret is — Tab indents inside a list and moves focus everywhere else —
     * and because rebinding them would break the editor's keyboard contract.
     */
    function handleStructuralKey(event: KeyboardEvent): boolean {
      const config = optionsRef.current;
      const mod = event.ctrlKey || event.metaKey;

      // Alt+F10 moves focus to the toolbar, the APG pattern for a composite widget.
      if (event.key === 'F10' && event.altKey) {
        // The first *enabled* control: undo is usually the first button and is
        // usually disabled, and focusing a disabled button does nothing at all.
        const target = [
          ...(containerRef.current
            ?.closest('.rte-root')
            ?.querySelectorAll<HTMLElement>('[data-toolbar-control]') ?? []),
        ].find((element) => !element.hasAttribute('disabled'));
        if (target) {
          event.preventDefault();
          target.focus();
        }
        return true;
      }

      if (mod && event.key === '/') {
        event.preventDefault();
        instance.exec('openShortcutHelp');
        return true;
      }

      if (event.key === 'Tab') {
        const { tabBehaviour } = config;
        const inList = engine.getFormatState().list.type !== null;

        if (tabBehaviour === 'insertTab') {
          event.preventDefault();
          engine.exec('insertText', { text: '\t' });
          return true;
        }

        // The default indents where indenting means something and moves focus
        // everywhere else, which is what keeps the editor usable inside a form
        //.
        if (tabBehaviour === 'indent' || (tabBehaviour !== 'focus' && inList)) {
          event.preventDefault();
          engine.exec(event.shiftKey ? 'outdent' : 'indent');
          return true;
        }

        // Claimed, but not prevented: the engine binds Tab too, and leaving it to
        // handle the key would trap focus inside the editor.
        return true;
      }

      if (event.key === 'Enter' && config.submitOnEnter && config.onSubmit) {
        const wants = config.submitOnEnter === 'mod' ? mod : !event.shiftKey;
        if (!wants) return false;
        event.preventDefault();
        const value = getValue();
        config.onSubmit(value, buildMeta('user'));
        return true;
      }

      if (event.key === 'Escape' && config.escapeExitsEditor) {
        event.preventDefault();
        instance.blur();
        return true;
      }

      return false;
    }
    cleanupsRef.current.push(engine.on('keydown', onKeyDown));

    // Consumer overrides run before anything a plugin registered: they are the
    // deployment's policy, and policy wins.
    for (const [command, handler] of Object.entries(optionsRef.current.commandOverrides ?? {})) {
      if (!handler) continue;
      cleanupsRef.current.push(
        instance.registerCommand(command as CommandId, handler as CommandHandler, 100),
      );
    }

    refreshState('init');
    lastEmittedRef.current = (() => {
      const value = getValue();
      return typeof value === 'string' ? value : JSON.stringify(value);
    })();

    optionsRef.current.onReady?.(instance);
    emit('ready');

    return () => {
      for (const cleanup of cleanupsRef.current.splice(0)) cleanup();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      engine.destroy();
      engineRef.current = null;
      emit('destroy');
    };
  }, [
    buildMeta,
    emit,
    getValue,
    instance,
    instanceId,
    mounted,
    parseHtml,
    serializeHtml,
    store,
    validate,
    valueFormat,
  ]);

  // ── controlled value ─────────────────────────────────────────────────────
  const controlledValue = options.value;
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || controlledValue === undefined) return;

    const incoming = isEditorDocument(controlledValue)
      ? JSON.stringify(controlledValue)
      : controlledValue;
    if (incoming === lastEmittedRef.current) return;

    // Only apply a value that actually differs, and keep the caret where it is: that
    // is what stops the cursor jumping on every parent render.
    lastEmittedRef.current = incoming;
    engine.setContent(controlledValue, {
      format: valueFormat,
      source: 'api',
      keepSelection: true,
    });
  }, [controlledValue, valueFormat]);

  // ── editable state ───────────────────────────────────────────────────────
  const editable = options.disabled !== true && options.readOnly !== true;
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.setEditable(editable);
    store.update({ editable });
  }, [editable, mounted, store]);

  // ── runtime bridge ───────────────────────────────────────────────────────
  useMemo(() => {
    const runtime: EditorRuntime = {
      store,
      attachContent,
      isMounted: () => engineRef.current !== null,
      setContentAttributes,
      setDraftHandlers: (handlers) => {
        draftRef.current = handlers;
      },
      ids: {
        root: instanceId,
        content: `${instanceId}-content`,
        label: `${instanceId}-label`,
        helper: `${instanceId}-helper`,
        error: `${instanceId}-error`,
        counter: `${instanceId}-counter`,
        announcer: `${instanceId}-announcer`,
      },
      announce: (message: string) => {
        instance.announce(message);
      },
    };
    setRuntime(instance, runtime);
    return runtime;
  }, [attachContent, instance, instanceId, setContentAttributes, store]);

  // The announcer element is created by `<Rte.Root>`; this keeps the ref in sync.
  useEffect(() => {
    announcerRef.current = document.getElementById(`${instanceId}-announcer`);
  }, [instanceId, mounted]);

  // ── imperative ref ───────────────────────────────────────────────────────
  const editorRef = options.editorRef;
  useEffect(() => {
    if (!editorRef) return undefined;
    if (typeof editorRef === 'function') {
      editorRef(instance);
      return () => {
        editorRef(null);
      };
    }
    (editorRef as { current: EditorInstance | null }).current = instance;
    return () => {
      (editorRef as { current: EditorInstance | null }).current = null;
    };
  }, [editorRef, instance]);

  return instance;
}

/** Re-exported so the component and the parts share one implementation. @internal */
export { runHandler, resolveFeatures };
export type { RteHandlers };
