---
pluginId: react-rtekit
pathname: /react-rtekit/api/icons/
title: Icon set
description: All 52 icons the toolbar and menus draw from, and how to replace one of them.
archetype: E
section: reference
---

# Icon set

<!--
  Generated from the TypeScript declarations. Do not author anything here:
  structure comes from reference/{symbol}.schema.json and prose from
  reference/{symbol}.strings.json, and this region is replaced wholesale.
-->

<!-- generated:reference:start -->

## Used by

- [Icons](/react-rtekit/icons/)

## Import

```ts
import { meta } from 'react-rtekit/meta';
```

## Options

Every icon the editor draws, keyed by name. Supply a replacement by passing a component for that name to `icons`; it receives the same props as the built-in, which renders a 24×24 SVG that inherits `currentColor`.

| Name | Type | Required | Description |
|---|---|---|---|
| `alert` | `string` | no | A triangle with an exclamation mark, for error and warning messages. |
| `align` | `string` | no | Alternating long and short lines, the alignment menu trigger. |
| `alignCenter` | `string` | no | Stacked lines centred on the axis. |
| `alignJustify` | `string` | no | Stacked lines of equal length, flush on both sides. |
| `alignLeft` | `string` | no | Stacked lines flush left, ragged right. |
| `alignRight` | `string` | no | Stacked lines flush right, ragged left. |
| `backgroundColor` | `string` | no | A marker pen over a colour bar, for the highlight picker. |
| `blockType` | `string` | no | A capital H, the same glyph as `heading`, opening the block-type menu. |
| `blockquote` | `string` | no | A pair of quotation marks. |
| `bold` | `string` | no | A bold capital B. |
| `bulletList` | `string` | no | Three lines, each preceded by a dot. |
| `check` | `string` | no | A tick, marking the selected item in a menu. |
| `checkList` | `string` | no | Three lines, each preceded by a tick box. |
| `chevronDown` | `string` | no | A solid triangle pointing down, on a control that opens a menu below it. |
| `chevronRight` | `string` | no | A solid triangle pointing right, on a control that expands in place. |
| `clearFormatting` | `string` | no | A letterform with a diagonal slash through it. |
| `close` | `string` | no | A cross, dismissing a popover or a panel. |
| `code` | `string` | no | Angle brackets, for inline code. |
| `codeBlock` | `string` | no | Angle brackets in a frame, for a fenced code block. |
| `color` | `string` | no | A capital A over a colour bar, for the text-colour picker. |
| `dragHandle` | `string` | no | Two columns of dots, the grip on a draggable block. |
| `emoji` | `string` | no | A smiling face, opening the emoji picker. |
| `exitFullscreen` | `string` | no | Four arrows pointing inward, leaving fullscreen. |
| `external` | `string` | no | An arrow leaving a box, marking a link that opens elsewhere. |
| `findReplace` | `string` | no | A magnifier beside a curved arrow. |
| `fontFamily` | `string` | no | A capital A, the typeface menu trigger. |
| `fontSize` | `string` | no | Two capital As of different sizes, the size menu trigger. |
| `fullscreen` | `string` | no | Four arrows pointing outward, entering fullscreen. |
| `heading` | `string` | no | A capital H. |
| `horizontalRule` | `string` | no | A single horizontal line, inserting a divider. |
| `image` | `string` | no | A picture frame with a mountain range inside. |
| `indent` | `string` | no | Lines with an arrow pointing right, increasing the indent. |
| `italic` | `string` | no | A slanted capital I. |
| `link` | `string` | no | Two interlocking chain links. |
| `mention` | `string` | no | An at sign, opening the mention menu. |
| `mergeTag` | `string` | no | A pair of braces, inserting a merge tag. |
| `more` | `string` | no | Three dots in a row, opening the items the toolbar could not fit. |
| `orderedList` | `string` | no | Three lines, each preceded by a number. |
| `outdent` | `string` | no | Lines with an arrow pointing left, decreasing the indent. |
| `print` | `string` | no | A printer. |
| `redo` | `string` | no | An arrow curving forward. |
| `search` | `string` | no | A magnifier. |
| `sourceView` | `string` | no | Angle brackets, the same glyph as `code`, switching to the HTML source. |
| `spinner` | `string` | no | A broken ring, drawn rotating while something is in flight. |
| `strike` | `string` | no | A letterform struck through by a horizontal rule. |
| `subscript` | `string` | no | A capital X with a small figure below the baseline. |
| `superscript` | `string` | no | A capital X with a small figure above the line. |
| `table` | `string` | no | A grid of cells. |
| `underline` | `string` | no | A capital U above a rule. |
| `undo` | `string` | no | An arrow curving back. |
| `unlink` | `string` | no | A broken chain link, removing a link. |
| `wordCount` | `string` | no | Four lines of alternating length, for the counter in the footer. |

## Source

- [Icon set](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/src/meta.ts)

<!-- generated:reference:end -->
