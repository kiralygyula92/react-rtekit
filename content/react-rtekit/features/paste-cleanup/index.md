---
pluginId: react-rtekit
pathname: /react-rtekit/paste-cleanup/
title: Paste clean-up
description: Three paste modes — rich, clean and text — each running the same sanitizer, so a paste from Word cannot smuggle anything in.
archetype: B
section: features
capabilityId: paste-cleanup
group: 'Content & data'
symbols: [RteHandlers, RichTextEditorProps]
---

# Paste clean-up

## Basics

```demo
paste-cleanup
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

`clean` keeps structure and drops the source's own formatting. Deciding which of the two a given span is remains a heuristic, and a document that encodes meaning purely in inline style loses it.

## API

- [RteHandlers](/react-rtekit/api/types/)
- [RichTextEditorProps](/react-rtekit/api/rich-text-editor/)
