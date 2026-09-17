import type { ReactNode } from 'react';
import type { ResponsiveValue } from './common.js';
import type { CommandId, CommandPayload } from './commands.js';
import type { EditorInstance } from './editor.js';
import type { FormatState } from './selection.js';
import type { RteLocalization } from './localization.js';

/** Toolbar composition. @group Toolbar */

/**
 * A toolbar entry: a built-in name, a plugin's item name, or an item spec.
 *
 * The `string & {}` arm is what lets a plugin's own item be referenced by name —
 * `toolbar={[['bold', 'highlight']]}` — while keeping autocomplete on the built-ins,
 * which a plain `string` would throw away.
 */
export type ToolbarEntry = ToolbarItemName | (string & {}) | ToolbarItemSpec;

/** The built-in toolbar items. `'|'` inserts a separator. */
export type ToolbarItemName =
  | 'undo'
  | 'redo'
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strike'
  | 'code'
  | 'subscript'
  | 'superscript'
  | 'color'
  | 'backgroundColor'
  | 'clearFormatting'
  | 'fontFamily'
  | 'fontSize'
  | 'heading'
  | 'blockType'
  | 'alignLeft'
  | 'alignCenter'
  | 'alignRight'
  | 'alignJustify'
  | 'align'
  | 'indent'
  | 'outdent'
  | 'bulletList'
  | 'orderedList'
  | 'checkList'
  | 'blockquote'
  | 'codeBlock'
  | 'link'
  | 'unlink'
  | 'image'
  | 'table'
  | 'horizontalRule'
  | 'emoji'
  | 'mergeTag'
  | 'mention'
  | 'findReplace'
  | 'sourceView'
  | 'fullscreen'
  | 'print'
  | 'wordCount'
  | '|';

/** What a toolbar item's callbacks receive. */
export interface ToolbarItemContext {
  /** The instance the item acts on. */
  editor: EditorInstance;
  /** Every mark and block format at the selection, for `isActive` and `value`. */
  format: FormatState;
  /** The resolved message catalogue; never hard-code a label here (fixes R17). */
  t: RteLocalization;
}

/** Where a contributed item may appear. */
export type ToolbarItemSurface = 'toolbar' | 'slash' | 'bubble' | 'overflow' | 'contextMenu';

/** One option of a dropdown item. */
export interface ToolbarOption {
  /** What `onSelect` receives, and what `value` is compared against. */
  value: string;
  /** What the option's row shows. */
  label: ReactNode | ((t: RteLocalization) => ReactNode);
  /** A leading icon for the row. */
  icon?: ReactNode;
  /** Rendered in the trigger when this option is active. */
  shortLabel?: ReactNode;
}

/** A toolbar item, whether built-in or contributed by a plugin. */
export interface ToolbarItemSpec {
  /** Unique within the toolbar. */
  name: string;
  /** `button` (default), `toggle`, `dropdown`, `colorPicker`, `separator` or `custom`. */
  kind?: 'button' | 'toggle' | 'dropdown' | 'colorPicker' | 'separator' | 'custom';
  /** The control's icon, statically or derived from the current state. */
  icon?: ReactNode | ((ctx: ToolbarItemContext) => ReactNode);
  /** The accessible name, and the visible one when labels are shown. */
  label: ReactNode | ((t: RteLocalization) => ReactNode);
  /** Shown in the tooltip next to the label, e.g. `'Mod+B'`. */
  shortcut?: string;
  /** Command run by default when the item is activated. */
  command?: CommandId;
  /** Payload for `command`. */
  payload?: CommandPayload<CommandId>;
  /** Whether the control renders as pressed; the default reads `command`. */
  isActive?: (ctx: ToolbarItemContext) => boolean;
  /** Whether the control renders as disabled; the default reads `canExec`. */
  isDisabled?: (ctx: ToolbarItemContext) => boolean;
  /** Runs instead of `command` when the control is activated. */
  onClick?: (ctx: ToolbarItemContext) => void;
  /** Dropdown options; required for `kind: 'dropdown'`. */
  options?: ToolbarOption[] | ((ctx: ToolbarItemContext) => ToolbarOption[]);
  /** Current dropdown value. */
  value?: (ctx: ToolbarItemContext) => string | null;
  /** Runs when a dropdown option is chosen. */
  onSelect?: (value: string, ctx: ToolbarItemContext) => void;
  /** Fully custom rendering, bypassing the button slots. */
  render?: (ctx: ToolbarItemContext) => ReactNode;
  /** Logical grouping used by the slash menu and the overflow menu. */
  group?: string;
  /** Surfaces this item may appear on. @default ['toolbar'] */
  showIn?: ToolbarItemSurface[];
  /** Ordering hint inside a group; lower comes first. @default 0 */
  order?: number;
  /** Keywords used by slash-menu search. */
  keywords?: string[];
}

/** Full toolbar configuration object form. */
export interface ToolbarConfigObject {
  /** The items, grouped; separators are drawn between the inner arrays. */
  items: ToolbarEntry[][];
  /** Keep the toolbar visible while a long document scrolls. @default false */
  sticky?: boolean;
  /** The toolbar's accessible name. @default the catalogue's */
  ariaLabel?: string;
  /** Control height, which density scales further. @default 'md' */
  size?: 'sm' | 'md';
  /** Show labels beside the icons. @default false */
  showLabels?: boolean;
  /** Different item sets per breakpoint, for a toolbar that changes shape. */
  responsive?: ResponsiveValue<ToolbarEntry[][]>;
}

/** `toolbar` prop: a flat list, groups, or the full object. */
export type ToolbarConfig = ToolbarEntry[] | ToolbarEntry[][] | ToolbarConfigObject;

/** An entry in the slash-command palette. */
export interface SlashItemSpec {
  /** Unique within the palette. */
  name: string;
  /** What the row shows. */
  label: ReactNode | ((t: RteLocalization) => ReactNode);
  /** A second line in the row. */
  description?: ReactNode | ((t: RteLocalization) => ReactNode);
  /** A leading icon for the row. */
  icon?: ReactNode;
  /** Extra words the palette's search matches on. */
  keywords?: string[];
  /** The heading the row is filed under. */
  group?: string;
  /** Runs when the row is chosen; the trigger text is already removed. */
  onSelect: (ctx: ToolbarItemContext) => void;
}
