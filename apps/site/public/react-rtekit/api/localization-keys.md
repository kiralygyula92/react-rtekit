---
pluginId: react-rtekit
pathname: /react-rtekit/api/localization-keys/
title: Localization keys
description: 'All 153 catalogue keys, for translating the editor''s own strings.'
archetype: E
section: reference
---

# Localization keys

<!--
  Generated from the TypeScript declarations. Do not author anything here:
  structure comes from reference/{symbol}.schema.json and prose from
  reference/{symbol}.strings.json, and this region is replaced wholesale.
-->

<!-- generated:reference:start -->

## Used by

- [Localization](/react-rtekit/localization/)

## Import

```ts
import { meta } from 'react-rtekit/meta';
```

## Options

Every string the editor can show, including the `aria-label`s and the live-region announcements — nothing is hard-coded in a component. A catalogue is a partial object: supply only the keys you want to change and the rest fall back to English.

| Name | Type | Required | Description |
|---|---|---|---|
| `announce.draftRestored` | `string` | no | Default: `Draft restored` |
| `announce.findResults` | `string` | no | Default: a function returning `{count} results`. |
| `announce.formatApplied` | `string` | no | Default: a function returning `{format} applied`. |
| `announce.formatRemoved` | `string` | no | Default: a function returning `{format} removed`. |
| `announce.imageInserted` | `string` | no | Default: `Image inserted` |
| `announce.linkInserted` | `string` | no | Default: `Link inserted` |
| `announce.linkRemoved` | `string` | no | Default: `Link removed` |
| `announce.listLevel` | `string` | no | Default: a function returning `List level {level}`. |
| `announce.overLimit` | `string` | no | Default: `You have reached the character limit` |
| `color.apply` | `string` | no | Default: `Apply` |
| `color.automatic` | `string` | no | Default: `Automatic` |
| `color.custom` | `string` | no | Default: `Custom color` |
| `color.recent` | `string` | no | Default: `Recent` |
| `color.reset` | `string` | no | Default: `Reset` |
| `color.swatch` | `string` | no | Default: a function returning `Color {color}`. |
| `color.title` | `string` | no | Default: `Text color` |
| `counter.characters` | `string` | no | Default: a function returning `{count} characters`. |
| `counter.limit` | `string` | no | Default: a function returning `{count} / {max}`. |
| `counter.overLimit` | `string` | no | Default: `Over the limit` |
| `counter.words` | `string` | no | Default: a function returning `{count} words`. |
| `dir` | `string` | no | Default: `ltr` |
| `draft.discard` | `string` | no | Default: `Discard` |
| `draft.restore` | `string` | no | Default: `Restore` |
| `draft.restoreBody` | `string` | no | Default: a function returning `Saved {time}`. |
| `draft.restoreTitle` | `string` | no | Default: `Unsaved draft found` |
| `editor.empty` | `string` | no | Default: `Empty` |
| `editor.label` | `string` | no | Default: `Rich text editor` |
| `editor.placeholder` | `string` | no | Default: `Write something…` |
| `emoji.noResults` | `string` | no | Default: `No emoji found` |
| `emoji.search` | `string` | no | Default: `Search emoji` |
| `emoji.title` | `string` | no | Default: `Emoji` |
| `find.close` | `string` | no | Default: `Close` |
| `find.find` | `string` | no | Default: `Find` |
| `find.matchCase` | `string` | no | Default: `Match case` |
| `find.next` | `string` | no | Default: `Next match` |
| `find.noResults` | `string` | no | Default: `No results` |
| `find.previous` | `string` | no | Default: `Previous match` |
| `find.regex` | `string` | no | Default: `Regular expression` |
| `find.replace` | `string` | no | Default: `Replace` |
| `find.replaceAll` | `string` | no | Default: `Replace all` |
| `find.results` | `string` | no | Default: a function returning `{index} of {total}`. |
| `find.title` | `string` | no | Default: `Find and replace` |
| `find.wholeWord` | `string` | no | Default: `Whole word` |
| `image.alignCenter` | `string` | no | Default: `Align center` |
| `image.alignLeft` | `string` | no | Default: `Align left` |
| `image.alignRight` | `string` | no | Default: `Align right` |
| `image.alt` | `string` | no | Default: `Alt text` |
| `image.cancel` | `string` | no | Default: `Cancel` |
| `image.caption` | `string` | no | Default: `Caption` |
| `image.decorative` | `string` | no | Default: `Decorative (no alt text)` |
| `image.insert` | `string` | no | Default: `Insert` |
| `image.invalidUrl` | `string` | no | Default: `Enter a valid image URL` |
| `image.remove` | `string` | no | Default: `Remove` |
| `image.replace` | `string` | no | Default: `Replace` |
| `image.resize` | `string` | no | Default: `Drag to resize` |
| `image.retry` | `string` | no | Default: `Retry` |
| `image.title` | `string` | no | Default: `Image` |
| `image.tooLarge` | `string` | no | Default: a function returning `File is too large. Max {size}`. |
| `image.upload` | `string` | no | Default: `Upload` |
| `image.uploadFailed` | `string` | no | Default: `Upload failed` |
| `image.uploading` | `string` | no | Default: `Uploading…` |
| `image.url` | `string` | no | Default: `Image URL` |
| `image.width` | `string` | no | Default: `Width` |
| `image.wrongType` | `string` | no | Default: `That file type is not allowed` |
| `link.apply` | `string` | no | Default: `Apply` |
| `link.invalidUrl` | `string` | no | Default: `Enter a valid URL` |
| `link.newTab` | `string` | no | Default: `Open in new tab` |
| `link.open` | `string` | no | Default: `Open` |
| `link.remove` | `string` | no | Default: `Remove` |
| `link.text` | `string` | no | Default: `Text` |
| `link.title` | `string` | no | Default: `Link` |
| `link.url` | `string` | no | Default: `URL` |
| `locale` | `string` | no | Default: `en` |
| `mention.loading` | `string` | no | Default: `Searching…` |
| `mention.noResults` | `string` | no | Default: `No matches` |
| `mention.search` | `string` | no | Default: `Search people` |
| `mergeTag.noResults` | `string` | no | Default: `No variables found` |
| `mergeTag.preview` | `string` | no | Default: `Preview values` |
| `mergeTag.search` | `string` | no | Default: `Search variables` |
| `mergeTag.title` | `string` | no | Default: `Variables` |
| `mergeTag.unknown` | `string` | no | Default: a function returning `Unknown variable {{key}}`. |
| `paste.keepFormatting` | `string` | no | Default: `Keep formatting` |
| `paste.removeFormatting` | `string` | no | Default: `Remove formatting` |
| `shortcuts.close` | `string` | no | Default: `Close` |
| `shortcuts.title` | `string` | no | Default: `Keyboard shortcuts` |
| `slash.noResults` | `string` | no | Default: `No commands found` |
| `slash.search` | `string` | no | Default: `Search commands` |
| `slash.title` | `string` | no | Default: `Insert` |
| `sourceView.apply` | `string` | no | Default: `Apply` |
| `sourceView.cancel` | `string` | no | Default: `Cancel` |
| `sourceView.invalid` | `string` | no | Default: `The HTML could not be parsed` |
| `sourceView.title` | `string` | no | Default: `HTML source` |
| `table.addColumnAfter` | `string` | no | Default: `Insert column right` |
| `table.addColumnBefore` | `string` | no | Default: `Insert column left` |
| `table.addRowAfter` | `string` | no | Default: `Insert row below` |
| `table.addRowBefore` | `string` | no | Default: `Insert row above` |
| `table.columns` | `string` | no | Default: `Columns` |
| `table.deleteColumn` | `string` | no | Default: `Delete column` |
| `table.deleteRow` | `string` | no | Default: `Delete row` |
| `table.deleteTable` | `string` | no | Default: `Delete table` |
| `table.headerRow` | `string` | no | Default: `Header row` |
| `table.insert` | `string` | no | Default: `Insert table` |
| `table.rows` | `string` | no | Default: `Rows` |
| `table.size` | `string` | no | Default: a function returning `{rows} × {columns}`. |
| `toolbar.align` | `string` | no | Default: `Alignment` |
| `toolbar.alignCenter` | `string` | no | Default: `Align center` |
| `toolbar.alignJustify` | `string` | no | Default: `Justify` |
| `toolbar.alignLeft` | `string` | no | Default: `Align left` |
| `toolbar.alignRight` | `string` | no | Default: `Align right` |
| `toolbar.backgroundColor` | `string` | no | Default: `Highlight color` |
| `toolbar.blockType` | `string` | no | Default: `Block type` |
| `toolbar.blockquote` | `string` | no | Default: `Quote` |
| `toolbar.bold` | `string` | no | Default: `Bold` |
| `toolbar.bulletList` | `string` | no | Default: `Bulleted list` |
| `toolbar.checkList` | `string` | no | Default: `Check list` |
| `toolbar.clearFormatting` | `string` | no | Default: `Clear formatting` |
| `toolbar.code` | `string` | no | Default: `Inline code` |
| `toolbar.codeBlock` | `string` | no | Default: `Code block` |
| `toolbar.color` | `string` | no | Default: `Text color` |
| `toolbar.emoji` | `string` | no | Default: `Emoji` |
| `toolbar.exitFullscreen` | `string` | no | Default: `Exit fullscreen` |
| `toolbar.findReplace` | `string` | no | Default: `Find and replace` |
| `toolbar.fontFamily` | `string` | no | Default: `Font` |
| `toolbar.fontSize` | `string` | no | Default: `Font size` |
| `toolbar.fullscreen` | `string` | no | Default: `Fullscreen` |
| `toolbar.heading` | `string` | no | Default: `Heading` |
| `toolbar.headingLevel` | `string` | no | Default: a function returning `Heading {level}`. |
| `toolbar.horizontalRule` | `string` | no | Default: `Divider` |
| `toolbar.image` | `string` | no | Default: `Image` |
| `toolbar.indent` | `string` | no | Default: `Increase indent` |
| `toolbar.italic` | `string` | no | Default: `Italic` |
| `toolbar.label` | `string` | no | Default: `Formatting` |
| `toolbar.link` | `string` | no | Default: `Link` |
| `toolbar.mention` | `string` | no | Default: `Mention` |
| `toolbar.mergeTag` | `string` | no | Default: `Insert variable` |
| `toolbar.more` | `string` | no | Default: `More options` |
| `toolbar.orderedList` | `string` | no | Default: `Numbered list` |
| `toolbar.outdent` | `string` | no | Default: `Decrease indent` |
| `toolbar.paragraph` | `string` | no | Default: `Paragraph` |
| `toolbar.print` | `string` | no | Default: `Print` |
| `toolbar.redo` | `string` | no | Default: `Redo` |
| `toolbar.sourceView` | `string` | no | Default: `HTML source` |
| `toolbar.strike` | `string` | no | Default: `Strikethrough` |
| `toolbar.subscript` | `string` | no | Default: `Subscript` |
| `toolbar.superscript` | `string` | no | Default: `Superscript` |
| `toolbar.table` | `string` | no | Default: `Table` |
| `toolbar.underline` | `string` | no | Default: `Underline` |
| `toolbar.undo` | `string` | no | Default: `Undo` |
| `toolbar.unlink` | `string` | no | Default: `Remove link` |
| `toolbar.wordCount` | `string` | no | Default: `Word count` |
| `validation.invalidHtml` | `string` | no | Default: `The HTML could not be parsed` |
| `validation.maxLength` | `string` | no | Default: a function returning `Must be {max} characters or fewer`. |
| `validation.required` | `string` | no | Default: `This field is required` |

## Source

- [Localization keys](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/src/meta.ts)

<!-- generated:reference:end -->
