---
pluginId: react-rtekit
pathname: /react-rtekit/emoji/
title: Emoji
description: 'A searchable picker in the toolbar and a : trigger in the text, inserting characters rather than images.'
archetype: B
section: features
capabilityId: emoji
group: Interaction
symbols: [CommandId, RichTextEditorProps]
---

# Emoji

## Basics

```demo
emoji-and-slash
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

A curated set of about sixty, not the full Unicode table — the whole set is several hundred kilobytes that no editor should pay for by default.

## API

- [CommandId](/react-rtekit/api/types/)
- [RichTextEditorProps](/react-rtekit/api/rich-text-editor/)
