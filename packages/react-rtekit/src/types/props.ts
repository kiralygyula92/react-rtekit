import type { CSSProperties, FocusEvent, ReactNode, Ref } from 'react';
import type {
  ChangeSource,
  ContentWarning,
  CountUnit,
  DeepPartial,
  EditorValue,
  HtmlProfile,
  ValueFormat,
} from './common.js';
import type { ChangeMeta, EditorInstance } from './editor.js';
import type { EditorEngine } from './engine.js';
import type { EditorSelection } from './selection.js';
import type { HeadingLevel } from './document.js';
import type { CommandId, CommandOverrides } from './commands.js';
import type { PresetName, RtePlugin } from './plugin.js';
import type { RteHandlers } from './handlers.js';
import type { RteClassNames, RteSlotProps, RteSlots, RteStyles } from './slots.js';
import type { RteIcons } from './icons.js';
import type { RteLocalization } from './localization.js';
import type { ColorScheme, RteTheme } from './theme.js';
import type { EmailOutputOptions, InteropOptions } from './interop.js';
import type { SanitizeOption } from './sanitize.js';
import type { ToolbarConfig, ToolbarItemSpec } from './toolbar.js';
import type {
  AutosaveConfig,
  ColorPaletteConfig,
  FloatingToolbarConfig,
  ImageOptions,
  MarkdownShortcutConfig,
  MentionsConfig,
  MergeTagsConfig,
  RenderContext,
  SlashMenuConfig,
  UploadHandler,
  ValidateContext,
} from './config.js';
import type { PasteMode, PasteHandlerContext } from './handlers.js';

/** `<RichTextEditor>` props (04 §2). @group Component */

/** How `Tab` behaves outside lists. */
export type TabBehaviour = 'indent' | 'focus' | 'insertTab';

/**
 * Feature toggles, sugar over plugin inclusion (04 §2.3).
 *
 * Each flag adds or removes the plugin that provides it, so turning one off also takes
 * its toolbar item, keymap entry and schema rules with it. A format the schema does not
 * know is downgraded rather than dropped when content arrives carrying it.
 */
export interface FeatureFlagProps {
  /** Bold, with its `Mod+B` binding. */
  enableBold?: boolean;
  /** Italic, with its `Mod+I` binding. */
  enableItalic?: boolean;
  /** Underline, with its `Mod+U` binding. */
  enableUnderline?: boolean;
  /** Strikethrough. */
  enableStrike?: boolean;
  /** Inline code, as a mark rather than a block. */
  enableCode?: boolean;
  /** Subscript and superscript, which are mutually exclusive. */
  enableSubSup?: boolean;
  /** Text colour, with the palette from `colors`. */
  enableColor?: boolean;
  /** Background colour, with the same palette. */
  enableBackgroundColor?: boolean;
  /** The font-family dropdown, populated from `fontFamilies`. */
  enableFontFamily?: boolean;
  /** The font-size dropdown, populated from `fontSizes`. */
  enableFontSize?: boolean;
  /** Headings at the levels given by `headingLevels`. */
  enableHeadings?: boolean;
  /** Block alignment, with `left` as the canonical default (fixes R6). */
  enableAlign?: boolean;
  /** Block indent and outdent. */
  enableIndent?: boolean;
  /** Bulleted and numbered lists, with nesting. */
  enableLists?: boolean;
  /** Checklists, which need `enableLists` as well. */
  enableCheckList?: boolean;
  /** Blockquotes. */
  enableBlockquote?: boolean;
  /** Fenced code blocks with syntax highlighting. */
  enableCodeBlock?: boolean;
  /** Links, the link popover and URL validation. */
  enableLinks?: boolean;
  /** Images, including upload, drag-and-drop and paste. */
  enableImages?: boolean;
  /** Tables and their editing controls. */
  enableTables?: boolean;
  /** Horizontal rules. */
  enableHorizontalRule?: boolean;
  /** The emoji picker and its `:` trigger. */
  enableEmoji?: boolean;
  /** Mentions and their `@` trigger, configured through `mentions`. */
  enableMentions?: boolean;
  /** Merge tags as atomic nodes, configured through `mergeTags` (fixes R23). */
  enableMergeTags?: boolean;
  /** Undo and redo, with their bindings and toolbar controls. */
  enableHistory?: boolean;
  /** Markdown input rules, such as `# ` for a heading. */
  enableMarkdownShortcuts?: boolean;
  /** The find-and-replace panel. */
  enableFindReplace?: boolean;
  /** The HTML source view, which sanitizes on apply. */
  enableSourceView?: boolean;
  /** The fullscreen toggle. */
  enableFullscreen?: boolean;
  /** The "clear formatting" command. */
  enableClearFormatting?: boolean;
  /** Word counting, which `countUnit: 'words'` needs. */
  enableWordCount?: boolean;
}

