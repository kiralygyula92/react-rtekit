import { memo, useEffect, useMemo, type CSSProperties, type ReactNode } from 'react';
import type { EditorInstance } from '../types/editor.js';
import type { DeepPartial } from '../types/common.js';
import type { RteLocalization } from '../types/localization.js';
import type { ColorScheme, RteTheme } from '../types/theme.js';
import type { CommandId } from '../types/commands.js';
import type { HeadingLevel } from '../types/document.js';
import type { RteHandlers } from '../types/handlers.js';
import type { RichTextEditorProps } from '../types/props.js';
import type { ColorPaletteConfig, MergeTagDefinition } from '../types/config.js';
import type { RteIcons } from '../types/icons.js';
import type { RteSlots } from '../types/slots.js';
import type { CountUnit } from '../types/common.js';
import type { ToolbarEntry, ToolbarItemSpec } from '../types/toolbar.js';
import {
  ConfigContextProvider,
  EditorContextProvider,
  LocaleContextProvider,
  SlotsContextProvider,
  useEditorContext,
  useLocalization,
  useRteSlots,
  type RteConfigValue,
} from './context.js';
import { defaultSlots, resolveSlots } from './slots/defaults.js';
import { resolveIcons } from '../icons/index.js';
import { createBuiltInItems } from './toolbar/items.js';
import { Toolbar } from './toolbar/Toolbar.js';
import { FeatureUi } from './plugins/FeatureUi.js';
import { useRecentColors } from './hooks/useRecentColors.js';
import { CLASSIC_COLORS } from '../core/classic-parity.js';
import { useEditorState, useIsEmpty, useValidationError } from './hooks.js';
import { getRuntime } from './runtime.js';
import { themeToCssVars as flattenTheme } from '../themes/css-vars.js';
import { mergeLocalization, resolveMessage } from './localization.js';
import { en } from '../locales/en.js';
import { documentToHtml } from '../core/serialize/to-html.js';
import { htmlToDocument } from '../core/serialize/from-html.js';

/**
 * Composable parts.
 *
 * `<Rte.Root>` provides the context; every other part reads it. Arranging them in a
 * custom layout is the third of the four entry points.
 *
 * @module
 */

/** Props for {@link RteRoot}. */
export interface RteRootProps {
  /** The instance every part below reads from. */
  editor: EditorInstance;
  /** Theme tokens, written as inline custom properties on the root. */
  theme?: RteTheme | DeepPartial<RteTheme>;
  /** Light, dark, or follow the operating system. */
  colorScheme?: ColorScheme;
  /** Message catalogue overrides. */
  localization?: DeepPartial<RteLocalization>;
  /** Appended to the part’s own class name. */
  className?: string;
  /** Merged with the theme’s custom properties. */
  style?: CSSProperties;
  /** The parts you are composing. */
  children?: ReactNode;
  /** Sets `data-theme`, which is how the CSS presets are selected. */
  dataTheme?: string;
  /** Replacement components, by slot name. */
  slots?: Partial<RteSlots>;
  /** Replacement icons, by icon name. */
  icons?: RteIcons;
  /** The colour picker's palette and behaviour. */
  colors?: ColorPaletteConfig;
  /** The merge tags this editor knows. */
  mergeTags?: MergeTagDefinition[];
  /** The budget the counter renders against. */
  maxLength?: number;
  /** What `maxLength` and the counter measure. @default 'characters' */
  countUnit?: CountUnit;
  /** Rejects a URL before it becomes a link; sanitization runs regardless. */
  linkValidator?: (url: string) => string | null;
  /** Protocol given to a bare host. @default 'https' */
  defaultProtocol?: string;
}

/**
 * The editor root: context, state data attributes and the live region.
 *
 * @example
 * ```tsx
 * <Rte.Root editor={editor} dataTheme="classic">
 *   <Rte.Toolbar />
 *   <Rte.Content />
 * </Rte.Root>
 * ```
 */
