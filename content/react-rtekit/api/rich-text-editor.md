---
pluginId: react-rtekit
pathname: /react-rtekit/api/rich-text-editor/
title: RichTextEditor
description: The all-in-one component and every prop it takes.
archetype: E
section: reference
---

# RichTextEditor

<!--
  Generated from the TypeScript declarations. Do not author anything here:
  structure comes from reference/{symbol}.schema.json and prose from
  reference/{symbol}.strings.json, and this region is replaced wholesale.
-->

<!-- generated:reference:start -->

## Used by

- [Composable parts](/react-rtekit/composable-parts/)
- [Headings](/react-rtekit/headings/)
- [HTML interop](/react-rtekit/html-interop/)
- [Paste clean-up](/react-rtekit/paste-cleanup/)
- [Merge tags](/react-rtekit/merge-tags/)
- [Markdown shortcuts](/react-rtekit/markdown-shortcuts/)
- [Counters & limits](/react-rtekit/counters-and-limits/)
- [Colours](/react-rtekit/colours/)
- [Fonts](/react-rtekit/fonts/)
- [Selection toolbar](/react-rtekit/selection-toolbar/)
- [Slash menu](/react-rtekit/slash-menu/)
- [Emoji](/react-rtekit/emoji/)
- [Mentions](/react-rtekit/mentions/)
- [Fullscreen](/react-rtekit/fullscreen/)
- [Keyboard shortcuts](/react-rtekit/keyboard-shortcuts/)
- [Autosave & drafts](/react-rtekit/autosave/)
- [Read-only & disabled](/react-rtekit/read-only-and-disabled/)
- [Mobile](/react-rtekit/mobile/)
- [Engine adapter](/react-rtekit/engine-adapter/)
- [Accessibility](/react-rtekit/accessibility/)
- [Server rendering](/react-rtekit/server-rendering/)
- [Performance](/react-rtekit/performance/)
- [Forms](/react-rtekit/forms/)

## Import

```ts
import { RichTextEditor } from 'react-rtekit';
import { RichTextEditorProps } from 'react-rtekit';
```

## Options

### RichTextEditor

A complete rich-text field: toolbar, content, label, helper text, error and counter.

This symbol takes no options.

### RichTextEditorProps

The full prop surface of `<RichTextEditor>`.