/** The full prop surface of `<RichTextEditor>`. */
export interface RichTextEditorProps extends FeatureFlagProps {
  // ── 2.1 value and change ─────────────────────────────────────────────────
  /** Controlled value, in `valueFormat`. */
  value?: EditorValue;
  /** Uncontrolled initial value. @default '' */
  defaultValue?: EditorValue;
  /** What `value`, `defaultValue` and `onChange` speak. @default 'html' */
  valueFormat?: ValueFormat;
  /** Every content change, with the source that caused it (fixes R21). */
  onChange?: (value: EditorValue, meta: ChangeMeta) => void;
  /** Same payload as `onChange`, debounced by `changeDebounceMs`. */
  onChangeDebounced?: (value: EditorValue, meta: ChangeMeta) => void;
  /** How long the typing has to stop before `onChangeDebounced` runs. @default 300 */
  changeDebounceMs?: number;
  /** Focus left the editor for something outside it (fixes R9). */
  onBlur?: (event: FocusEvent) => void;
  /** Focus entered the editor. */
  onFocus?: (event: FocusEvent) => void;
  /** The selection moved, or collapsed to nothing (fixes R8). */
  onSelectionChange?: (selection: EditorSelection | null) => void;
  /** Fired once, when the engine has mounted. */
  onReady?: (editor: EditorInstance) => void;
  /** Content that was dropped or downgraded on input. A development aid. */
  onContentWarning?: (warnings: ContentWarning[]) => void;
  /** Anything the engine, a plugin or a serializer threw. */
  onError?: (error: unknown) => void;

  // ── 2.2 editing state ────────────────────────────────────────────────────
  /** Not focusable, dimmed, `aria-disabled`. What forms should use. @default false */
  disabled?: boolean;
  /** Selection and copy still work; editing does not. @default false */
  readOnly?: boolean;
  /** Take focus on mount, optionally placing the caret. @default false */
  autoFocus?: boolean | 'start' | 'end';
  /** Shown over an empty document (fixes R24). @default localization.editor.placeholder */
  placeholder?: ReactNode;
  /** Browser spell-checking inside the content element. @default true */
  spellCheck?: boolean;
  /** Writing direction; `rtl` mirrors the whole field, including the toolbar. */
  dir?: 'ltr' | 'rtl' | 'auto';
  /** The content language, for spell-checking and screen-reader pronunciation. */
  lang?: string;
  /** Tab order of the content element. @default 0 */
  tabIndex?: number;
  /** Receives the {@link EditorInstance} once the engine has mounted. */
  editorRef?: Ref<EditorInstance>;
  /** Swap the document engine. @default the Lexical adapter */
  engine?: EditorEngine;

