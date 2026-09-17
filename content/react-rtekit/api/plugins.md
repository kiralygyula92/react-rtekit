---
pluginId: react-rtekit
pathname: /react-rtekit/api/plugins/
title: Plugin catalogue
description: Every built-in plugin and the presets it appears in.
archetype: E
section: reference
---

# Plugin catalogue

<!--
  Generated from the TypeScript declarations. Do not author anything here:
  structure comes from reference/{symbol}.schema.json and prose from
  reference/{symbol}.strings.json, and this region is replaced wholesale.
-->

<!-- generated:reference:start -->

## Used by

- [Markdown shortcuts](/react-rtekit/markdown-shortcuts/)
- [Presets](/react-rtekit/presets/)

## Import

```ts
import { meta } from 'react-rtekit/meta';
```

## Options

Every plugin the package ships, and the presets that load each one. A preset is a list of these names; pass `plugins` yourself to load a different set. Loading a plugin is what turns its capability on — the toolbar item alone does nothing.

| Name | Type | Required | Description |
|---|---|---|---|
| `align` | `entry` | no | In presets: classic, email, full, standard. |
| `backgroundColor` | `entry` | no | In presets: full. |
| `blockquote` | `entry` | no | In presets: email, full, standard. |
| `bold` | `entry` | no | In presets: classic, comment, email, full, minimal, standard. |
| `checkList` | `entry` | no | In presets: full. |
| `clearFormatting` | `entry` | no | In presets: email, full, standard. |
| `code` | `entry` | no | In presets: comment, full. |
| `codeBlock` | `entry` | no | In presets: full. |
| `color` | `entry` | no | In presets: classic, email, full, standard. |
| `counter` | `entry` | no | In presets: email, full, standard. |
| `emoji` | `entry` | no | In presets: comment. |
| `findReplace` | `entry` | no | In presets: full. |
| `floatingToolbar` | `entry` | no | In presets: full. |
| `fontFamily` | `entry` | no | In presets: email, full. |
| `fontSize` | `entry` | no | In presets: email, full. |
| `fullscreen` | `entry` | no | In presets: full. |
| `heading` | `entry` | no | In presets: email, full, standard. |
| `history` | `entry` | no | In presets: classic, comment, email, full, minimal, standard. |
| `horizontalRule` | `entry` | no | In presets: email, full. |
| `image` | `entry` | no | In presets: email, full. |
| `indent` | `entry` | no | In presets: email, full, standard. |
| `italic` | `entry` | no | In presets: classic, comment, email, full, minimal, standard. |
| `link` | `entry` | no | In presets: comment, email, full, minimal, standard. |
| `list` | `entry` | no | In presets: classic, comment, email, full, standard. |
| `markdownShortcuts` | `entry` | no | In presets: email, full, standard. |
| `mention` | `entry` | no | In presets: comment. |
| `mergeTag` | `entry` | no | In presets: email, full. |
| `paragraph` | `entry` | no | In presets: classic, comment, email, full, minimal, standard. |
| `paste` | `entry` | no | In presets: classic, comment, email, full, standard. |
| `placeholder` | `entry` | no | In presets: classic, comment, email, full, minimal, standard. |
| `slashMenu` | `entry` | no | In presets: full. |
| `sourceView` | `entry` | no | In presets: full. |
| `strike` | `entry` | no | In presets: comment, email, full, standard. |
| `subSup` | `entry` | no | In presets: full. |
| `table` | `entry` | no | In presets: full. |
| `trailingParagraph` | `entry` | no | In presets: email, full, standard. |
| `underline` | `entry` | no | In presets: classic, email, full, minimal, standard. |

## Source

- [Plugin catalogue](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/src/meta.ts)

<!-- generated:reference:end -->
