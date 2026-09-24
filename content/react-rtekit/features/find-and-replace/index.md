---
pluginId: react-rtekit
pathname: /react-rtekit/find-and-replace/
title: 'Find & replace'
description: Find and replace over the document, with match case, whole word and regular expressions, highlighted by overlay.
archetype: B
section: features
capabilityId: find-and-replace
group: Interaction
symbols: [EditorInstance, FindOptions]
---

# Find & replace

## Basics

```demo
find-replace
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](/react-rtekit/customization/) for the eight levels and how to pick one, and [Theming & tokens](/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

Matches are highlighted with an overlay rather than by marking up the document, so a search never changes what you would save and never pushes an entry onto the undo stack. The overlay is positioned from the rendered text, so it needs the editor to be visible.

## API

- [EditorInstance](/react-rtekit/api/editor-instance/)
- [FindOptions](/react-rtekit/api/types/)
