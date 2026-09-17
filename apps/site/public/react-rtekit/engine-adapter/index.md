---
pluginId: react-rtekit
pathname: /react-rtekit/engine-adapter/
title: Engine adapter
description: An EditorEngine interface owns the document layer, with Lexical as the default adapter behind it.
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

Every part of this is a slot, a token or a handler. See [How to customize](/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

One adapter ships. The interface exists so the engine is replaceable and so nothing outside `src/engines/` depends on it — not because a second adapter is coming.

## API

- [EditorInstance](/react-rtekit/api/editor-instance/)
- [RichTextEditorProps](/react-rtekit/api/rich-text-editor/)
