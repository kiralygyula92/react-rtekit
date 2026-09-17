import { createContext, useContext, type Context } from 'react';
import type { EditorInstance } from '../types/editor.js';
import type { RteLocalization } from '../types/localization.js';
import type { ColorScheme, ResolvedRteTheme } from '../types/theme.js';
import type { RteSlots } from '../types/slots.js';
import type { RteIcons } from '../types/icons.js';
import type { RichTextEditorProps } from '../types/props.js';
import type { MergeTagDefinition } from '../types/config.js';
import type { EditorStore } from './store.js';
import { en } from '../locales/en.js';

/**
 * React contexts (02 §1).
 *
 * Four separate contexts rather than one: a theme change must not re-render every
 * toolbar button, and a slot override must not invalidate the editor instance.
 *
 * @module
 */

/**
 * A context with a name, created purely.
 *
 * `Context.displayName = '…'` at module scope is a property assignment, which no
 * bundler can prove is safe to drop — so the context, the module and everything it
 * imports stay in every graph that touches this file. Doing the same work inside a
 * function marked `@__PURE__` lets an unused context disappear, which is what keeps
 * `useEditor` from dragging the whole React chrome behind it (09 §4).
 */
function namedContext<T>(name: string, initial: T): Context<T> {
  const context = createContext(initial);
  context.displayName = name;
  return context;
}

/** What plugins and slots get from {@link useEditorContext}. */
export interface EditorContextValue {
  editor: EditorInstance;
  store: EditorStore;
}

const EditorContext = /* @__PURE__ */ namedContext<EditorContextValue | null>('RteEditorContext', null);

/** Provides the editor instance to slots, plugins and composable parts. */
export const EditorContextProvider = EditorContext.Provider;

/**
 * The editor instance for the nearest `<Rte.Root>` or `<RichTextEditor>`.
 *
 * @throws when called outside an editor tree, which is always a wiring mistake.
 */
export function useEditorContext(): EditorInstance {
  const value = useContext(EditorContext);
  if (!value) {
    throw new Error(
      'useEditorContext must be called inside <RichTextEditor> or <Rte.Root>. ' +
        'If you are rendering a custom slot, make sure it is passed through the `slots` prop ' +
        'rather than rendered outside the editor.',
    );
  }
  return value.editor;
}

/** The editor context, or `null` outside an editor tree. @internal */
export function useOptionalEditorContext(): EditorContextValue | null {
  return useContext(EditorContext);
}

/** The store behind `useEditorState`. @internal */
export function useEditorStore(): EditorStore {
  const value = useContext(EditorContext);
  if (!value) throw new Error('useEditorState must be called inside an editor tree.');
  return value.store;
}

// ─── slots ───────────────────────────────────────────────────────────────────

/** What {@link useRteSlots} returns. */
export interface SlotsContextValue {
  /** The slots in effect, after merging overrides onto the defaults. */
  slots: RteSlots;
  /** The default implementations, so an override can wrap one rather than replace it. */
  defaults: RteSlots;
  /** Extra props merged into each slot. */
  slotProps: RichTextEditorProps['slotProps'];
  /** Per-slot class names. */
  classNames: RichTextEditorProps['classNames'];
  /** Per-slot inline styles. */
  styles: RichTextEditorProps['styles'];
  /** The icon set in effect, after merging overrides. */
  icons: RteIcons;
}

const SlotsContext = /* @__PURE__ */ namedContext<SlotsContextValue | null>('RteSlotsContext', null);

/** Provides the resolved slot table. */
export const SlotsContextProvider = SlotsContext.Provider;

/**
 * The slot table, including the defaults.
 *
 * @example
 * ```tsx
 * const MyButton: RteSlots['ToolbarButton'] = (props) => {
 *   const { ToolbarButton: Default } = useRteSlots().defaults;
 *   return <Tooltip title={props.label}><Default {...props} /></Tooltip>;
 * };
 * ```
 */
export function useRteSlots(): SlotsContextValue {
  const value = useContext(SlotsContext);
  if (!value) throw new Error('useRteSlots must be called inside an editor tree.');
  return value;
}

/** The slot table, or `null` outside an editor tree. @internal */
export function useOptionalRteSlots(): SlotsContextValue | null {
  return useContext(SlotsContext);
}

// ─── localization ────────────────────────────────────────────────────────────

const LocaleContext = /* @__PURE__ */ namedContext<RteLocalization>('RteLocaleContext', en);

/** Provides the message catalogue. */
export const LocaleContextProvider = LocaleContext.Provider;

/** The active message catalogue. Falls back to the shipped English one. */
export function useLocalization(): RteLocalization {
  return useContext(LocaleContext);
}

// ─── theme ───────────────────────────────────────────────────────────────────

/** What {@link useRteTheme} returns. */
export interface ThemeContextValue {
  /** Every token resolved, ready to write as custom properties. */
  theme: ResolvedRteTheme;
  /** Light, dark, or follow the operating system. */
  colorScheme: ColorScheme;
}

const ThemeContext = /* @__PURE__ */ namedContext<ThemeContextValue | null>('RteThemeContext', null);

/** Provides the resolved theme. */
export const ThemeContextProvider = ThemeContext.Provider;

/** The active theme, or `null` when no provider is above. */
export function useRteTheme(): ThemeContextValue | null {
  return useContext(ThemeContext);
}

// ─── resolved configuration ─────────────────────────────────────────

/**
 * The parts of the resolved props that UI components need.
 *
 * Kept separate from the editor instance so a colour-palette change re-renders the
 * picker and nothing else, and so a slot never has to reach into the editor for
 * configuration that is really a prop.
 */
export interface RteConfigValue {
  /** What the colour picker needs, including the recent list and its writer. */
  colors: {
    palette: readonly string[];
    recent: readonly string[];
    columns: number;
    allowCustom: boolean;
    allowClear: boolean;
    /** Records a colour in the recent list. */
    remember: (color: string) => void;
  };
  /** The tags this editor knows. */
  mergeTags: MergeTagDefinition[];
  /** The character or word budget, for the counter and the over-limit state. */
  maxLength?: number;
  /** What `maxLength` and the counter measure. */
  countUnit: 'characters' | 'words';
  /** Rejects a URL before it becomes a link; sanitization runs regardless. */
  linkValidator?: (url: string) => string | null;
  /** Protocol given to a bare host in the popover and in autolinking. */
  defaultProtocol: string;
}

const ConfigContext = /* @__PURE__ */ namedContext<RteConfigValue | null>('RteConfigContext', null);

/** Provides the resolved configuration to slots. */
export const ConfigContextProvider = ConfigContext.Provider;

/** The resolved configuration for the nearest editor. */
export function useRteConfig(): RteConfigValue {
  const value = useContext(ConfigContext);
  if (!value) throw new Error('useRteConfig must be called inside an editor tree.');
  return value;
}


// ─── app-wide defaults ───────────────────────────────────────────────────────

const DefaultsContext = /* @__PURE__ */ namedContext<Partial<RichTextEditorProps>>('RteDefaultsContext', {});

/** Provides app-wide prop defaults. */
export const DefaultsContextProvider = DefaultsContext.Provider;

/** App-wide prop defaults from `<RteDefaultsProvider>`. Props still win (06 §0). */
export function useRteDefaults(): Partial<RichTextEditorProps> {
  return useContext(DefaultsContext);
}
