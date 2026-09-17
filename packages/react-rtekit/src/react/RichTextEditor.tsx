import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { RichTextEditorProps } from '../types/props.js';
import type { ToolbarConfig, ToolbarEntry, ToolbarItemSpec } from '../types/toolbar.js';
import type { PresetName } from '../types/plugin.js';
import type { ResolvedRteTheme } from '../types/theme.js';
import type { CommandId } from '../types/commands.js';
import { useEditor } from './useEditor.js';
import { getRuntime } from './runtime.js';
import {
  ConfigContextProvider,
  EditorContextProvider,
  LocaleContextProvider,
  SlotsContextProvider,
  useLocalization as useLocalizationValue,
  useOptionalEditorContext,
  useRteConfig as useConfigValue,
  useRteDefaults,
  useRteSlots as useSlotsValue,
  useRteTheme,
  type RteConfigValue,
} from './context.js';
import { useEditorState } from './hooks.js';
import { defaultSlots, resolveSlots } from './slots/defaults.js';
import { resolveIcons } from '../icons/index.js';
import { createBuiltInItems } from './toolbar/items.js';
import { Toolbar } from './toolbar/Toolbar.js';
import { mergeLocalization, resolveMessage } from './localization.js';
import { en } from '../locales/en.js';
import { classicTheme, themeToCssVars } from '../themes/index.js';
import { presets, resolvePlugins } from '../core/plugins/presets.js';
import { featuresOf } from '../core/plugins/define.js';
import { CLASSIC_COLORS } from '../core/classic-parity.js';
import { FeatureUi } from './plugins/FeatureUi.js';
import { useServerPreview } from './parts.js';
import { useKeyboardInset } from './hooks/useVisualViewport.js';
import { useRecentColors } from './hooks/useRecentColors.js';

/**
 * The all-in-one component.
 *
 * The first of the four entry points: props in, a complete field out. The
 * other three — the same plus overrides, the composable parts, and `useEditor` with no
 * UI — are all reachable from the same pieces this assembles.
 *
 * @module
 */

