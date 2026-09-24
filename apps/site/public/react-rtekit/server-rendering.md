---
pluginId: react-rtekit
pathname: /react-rtekit/server-rendering/
title: Server rendering
description: Renders the content on the server and hydrates without a flash, so the field is not an empty box on first paint.
archetype: B
section: features
capabilityId: server-rendering
group: Developer tools
symbols: [RichTextEditorProps, RteContentView]
---

# Server rendering

## Basics

```demo
basic
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](/react-rtekit/customization/) for the eight levels and how to pick one, and [Theming & tokens](/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

The server output is the content, not a working editor — the engine needs a DOM. Only an HTML value can be pre-rendered; JSON and Markdown need a converter the server entry deliberately does not carry.

## API

- [RichTextEditorProps](/react-rtekit/api/rich-text-editor/)
- [RteContentView](/react-rtekit/api/rte-content-view/)
