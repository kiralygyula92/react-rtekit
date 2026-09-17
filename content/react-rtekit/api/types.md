---
pluginId: react-rtekit
pathname: /react-rtekit/api/types/
title: Types
description: 'The exported types you annotate with: values, documents, themes, slots, handlers and configuration.'
archetype: E
section: reference
---

# Types

<!--
  Generated from the TypeScript declarations. Do not author anything here:
  structure comes from reference/{symbol}.schema.json and prose from
  reference/{symbol}.strings.json, and this region is replaced wholesale.
-->

<!-- generated:reference:start -->

## Used by

- [Value formats](/react-rtekit/value-formats/)
- [Text formatting](/react-rtekit/text-formatting/)
- [Headings](/react-rtekit/headings/)
- [Lists](/react-rtekit/lists/)
- [Check lists](/react-rtekit/check-lists/)
- [Blockquotes](/react-rtekit/blockquotes/)
- [Code blocks](/react-rtekit/code-blocks/)
- [Dividers](/react-rtekit/dividers/)
- [Subscript & superscript](/react-rtekit/subscript-and-superscript/)
- [Clear formatting](/react-rtekit/clear-formatting/)
- [Undo & redo](/react-rtekit/history/)
- [Colours](/react-rtekit/colours/)
- [Fonts](/react-rtekit/fonts/)
- [Alignment](/react-rtekit/alignment/)
- [Indentation](/react-rtekit/indentation/)
- [Tables](/react-rtekit/tables/)
- [Emoji](/react-rtekit/emoji/)
- [Commands](/react-rtekit/commands/)
- [Find & replace](/react-rtekit/find-and-replace/)
- [Images & uploads](/react-rtekit/images/)
- [Links](/react-rtekit/links/)
- [Paste clean-up](/react-rtekit/paste-cleanup/)
- [Mentions](/react-rtekit/mentions/)
- [Handler middleware](/react-rtekit/handler-middleware/)
- [Icons](/react-rtekit/icons/)
- [Localization](/react-rtekit/localization/)
- [Keyboard shortcuts](/react-rtekit/keyboard-shortcuts/)
- [Plugin authoring](/react-rtekit/plugin-authoring/)
- [Slots](/react-rtekit/slots/)
- [Theming](/react-rtekit/theming/)
- [Sanitization](/react-rtekit/sanitization/)
- [E-mail output](/react-rtekit/email-output/)
- [Toolbar](/react-rtekit/toolbar/)
- [Selection toolbar](/react-rtekit/selection-toolbar/)
- [Slash menu](/react-rtekit/slash-menu/)

## Import

```ts
import { ChangeMeta } from 'react-rtekit';
import { CommandId } from 'react-rtekit';
import { EditorDocument } from 'react-rtekit';
import { EditorValue } from 'react-rtekit';
import { FindOptions } from 'react-rtekit';
import { FormatState } from 'react-rtekit';
import { ImageAttrs } from 'react-rtekit';
import { LinkAttrs } from 'react-rtekit';
import { RteHandlers } from 'react-rtekit';
import { RteIcons } from 'react-rtekit';
import { RteLocalization } from 'react-rtekit';
import { RtePlugin } from 'react-rtekit';
import { RteSlots } from 'react-rtekit';
import { RteTheme } from 'react-rtekit';
import { SanitizeConfig } from 'react-rtekit';
import { SanitizeProfileName } from 'react-rtekit';
import { TableOptions } from 'react-rtekit';
import { ToolbarItemSpec } from 'react-rtekit';
import { UploadHandler } from 'react-rtekit';
```

## Options

### ChangeMeta

Metadata passed alongside every `onChange`.

| Name | Type | Required | Description |
|---|---|---|---|
| `source` | `ChangeSource` | yes | What caused the change, which is what keeps a controlled parent from looping. |
| `isEmpty` | `boolean` | yes | True for content that only looks non-empty, such as `<p><br></p>` (fixes R2). |
| `length` | `number` | yes | Length in the configured `countUnit`. |
| `wordCount` | `number` | yes | Words in the document, whatever `countUnit` is set to. |
| `document` | `EditorDocument` | yes | Lazily built — the getter only runs if the consumer reads it. |