/** Default font stacks offered by the font-family dropdown. */
const DEFAULT_FONT_FAMILIES = [
  { label: 'Default', value: '' },
  { label: 'Sans serif', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Serif', value: 'Georgia, "Times New Roman", serif' },
  { label: 'Monospace', value: 'ui-monospace, Menlo, Consolas, monospace' },
];

/** Default sizes offered by the font-size dropdown. */
const DEFAULT_FONT_SIZES = [
  { label: 'Small', value: '0.75em' },
  { label: 'Normal', value: '' },
  { label: 'Large', value: '1.5em' },
  { label: 'Huge', value: '2.5em' },
];

/** Normalizes the three `toolbar` prop shapes into groups. */
function toolbarGroups(config: ToolbarConfig | false | undefined): ToolbarEntry[][] {
  if (config === false || config === undefined) return [];
  if (Array.isArray(config)) {
    if (config.length === 0) return [];
    // A flat list, with '|' marking the group boundaries.
    if (!Array.isArray(config[0])) {
      const flat = config as ToolbarEntry[];
      const groups: ToolbarEntry[][] = [[]];
      for (const item of flat) {
        if (item === '|') groups.push([]);
        else groups[groups.length - 1]!.push(item);
      }
      return groups.filter((group) => group.length > 0);
    }
    return config as ToolbarEntry[][];
  }
  return config.items;
}

/**
 * Themes a preset brings with it.
 *
 * A preset is a plugin bundle and its prop defaults; a theme is tokens, and the two
 * stay separate — except for `classic`, which exists to reproduce one specific editor
 * and is defined by its look as much as by its plugin list.
 */
const PRESET_THEMES: Partial<Record<PresetName, ResolvedRteTheme>> = { classic: classicTheme };

/**
 * A complete rich-text field: toolbar, content, label, helper text, error and counter.
 *
 * @example
 * ```tsx
 * <RichTextEditor
 *   preset="classic"
 *   label="Message"
 *   required
 *   maxLength={2048}
 *   value={html}
 *   onChange={setHtml}
 * />
 * ```
 */
export function RichTextEditor(props: RichTextEditorProps) {
  const appDefaults = useRteDefaults();
  const themeContext = useRteTheme();

  // Precedence: props > provider > preset defaults > library defaults.
  const presetName = props.preset ?? appDefaults.preset ?? 'standard';
  const resolved: RichTextEditorProps = useMemo(
    () => ({ ...presets[presetName].defaults, ...appDefaults, ...props }),
    [appDefaults, presetName, props],
  );

  const plugins = useMemo(
    () =>
      resolvePlugins({
        preset: presetName,
        ...(resolved.plugins ? { plugins: resolved.plugins } : {}),
        ...(resolved.addPlugins ? { addPlugins: resolved.addPlugins } : {}),
        ...(resolved.removePlugins ? { removePlugins: resolved.removePlugins } : {}),
      }),
    [presetName, resolved.addPlugins, resolved.plugins, resolved.removePlugins],
  );

  const enabledFeatures = useMemo(() => new Set(featuresOf(plugins)), [plugins]);

  // Plugin bindings first, then the consumer's, which win. `useEditor` installs
  // the listener, because only it knows when the engine has mounted.
  const keymap = useMemo(() => {
    const bindings: Record<string, CommandId> = {};
    for (const plugin of plugins) {
      for (const [shortcut, handler] of Object.entries(plugin.keymap ?? {})) {
        if (typeof handler === 'string') bindings[shortcut] = handler;
      }
    }
    return { ...bindings, ...(resolved.keymap as Record<string, CommandId> | undefined) };
  }, [plugins, resolved.keymap]);

  const editor = useEditor({
    ...resolved,
    keymap,
    // The plugin list decides which features the schema accepts, so a `classic` editor
    // downgrades a pasted heading instead of keeping markup it cannot edit.
    enableHeadings: resolved.enableHeadings ?? enabledFeatures.has('heading'),
    enableStrike: resolved.enableStrike ?? enabledFeatures.has('strike'),
    enableCode: resolved.enableCode ?? enabledFeatures.has('code'),
    // The plugin is named `subSup` but provides two schema features; the feature name
    // is what the set holds.
    enableSubSup: resolved.enableSubSup ?? enabledFeatures.has('subscript'),
    enableBackgroundColor: resolved.enableBackgroundColor ?? enabledFeatures.has('backgroundColor'),
    enableFontFamily: resolved.enableFontFamily ?? enabledFeatures.has('fontFamily'),
    enableFontSize: resolved.enableFontSize ?? enabledFeatures.has('fontSize'),
    enableBlockquote: resolved.enableBlockquote ?? enabledFeatures.has('blockquote'),
    enableCodeBlock: resolved.enableCodeBlock ?? enabledFeatures.has('codeBlock'),
    enableLinks: resolved.enableLinks ?? enabledFeatures.has('link'),
    enableImages: resolved.enableImages ?? enabledFeatures.has('image'),
    enableTables: resolved.enableTables ?? enabledFeatures.has('table'),
    enableHorizontalRule: resolved.enableHorizontalRule ?? enabledFeatures.has('horizontalRule'),
    enableCheckList: resolved.enableCheckList ?? enabledFeatures.has('checkList'),
    // Configuring merge tags or mentions turns the feature on, whatever the preset
    // says: the legacy field is `classic` *plus* merge tags.
    enableMergeTags:
      resolved.enableMergeTags ??
      (enabledFeatures.has('mergeTag') || resolved.mergeTags !== undefined),
    enableMentions:
      resolved.enableMentions ??
      (enabledFeatures.has('mention') || resolved.mentions !== undefined),
    enableEmoji: resolved.enableEmoji ?? enabledFeatures.has('emoji'),
    enableIndent: resolved.enableIndent ?? enabledFeatures.has('indent'),
  });

  const runtime = getRuntime(editor);
  const localization = useMemo(
    () => mergeLocalization(en, resolved.localization),
    [resolved.localization],
  );
  const icons = useMemo(() => resolveIcons(resolved.icons), [resolved.icons]);
  const slots = useMemo(() => resolveSlots(resolved.slots), [resolved.slots]);

  // ── toolbar items ────────────────────────────────────────────────────────
  const builtIns = useMemo(
    () =>
      createBuiltInItems({
        icons,
        headingLevels: resolved.headingLevels ?? [1, 2, 3],
        fontFamilies: resolved.fontFamilies ?? DEFAULT_FONT_FAMILIES,
        fontSizes: resolved.fontSizes ?? DEFAULT_FONT_SIZES,
      }),
    [icons, resolved.fontFamilies, resolved.fontSizes, resolved.headingLevels],
  );

  const pluginItems = useMemo(() => {
    const map = new Map<string, ToolbarItemSpec>();
    for (const plugin of plugins) for (const item of plugin.toolbar ?? []) map.set(item.name, item);
    return map;
  }, [plugins]);

  const groups = useMemo(() => {
    const configured = toolbarGroups(resolved.toolbar);
    return configured
      .map((group) =>
        group
          .map((entry) =>
            typeof entry === 'string' ? (pluginItems.get(entry) ?? builtIns.get(entry)) : entry,
          )
          .filter((item): item is ToolbarItemSpec => item !== undefined),
      )
      .filter((group) => group.length > 0);
  }, [builtIns, pluginItems, resolved.toolbar]);

  // ── colour configuration ─────────────────────────────────────────────────
  const { recent: recentColors, remember: rememberColor } = useRecentColors(
    resolved.colors?.colorStorageKey ?? 'rte-recent-colors',
    resolved.colors?.recentCount ?? 6,
  );

  const configValue: RteConfigValue = useMemo(
    () => ({
      colors: {
        palette: resolved.colors?.palette ?? CLASSIC_COLORS,
        recent: recentColors,
        columns: resolved.colors?.columns ?? 7,
        allowCustom: resolved.colors?.allowCustom ?? true,
        allowClear: resolved.colors?.allowClear ?? true,
        remember: rememberColor,
      },
      mergeTags: resolved.mergeTags?.tags ?? [],
      ...(resolved.maxLength !== undefined ? { maxLength: resolved.maxLength } : {}),
      countUnit: resolved.countUnit ?? 'characters',
      defaultProtocol: 'https',
    }),
    [
      recentColors,
      rememberColor,
      resolved.colors?.allowClear,
      resolved.colors?.allowCustom,
      resolved.colors?.columns,
      resolved.colors?.palette,
      resolved.countUnit,
      resolved.maxLength,
      resolved.mergeTags?.tags,
    ],
  );

  const slotsValue = useMemo(
    () => ({
      slots,
      defaults: defaultSlots,
      slotProps: resolved.slotProps,
      classNames: resolved.classNames,
      styles: resolved.styles,
      icons,
    }),
    [icons, resolved.classNames, resolved.slotProps, resolved.styles, slots],
  );

  const editorContextValue = useMemo(
    () => ({ editor, store: runtime.store }),
    [editor, runtime.store],
  );

  // ── rendering ────────────────────────────────────────────────────────────
  // An explicit `theme` wins, then an app-wide provider, then whatever the preset
  // implies. Only `classic` implies one: its whole purpose is a visual reproduction,
  // so `preset="classic"` has to look classic without a second prop.
  const explicitTheme = resolved.theme ?? themeContext?.theme;
  const theme = explicitTheme ?? PRESET_THEMES[presetName];

  /*
   * Only a theme the caller actually passed is written out as inline custom properties.
   *
   * An inline custom property beats every stylesheet, layered or not, so inlining the
   * *implied* theme put a complete light palette on the element and left the colour
   * scheme with nothing it could override: `preset="classic"` stayed white on a dark
   * page, and so did its toolbar, its menus and its popovers.
   *
   * It was also redundant. `classicTheme` flattens to exactly the 114 variables that
   * `tokens.css` plus `presets/classic.css` already produce — same names, same values —
   * so `data-theme="classic"` below reaches the same result through the cascade, where a
   * colour scheme can still get at it.
   *
   * An explicit `theme` is a different matter and still wins outright: the caller named a
   * palette, and a palette they named is not something a media query should override.
   */
  const themeVars = useMemo(
    () => (explicitTheme ? themeToCssVars(explicitTheme) : undefined),
    [explicitTheme],
  );

  const colorScheme = resolved.colorScheme ?? themeContext?.colorScheme;
  const themeName = theme && 'name' in theme ? theme.name : undefined;

  return (
    <EditorContextProvider value={editorContextValue}>
      <LocaleContextProvider value={localization}>
        <SlotsContextProvider value={slotsValue}>
          <ConfigContextProvider value={configValue}>
            <EditorChrome
              props={resolved}
              groups={groups}
              features={enabledFeatures}
              keymap={keymap}
              themeVars={themeVars}
              {...(colorScheme ? { colorScheme } : {})}
              {...(themeName ? { themeName } : {})}
            />
          </ConfigContextProvider>
        </SlotsContextProvider>
      </LocaleContextProvider>
    </EditorContextProvider>
  );
}

/** Props for the chrome that surrounds the content. */
interface EditorChromeProps {
  props: RichTextEditorProps;
  groups: ToolbarItemSpec[][];
  /** Feature names the resolved plugin list provides, for the feature chrome. */
  features: ReadonlySet<string>;
  /** The resolved keymap, for the shortcut reference. */
  keymap: Record<string, CommandId>;
  themeVars: Record<string, string> | undefined;
  colorScheme?: string;
  themeName?: string;
}

/**
 * The field chrome: label, toolbar, content, footer and error.
 *
 * Split from `RichTextEditor` so it can subscribe to editor state without re-rendering
 * the providers above it on every keystroke.
 */
function EditorChrome({
  props,
  groups,
  features,
  keymap,
  themeVars,
  colorScheme,
  themeName,
}: EditorChromeProps) {
  const editorContext = useEditorContextValue();
  const { editor } = editorContext;
  const runtime = getRuntime(editor);
  const { slots } = useSlotsValue();
  const t = useLocalizationValue();
  const config = useConfigValue();

  const state = useEditorState((snapshot) => ({
    focused: snapshot.focused,
    editable: snapshot.editable,
    empty: snapshot.empty,
    sourceView: snapshot.sourceView,
    fullscreen: snapshot.fullscreen,
    length: snapshot.length,
    wordCount: snapshot.wordCount,
    error: snapshot.error,
  }));

  const explicitError = typeof props.error === 'string' ? props.error : null;
  const hasError = props.error === true || explicitError !== null || state.error !== null;
  const errorMessage = explicitError ?? state.error;

  const placeholderText =
    typeof props.placeholder === 'string'
      ? props.placeholder
      : props.placeholder === undefined
        ? resolveMessage(t.editor.placeholder)
        : '';

  const describedBy = [
    props.helperText ? runtime.ids.helper : null,
    hasError && errorMessage ? runtime.ids.error : null,
    props.showCounter || props.maxLength !== undefined ? runtime.ids.counter : null,
  ]
    .filter(Boolean)
    .join(' ');

  // The content element belongs to the engine, so its ARIA is applied imperatively.
  useEffect(() => {
    runtime.setContentAttributes({
      'aria-describedby': describedBy || null,
      'aria-required': props.required === true ? 'true' : null,
      'aria-invalid': hasError ? 'true' : 'false',
      'aria-disabled': props.disabled === true ? 'true' : null,
      spellcheck: String(props.spellCheck ?? true),
      ...(props.dir ? { dir: props.dir } : {}),
      ...(props.lang ? { lang: props.lang } : {}),
      ...(props.label ? { 'aria-labelledby': runtime.ids.label } : {}),
      ...(props.label ? {} : { 'aria-label': resolveMessage(t.editor.label) }),
      tabindex: String(props.tabIndex ?? 0),
    });
  }, [describedBy, hasError, props, runtime, t.editor.label]);

  const counterUnit = config.countUnit;
  const count = counterUnit === 'words' ? state.wordCount : state.length;
  const showCounter = props.showCounter ?? props.maxLength !== undefined;
  const nearLimit =
    props.maxLength !== undefined && count >= props.maxLength * 0.9 && count <= props.maxLength;
  const overLimit = props.maxLength !== undefined && count > props.maxLength;

  const counterText =
    props.maxLength === undefined
      ? resolveMessage(counterUnit === 'words' ? t.counter.words : t.counter.characters, { count })
      : resolveMessage(t.counter.limit, { count, max: props.maxLength });

  // What the server sends for the content element, captured once.
  //
  // Only an HTML value can be rendered without the engine; a JSON or Markdown value
  // would need a converter the server entry deliberately does not carry. It has to be
  // the *first* value and never change again: this becomes the host element's
  // `dangerouslySetInnerHTML`, and re-rendering that with a new string would have React
  // replace the children — which by then are the engine's contenteditable element.
  const [serverValue] = useState(() =>
    (props.valueFormat ?? 'html') === 'html' ? (props.value ?? props.defaultValue) : undefined,
  );

  // A bottom-docked toolbar has to sit above the on-screen keyboard, which does not
  // resize the layout viewport on either mobile platform.
  const keyboardInset = useKeyboardInset(props.toolbarPosition === 'bottom');

  const toolbarVisible =
    props.toolbar !== false &&
    props.toolbarPosition !== 'none' &&
    groups.length > 0 &&
    !(props.readOnly === true && (props.readOnlyToolbar ?? 'hide') === 'hide') &&
    props.disabled !== true;

  const toolbarNode: ReactNode = toolbarVisible ? (
    <Toolbar
      groups={groups}
      {...(typeof props.toolbar === 'object' &&
      !Array.isArray(props.toolbar) &&
      props.toolbar.ariaLabel
        ? { ariaLabel: props.toolbar.ariaLabel }
        : {})}
      {...(props.toolbarOverflow ? { overflow: props.toolbarOverflow } : {})}
      {...(props.stickyToolbar ? { sticky: props.stickyToolbar } : {})}
      {...(typeof props.toolbar === 'object' &&
      !Array.isArray(props.toolbar) &&
      props.toolbar.showLabels
        ? { showLabels: true }
        : {})}
      {...(typeof props.toolbar === 'object' && !Array.isArray(props.toolbar) && props.toolbar.size
        ? { size: props.toolbar.size }
        : {})}
      {...(props.handlers ? { handlers: props.handlers } : {})}
    />
  ) : null;

  const renderedToolbar = props.renderToolbar
    ? props.renderToolbar({
        editor,
        t,
        valueFormat: props.valueFormat ?? 'html',
        items: groups,
        defaultRender: () => toolbarNode,
      })
    : toolbarNode;

  const Label = slots.Label;
  const HelperText = slots.HelperText;
  const ErrorText = slots.ErrorText;
  const Counter = slots.Counter;

  return (
    <div
      id={props.id ?? runtime.ids.root}
      className={['rte-root', props.unstyled ? 'rte-root--unstyled' : null, props.className]
        .filter(Boolean)
        .join(' ')}
      style={{ ...themeVars, ...styleFromProps(props), ...props.style }}
      data-focused={state.focused}
      data-disabled={props.disabled === true}
      data-readonly={props.readOnly === true}
      data-empty={state.empty}
      data-invalid={hasError}
      data-fullscreen={state.fullscreen}
      data-source-view={state.sourceView}
      data-over-limit={overLimit}
      data-density={props.theme && 'density' in props.theme ? props.theme.density : undefined}
      // The whole field mirrors, not only the text: the toolbar order, the indent
      // direction, the alignment defaults and the popover placement all follow the
      // root's direction, and the stylesheet is written in logical properties so
      // that it does.
      dir={props.dir ?? t.dir}
      {...(themeName ? { 'data-theme': themeName } : {})}
      {...(colorScheme && colorScheme !== 'auto' ? { 'data-color-scheme': colorScheme } : {})}
    >
      {props.label ? (
        <Label
          htmlFor={`${runtime.ids.content}-editable`}
          required={props.required === true}
          hidden={props.hideLabel === true}
        >
          <span id={runtime.ids.label}>{props.label}</span>
        </Label>
      ) : null}

      {props.toolbarPosition !== 'bottom' ? renderedToolbar : null}

      <EditorContent
        placeholder={placeholderText}
        contentClassName={props.contentClassName}
        ssrValue={typeof serverValue === 'string' ? serverValue : undefined}
      />

      {props.toolbarPosition === 'bottom' ? (
        <div
          className="rte-toolbar-dock"
          style={keyboardInset > 0 ? { paddingBlockEnd: `${keyboardInset}px` } : undefined}
        >
          {renderedToolbar}
        </div>
      ) : null}

      {props.helperText || showCounter || props.footer ? (
        <div className="rte-footer">
          <div className="rte-footer__start">
            {props.helperText ? (
              <HelperText id={runtime.ids.helper}>{props.helperText}</HelperText>
            ) : null}
            {typeof props.footer === 'function'
              ? props.footer({ editor, t, valueFormat: props.valueFormat ?? 'html' })
              : props.footer}
          </div>
          <div className="rte-footer__end">
            {showCounter ? (
              <Counter
                count={count}
                {...(props.maxLength !== undefined ? { max: props.maxLength } : {})}
                unit={counterUnit}
                nearLimit={nearLimit}
                overLimit={overLimit}
                text={counterText}
                id={runtime.ids.counter}
              />
            ) : null}
          </div>
        </div>
      ) : null}

      {hasError && errorMessage ? (
        <ErrorText id={runtime.ids.error} role="alert">
          {errorMessage}
        </ErrorText>
      ) : null}

      <FeatureUi
        props={props}
        features={features}
        keymap={keymap}
        groups={groups}
        toolbarVisible={toolbarVisible}
      />

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

/** Height and resize tokens the layout props imply. */
function styleFromProps(props: RichTextEditorProps): Record<string, string> {
  const style: Record<string, string> = {};
  if (props.minHeight !== undefined) {
    style['--rte-min-height'] =
      typeof props.minHeight === 'number' ? `${props.minHeight}px` : props.minHeight;
  }
  if (props.maxHeight !== undefined) {
    style['--rte-max-height'] =
      typeof props.maxHeight === 'number' ? `${props.maxHeight}px` : props.maxHeight;
  }
  return style;
}

/** The content host, split out so it re-renders on its own state alone. */
function EditorContent({
  placeholder,
  contentClassName,
  ssrValue,
}: {
  placeholder: string;
  contentClassName: string | undefined;
  ssrValue: string | undefined;
}) {
  const { editor } = useEditorContextValue();
  const { attachContent, ids } = getRuntime(editor);
  const empty = useEditorState((snapshot) => snapshot.empty);
  const editable = useEditorState((snapshot) => snapshot.editable);
  const previewHtml = useServerPreview(ssrValue);

  return (
    <div className="rte-content-wrapper" data-editable={editable}>
      <div
        id={ids.content}
        ref={attachContent}
        className="rte-content-host"
        // The engine normalizes markup when it takes the element over, so the client's
        // first tree differs from the server's by design. Without this, every
        // server-rendered application logs a hydration warning it cannot act on.
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: previewHtml }}
      />
      {empty && placeholder ? (
        <div className="rte-placeholder" aria-hidden="true">
          {placeholder}
        </div>
      ) : null}
      {contentClassName ? <ContentClassName value={contentClassName} /> : null}
    </div>
  );
}

/** Applies `contentClassName` to the engine's element, which React does not own. */
function ContentClassName({ value }: { value: string }) {
  const { editor } = useEditorContextValue();
  useEffect(() => {
    const element = editor.engine.contentElement;
    const tokens = value.split(/\s+/).filter(Boolean);
    for (const token of tokens) element.classList.add(token);
    return () => {
      for (const token of tokens) element.classList.remove(token);
    };
  }, [editor, value]);
  return null;
}

/** The editor context, asserted non-null inside the component tree. */
function useEditorContextValue() {
  const value = useOptionalEditorContext();
  if (!value) throw new Error('EditorChrome must render inside <RichTextEditor>.');
  return value;
}
