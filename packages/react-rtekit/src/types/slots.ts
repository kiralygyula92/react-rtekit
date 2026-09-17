import type { ComponentType, CSSProperties, MouseEvent, ReactNode, Ref } from 'react';
import type { EditorInstance, UploadState } from './editor.js';
import type { LinkAttrs } from './selection.js';
import type { ToolbarItemSpec } from './toolbar.js';

/** Slot system. @group Customization */

/** Props every slot receives on top of its own. */
export interface SlotBaseProps {
  /** The class name the theme resolved for this part. Spread it to keep the styling. */
  className?: string;
  /** Inline styles from `styles.<slot>`, already resolved. */
  style?: CSSProperties;
  /** The element ref the editor needs; forward it or measurement and focus break. */
  ref?: Ref<never>;
  /** The part's own content. A replacement that drops it renders an empty shell. */
  children?: ReactNode;
}

/** A replaceable component. Spreading the props it receives keeps all behaviour. */
export type SlotComponent<P> = ComponentType<P & SlotBaseProps>;

/** Context for the `Root` slot: the editor plus every state flag CSS keys off. */
export interface RootSlotProps {
  /** The instance, so a custom root can read state or run commands. */
  editor: EditorInstance;
  /** True while the caret is inside the content element. */
  focused: boolean;
  /** True when the field is disabled, which also makes it unfocusable. */
  disabled: boolean;
  /** True when the content is selectable but not editable. */
  readOnly: boolean;
  /** True when the document has no text, images or other content (fixes R2). */
  empty: boolean;
  /** True when the field is showing an error. */
  invalid: boolean;
}

/** Context for the `Toolbar` slot: the resolved item groups and the ARIA wiring. */
export interface ToolbarSlotProps {
  /** The instance the controls act on. */
  editor: EditorInstance;
  /** Items, already grouped; separators are the gaps between the inner arrays. */
  items: ToolbarItemSpec[][];
  /** The accessible name, from the localization catalogue. */
  'aria-label': string;
  /** Always `toolbar`; the roving-tabindex model depends on it. */
  role: 'toolbar';
}

/** Context shared by the `ToolbarButton` and `ToolbarToggle` slots. */
export interface ToolbarButtonSlotProps {
  /** The command this control runs, when it maps to one. */
  command?: string;
  /** True when the command applies to the current selection. */
  active: boolean;
  /** True when the command cannot run right now. */
  disabled: boolean;
  /** The visible or tooltip label, already localized. */
  label: string;
  /** The key binding in force, formatted for this platform, when there is one. */
  shortcut?: string;
  /** The icon element, from the icon set or an override. */
  icon: ReactNode;
  /** True when the toolbar is configured to show labels beside icons. */
  showLabel?: boolean;
  /** Always calls `preventDefault`, so clicking never moves focus out (fixes R5). */
  onMouseDown: (event: MouseEvent) => void;
  /** Runs the command through the handler middleware. */
  onClick: (event: MouseEvent) => void;
  /** Present on toggles only; a plain button must not claim a pressed state. */
  'aria-pressed'?: boolean;
  /** The accessible name, which includes the shortcut when there is one. */
  'aria-label': string;
  /** The roving-tabindex value: `0` for the one entry point, `-1` for the rest. */
  tabIndex: number;
  /** Always `button`, so the control never submits a surrounding form. */
  type: 'button';
}

/** Context for the `ToolbarDropdown` slot: a button plus its menu state. */
export interface ToolbarDropdownSlotProps extends Omit<ToolbarButtonSlotProps, 'aria-pressed'> {
  /** The selected option, or `null` for a mixed or empty selection. */
  value: string | null;
  /** Everything the dropdown offers, in display order. */
  options: { value: string; label: ReactNode }[];
  /** Applies one option. */
  onSelect: (value: string) => void;
  /** True while the menu is showing. */
  open: boolean;
  /** Opens or closes the menu; the editor keeps the selection while it is open. */
  onOpenChange: (open: boolean) => void;
  /** Mirrors {@link ToolbarDropdownSlotProps.open} for assistive technology. */
  'aria-expanded': boolean;
  /** What the trigger opens, which depends on the kind of dropdown. */
  'aria-haspopup': 'menu' | 'listbox' | 'dialog';
}