### CommandId

Every known command id.

This symbol takes no options.

### EditorDocument

A whole document.

| Name | Type | Required | Description |
|---|---|---|---|
| `type` | `"doc"` | yes | Discriminator. |
| `version` | `1` | yes | Schema version, so stored documents can be migrated rather than guessed at. |
| `content` | `BlockNode[]` | yes | The document's top-level blocks. |

### EditorValue

A value in the currently configured ValueFormat.

This symbol takes no options.

### FindOptions

Find & replace options.

| Name | Type | Required | Description |
|---|---|---|---|
| `matchCase` | `boolean` | no | Match the query's case. |
| `wholeWord` | `boolean` | no | Only match whole words. |
| `regex` | `boolean` | no | Treat the query as a regular expression. |
| `backwards` | `boolean` | no | Search backwards from the current match. |

### FormatState

The formatting that applies to the current selection.

A value-carrying mark is `null` when the selection is mixed, so a toolbar can render
an indeterminate state rather than lying about one of the values.

| Name | Type | Required | Description |
|---|---|---|---|
| `marks` | `object` | yes | Inline formatting; a value mark is `null` when the selection is mixed. |
| `block` | `object` | yes | The block the caret is in, and how it is laid out. |
| `list` | `object` | yes | The list the caret is in, if any, and how deeply nested it is. |
| `link` | `LinkAttrs \| null` | yes | The link the caret is inside, or `null`. |
| `canUndo` | `boolean` | yes | Whether there is anything to undo, which disables the control. |
| `canRedo` | `boolean` | yes | Whether there is anything to redo. |
| `isEmpty` | `boolean` | yes | Whether the document is empty in the `isEmpty` sense (fixes R2). |
| `isCollapsed` | `boolean` | yes | Whether the selection is a caret rather than a range. |

### ImageAttrs

Image attributes as stored on an image node.

| Name | Type | Required | Description |
|---|---|---|---|
| `src` | `string` | yes | The source, sanitized before it reaches the document. |
| `alt` | `string` | no | Alternative text; an empty string marks the image as decorative and is kept. |
| `title` | `string` | no | The image's advisory title. |
| `width` | `number` | no | Intrinsic width in pixels. |
| `height` | `number` | no | Intrinsic height in pixels. |
| `align` | `Align` | no | How the image sits in the flow. |
| `caption` | `string` | no | The caption, which serializes as a `<figure>` with a `<figcaption>`. |

### LinkAttrs

Link attributes as stored on a link node and edited in the link popover.

| Name | Type | Required | Description |
|---|---|---|---|
| `href` | `string` | yes | The destination. Sanitized before it reaches the document. |
| `text` | `string` | no | The link text, used when creating a link at a collapsed caret. |
| `target` | `string` | no | Where the link opens. |
| `rel` | `string` | no | The relationship, which gains `noopener noreferrer` for `_blank`. |
| `title` | `string` | no | The anchor's advisory title. |

### RteHandlers

The overridable interaction surface.

Each handler is `(ctx, next) => void`. Call `next()` (optionally with a partial
context override) to run the built-in behaviour; skip it to cancel.

