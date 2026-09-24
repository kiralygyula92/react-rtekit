---
pluginId: react-rtekit
pathname: /react-rtekit/merge-tags/
title: Merge tags
description: 'Template variables as atomic chips: one delete removes the whole tag, and formatting the message never splits it.'
archetype: B
section: features
capabilityId: merge-tags
group: 'Content & data'
symbols: [EditorInstance, RichTextEditorProps]
---

# Merge tags

## Basics

```demo
merge-tags
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](/react-rtekit/customization/) for the eight levels and how to pick one, and [Theming & tokens](/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

A tag is atomic in the editor, not in stored HTML. Code that rewrites the saved markup with a regular expression can still cut one in half.

## API

- [EditorInstance](/react-rtekit/api/editor-instance/)
- [RichTextEditorProps](/react-rtekit/api/rich-text-editor/)