| Name | Type | Required | Description |
|---|---|---|---|
| `enableBold` | `boolean` | no | Bold, with its `Mod+B` binding. |
| `enableItalic` | `boolean` | no | Italic, with its `Mod+I` binding. |
| `enableUnderline` | `boolean` | no | Underline, with its `Mod+U` binding. |
| `enableStrike` | `boolean` | no | Strikethrough. |
| `enableCode` | `boolean` | no | Inline code, as a mark rather than a block. |
| `enableSubSup` | `boolean` | no | Subscript and superscript, which are mutually exclusive. |
| `enableColor` | `boolean` | no | Text colour, with the palette from `colors`. |
| `enableBackgroundColor` | `boolean` | no | Background colour, with the same palette. |
| `enableFontFamily` | `boolean` | no | The font-family dropdown, populated from `fontFamilies`. |
| `enableFontSize` | `boolean` | no | The font-size dropdown, populated from `fontSizes`. |
| `enableHeadings` | `boolean` | no | Headings at the levels given by `headingLevels`. |
| `enableAlign` | `boolean` | no | Block alignment, with `left` as the canonical default (fixes R6). |
| `enableIndent` | `boolean` | no | Block indent and outdent. |
| `enableLists` | `boolean` | no | Bulleted and numbered lists, with nesting. |
| `enableCheckList` | `boolean` | no | Checklists, which need `enableLists` as well. |
| `enableBlockquote` | `boolean` | no | Blockquotes. |
| `enableCodeBlock` | `boolean` | no | Fenced code blocks with syntax highlighting. |
| `enableLinks` | `boolean` | no | Links, the link popover and URL validation. |
| `enableImages` | `boolean` | no | Images, including upload, drag-and-drop and paste. |
| `enableTables` | `boolean` | no | Tables and their editing controls. |
| `enableHorizontalRule` | `boolean` | no | Horizontal rules. |
| `enableEmoji` | `boolean` | no | The emoji picker and its `:` trigger. |
| `enableMentions` | `boolean` | no | Mentions and their `@` trigger, configured through `mentions`. |
| `enableMergeTags` | `boolean` | no | Merge tags as atomic nodes, configured through `mergeTags` (fixes R23). |
| `enableMarkdownShortcuts` | `boolean` | no | Markdown input rules, such as `# ` for a heading. |
| `enableFindReplace` | `boolean` | no | The find-and-replace panel. |
| `enableSourceView` | `boolean` | no | The HTML source view, which sanitizes on apply. |
| `enableFullscreen` | `boolean` | no | The fullscreen toggle. |
| `value` | `EditorValue` | no | Controlled value, in `valueFormat`. |
| `defaultValue` | `EditorValue` | no | Uncontrolled initial value. |
| `valueFormat` | `ValueFormat` | no | What `value`, `defaultValue` and `onChange` speak. |
| `onChange` | `function` | no | Every content change, with the source that caused it (fixes R21). |
| `onChangeDebounced` | `function` | no | Same payload as `onChange`, debounced by `changeDebounceMs`. |
| `changeDebounceMs` | `number` | no | How long the typing has to stop before `onChangeDebounced` runs. |
| `onBlur` | `function` | no | Focus left the editor for something outside it (fixes R9). |
| `onFocus` | `function` | no | Focus entered the editor. |
| `onSelectionChange` | `function` | no | The selection moved, or collapsed to nothing (fixes R8). |
| `onReady` | `function` | no | Fired once, when the engine has mounted. |
| `onContentWarning` | `function` | no | Content that was dropped or downgraded on input. A development aid. |
| `onError` | `function` | no | Anything the engine, a plugin or a serializer threw. |
| `disabled` | `boolean` | no | Not focusable, dimmed, `aria-disabled`. What forms should use. |
| `readOnly` | `boolean` | no | Selection and copy still work; editing does not. |
| `autoFocus` | `boolean \| "start" \| "end"` | no | Take focus on mount, optionally placing the caret. |
| `placeholder` | `ReactNode` | no | Shown over an empty document (fixes R24). |
| `spellCheck` | `boolean` | no | Browser spell-checking inside the content element. |
| `dir` | `"ltr" \| "rtl" \| "auto"` | no | Writing direction; `rtl` mirrors the whole field, including the toolbar. |
| `lang` | `string` | no | The content language, for spell-checking and screen-reader pronunciation. |
| `tabIndex` | `number` | no | Tab order of the content element. |
| `editorRef` | `Ref<EditorInstance>` | no | Receives the EditorInstance once the engine has mounted. |
| `engine` | `EditorEngine` | no | Swap the document engine. |
| `preset` | `PresetName` | no | The plugin bundle and the props it implies. |
| `plugins` | `RtePlugin<unknown>[]` | no | Replaces the preset's plugin list entirely. |
| `addPlugins` | `RtePlugin<unknown>[]` | no | Plugins added on top of the preset's list. |
| `removePlugins` | `string[]` | no | Names of plugins the preset included that this editor does not want. |
| `headingLevels` | `HeadingLevel[]` | no | Which heading levels the dropdown and the schema allow. |
| `fontFamilies` | `object[]` | no | The font-family dropdown's options. |
| `fontSizes` | `object[]` | no | The font-size dropdown's options. |
| `colors` | `ColorPaletteConfig` | no | Swatches, columns and the custom-colour option. |
| `mergeTags` | `MergeTagsConfig` | no | The merge tags this editor knows, and how they are triggered. |
| `mentions` | `MentionsConfig` | no | The mention provider, trigger and rendering. |
| `slashMenu` | `boolean \| SlashMenuConfig` | no | The `/` command palette. |
| `markdownShortcuts` | `boolean \| MarkdownShortcutConfig[]` | no | Markdown input rules, or an explicit list of them. |
| `maxLength` | `number` | no | Counts text in `countUnit`, never markup (fixes R3). |
| `countUnit` | `CountUnit` | no | What `maxLength` and the counter measure. |
| `maxLengthBehaviour` | `"warn" \| "block"` | no | Whether the limit refuses further input or only warns. |
| `showCounter` | `boolean \| "always" \| "nearLimit"` | no | When to show the counter. |
| `required` | `boolean` | no | Drives `aria-required` and the `isEmpty` check (fixes R2). |
| `error` | `string \| boolean` | no | `true` sets the error state; a string also renders as the message. |
| `helperText` | `ReactNode` | no | Description below the field, linked with `aria-describedby` (fixes R16). |
| `label` | `ReactNode` | no | Renders a `<label>` bound to the content element. |
| `hideLabel` | `boolean` | no | Visually hidden but still announced. |
| `validate` | `function` | no | Returns a message for invalid content, or `null` when it is acceptable. |
| `sanitize` | `SanitizeOption` | no | The input sanitization profile, or an explicit config. |
| `sanitizeOutput` | `boolean` | no | Sanitize again on the way out, so a bug upstream cannot leak. |
| `htmlProfile` | `HtmlProfile` | no | The HTML dialect `getHTML` produces. |
| `emailOptions` | `EmailOutputOptions` | no | Inlining, width and table-layout choices for the `email` profile. |
| `interop` | `InteropOptions` | no | How legacy markup, such as Quill's, is read and written back. |
| `pasteMode` | `PasteMode \| function` | no | Rich, plain or cleaned paste, statically or per paste. |
| `autoLink` | `boolean` | no | Turn typed URLs and e-mail addresses into links. |
| `autoLinkProtocols` | `string[]` | no | Protocols a typed URL may be linked with. |
| `defaultProtocol` | `string` | no | Protocol given to a bare host, in the popover and in autolinking. |
| `linkValidator` | `function` | no | Rejects or rewrites a URL before it becomes a link. Return a message to reject, or `null` to accept. Sanitization runs regardless: a validator can tighten the rules but never loosens them. |
| `autosave` | `AutosaveConfig` | no | Draft saving, its key, its TTL and its restore prompt. |
| `toolbar` | `false \| ToolbarConfig` | no | `false` hides the toolbar entirely. |
| `toolbarPosition` | `"top" \| "bottom" \| "none"` | no | Which side of the content the toolbar sits on. |
| `stickyToolbar` | `boolean \| object` | no | Keep the toolbar visible while a long document scrolls. |
| `toolbarOverflow` | `"menu" \| "wrap" \| "scroll"` | no | What happens to items that do not fit at this width. |
| `floatingToolbar` | `boolean \| FloatingToolbarConfig` | no | A toolbar that follows the selection. |
| `bubbleMenuItems` | `ToolbarItemSpec[]` | no | What the bubble menu offers, when it differs from the floating toolbar. |
| `minHeight` | `string \| number` | no | Height of the content box before it grows. |
| `maxHeight` | `string \| number` | no | Height at which the content starts scrolling instead of growing. |
| `resizable` | `boolean \| "vertical"` | no | Offer a drag handle for resizing the content box (fixes R22). |
| `fullscreen` | `boolean` | no | Controlled fullscreen. |
| `footer` | `ReactNode \| function` | no | Extra footer content next to the counter. |
| `readOnlyToolbar` | `"hide" \| "disable"` | no | Hide or disable the toolbar in `readOnly` mode. |
| `renderToolbar` | `function` | no | Replaces the toolbar, with the resolved items and the default renderer to hand. |
| `onUpload` | `UploadHandler` | no | Hands a file to your own service and returns the attributes to insert. |
| `uploadAccept` | `string` | no | Accepted file types, enforced before the upload starts. |
| `maxUploadSize` | `number` | no | Size ceiling, enforced before the file leaves the browser. |
| `onUploadError` | `function` | no | A rejected or failed upload, with the file it concerned. |
| `imageOptions` | `ImageOptions` | no | Resizing, alignment and caption behaviour for images. |
| `slots` | `Partial<RteSlots>` | no | Replacement components, by slot name. |
| `handlers` | `Partial<RteHandlers>` | no | Interaction middleware; each wraps one interaction. |
| `commandOverrides` | `CommandOverrides` | no | Replacement command implementations, by command id. |
| `icons` | `RteIcons` | no | Replacement icons, by icon name. |
| `localization` | `object` | no | Message catalogue, merged over the default. |
| `theme` | `RteTheme \| object` | no | Theme tokens, merged over the preset's. |
| `colorScheme` | `ColorScheme` | no | Light, dark, or follow the operating system. |
| `contentClassName` | `string` | no | Applied to `.rte-content`, for prose overrides. |
| `unstyled` | `boolean` | no | Structure and prose styles only, no chrome visuals. |
| `className` | `string` | no | Applied to the root element. |
| `style` | `CSSProperties` | no | Applied to the root element. |
| `id` | `string` | no | Base for the generated element ids; one is derived when absent (fixes R4). |
| `keymap` | `Record<string, CommandId \| function>` | no | Extra or replacement bindings, keyed by shortcut string. |
| `disableShortcuts` | `string[]` | no | Bindings to drop, so the surrounding app can claim them. |
| `tabBehaviour` | `TabBehaviour` | no | What `Tab` does outside a list. |
| `submitOnEnter` | `boolean \| "mod"` | no | `'mod'` makes Ctrl/Cmd+Enter call `onSubmit`. |
| `onSubmit` | `function` | no | Called when a submit binding fires, with the current value. |
| `escapeExitsEditor` | `boolean` | no | Let Escape move focus out of the editor. |

## Source

- [RichTextEditor](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/react/RichTextEditor.tsx#L108)
- [RichTextEditorProps](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/types/props.ts#L112)

<!-- generated:reference:end -->
