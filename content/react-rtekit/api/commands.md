---
pluginId: react-rtekit
pathname: /react-rtekit/api/commands/
title: Command catalogue
description: All 57 commands, their payloads and what each one does.
archetype: E
section: reference
---

# Command catalogue

<!--
  Generated from the TypeScript declarations. Do not author anything here:
  structure comes from reference/{symbol}.schema.json and prose from
  reference/{symbol}.strings.json, and this region is replaced wholesale.
-->

<!-- generated:reference:start -->

## Used by

- [Text formatting](/react-rtekit/text-formatting/)
- [Commands](/react-rtekit/commands/)

## Import

```ts
import { meta } from 'react-rtekit/meta';
```

## Options

Every command the editor can run. Run one with `editor.exec(id, payload)`, ask `canExec` or `isActive` about it, or replace what it does with `commandOverrides`. Keyboard shortcuts and toolbar buttons both go through this list.

| Name | Type | Required | Description |
|---|---|---|---|
| `toggleBold` | `entry` | no | Toggles bold on the selection. |
| `toggleItalic` | `entry` | no | Toggles italic on the selection. |
| `toggleUnderline` | `entry` | no | Toggles underline on the selection. |
| `toggleStrike` | `entry` | no | Toggles strikethrough on the selection. |
| `toggleCode` | `entry` | no | Toggles inline code on the selection. |
| `toggleSubscript` | `entry` | no | Toggles subscript on the selection. |
| `toggleSuperscript` | `entry` | no | Toggles superscript on the selection. |
| `setColor` | `entry` | no | Sets the text colour; `null` removes it (R14). |
| `setBackgroundColor` | `entry` | no | Sets the highlight colour; `null` removes it. |
| `setFontFamily` | `entry` | no | Sets the font family; `null` removes it. |
| `setFontSize` | `entry` | no | Sets the font size; `null` removes it. |
| `clearFormatting` | `entry` | no | Removes marks, and optionally block formatting. |
| `setBlockType` | `entry` | no | Turns the block into a paragraph, heading, quote or code block. |
| `setAlign` | `entry` | no | Aligns the block; 'left' is the default (R6). |
| `indent` | `entry` | no | Indents the block or list item. |
| `outdent` | `entry` | no | Outdents the block or list item. |
| `toggleBulletList` | `entry` | no | Turns the selection into a bulleted list. |
| `toggleOrderedList` | `entry` | no | Turns the selection into a numbered list. |
| `toggleCheckList` | `entry` | no | Turns the selection into a check list. |
| `insertLink` | `entry` | no | Links the selection. |
| `updateLink` | `entry` | no | Updates the link at the selection. |
| `removeLink` | `entry` | no | Removes the link, keeping the text. |
| `openLinkEditor` | `entry` | no | Opens the link popover. |
| `insertImage` | `entry` | no | Inserts an image. |
| `updateImage` | `entry` | no | Updates the selected image. |
| `removeImage` | `entry` | no | Removes the selected image. |
| `openImageDialog` | `entry` | no | Opens the insert-image dialog. |
| `insertTable` | `entry` | no | Inserts a table. |
| `addRowBefore` | `entry` | no | Adds a row above the current one. |
| `addRowAfter` | `entry` | no | Adds a row below the current one. |
| `addColumnBefore` | `entry` | no | Adds a column before the current one. |
| `addColumnAfter` | `entry` | no | Adds a column after the current one. |
| `deleteRow` | `entry` | no | Deletes the current row. |
| `deleteColumn` | `entry` | no | Deletes the current column. |
| `deleteTable` | `entry` | no | Deletes the table. |
| `toggleHeaderRow` | `entry` | no | Turns the first row into a header row. |
| `insertHorizontalRule` | `entry` | no | Inserts a horizontal rule. |
| `insertLineBreak` | `entry` | no | Inserts a line break inside the block. |
| `insertEmoji` | `entry` | no | Inserts an emoji character. |
| `insertMergeTag` | `entry` | no | Inserts a merge tag as one atomic node (R23). |
| `insertMention` | `entry` | no | Inserts a mention. |
| `insertText` | `entry` | no | Inserts plain text at the selection. |
| `insertHTML` | `entry` | no | Inserts sanitized HTML at the selection. |
| `insertContent` | `entry` | no | Inserts a value in any supported format. |
| `undo` | `entry` | no | Undoes the last change. |
| `redo` | `entry` | no | Redoes the last undone change. |
| `selectAll` | `entry` | no | Selects the whole document. |
| `focusStart` | `entry` | no | Moves the caret to the start. |
| `focusEnd` | `entry` | no | Moves the caret to the end. |
| `toggleSourceView` | `entry` | no | Shows or hides the HTML source view. |
| `toggleFullscreen` | `entry` | no | Enters or leaves fullscreen. |
| `openFindReplace` | `entry` | no | Opens find and replace. |
| `print` | `entry` | no | Prints the content. |
| `pastePlainText` | `entry` | no | Pastes text with no formatting. |
| `openShortcutHelp` | `entry` | no | Opens the shortcut reference (R25). |
| `openColorPicker` | `entry` | no | Opens the colour picker. |
| `openMergeTagMenu` | `entry` | no | Opens the merge-tag insert menu. |

## Source

- [Command catalogue](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/src/meta.ts)

<!-- generated:reference:end -->
