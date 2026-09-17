---
pluginId: react-rtekit
pathname: /react-rtekit/api/handlers/
title: Handler catalogue
description: All 18 middleware points, and the context each one receives.
archetype: E
section: reference
---

# Handler catalogue

<!--
  Generated from the TypeScript declarations. Do not author anything here:
  structure comes from reference/{symbol}.schema.json and prose from
  reference/{symbol}.strings.json, and this region is replaced wholesale.
-->

<!-- generated:reference:start -->

## Used by

- [Handler middleware](/react-rtekit/handler-middleware/)

## Import

```ts
import { meta } from 'react-rtekit/meta';
```

## Options

| Name | Type | Required | Description |
|---|---|---|---|
| `onBeforeChange` | `entry` | no | Runs before a change is committed; can veto it. |
| `onPaste` | `entry` | no | Wraps the paste pipeline. |
| `onDrop` | `entry` | no | Wraps drop handling. |
| `onUploadStart` | `entry` | no | Runs before an upload begins. |
| `onUploadError` | `entry` | no | Runs when an upload fails. |
| `onKeyDown` | `entry` | no | Wraps key handling before the keymap. |
| `onLinkClick` | `entry` | no | Runs when a link in the content is clicked. |
| `onLinkOpen` | `entry` | no | Runs before a link is opened. |
| `onToolbarCommand` | `entry` | no | Wraps every toolbar activation. |
| `onFocus` | `entry` | no | Wraps focus handling. |
| `onBlur` | `entry` | no | Wraps blur handling. |
| `onSelectionChange` | `entry` | no | Wraps selection updates. |
| `onMaxLengthExceeded` | `entry` | no | Runs when input would exceed `maxLength`. |
| `onSanitizeViolation` | `entry` | no | Runs for each thing the sanitizer removed. |
| `onFullscreenChange` | `entry` | no | Wraps entering and leaving fullscreen. |
| `onSourceViewToggle` | `entry` | no | Wraps the source-view toggle. |
| `onDraftRestore` | `entry` | no | Wraps restoring a saved draft. |
| `onDraftSave` | `entry` | no | Wraps saving a draft. |

## Source

- [Handler catalogue](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/src/meta.ts)

<!-- generated:reference:end -->