| Name | Type | Required | Description |
|---|---|---|---|
| `onBeforeChange` | `Middleware<BeforeChangeContext>` | yes | Wraps every content change; skipping `next()` vetoes it. |
| `onPaste` | `Middleware<PasteHandlerContext>` | yes | Wraps every paste, including the sanitization that follows it. |
| `onDrop` | `Middleware<DropHandlerContext>` | yes | Wraps every drop onto the content element. |
| `onUploadStart` | `Middleware<UploadStartContext>` | yes | Wraps each upload before the file leaves the browser. |
| `onUploadError` | `Middleware<UploadErrorContext>` | yes | Wraps the reporting of a rejected or failed upload. |
| `onKeyDown` | `Middleware<KeyDownContext>` | yes | Wraps every keydown, before the keymap acts on it. |
| `onLinkClick` | `Middleware<LinkClickContext>` | yes | Wraps a click on a link inside the content. |
| `onLinkOpen` | `Middleware<LinkOpenContext>` | yes | Wraps following a link, which is where a confirmation belongs. |
| `onToolbarCommand` | `Middleware<ToolbarCommandContext>` | yes | Wraps every toolbar activation, which is where analytics belongs. |
| `onFocus` | `Middleware<FocusHandlerContext>` | yes | Wraps focus entering the editor. |
| `onBlur` | `Middleware<FocusHandlerContext>` | yes | Wraps focus leaving the editor (fixes R9). |
| `onSelectionChange` | `Middleware<SelectionChangeContext>` | yes | Wraps every selection change. |
| `onMaxLengthExceeded` | `Middleware<MaxLengthContext>` | yes | Wraps what happens when input would pass `maxLength`. |
| `onSanitizeViolation` | `Middleware<SanitizeViolationContext>` | yes | Wraps the reporting of something the sanitizer refused. |
| `onFullscreenChange` | `Middleware<OpenStateContext>` | yes | Wraps entering and leaving fullscreen. |
| `onSourceViewToggle` | `Middleware<OpenStateContext>` | yes | Wraps opening and closing the HTML source view. |
| `onDraftRestore` | `Middleware<DraftContext>` | yes | Wraps restoring an autosaved draft. |
| `onDraftSave` | `Middleware<DraftContext>` | yes | Wraps writing an autosave draft. |

### RteIcons

Replaceable icons.

Defaults are in-house 24px inline SVGs drawn with `currentColor`, sized from
`--rte-icon-size`, so no icon package is ever pulled into a consumer's bundle.

This symbol takes no options.

### RteLocalization

The full message catalogue.

| Name | Type | Required | Description |
|---|---|---|---|
| `locale` | `string` | yes | BCP-47 tag of this catalogue, e.g. `'en'`. |
| `dir` | `"ltr" \| "rtl"` | yes | Writing direction of this locale. |
| `editor` | `object` | yes | The field itself: its default name, its placeholder and its empty announcement. |
| `toolbar` | `object` | yes | Every toolbar control, used as both the tooltip and the accessible name. |
| `color` | `object` | yes | The colour picker. |
| `link` | `object` | yes | The link popover. |
| `image` | `object` | yes | The image dialog, the upload placeholder and the image controls. |
| `table` | `object` | yes | The table picker and the table controls. |
| `mergeTag` | `object` | yes | The merge-tag menu and its validation messages. |
| `mention` | `object` | yes | The mention menu, including its loading and empty states. |
| `slash` | `object` | yes | The slash-command palette. |
| `emoji` | `object` | yes | The emoji picker. |
| `find` | `object` | yes | The find-and-replace panel. |
| `counter` | `object` | yes | The character and word counter. |
| `validation` | `object` | yes | The built-in validation messages. |
| `draft` | `object` | yes | The prompt offering to restore an autosaved draft. |
| `shortcuts` | `object` | yes | The keyboard reference dialog. |
| `paste` | `object` | yes | The prompt shown after a rich office paste. |
| `sourceView` | `object` | yes | The HTML source view. |
| `announce` | `object` | yes | Everything sent to the editor's polite live region. |
| `custom` | `Record<string, LocalizedString>` | yes | Keys contributed by plugins live here, flat and dot-separated. |

### RtePlugin

A plugin.

Every built-in feature is one of these, which is what makes `enableX` props,
presets and third-party extensions the same mechanism.

| Name | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | yes | Unique id. Duplicate names are de-duplicated, last registration winning. |
| `dependsOn` | `string[]` | no | Names of plugins that must be set up first. |
| `provides` | `string[]` | no | Feature ids this plugin adds to the active schema. Defaults to `[name]`. |
| `setup` | `object` | no | Runs once on mount; anything it returns is called on teardown. |
| `commands` | `Partial<Record<CommandId, CommandHandler>>` | no | Command handlers, added to the chains of the ids they name. |
| `nodes` | `NodeSpec[]` | no | Custom node types this plugin introduces. |
| `marks` | `MarkSpec[]` | no | Custom inline marks this plugin introduces. |
| `keymap` | `Record<string, CommandId \| function>` | no | `'Mod+B'` style bindings. A string value is a command id. |
| `toolbar` | `ToolbarItemSpec[]` | no | Controls this plugin contributes to the toolbar. |
| `slashItems` | `SlashItemSpec[]` | no | Entries this plugin contributes to the slash palette. |
| `serialize` | `PluginSerializers` | no | Serializer rules, in both directions, so the markup round-trips. |
| `sanitize` | `PluginSanitizeRules` | no | Sanitizer additions, so the markup survives input. |
| `ui` | `ComponentType` | no | Rendered inside the editor root; the home of popovers and menus. |
| `localization` | `Record<string, string>` | no | Extra localization keys, merged under `custom`. |
| `theme` | `object` | no | Extra theme tokens. |
| `options` | `Options` | no | Default options for this plugin. |
| `priority` | `number` | no | Higher runs its command handlers later, so it wins. |

