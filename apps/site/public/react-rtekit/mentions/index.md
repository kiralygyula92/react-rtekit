---
pluginId: react-rtekit
pathname: /react-rtekit/mentions/
title: Mentions
description: 'An @ trigger backed by your own async search, inserting an atomic chip that carries an id.'
archetype: B
section: features
capabilityId: mentions
group: Interaction
symbols: [RichTextEditorProps, RteHandlers]
---

# Mentions

## Basics

```demo
mentions
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

The provider is yours, and so is its debounce. The editor does not cache results between triggers.

## API

- [RichTextEditorProps](/react-rtekit/api/rich-text-editor/)
- [RteHandlers](/react-rtekit/api/types/)
