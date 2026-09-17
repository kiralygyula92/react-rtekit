---
pluginId: react-rtekit
pathname: /react-rtekit/fullscreen/
title: Fullscreen
description: Fills the window without remounting the editor, so the selection, the undo stack and every listener survive.
archetype: B
section: features
capabilityId: fullscreen
group: Interaction
symbols: [EditorInstance, RichTextEditorProps]
---

# Fullscreen

## Basics

```demo
fullscreen
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

This is a CSS fullscreen, not the Fullscreen API: it covers the viewport, not the screen, and it does not need a user gesture.

## API

- [EditorInstance](/react-rtekit/api/editor-instance/)
- [RichTextEditorProps](/react-rtekit/api/rich-text-editor/)