### RteSlots

Every replaceable component.

The last dozen entries are primitives; overriding just those re-skins the whole
editor for a design system.

| Name | Type | Required | Description |
|---|---|---|---|
| `Root` | `SlotComponent<RootSlotProps>` | yes | The outermost element, carrying every state attribute the CSS keys off. |
| `Toolbar` | `SlotComponent<ToolbarSlotProps>` | yes | The toolbar container, including its roving-tabindex keyboard model. |
| `ToolbarGroup` | `SlotComponent<Record<string, never>>` | yes | One group of toolbar items. |
| `ToolbarSeparator` | `SlotComponent<Record<string, never>>` | yes | The divider drawn between toolbar groups. |
| `ToolbarButton` | `SlotComponent<ToolbarButtonSlotProps>` | yes | A toolbar control that performs an action. |
| `ToolbarToggle` | `SlotComponent<ToolbarButtonSlotProps>` | yes | A toolbar control that reflects a format, with `aria-pressed`. |
| `ToolbarDropdown` | `SlotComponent<ToolbarDropdownSlotProps>` | yes | A toolbar control that opens a list of options. |
| `ToolbarOverflow` | `SlotComponent<object>` | yes | The menu holding the items that did not fit at this width. |
| `ColorPicker` | `SlotComponent<ColorPickerSlotProps>` | yes | The colour palette shown by the text- and background-colour controls. |
| `ContentWrapper` | `SlotComponent<Record<string, never>>` | yes | The box around the content, which is what scrolls and grows. |
| `Content` | `SlotComponent<ContentSlotProps>` | yes | The contenteditable surface itself. |
| `Placeholder` | `SlotComponent<object>` | yes | The placeholder shown over an empty document. |
| `Label` | `SlotComponent<object>` | yes | The field label. |
| `HelperText` | `SlotComponent<object>` | yes | The description below the field. |
| `ErrorText` | `SlotComponent<object>` | yes | The validation message, announced when it appears. |
| `Counter` | `SlotComponent<CounterSlotProps>` | yes | The character or word counter. |
| `Footer` | `SlotComponent<Record<string, never>>` | yes | The row below the content that holds the helper text and the counter. |
| `LinkPopover` | `SlotComponent<LinkPopoverSlotProps>` | yes | The popover for creating and editing links. |
| `ImageDialog` | `SlotComponent<Record<string, unknown>>` | yes | The dialog for inserting an image by URL or by file. |
| `ImagePopover` | `SlotComponent<Record<string, unknown>>` | yes | The controls shown when an image is selected. |
| `UploadPlaceholder` | `SlotComponent<UploadPlaceholderSlotProps>` | yes | The stand-in shown while a file uploads. |
| `TablePicker` | `SlotComponent<object>` | yes | The grid for choosing the size of a new table. |
| `TableToolbar` | `SlotComponent<Record<string, unknown>>` | yes | The controls shown when the caret is inside a table. |
| `InlineSuggestMenu` | `SlotComponent<InlineSuggestMenuSlotProps<unknown>>` | yes | The shared popover behind the slash, mention, emoji and merge-tag menus. |
| `MergeTagChip` | `SlotComponent<object>` | yes | One merge tag as it appears inside the document. |
| `SlashMenu` | `SlotComponent<InlineSuggestMenuSlotProps<unknown>>` | yes | The command palette opened by `/`. |
| `EmojiPicker` | `SlotComponent<InlineSuggestMenuSlotProps<unknown>>` | yes | The emoji picker. |
| `MentionList` | `SlotComponent<InlineSuggestMenuSlotProps<unknown>>` | yes | The mention results, including their loading and empty states. |
| `FloatingToolbar` | `SlotComponent<object>` | yes | The toolbar that follows the selection. |
| `BubbleMenu` | `SlotComponent<object>` | yes | The bubble menu shown above a non-empty selection. |
| `FindReplacePanel` | `SlotComponent<FindReplacePanelSlotProps>` | yes | The find-and-replace panel. |
| `SourceView` | `SlotComponent<SourceViewSlotProps>` | yes | The HTML source editor. |
| `FullscreenPortal` | `SlotComponent<object>` | yes | The container the editor moves into in fullscreen mode. |
| `RestoreDraftPrompt` | `SlotComponent<RestoreDraftPromptSlotProps>` | yes | The prompt offering to restore an autosaved draft. |
| `ShortcutHelpDialog` | `SlotComponent<object>` | yes | The keyboard reference, built from the keymap actually in force. |
| `Tooltip` | `SlotComponent<object>` | yes | Wraps a control with its hover and focus description. |
| `Menu` | `SlotComponent<object>` | yes | A menu surface with its own focus management. |
| `MenuItem` | `SlotComponent<object>` | yes | One row of a RteSlots.Menu. |
| `Popover` | `SlotComponent<object>` | yes | A positioned surface anchored to an element, closing on Escape and outside click. |
| `Dialog` | `SlotComponent<object>` | yes | A modal surface that traps focus and returns it to the trigger. |
| `Button` | `SlotComponent<object>` | yes | A labelled button. |
| `IconButton` | `SlotComponent<object>` | yes | A button whose label is not visible and so must be given to assistive technology. |
| `TextInput` | `SlotComponent<object>` | yes | A single-line text field. |
| `Select` | `SlotComponent<object>` | yes | A single-choice control. |
| `Checkbox` | `SlotComponent<object>` | yes | A two-state control with a visible label. |
| `Spinner` | `SlotComponent<object>` | yes | The busy indicator, used while uploads and async providers are pending. |

