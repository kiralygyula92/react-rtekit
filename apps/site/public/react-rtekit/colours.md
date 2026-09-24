---
pluginId: react-rtekit
pathname: /react-rtekit/colours/
title: Colours
description: Text and background colour from a configurable palette, with a recent-colours row and a reset that removes the declaration.
archetype: B
section: features
capabilityId: colours
group: 'Display & layout'
symbols: [CommandId, FormatState, RichTextEditorProps]
---

# Colours

## Basics

```demo
toolbar-config
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](/react-rtekit/customization/) for the eight levels and how to pick one, and [Theming & tokens](/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

Reset removes the colour rather than writing black, so text returns to whatever the theme says. A document that relied on an explicit black will look different after a reset.

## API

- [CommandId](/react-rtekit/api/types/)
- [FormatState](/react-rtekit/api/types/)
- [RichTextEditorProps](/react-rtekit/api/rich-text-editor/)
