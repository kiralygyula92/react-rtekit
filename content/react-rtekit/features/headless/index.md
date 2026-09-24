---
pluginId: react-rtekit
pathname: /react-rtekit/headless/
title: Headless
description: 'useEditor with no chrome at all: the document, the commands and the state, and you draw the rest.'
archetype: B
section: features
capabilityId: headless
group: Developer tools
symbols: [useEditor, UseEditorOptions, EditorInstance, useEditorContext, useIsFocused, useFormatState]
---

# Headless

## Basics

```demo
headless
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](/react-rtekit/customization/) for the eight levels and how to pick one, and [Theming & tokens](/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

Headless still needs the engine and the stylesheet for the content area. It is about the chrome, not about the bytes.

## API

- [useEditor](/react-rtekit/api/use-editor/)
- [UseEditorOptions](/react-rtekit/api/use-editor/)
- [EditorInstance](/react-rtekit/api/editor-instance/)
- [useEditorContext](/react-rtekit/api/editor-hooks/)
- [useIsFocused](/react-rtekit/api/editor-hooks/)
- [useFormatState](/react-rtekit/api/editor-hooks/)