/** Context for the `ColorPicker` slot: palette, recents and the clear action. */
export interface ColorPickerSlotProps {
  /** The colour at the selection, or `null` when there is none or it is mixed. */
  value: string | null;
  /** The configured swatches, defaulting to the 21 classic ones. */
  palette: readonly string[];
  /** Recently used colours, most recent first, persisted per editor. */
  recent: readonly string[];
  /** How many swatches per row, so a custom picker can match the grid. */
  columns: number;
  /** True when a free-form colour input is offered. */
  allowCustom: boolean;
  /** True when the picker offers to remove the colour rather than set one. */
  allowClear: boolean;
  /** Applies a colour to the selection. */
  onSelect: (color: string) => void;
  /** Removes the colour, which is not the same as setting black (fixes R14). */
  onClear: () => void;
  /** Closes the popover and returns focus to the trigger. */
  onClose: () => void;
}

/** Context for the `Content` slot: the contenteditable surface and its textbox semantics. */
export interface ContentSlotProps {
  /** The element id other parts point at through `aria-describedby` and `htmlFor`. */
  id: string;
  /** False when the field is disabled or read-only. */
  editable: boolean;
  /** The placeholder text, already localized. */
  placeholder: string;
  /** The accessible name, when `label` did not already provide one. */
  'aria-label'?: string;
  /** The ids of the helper text, counter and error, space separated. */
  'aria-describedby'?: string;
  /** Always true; this is a multi-line textbox. */
  'aria-multiline': true;
  /** True when the field is required, so an empty editor is announced as such. */
  'aria-required'?: boolean;
  /** True when the field is showing an error. */
  'aria-invalid'?: boolean;
  /** Always `textbox`, which is what makes the editor reachable by screen readers. */
  role: 'textbox';
}

/** Context for the `Counter` slot: the count, the limit and the two threshold flags. */
export interface CounterSlotProps {
  /** Links the counter to the content element through `aria-describedby`. */
  id: string;
  /** The current count in `unit`, which counts text rather than HTML (fixes R3). */
  count: number;
  /** The configured limit, when there is one. */
  max?: number;
  /** What is being counted. */
  unit: 'characters' | 'words';
  /** True inside the warning threshold below the limit. */
  nearLimit: boolean;
  /** True past the limit, which only happens when the limit warns rather than blocks. */
  overLimit: boolean;
  /** The formatted string, from the catalogue, so plural rules stay translatable. */
  text: string;
}

/** Context for the `LinkPopover` slot: the link being edited and its actions. */
export interface LinkPopoverSlotProps {
  /** The current URL, or an empty string when creating a link. */
  href: string;
  /** The link text, which is the selected text when creating one. */
  text: string;
  /** The current target, or `null` for the default. */
  target: string | null;
  /** Saves the link; the URL is sanitized whatever is passed. */
  onApply: (attrs: LinkAttrs) => void;
  /** Unwraps the link, leaving its text. */
  onRemove: () => void;
  /** Follows the link through the `onLinkOpen` handler. */
  onOpen: () => void;
  /** Closes the popover and returns focus to the content. */
  onClose: () => void;
  /** Returns an error message for an unacceptable URL, or `null` when it is fine. */
  validate: (url: string) => string | null;
  /** True when editing an existing link rather than creating one. */
  editing: boolean;
}

/** Context for the `UploadPlaceholder` slot: one in-flight upload and its controls. */
export interface UploadPlaceholderSlotProps {
  /** The upload this placeholder stands for, including its progress and error. */
  upload: UploadState;
  /** Runs the upload handler again for the same file. */
  retry: () => void;
  /** Aborts the upload and removes the placeholder. */
  cancel: () => void;
}

/** One row of an {@link InlineSuggestMenuSlotProps} list. */
export interface InlineSuggestMenuItem<T = unknown> {
  /** Stable identity for React and for the active-item announcement. */
  key: string;
  /** What the row shows. */
  label: ReactNode;
  /** A secondary line, such as a mention's e-mail address. */
  description?: ReactNode;
  /** A leading icon, avatar or emoji. */
  icon?: ReactNode;
  /** A heading the row is filed under, for a grouped menu. */
  group?: string;
  /** Whatever the provider needs back when the row is chosen. */
  data: T;
}

/**
 * Context for the `InlineSuggestMenu` slot.
 *
 * The slash menu, mentions, emoji and merge tags all render through this one
 * primitive, so their popovers, keyboard model and a11y are identical.
 */
export interface InlineSuggestMenuSlotProps<T = unknown> {
  /** The rows to show, already filtered by `query`. */
  items: InlineSuggestMenuItem<T>[];
  /** What the user has typed after the trigger character. */
  query: string;
  /** The highlighted row, which Enter chooses. */
  activeIndex: number;
  /** True while an async provider is still fetching. */
  loading?: boolean;
  /** Chooses a row, which inserts it and closes the menu. */
  onSelect: (index: number) => void;
  /** Moves the highlight; the editor keeps the caret where it is. */
  onActiveIndexChange: (index: number) => void;
  /** What to show when nothing matches, already localized. */
  emptyMessage: string;
}

