---
pluginId: react-rtekit
pathname: /react-rtekit/empty-state/
title: Empty state
description: 'What counts as empty, and why an empty paragraph does not: isEmpty() reads content, so required means required.'
archetype: B
section: features
capabilityId: empty-state
group: Core features
symbols: [EditorInstance, isEmptyHtml, useIsEmpty, RteErrorText, RteHelperText]
---

# Empty state

## Basics

```demo
counter-and-limits
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

An editor containing only an image, a table or a horizontal rule is not empty, even though it has no text. That is deliberate: emptiness is about content, not about characters.

## API

- [EditorInstance](/react-rtekit/api/editor-instance/)
- [isEmptyHtml](/react-rtekit/api/serialization/)
- [useIsEmpty](/react-rtekit/api/editor-hooks/)
- [RteErrorText](/react-rtekit/api/composable-parts/)
- [RteHelperText](/react-rtekit/api/composable-parts/)
