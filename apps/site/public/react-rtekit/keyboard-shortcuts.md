---
pluginId: react-rtekit
pathname: /react-rtekit/keyboard-shortcuts/
title: Keyboard shortcuts
description: A complete keyboard model, and a shortcut reference built from the keymap that is actually in force.
archetype: B
section: features
capabilityId: keyboard-shortcuts
group: Interaction
symbols: [RichTextEditorProps, RtePlugin]
---

# Keyboard shortcuts

## Basics

```demo
accessibility
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

Shortcuts are matched on physical keys, so a layout that puts `B` somewhere else moves Mod+B with it. That is the platform's behaviour, not something this package overrides.

## API

- [RichTextEditorProps](/react-rtekit/api/rich-text-editor/)
- [RtePlugin](/react-rtekit/api/types/)