### RteTheme

The token tree. Every field is optional in overrides via `DeepPartial`.

| Name | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | yes | Identifies the theme in `data-theme` and in the docs site. |
| `font` | `object` | yes | The chrome’s typography, which is separate from the content’s. |
| `color` | `object` | yes | The palette every other group draws from. |
| `editor` | `object` | yes | The content box: its size, its border and its focus ring. |
| `toolbar` | `object` | yes | The toolbar strip. |
| `button` | `object` | yes | Toolbar controls, in each of their states. |
| `popover` | `object` | yes | Every floating surface. |
| `menu` | `object` | yes | Menu rows. |
| `colorPicker` | `object` | yes | The swatch grid. |
| `footer` | `object` | yes | The row below the content holding the helper text and the counter. |
| `helper` | `object` | yes | The helper text. |
| `counter` | `object` | yes | The counter, in each of its three states. |
| `mergeTag` | `object` | yes | Merge-tag chips inside the content. |
| `mention` | `object` | yes | Mention chips inside the content. |
| `selection` | `object` | yes | The selection highlight. |
| `findMatch` | `object` | yes | Search-match highlights, current and otherwise. |
| `content` | `object` | yes | Prose styles, shipped separately so stored content renders identically anywhere. |
| `motion` | `object` | yes | Transition timing, which `prefers-reduced-motion` overrides to none. |
| `z` | `object` | yes | Stacking, so the editor can sit inside an application’s own layers. |
| `density` | `Density` | yes | A multiplier over sizes and paddings, so it composes with any theme. |

### SanitizeConfig

Fine-grained sanitizer configuration.

Anything omitted falls back to the profile the config is merged onto (`standard` by
default). The hard rules cannot be re-enabled from here.