export function RteRoot({
  editor,
  theme,
  colorScheme,
  localization,
  className,
  style,
  children,
  dataTheme,
  slots,
  icons,
  colors,
  mergeTags,
  maxLength,
  countUnit,
  linkValidator,
  defaultProtocol,
}: RteRootProps) {
  const runtime = getRuntime(editor);
  const messages = useMemo(() => mergeLocalization(en, localization), [localization]);

  const contextValue = useMemo(() => ({ editor, store: runtime.store }), [editor, runtime.store]);

  const resolvedIcons = useMemo(() => resolveIcons(icons), [icons]);
  const resolvedSlots = useMemo(() => resolveSlots(slots), [slots]);

  const slotsValue = useMemo(
    () => ({
      slots: resolvedSlots,
      defaults: defaultSlots,
      icons: resolvedIcons,
    }),
    [resolvedIcons, resolvedSlots],
  );

  const { recent, remember } = useRecentColors(
    colors?.colorStorageKey ?? 'rte-recent-colors',
    colors?.recentCount ?? 6,
  );

  // The same configuration `<RichTextEditor>` provides, so a part behaves identically
  // whichever entry point assembled it.
  const configValue: RteConfigValue = useMemo(
    () => ({
      colors: {
        palette: colors?.palette ?? CLASSIC_COLORS,
        recent,
        columns: colors?.columns ?? 7,
        allowCustom: colors?.allowCustom ?? true,
        allowClear: colors?.allowClear ?? true,
        remember,
      },
      mergeTags: mergeTags ?? [],
      ...(maxLength !== undefined ? { maxLength } : {}),
      countUnit: countUnit ?? 'characters',
      ...(linkValidator ? { linkValidator } : {}),
      defaultProtocol: defaultProtocol ?? 'https',
    }),
    [
      colors?.allowClear,
      colors?.allowCustom,
      colors?.columns,
      colors?.palette,
      countUnit,
      defaultProtocol,
      linkValidator,
      maxLength,
      mergeTags,
      recent,
      remember,
    ],
  );

  return (
    <EditorContextProvider value={contextValue}>
      <LocaleContextProvider value={messages}>
        <SlotsContextProvider value={slotsValue}>
          <ConfigContextProvider value={configValue}>
            <RteRootElement
              className={className}
              style={style}
              theme={theme}
              colorScheme={colorScheme}
              dataTheme={dataTheme}
            >
              {children}
            </RteRootElement>
          </ConfigContextProvider>
        </SlotsContextProvider>
      </LocaleContextProvider>
    </EditorContextProvider>
  );
}

/** The root element, split out so it can subscribe without re-rendering the providers. */
function RteRootElement({
  className,
  style,
  theme,
  colorScheme,
  dataTheme,
  children,
}: Pick<RteRootProps, 'className' | 'style' | 'theme' | 'colorScheme' | 'dataTheme' | 'children'>) {
  const editor = useEditorContext();
  const runtime = getRuntime(editor);
  const state = useEditorState((snapshot) => ({
    focused: snapshot.focused,
    editable: snapshot.editable,
    empty: snapshot.empty,
    fullscreen: snapshot.fullscreen,
    sourceView: snapshot.sourceView,
    invalid: snapshot.error !== null,
  }));

  const themeVars = useMemo(() => (theme ? flattenTheme(theme) : undefined), [theme]);

  return (
    <div
      id={runtime.ids.root}
      className={['rte-root', className].filter(Boolean).join(' ')}
      style={{ ...themeVars, ...style }}
      data-focused={state.focused}
      data-disabled={!state.editable}
      data-empty={state.empty}
      data-invalid={state.invalid}
      data-fullscreen={state.fullscreen}
      data-source-view={state.sourceView}
      {...(dataTheme ? { 'data-theme': dataTheme } : {})}
      {...(colorScheme && colorScheme !== 'auto' ? { 'data-color-scheme': colorScheme } : {})}
    >
      {children}
      <div
        id={runtime.ids.announcer}
        className="rte-visually-hidden"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      />
    </div>
  );
}

