---
pluginId: react-rtekit
pathname: /react-rtekit/fonts/
title: Fonts
description: Font family and size as inline styles, from lists you supply, for editors whose output has to carry its own typography.
archetype: B
section: features
capabilityId: fonts
group: 'Display & layout'
symbols: [CommandId, RichTextEditorProps]
---

# Fonts

## Basics

```demo
content-styles
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](/react-rtekit/customization/) for the eight levels and how to pick one, and [Theming & tokens](/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

Both write inline styles, which is what e-mail needs and what a design system usually does not want. Prefer theme tokens unless the output has to survive outside your CSS.

## API

- [CommandId](/react-rtekit/api/types/)
- [RichTextEditorProps](/react-rtekit/api/rich-text-editor/)