| Name | Type | Required | Description |
|---|---|---|---|
| `allowTags` | `string[]` | no | Tag allowlist. Replaces the profile's list when given. |
| `allowAttributes` | `Record<string, string[]>` | no | Attribute allowlist per tag. The `'*'` key applies to every tag. |
| `allowStyles` | `string[]` | no | CSS property allowlist for inline `style`. |
| `allowClasses` | `string \| RegExp[]` | no | Class-name allowlist. Strings match exactly; regexes are tested against the name. |
| `allowProtocols` | `string[]` | no | URL scheme allowlist. |
| `allowDataUrls` | `boolean \| object` | no | Allow `data:` URLs, optionally restricted to specific MIME types. |
| `allowRelative` | `boolean` | no | Allow protocol-relative and path-relative URLs. |
| `linkRel` | `string` | no | `rel` forced onto links that open in a new tab. |
| `transform` | `function` | no | Per-element hook. Return the element, `null` to drop it, or `'unwrap'` to keep its children. |
| `onViolation` | `function` | no | Called for every removal. |

### SanitizeProfileName

One of the four shipped profiles.

This symbol takes no options.

### TableOptions

Options for `insertTable`.

| Name | Type | Required | Description |
|---|---|---|---|
| `headerRow` | `boolean` | no | Make the first row a header row. |
| `headerColumn` | `boolean` | no | Make the first column a header column. |
| `columnWidths` | `number[]` | no | Column widths as percentages, summing to 100. |

### ToolbarItemSpec

A toolbar item, whether built-in or contributed by a plugin.

| Name | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | yes | Unique within the toolbar. |
| `kind` | `"custom" \| "button" \| "toggle" \| "dropdown" \| "colorPicker" \| "separator"` | no | `button` (default), `toggle`, `dropdown`, `colorPicker`, `separator` or `custom`. |
| `icon` | `ReactNode \| function` | no | The control's icon, statically or derived from the current state. |
| `label` | `ReactNode \| function` | yes | The accessible name, and the visible one when labels are shown. |
| `shortcut` | `string` | no | Shown in the tooltip next to the label, e.g. `'Mod+B'`. |
| `command` | `CommandId` | no | Command run by default when the item is activated. |
| `payload` | `CommandPayload<CommandId>` | no | Payload for `command`. |
| `isActive` | `function` | no | Whether the control renders as pressed; the default reads `command`. |
| `isDisabled` | `function` | no | Whether the control renders as disabled; the default reads `canExec`. |
| `onClick` | `function` | no | Runs instead of `command` when the control is activated. |
| `options` | `ToolbarOption[] \| function` | no | Dropdown options; required for `kind: 'dropdown'`. |
| `value` | `function` | no | Current dropdown value. |
| `onSelect` | `function` | no | Runs when a dropdown option is chosen. |
| `render` | `function` | no | Fully custom rendering, bypassing the button slots. |
| `group` | `string` | no | Logical grouping used by the slash menu and the overflow menu. |
| `showIn` | `ToolbarItemSurface[]` | no | Surfaces this item may appear on. |
| `order` | `number` | no | Ordering hint inside a group; lower comes first. |
| `keywords` | `string[]` | no | Keywords used by slash-menu search. |

### UploadHandler

`onUpload` signature.

This symbol takes no options.

## Source

- [ChangeMeta](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/types/editor.ts#L18)
- [CommandId](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/types/commands.ts#L172)
- [EditorDocument](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/types/document.ts#L289)
- [EditorValue](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/types/common.ts#L30)
- [FindOptions](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/types/editor.ts#L54)
- [FormatState](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/types/selection.ts#L72)
- [ImageAttrs](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/types/commands.ts#L9)
- [LinkAttrs](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/types/selection.ts#L51)
- [RteHandlers](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/types/handlers.ts#L157)
- [RteIcons](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/types/icons.ts#L12)
- [RteLocalization](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/types/localization.ts#L24)
- [RtePlugin](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/types/plugin.ts#L90)
- [RteSlots](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/types/slots.ts#L294)
- [RteTheme](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/types/theme.ts#L18)
- [SanitizeConfig](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/types/sanitize.ts#L53)
- [SanitizeProfileName](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/types/sanitize.ts#L16)
- [TableOptions](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/types/commands.ts#L27)
- [ToolbarItemSpec](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/types/toolbar.ts#L90)
- [UploadHandler](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/types/config.ts#L154)

<!-- generated:reference:end -->