/** Context for the `FindReplacePanel` slot: query state, match position and actions. */
export interface FindReplacePanelSlotProps {
  /** What is being searched for. */
  query: string;
  /** What matches are replaced with. */
  replacement: string;
  /** How many matches the document currently contains. */
  matches: number;
  /** The current match, zero-based, or `-1` when there is none. */
  index: number;
  /** True when the search is case-sensitive. */
  matchCase: boolean;
  /** True when the search only matches whole words. */
  wholeWord: boolean;
  /** True when the query is a regular expression. */
  regex: boolean;
  /** Updates the query, which re-runs the search. */
  onQueryChange: (q: string) => void;
  /** Updates the replacement text. */
  onReplacementChange: (r: string) => void;
  /** Moves to the next match, wrapping at the end. */
  onNext: () => void;
  /** Moves to the previous match, wrapping at the start. */
  onPrevious: () => void;
  /** Replaces the current match and moves to the next. */
  onReplace: () => void;
  /** Replaces every match in one undo step. */
  onReplaceAll: () => void;
  /** Flips one of the three search options. */
  onToggle: (option: 'matchCase' | 'wholeWord' | 'regex') => void;
  /** Closes the panel and returns focus to the content. */
  onClose: () => void;
}

/** Context for the `SourceView` slot: the current HTML and the apply/cancel actions. */
export interface SourceViewSlotProps {
  /** The document serialized to HTML, for editing by hand. */
  html: string;
  /** A parse or sanitizer complaint about what is in the editor, or `null`. */
  error: string | null;
  /** Applies the edited source; it is sanitized before it reaches the document. */
  onApply: (html: string) => void;
  /** Leaves source view without applying anything. */
  onCancel: () => void;
}

/** Context for the `RestoreDraftPrompt` slot: when the draft was saved, and what to do. */
export interface RestoreDraftPromptSlotProps {
  /** When the draft was written, as an epoch timestamp. */
  savedAt: number;
  /** Loads the draft into the editor. */
  restore: () => void;
  /** Throws the draft away and keeps what is in the editor. */
  discard: () => void;
}

/**
 * Every replaceable component.
 *
 * The last dozen entries are primitives; overriding just those re-skins the whole
 * editor for a design system.
 */