  // ── 2.3 features and plugins ─────────────────────────────────────────────
  /** The plugin bundle and the props it implies. @default 'standard' */
  preset?: PresetName;
  /** Replaces the preset's plugin list entirely. */
  plugins?: RtePlugin[];
  /** Plugins added on top of the preset's list. */
  addPlugins?: RtePlugin[];
  /** Names of plugins the preset included that this editor does not want. */
  removePlugins?: string[];
  /** Per-plugin options, keyed by plugin name. */
  pluginOptions?: Record<string, unknown>;
  /** Which heading levels the dropdown and the schema allow. @default [1,2,3] */
  headingLevels?: HeadingLevel[];
  /** The font-family dropdown's options. */
  fontFamilies?: { label: string; value: string }[];
  /** The font-size dropdown's options. */
  fontSizes?: { label: string; value: string }[];
  /** Swatches, columns and the custom-colour option. @default the 21 classic swatches */
  colors?: ColorPaletteConfig;
  /** The merge tags this editor knows, and how they are triggered (05 §10). */
  mergeTags?: MergeTagsConfig;
  /** The mention provider, trigger and rendering. */
  mentions?: MentionsConfig;
  /** The `/` command palette. @default true in the `full` preset */
  slashMenu?: boolean | SlashMenuConfig;
  /** Markdown input rules, or an explicit list of them. @default true */
  markdownShortcuts?: boolean | MarkdownShortcutConfig[];

  // ── 2.4 content rules and validation ─────────────────────────────────────
  /** Counts text in `countUnit`, never markup (fixes R3). */
  maxLength?: number;
  /** What `maxLength` and the counter measure. @default 'characters' */
  countUnit?: CountUnit;
  /** Whether the limit refuses further input or only warns. @default 'block' */
  maxLengthBehaviour?: 'block' | 'warn';
  /** When to show the counter. @default false, or true when `maxLength` is set */
  showCounter?: boolean | 'always' | 'nearLimit';
  /** Drives `aria-required` and the `isEmpty` check (fixes R2). @default false */
  required?: boolean;
  /** `true` sets the error state; a string also renders as the message. @default false */
  error?: boolean | string;
  /** Description below the field, linked with `aria-describedby` (fixes R16). */
  helperText?: ReactNode;
  /** Renders a `<label>` bound to the content element. */
  label?: ReactNode;
  /** Visually hidden but still announced. @default false */
  hideLabel?: boolean;
  /** Returns a message for invalid content, or `null` when it is acceptable. */
  validate?: (ctx: ValidateContext) => string | null;
  /** The input sanitization profile, or an explicit config (03 §4). @default 'standard' */
  sanitize?: SanitizeOption;
  /** Sanitize again on the way out, so a bug upstream cannot leak. @default true */
  sanitizeOutput?: boolean;
  /** The HTML dialect `getHTML` produces (03 §5). @default 'standard' */
  htmlProfile?: HtmlProfile;
  /** Inlining, width and table-layout choices for the `email` profile. */
  emailOptions?: EmailOutputOptions;
  /** How legacy markup, such as Quill's, is read and written back. */
  interop?: InteropOptions;
  /** Rich, plain or cleaned paste, statically or per paste. @default 'rich' */
  pasteMode?: PasteMode | ((ctx: PasteHandlerContext) => PasteMode);
  /** Offer "Keep / Remove formatting" after a rich office paste. @default false */
  pastePrompt?: boolean;
  /** Turn pasted URLs into links. @default true */
  autoLinkOnPaste?: boolean;
  /** Turn typed URLs and e-mail addresses into links (05 §6). @default true */
  autoLink?: boolean;
  /** Protocols a typed URL may be linked with. @default ['https', 'http', 'mailto'] */
  autoLinkProtocols?: string[];
  /** Protocol given to a bare host, in the popover and in autolinking. @default 'https' */
  defaultProtocol?: string;
  /**
   * Rejects or rewrites a URL before it becomes a link (05 §6).
   *
   * Return a message to reject, or `null` to accept. Sanitization runs regardless: a
   * validator can tighten the rules but never loosens them (03 §4.3).
   *
   * @example
   * ```ts
   * linkValidator={(url) => (url.startsWith('https://intra.example/') ? null : 'Internal links only')}
   * ```
   */
  linkValidator?: (url: string) => string | null;
  /** Allow `data:` image sources, which bloat stored content. @default false */
  allowDataUrlImages?: boolean;
  /** Draft saving, its key, its TTL and its restore prompt. */
  autosave?: AutosaveConfig;

