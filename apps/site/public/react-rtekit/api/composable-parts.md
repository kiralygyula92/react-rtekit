---
pluginId: react-rtekit
pathname: /react-rtekit/api/composable-parts/
title: Composable parts API
description: The nine parts the all-in-one component is assembled from.
archetype: E
section: reference
---

# Composable parts API

<!--
  Generated from the TypeScript declarations. Do not author anything here:
  structure comes from reference/{symbol}.schema.json and prose from
  reference/{symbol}.strings.json, and this region is replaced wholesale.
-->

<!-- generated:reference:start -->

## Used by

- [Composable parts](/react-rtekit/composable-parts/)
- [Empty state](/react-rtekit/empty-state/)
- [Toolbar](/react-rtekit/toolbar/)

## Import

```ts
import { Rte } from 'react-rtekit';
import { RteContent } from 'react-rtekit';
import { RteCounter } from 'react-rtekit';
import { RteErrorText } from 'react-rtekit';
import { RteFooter } from 'react-rtekit';
import { RteHelperText } from 'react-rtekit';
import { RteLabel } from 'react-rtekit';
import { RtePortals } from 'react-rtekit';
import { RteRoot } from 'react-rtekit';
import { RteToolbar } from 'react-rtekit';
```

## Options

### Rte

The composable parts, grouped for import as one namespace.

This symbol takes no options.

### RteContent

The editable surface.

The engine creates the contenteditable element itself and React never touches its
children, which is what keeps React's reconciler and the browser's editing engine out
of each other's way.

This symbol takes no options.

### RteCounter

The live character or word counter.

This symbol takes no options.

### RteErrorText

The validation message, linked to the content element with `aria-describedby`.

This symbol takes no options.

### RteFooter

The footer row: counter on the right, anything else on the left.

This symbol takes no options.

### RteHelperText

Helper text below the editor.

This symbol takes no options.

### RteLabel

The field label, bound to the content element.

`<label for>` names a form control, and the content element is a `div` with
`role="textbox"` — so the label also has to be attached with `aria-labelledby`, or
the editor has an accessible name in the markup and none in the accessibility tree.

This symbol takes no options.

### RtePortals

The popovers, menus and dialogs the features own.

A composed layout renders this once, anywhere inside `<Rte.Root>`. Without it the
link popover, the image dialog and the suggestion menus have nowhere to mount, and
the features look broken rather than absent.

This symbol takes no options.

### RteRoot

The editor root: context, state data attributes and the live region.

This symbol takes no options.

### RteToolbar

The toolbar, for a layout you are composing yourself.

This symbol takes no options.

## Source

- [Rte](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/react/parts.tsx#L430)
- [RteContent](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/react/parts.tsx#L278)
- [RteCounter](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/react/parts.tsx#L350)
- [RteErrorText](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/react/parts.tsx#L387)
- [RteFooter](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/react/parts.tsx#L417)
- [RteHelperText](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/react/parts.tsx#L405)
- [RteLabel](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/react/parts.tsx#L461)
- [RtePortals](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/react/parts.tsx#L584)
- [RteRoot](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/react/parts.tsx#L96)
- [RteToolbar](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/react/parts.tsx#L531)

<!-- generated:reference:end -->
