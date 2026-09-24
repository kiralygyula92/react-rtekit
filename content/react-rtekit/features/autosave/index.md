---
pluginId: react-rtekit
pathname: /react-rtekit/autosave/
title: 'Autosave & drafts'
description: Drafts written on a debounce to storage you choose, with a restore prompt on the way back and a TTL.
archetype: B
section: features
capabilityId: autosave
group: Interaction
symbols: [EditorInstance, RichTextEditorProps]
---

# Autosave & drafts

## Basics

```demo
autosave
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](/react-rtekit/customization/) for the eight levels and how to pick one, and [Theming & tokens](/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

The default store is `localStorage`, which is per browser and per device, and which can be unavailable in private mode. Supply your own store for anything that has to follow a user.

## API

- [EditorInstance](/react-rtekit/api/editor-instance/)
- [RichTextEditorProps](/react-rtekit/api/rich-text-editor/)
