---
pluginId: react-rtekit
pathname: /react-rtekit/history/
title: 'Undo & redo'
description: Undo and redo with coalesced typing, so a sentence is one entry rather than forty.
archetype: B
section: features
capabilityId: history
group: Core features
symbols: [CommandId, EditorInstance]
---

# Undo & redo

## Basics

```demo
history
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](/react-rtekit/customization/) for the eight levels and how to pick one, and [Theming & tokens](/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

History is per editor instance and is not persisted. A remount — including one caused by changing `preset` or `locale` — starts a new stack.

## API

- [CommandId](/react-rtekit/api/types/)
- [EditorInstance](/react-rtekit/api/editor-instance/)
