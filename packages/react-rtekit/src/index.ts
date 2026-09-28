/**
 * `react-rtekit`: an accessible, themeable rich-text editor for React.
 *
 * @module
 */
export { VERSION } from './version.js';

// ── component and parts ─────────────────────────────────────────────────────
export { RichTextEditor } from './react/RichTextEditor.js';
export {
  Rte,
  RteRoot,
  RteLabel,
  RteToolbar,
  RteContent,
  RteCounter,
  RteErrorText,
  RteHelperText,
  RteFooter,
  RtePortals,
  type RteRootProps,
  type RteLabelProps,
  type RteToolbarProps,
  type RteContentProps,
  type RteCounterProps,
  type RtePortalsProps,
} from './react/parts.js';

// ── hooks ───────────────────────────────────────────────────────────────────
export { useEditor } from './react/useEditor.js';
export {
  useEditorState,
  useFormatState,
  useCommand,
  useIsEmpty,
  useIsFocused,
  useCharacterCount,
  useUpload,
  useValidationError,
  type CommandBinding,
  type UploadBinding,
} from './react/hooks.js';
export {
  useEditorContext,
  useRteSlots,
  useRteConfig,
  useLocalization,
  useRteTheme,
  useRteDefaults,
  type SlotsContextValue,
  type ThemeContextValue,
  type RteConfigValue,
} from './react/context.js';

// ── providers ───────────────────────────────────────────────────────────────
export {
  RteThemeProvider,
  RteLocaleProvider,
  RteDefaultsProvider,
  type RteThemeProviderProps,
  type RteLocaleProviderProps,
  type RteDefaultsProviderProps,
} from './react/providers.js';

// ── plugins and presets ─────────────────────────────────────────────────────
export { definePlugin, createToolbarItem, resolvePluginOrder, featuresOf } from './core/plugins/define.js';
export {
  presets,
  plugins,
  resolvePlugins,
  CLASSIC_TOOLBAR,
  type PresetDefinition,
} from './core/plugins/presets.js';

// ── toolbar ─────────────────────────────────────────────────────────────────
export { Toolbar, type ToolbarProps } from './react/toolbar/Toolbar.js';
export { createBuiltInItems, type ToolbarItemFactoryOptions } from './react/toolbar/items.js';

// ── slots, primitives and icons ─────────────────────────────────────────────
export { defaultSlots, resolveSlots } from './react/slots/defaults.js';
export { defaultIcons, resolveIcons } from './icons/index.js';
export { Popover, type PopoverProps, type PopoverPlacement } from './react/ui/Popover.js';
export { Menu, type MenuProps, type MenuOption } from './react/ui/Menu.js';
export { ColorPicker, CLASSIC_COLORS } from './react/ui/ColorPicker.js';
export {
  Button,
  IconButton,
  TextInput,
  Select,
  Checkbox,
  Spinner,
  Tooltip,
  type ButtonProps,
  type IconButtonProps,
  type TextInputProps,
  type SelectProps,
  type CheckboxProps,
  type SpinnerProps,
  type TooltipProps,
} from './react/ui/primitives.js';

// ── themes ──────────────────────────────────────────────────────────────────
export {
  lightTheme,
  classicTheme,
  classicDefaults,
  darkTheme,
  compactTheme,
  borderedTheme,
  themes,
  createTheme,
  themeToCssVars,
} from './themes/index.js';

// ── engine ──────────────────────────────────────────────────────────────────
export { nativeEngine } from './engines/native/engine.js';

// ── core utilities, re-exported for convenience ─────────────────────────────
export {
  sanitizeHtml,
  htmlToDocument,
  documentToHtml,
  documentToMarkdown,
  documentToText,
  plainTextAlternative,
  markdownToDocument,
  isEmptyHtml,
  isEmptyDocument,
  countText,
  countDocument,
  validateMergeTagKeys,
  normalizeUrl,
  normalizeColor,
  contrastRatio,
  meetsContrastAA,
} from './core/index.js';

// ── keyboard ────────────────────────────────────────────────────────────────
export {
  parseShortcut,
  formatShortcut,
  matchesShortcut,
  isApplePlatform,
  type ParsedShortcut,
} from './core/utils/keymap.js';

// ── localization ────────────────────────────────────────────────────────────
export { en as defaultLocalization } from './locales/en.js';

/**
 * The shipped catalogues.
 *
 * Each one is complete: a partial catalogue falls back to English silently, which
 * reads as a bug rather than as a translation gap.
 */
export { en } from './locales/en.js';
export { hu } from './locales/hu.js';
export { de } from './locales/de.js';
export { es } from './locales/es.js';
export { pseudo, pseudoize } from './locales/pseudo.js';
export { resolveMessage, mergeLocalization } from './react/localization.js';

export type * from './types/index.js';
