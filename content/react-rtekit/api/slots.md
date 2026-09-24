---
pluginId: react-rtekit
pathname: /react-rtekit/api/slots/
title: Slot catalogue
description: All 20 replaceable parts and the props each one receives.
archetype: E
section: reference
---

# Slot catalogue

<!--
  Generated from the TypeScript declarations. Do not author anything here:
  structure comes from reference/{symbol}.schema.json and prose from
  reference/{symbol}.strings.json, and this region is replaced wholesale.
-->

<!-- generated:reference:start -->

## Used by

- [Slots](/react-rtekit/slots/)

## Import

```ts
import { meta } from 'react-rtekit/meta';
```

## Options

Every part of the editor you can replace, keyed by name. Pass a component for a name to `slots` and it renders in place of the built-in one, receiving the same props. A name absent from `slots` keeps its default.

| Name | Type | Required | Description |
|---|---|---|---|
| `ToolbarSeparator` | `entry` | no | The divider between groups. |
| `ToolbarButton` | `entry` | no | A plain toolbar button. |
| `ToolbarToggle` | `entry` | no | A toolbar button with a pressed state. |
| `ToolbarDropdown` | `entry` | no | A toolbar control that opens a menu. |
| `ColorPicker` | `entry` | no | The colour palette, recents and custom input. |
| `Label` | `entry` | no | The field label. |
| `HelperText` | `entry` | no | The helper text below the editor. |
| `ErrorText` | `entry` | no | The validation message, with role="alert". |
| `Counter` | `entry` | no | The character or word counter. |
| `LinkPopover` | `entry` | no | The link editor and preview. |
| `ImagePopover` | `entry` | no | The controls shown for a selected image. |
| `TableToolbar` | `entry` | no | Row and column controls for a selected table. |
| `InlineSuggestMenu` | `entry` | no | The shared list behind every trigger menu. |
| `EmojiPicker` | `entry` | no | The emoji list. |
| `FloatingToolbar` | `entry` | no | The toolbar that follows the selection. |
| `FindReplacePanel` | `entry` | no | The find-and-replace panel. |
| `SourceView` | `entry` | no | The HTML source editor. |
| `RestoreDraftPrompt` | `entry` | no | The prompt offering a saved draft. |
| `ShortcutHelpDialog` | `entry` | no | The keyboard shortcut reference. |
| `Dialog` | `entry` | no | Dialog primitive. |

## Source

- [Slot catalogue](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/src/meta.ts)

<!-- generated:reference:end -->