/**
 * The static markup the server emits, so the field is not a blank box before the
 * engine mounts.
 *
 * The same serializer `<RteContentView>` uses, so what the server sends and what the
 * editor shows a moment later are the same content. React does not track
 * `dangerouslySetInnerHTML` children, so the mount callback is free to clear them.
 *
 * @internal
 */
export function useServerPreview(value: string | undefined): string {
  return useMemo(
    () => (value ? `<div class="rte-content">${documentToHtml(htmlToDocument(value))}</div>` : ''),
    [value],
  );
}

/** Props for {@link RteContent}. */
export interface RteContentProps {
  /** Appended to the content element’s own class name. */
  className?: string;
  /** Applied to the content element. */
  style?: CSSProperties;
  /** Accessible name, when there is no `<Rte.Label>`. */
  'aria-label'?: string;
  /** Points at your own label element, when you render one. */
  'aria-labelledby'?: string;
  /** Shown over an empty document. */
  placeholder?: ReactNode;
  /** HTML rendered on the server, before the engine mounts. */
  ssrValue?: string;
}

/**
 * The editable surface.
 *
 * The engine creates the contenteditable element itself and React never touches its
 * children, which is what keeps React's reconciler and the browser's editing engine out
 * of each other's way.
 */
export const RteContent = /* @__PURE__ */ memo(function RteContent({
  className,
  style,
  placeholder,
  ssrValue,
  ...aria
}: RteContentProps) {
  const editor = useEditorContext();
  const { ids, attachContent, setContentAttributes } = getRuntime(editor);
  const empty = useIsEmpty();
  const error = useValidationError();
  const editable = useEditorState((snapshot) => snapshot.editable);
  const ariaLabel = aria['aria-label'];
  const ariaLabelledBy = aria['aria-labelledby'];

  const previewHtml = useServerPreview(ssrValue);

  useEffect(() => {
    setContentAttributes({
      'aria-invalid': error !== null ? 'true' : 'false',
      // Only what this component was actually given. Writing `null` for an absent prop
      // would clear the `aria-labelledby` that a sibling <Rte.Label> just set — and
      // sibling effects run in order, so the content element would end up unnamed.
      ...(ariaLabel === undefined ? {} : { 'aria-label': ariaLabel }),
      ...(ariaLabelledBy === undefined ? {} : { 'aria-labelledby': ariaLabelledBy }),
      ...(className ? { class: `rte-content ${className}` } : {}),
    });

    return () => {
      // Clearing on unmount rather than on every render is what makes "only what it
      // was given" safe: a prop that goes away still takes its attribute with it.
      setContentAttributes({
        ...(ariaLabel === undefined ? {} : { 'aria-label': null }),
        ...(ariaLabelledBy === undefined ? {} : { 'aria-labelledby': null }),
      });
    };
  }, [ariaLabel, ariaLabelledBy, className, error, setContentAttributes]);

  return (
    <div className="rte-content-wrapper" data-editable={editable}>
      <div
        id={ids.content}
        ref={attachContent}
        className="rte-content-host"
        style={style}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: previewHtml }}
      />
      {empty && placeholder ? (
        <div className="rte-placeholder" aria-hidden="true">
          {placeholder}
        </div>
      ) : null}
    </div>
  );
});

/** Props for {@link RteCounter}. */
export interface RteCounterProps {
  /** The budget the counter renders against. */
  max?: number;
  /** What is being counted. */
  unit?: 'characters' | 'words';
  /** Appended to the counter’s own class name. */
  className?: string;
  /** Show only when the count passes `warnThreshold`. @default false */
  nearLimitOnly?: boolean;
  /** Fraction of `max` at which the counter warns. @default 0.9 */
  warnThreshold?: number;
}