  // ── 2.5 layout and chrome ────────────────────────────────────────────────
  /** `false` hides the toolbar entirely. @default the preset's toolbar */
  toolbar?: ToolbarConfig | false;
  /** Which side of the content the toolbar sits on. @default 'top' */
  toolbarPosition?: 'top' | 'bottom' | 'none';
  /** Keep the toolbar visible while a long document scrolls. @default false */
  stickyToolbar?: boolean | { offset?: number };
  /** What happens to items that do not fit at this width. @default 'menu' */
  toolbarOverflow?: 'wrap' | 'menu' | 'scroll';
  /** A toolbar that follows the selection. @default false */
  floatingToolbar?: boolean | FloatingToolbarConfig;
  /** What the bubble menu offers, when it differs from the floating toolbar. */
  bubbleMenuItems?: ToolbarItemSpec[];
  /** Height of the content box before it grows. @default 287 (classic parity) */
  minHeight?: number | string;
  /** Height at which the content starts scrolling instead of growing. */
  maxHeight?: number | string;
  /** Grow with the content rather than scrolling immediately. @default true */
  autoGrow?: boolean;
  /** Offer a drag handle for resizing the content box (fixes R22). @default false */
  resizable?: boolean | 'vertical';
  /** Controlled fullscreen. */
  fullscreen?: boolean;
  /** Start in fullscreen, for an uncontrolled editor. @default false */
  defaultFullscreen?: boolean;
  /** Extra footer content next to the counter. */
  footer?: ReactNode | ((ctx: RenderContext) => ReactNode);
  /** Hide or disable the toolbar in `readOnly` mode. @default 'hide' */
  readOnlyToolbar?: 'hide' | 'disable';

  /** Replaces the toolbar, with the resolved items and the default renderer to hand. */
  renderToolbar?: (
    ctx: RenderContext & {
      items: ToolbarItemSpec[][];
      defaultRender: (override?: { items?: ToolbarItemSpec[][] }) => ReactNode;
    },
  ) => ReactNode;
  /** Replaces the footer row. */
  renderFooter?: (ctx: RenderContext & { defaultRender: () => ReactNode }) => ReactNode;
  /** Replaces the placeholder. */
  renderPlaceholder?: (ctx: RenderContext & { text: string }) => ReactNode;
  /** Replaces the link popover. */
  renderLinkPopover?: (ctx: RenderContext & { defaultRender: () => ReactNode }) => ReactNode;
  /** Replaces the controls shown when an image is selected. */
  renderImagePopover?: (ctx: RenderContext & { defaultRender: () => ReactNode }) => ReactNode;
  /** Replaces the `/` command palette. */
  renderSlashMenu?: (ctx: RenderContext & { defaultRender: () => ReactNode }) => ReactNode;
  /** Replaces the merge-tag menu. */
  renderMergeTagMenu?: (ctx: RenderContext & { defaultRender: () => ReactNode }) => ReactNode;
  /** Replaces the colour palette. */
  renderColorPicker?: (ctx: RenderContext & { defaultRender: () => ReactNode }) => ReactNode;
  /** Replaces the HTML source view. */
  renderSourceView?: (ctx: RenderContext & { defaultRender: () => ReactNode }) => ReactNode;
  /** Replaces the prompt offering to restore an autosaved draft. */
  renderRestoreDraftPrompt?: (ctx: RenderContext & { defaultRender: () => ReactNode }) => ReactNode;

  // ── 2.6 uploads and media ────────────────────────────────────────────────
  /** Hands a file to your own service and returns the attributes to insert. */
  onUpload?: UploadHandler;
  /** Accepted file types, enforced before the upload starts. @default 'image/*' */
  uploadAccept?: string;
  /** Size ceiling, enforced before the file leaves the browser. @default 5 * 1024 * 1024 */
  maxUploadSize?: number;
  /** A rejected or failed upload, with the file it concerned. */
  onUploadError?: (error: unknown, file: File) => void;
  /** Resizing, alignment and caption behaviour for images. */
  imageOptions?: ImageOptions;

