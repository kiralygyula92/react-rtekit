---
pluginId: react-rtekit
pathname: /react-rtekit/engine-adapter/
title: Engine adapter
description: An EditorEngine interface owns the document layer, so the engine behind it can change without the public API moving.
archetype: B
section: features
capabilityId: engine-adapter
group: Developer tools
symbols: [EditorInstance, RichTextEditorProps]
---

# Engine adapter

## Basics

```demo
headless
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](/react-rtekit/customization/) for the eight levels and how to pick one, and [Theming & tokens](/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

One adapter ships, and it is this project's own. The interface exists so the engine is replaceable and so nothing outside `src/engines/` depends on which one is in place — a boundary that has already earned itself once, when the engine behind it was rewritten and nothing above it moved.

## API

- [EditorInstance](/react-rtekit/api/editor-instance/)
- [RichTextEditorProps](/react-rtekit/api/rich-text-editor/)