/** The live character or word counter. */
export const RteCounter = /* @__PURE__ */ memo(function RteCounter({
  max,
  unit = 'characters',
  className,
  nearLimitOnly = false,
  warnThreshold = 0.9,
}: RteCounterProps) {
  const editor = useEditorContext();
  const runtime = getRuntime(editor);
  const count = useEditorState((snapshot) =>
    unit === 'words' ? snapshot.wordCount : snapshot.length,
  );
  const t = useLocalization();

  const nearLimit = max !== undefined && count >= max * warnThreshold && count <= max;
  const overLimit = max !== undefined && count > max;
  if (nearLimitOnly && !nearLimit && !overLimit) return null;

  const text =
    max === undefined
      ? resolveMessage(unit === 'words' ? t.counter.words : t.counter.characters, { count })
      : resolveMessage(t.counter.limit, { count, max });

  return (
    <div
      id={runtime.ids.counter}
      className={['rte-counter', className].filter(Boolean).join(' ')}
      data-near-limit={nearLimit}
      data-over-limit={overLimit}
      aria-live="polite"
    >
      {text}
    </div>
  );
});

/** The validation message, linked to the content element with `aria-describedby`. */
export const RteErrorText = /* @__PURE__ */ memo(function RteErrorText({
  children,
}: {
  children?: ReactNode;
}) {
  const editor = useEditorContext();
  const runtime = getRuntime(editor);
  const error = useValidationError();
  const message = children ?? error;
  if (!message) return null;
  return (
    <div id={runtime.ids.error} className="rte-error" role="alert">
      {message}
    </div>
  );
});

/** Helper text below the editor. */
export function RteHelperText({ children }: { children?: ReactNode }) {
  const editor = useEditorContext();
  const runtime = getRuntime(editor);
  if (!children) return null;
  return (
    <div id={runtime.ids.helper} className="rte-helper">
      {children}
    </div>
  );
}

/** The footer row: counter on the right, anything else on the left. */
export function RteFooter({ children }: { children?: ReactNode }) {
  return <div className="rte-footer">{children}</div>;
}

/**
 * The composable parts, grouped for import as one namespace.
 *
 * @example
 * ```tsx
 * import { Rte } from 'react-rtekit';
 * <Rte.Root editor={editor}><Rte.Content /></Rte.Root>
 * ```
 */
export const Rte = {
  Root: RteRoot,
  Label: RteLabel,
  Toolbar: RteToolbar,
  Content: RteContent,
  Counter: RteCounter,
  ErrorText: RteErrorText,
  HelperText: RteHelperText,
  Footer: RteFooter,
  Portals: RtePortals,
};

/** Props for {@link RteLabel}. */
export interface RteLabelProps {
  /** Marks the field required, both visually and for assistive technology. */
  required?: boolean;
  /** Visually hidden but still announced. */
  hidden?: boolean;
  /** Appended to the part’s own class name. */
  className?: string;
  /** The label text. */
  children?: ReactNode;
}

/**
 * The field label, bound to the content element.
 *
 * `<label for>` names a form control, and the content element is a `div` with
 * `role="textbox"` — so the label also has to be attached with `aria-labelledby`, or
 * the editor has an accessible name in the markup and none in the accessibility tree.
 */
export function RteLabel({ required, hidden, className, children }: RteLabelProps) {
  const editor = useEditorContext();
  const runtime = getRuntime(editor);
  const { slots } = useRteSlots();
  const Label = slots.Label;

  useEffect(() => {
    runtime.setContentAttributes({ 'aria-labelledby': runtime.ids.label });
    return () => {
      runtime.setContentAttributes({ 'aria-labelledby': null });
    };
  }, [runtime]);

  return (
    <Label
      htmlFor={`${runtime.ids.content}-editable`}
      required={required === true}
      hidden={hidden === true}
      {...(className ? { className } : {})}
    >
      <span id={runtime.ids.label}>{children}</span>
    </Label>
  );
}

