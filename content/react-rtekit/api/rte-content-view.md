---
pluginId: react-rtekit
pathname: /react-rtekit/api/rte-content-view/
title: RteContentView
description: The read-only renderer for stored HTML, with the same content styles as the editor.
archetype: E
section: reference
---

# RteContentView

<!--
  Generated from the TypeScript declarations. Do not author anything here:
  structure comes from reference/{symbol}.schema.json and prose from
  reference/{symbol}.strings.json, and this region is replaced wholesale.
-->

<!-- generated:reference:start -->

## Used by

- [Content view](/react-rtekit/content-view/)
- [Server rendering](/react-rtekit/server-rendering/)

## Import

```ts
import { RteContentView } from 'react-rtekit/view';
import { RteContentViewProps } from 'react-rtekit';
```

## Options

### RteContentView

Renders stored content read-only.

This symbol takes no options.

### RteContentViewProps

`<RteContentView>` props.

| Name | Type | Required | Description |
|---|---|---|---|
| `value` | `EditorValue` | yes | The stored content to render. |
| `valueFormat` | `ValueFormat` | no | What `value` is. |
| `sanitize` | `SanitizeOption` | no | The profile applied before rendering; never render unsanitized HTML. |
| `htmlProfile` | `HtmlProfile` | no | Output dialect used when re-serializing non-HTML input. |
| `theme` | `RteTheme \| object` | no | Theme tokens, so stored content matches the editor that produced it. |
| `colorScheme` | `ColorScheme` | no | Light, dark, or follow the operating system. |
| `className` | `string` | no | Applied to the container. |
| `style` | `CSSProperties` | no | Applied to the container. |
| `mergeTagPreview` | `Record<string, string>` | no | Render merge tags with these sample values instead of `{key}`. |
| `as` | `"div" \| "article" \| "section"` | no | Element rendered as the container. |
| `unstyled` | `boolean` | no | Prose styles only, no chrome visuals. |
| `id` | `string` | no | The container's element id. |

## Source

- [RteContentView](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/src/view/RteContentView.tsx#L33)
- [RteContentViewProps](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/src/types/props.ts#L338)

<!-- generated:reference:end -->
