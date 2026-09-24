---
pluginId: react-rtekit
pathname: /react-rtekit/slash-menu/
title: Slash menu
description: A command palette on /, listing the blocks and inserts the current configuration actually has.
archetype: B
section: features
capabilityId: slash-menu
group: Interaction
symbols: [RichTextEditorProps, ToolbarItemSpec]
---

# Slash menu

## Basics

```demo
emoji-and-slash
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](/react-rtekit/customization/) for the eight levels and how to pick one, and [Theming & tokens](/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

The menu lists items whose plugins are loaded. An item you add to the toolbar without a plugin behind it appears in neither.

## API

- [RichTextEditorProps](/react-rtekit/api/rich-text-editor/)
- [ToolbarItemSpec](/react-rtekit/api/types/)