/** Props for {@link RteToolbar}. */
export interface RteToolbarProps {
  /**
   * The controls, grouped; separators are drawn between the groups.
   *
   * Names are resolved against the built-in registry, so a composed layout can ask for
   * `'bold'` without importing anything.
   */
  items?: ToolbarEntry[][];
  /** Which heading levels the heading dropdown offers. @default [1, 2, 3] */
  headingLevels?: HeadingLevel[];
  /** What the font-family dropdown offers. */
  fontFamilies?: { label: string; value: string }[];
  /** What the font-size dropdown offers. */
  fontSizes?: { label: string; value: string }[];
  /** The toolbar’s accessible name. */
  ariaLabel?: string;
  /** What happens to items that do not fit at this width. @default 'menu' */
  overflow?: 'wrap' | 'menu' | 'scroll';
  /** Show labels beside the icons. */
  showLabels?: boolean;
  /** Control height, which density scales further. */
  size?: 'sm' | 'md';
  /** Interaction middleware, so activations can be wrapped. */
  handlers?: Partial<RteHandlers>;
  /** Appended to the toolbar’s own class name. */
  className?: string;
}

/** The default groups, which are what `<RichTextEditor preset="standard">` shows. */
const DEFAULT_TOOLBAR: ToolbarEntry[][] = [
  ['undo', 'redo'],
  ['bold', 'italic', 'underline'],
  ['heading', 'bulletList', 'orderedList'],
  ['link'],
];

/**
 * The toolbar, for a layout you are composing yourself.
 *
 * @example
 * ```tsx
 * <Rte.Toolbar items={[['bold', 'italic'], ['color'], ['bulletList']]} />
 * ```
 */
export function RteToolbar({
  items = DEFAULT_TOOLBAR,
  headingLevels = [1, 2, 3],
  fontFamilies,
  fontSizes,
  ...rest
}: RteToolbarProps) {
  const { icons } = useRteSlots();

  const groups = useMemo(() => {
    const builtIns = createBuiltInItems({
      icons,
      headingLevels,
      fontFamilies: fontFamilies ?? [],
      fontSizes: fontSizes ?? [],
    });
    return items
      .map((group) =>
        group
          .map((entry) => (typeof entry === 'string' ? builtIns.get(entry) : entry))
          .filter((item): item is ToolbarItemSpec => item !== undefined),
      )
      .filter((group) => group.length > 0);
  }, [fontFamilies, fontSizes, headingLevels, icons, items]);

  return <Toolbar groups={groups} {...rest} />;
}

/** Props for {@link RtePortals}. */
export interface RtePortalsProps {
  /**
   * The feature chrome to mount.
   *
   * Composed layouts do not go through a preset, so there is no plugin list to read
   * the answer from: say which popovers and menus this editor should have.
   */
  features?: ('link' | 'image' | 'table' | 'findReplace' | 'sourceView' | 'fullscreen')[];
  /** The options the feature chrome reads, using the same names as the props. */
  options?: RichTextEditorProps;
  /** The keymap in force, for the shortcut reference. */
  keymap?: Record<string, CommandId>;
}

/** Everything the shipped features render: popovers, menus, dialogs and prompts. */
const DEFAULT_PORTAL_FEATURES: NonNullable<RtePortalsProps['features']> = ['link', 'image'];

/**
 * The popovers, menus and dialogs the features own.
 *
 * A composed layout renders this once, anywhere inside `<Rte.Root>`. Without it the
 * link popover, the image dialog and the suggestion menus have nowhere to mount, and
 * the features look broken rather than absent.
 */
export function RtePortals({
  features = DEFAULT_PORTAL_FEATURES,
  options = {},
  keymap = {},
}: RtePortalsProps) {
  const featureSet = useMemo(() => new Set<string>(features), [features]);
  return <FeatureUi props={options} features={featureSet} keymap={keymap} />;
}