  // ── 2.7 customization and theming ────────────────────────────────────────
  /** Replacement components, by slot name (06 §1). */
  slots?: Partial<RteSlots>;
  /** Extra props merged into each slot, statically or per render. */
  slotProps?: RteSlotProps;
  /** Per-slot class names. */
  classNames?: RteClassNames;
  /** Per-slot inline styles. */
  styles?: RteStyles;
  /** Interaction middleware; each wraps one interaction (06 §4). */
  handlers?: Partial<RteHandlers>;
  /** Replacement command implementations, by command id (06 §3). */
  commandOverrides?: CommandOverrides;
  /** Replacement icons, by icon name. */
  icons?: RteIcons;
  /** Message catalogue, merged over the default. */
  localization?: DeepPartial<RteLocalization>;
  /** Theme tokens, merged over the preset's (07 §2). */
  theme?: RteTheme | DeepPartial<RteTheme>;
  /** Light, dark, or follow the operating system. */
  colorScheme?: ColorScheme;
  /** Applied to `.rte-content`, for prose overrides. */
  contentClassName?: string;
  /** Structure and prose styles only, no chrome visuals (07 §7). @default false */
  unstyled?: boolean;
  /** Applied to the root element. */
  className?: string;
  /** Applied to the root element. */
  style?: CSSProperties;
  /** Base for the generated element ids; one is derived when absent (fixes R4). */
  id?: string;

  // ── 2.8 keyboard ─────────────────────────────────────────────────────────
  /** Extra or replacement bindings, keyed by shortcut string. */
  keymap?: Record<string, CommandId | ((ctx: { editor: EditorInstance }) => boolean)>;
  /** Bindings to drop, so the surrounding app can claim them. */
  disableShortcuts?: string[];
  /** What `Tab` does outside a list. @default 'indent' inside lists, otherwise 'focus' */
  tabBehaviour?: TabBehaviour;
  /** `'mod'` makes Ctrl/Cmd+Enter call `onSubmit`. @default false */
  submitOnEnter?: boolean | 'mod';
  /** Called when a submit binding fires, with the current value. */
  onSubmit?: (value: EditorValue, meta: ChangeMeta) => void;
  /** Let Escape move focus out of the editor. @default false */
  escapeExitsEditor?: boolean;
}

/** Options accepted by the headless `useEditor` hook. */
export interface UseEditorOptions
  extends Omit<
    RichTextEditorProps,
    'slots' | 'slotProps' | 'classNames' | 'styles' | 'className' | 'style' | 'renderToolbar'
  > {
  /** Source tag used by the initial `onChange`. @default 'init' */
  initialChangeSource?: ChangeSource;
}

/** `<RteContentView>` props (04 §6). */
export interface RteContentViewProps {
  /** The stored content to render. */
  value: EditorValue;
  /** What `value` is. @default 'html' */
  valueFormat?: ValueFormat;
  /** The profile applied before rendering; never render unsanitized HTML. @default 'standard' */
  sanitize?: SanitizeOption;
  /** Output dialect used when re-serializing non-HTML input. @default 'standard' */
  htmlProfile?: HtmlProfile;
  /** Theme tokens, so stored content matches the editor that produced it. */
  theme?: RteTheme | DeepPartial<RteTheme>;
  /** Light, dark, or follow the operating system. */
  colorScheme?: ColorScheme;
  /** Applied to the container. */
  className?: string;
  /** Applied to the container. */
  style?: CSSProperties;
  /** Render merge tags with these sample values instead of `{key}`. */
  mergeTagPreview?: Record<string, string>;
  /** Element rendered as the container. @default 'div' */
  as?: 'div' | 'article' | 'section';
  /** Prose styles only, no chrome visuals. @default false */
  unstyled?: boolean;
  /** The container's element id. */
  id?: string;
}