export interface RteSlots {
  /** The outermost element, carrying every state attribute the CSS keys off. */
  Root: SlotComponent<RootSlotProps>;
  /** The toolbar container, including its roving-tabindex keyboard model. */
  Toolbar: SlotComponent<ToolbarSlotProps>;
  /** One group of toolbar items. */
  ToolbarGroup: SlotComponent<Record<string, never>>;
  /** The divider drawn between toolbar groups. */
  ToolbarSeparator: SlotComponent<Record<string, never>>;
  /** A toolbar control that performs an action. */
  ToolbarButton: SlotComponent<ToolbarButtonSlotProps>;
  /** A toolbar control that reflects a format, with `aria-pressed`. */
  ToolbarToggle: SlotComponent<ToolbarButtonSlotProps>;
  /** A toolbar control that opens a list of options. */
  ToolbarDropdown: SlotComponent<ToolbarDropdownSlotProps>;
  /** The menu holding the items that did not fit at this width. */
  ToolbarOverflow: SlotComponent<{ hiddenItems: ToolbarItemSpec[]; label: string }>;
  /** The colour palette shown by the text- and background-colour controls. */
  ColorPicker: SlotComponent<ColorPickerSlotProps>;
  /** The box around the content, which is what scrolls and grows. */
  ContentWrapper: SlotComponent<Record<string, never>>;
  /** The contenteditable surface itself. */
  Content: SlotComponent<ContentSlotProps>;
  /** The placeholder shown over an empty document. */
  Placeholder: SlotComponent<{ text: string }>;
  /** The field label. */
  Label: SlotComponent<{ htmlFor: string; required: boolean; hidden: boolean }>;
  /** The description below the field. */
  HelperText: SlotComponent<{ id: string }>;
  /** The validation message, announced when it appears. */
  ErrorText: SlotComponent<{ id: string; role: 'alert' }>;
  /** The character or word counter. */
  Counter: SlotComponent<CounterSlotProps>;
  /** The row below the content that holds the helper text and the counter. */
  Footer: SlotComponent<Record<string, never>>;
  /** The popover for creating and editing links. */
  LinkPopover: SlotComponent<LinkPopoverSlotProps>;
  /** The dialog for inserting an image by URL or by file. */
  ImageDialog: SlotComponent<Record<string, unknown>>;
  /** The controls shown when an image is selected. */
  ImagePopover: SlotComponent<Record<string, unknown>>;
  /** The stand-in shown while a file uploads. */
  UploadPlaceholder: SlotComponent<UploadPlaceholderSlotProps>;
  /** The grid for choosing the size of a new table. */
  TablePicker: SlotComponent<{ onSelect: (rows: number, cols: number) => void }>;
  /** The controls shown when the caret is inside a table. */
  TableToolbar: SlotComponent<Record<string, unknown>>;
  /** The shared popover behind the slash, mention, emoji and merge-tag menus. */
  InlineSuggestMenu: SlotComponent<InlineSuggestMenuSlotProps>;
  /** One merge tag as it appears inside the document. */
  MergeTagChip: SlotComponent<{ tagKey: string; label: string; selected: boolean }>;
  /** The command palette opened by `/`. */
  SlashMenu: SlotComponent<InlineSuggestMenuSlotProps>;
  /** The emoji picker. */
  EmojiPicker: SlotComponent<InlineSuggestMenuSlotProps>;
  /** The mention results, including their loading and empty states. */
  MentionList: SlotComponent<InlineSuggestMenuSlotProps>;
  /** The toolbar that follows the selection. */
  FloatingToolbar: SlotComponent<{ selectionRect: DOMRect | null; items: ToolbarItemSpec[] }>;
  /** The bubble menu shown above a non-empty selection. */
  BubbleMenu: SlotComponent<{ selectionRect: DOMRect | null; items: ToolbarItemSpec[] }>;
  /** The find-and-replace panel. */
  FindReplacePanel: SlotComponent<FindReplacePanelSlotProps>;
  /** The HTML source editor. */
  SourceView: SlotComponent<SourceViewSlotProps>;
  /** The container the editor moves into in fullscreen mode. */
  FullscreenPortal: SlotComponent<{ open: boolean }>;
  /** The prompt offering to restore an autosaved draft. */
  RestoreDraftPrompt: SlotComponent<RestoreDraftPromptSlotProps>;
  /** The keyboard reference, built from the keymap actually in force. */
  ShortcutHelpDialog: SlotComponent<{
    shortcuts: { keys: string; label: string }[];
    onClose: () => void;
  }>;
  // ── primitives: the whole design-system integration surface ──────────────
  /** Wraps a control with its hover and focus description. */
  Tooltip: SlotComponent<{ title: string; children: ReactNode }>;
  /** A menu surface with its own focus management. */
  Menu: SlotComponent<{ open: boolean; onClose: () => void; label: string }>;
  /** One row of a {@link RteSlots.Menu}. */
  MenuItem: SlotComponent<{ selected?: boolean; disabled?: boolean; onSelect: () => void }>;
  /** A positioned surface anchored to an element, closing on Escape and outside click. */
  Popover: SlotComponent<{
    open: boolean;
    anchor: HTMLElement | null;
    onClose: () => void;
    label: string;
    placement?: 'bottom-start' | 'bottom' | 'top' | 'top-start';
  }>;
  /** A modal surface that traps focus and returns it to the trigger. */
  Dialog: SlotComponent<{ open: boolean; onClose: () => void; title: string }>;
  /** A labelled button. */
  Button: SlotComponent<{
    variant?: 'text' | 'solid' | 'outline';
    disabled?: boolean;
    onClick?: () => void;
  }>;
  /** A button whose label is not visible and so must be given to assistive technology. */
  IconButton: SlotComponent<{ label: string; disabled?: boolean; onClick?: () => void }>;
  /** A single-line text field. */
  TextInput: SlotComponent<{
    label?: string;
    value: string;
    onChange: (v: string) => void;
    invalid?: boolean;
  }>;
  /** A single-choice control. */
  Select: SlotComponent<{
    label?: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (v: string) => void;
  }>;
  /** A two-state control with a visible label. */
  Checkbox: SlotComponent<{
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
  }>;
  /** The busy indicator, used while uploads and async providers are pending. */
  Spinner: SlotComponent<{ label?: string }>;
}

/** Every slot name. */
export type SlotName = keyof RteSlots;

/** Per-slot extra props, either static or derived from the slot's own props. */
export type RteSlotProps = {
  [K in SlotName as Uncapitalize<K>]?:
    | Record<string, unknown>
    | ((ctx: Record<string, unknown>) => Record<string, unknown>);
};

/** Per-slot class names, either static or derived. */
export type RteClassNames = {
  [K in SlotName as Uncapitalize<K>]?:
    | string
    | ((ctx: Record<string, unknown>) => string | undefined);
};

/** Per-slot inline styles, either static or derived. */
export type RteStyles = {
  [K in SlotName as Uncapitalize<K>]?:
    | CSSProperties
    | ((ctx: Record<string, unknown>) => CSSProperties | undefined);
};
