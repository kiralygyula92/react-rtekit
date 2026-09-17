---
pluginId: react-rtekit
pathname: /react-rtekit/selection-toolbar/
title: Selection toolbar
description: A bubble toolbar over the selection, carrying the marks and the link rather than the whole row.
archetype: B
section: features
capabilityId: selection-toolbar
group: Interaction
symbols: [RichTextEditorProps, ToolbarItemSpec]
---

# Selection toolbar

## Basics

```demo
floating-toolbar
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

Off by default wherever a toolbar is already docked: two toolbars offering the same commands is noise. Set `floatingToolbar` to ask for both.

## API

- [RichTextEditorProps](/react-rtekit/api/rich-text-editor/)
- [ToolbarItemSpec](/react-rtekit/api/types/)
