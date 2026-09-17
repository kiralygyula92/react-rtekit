---
pluginId: react-rtekit
pathname: /react-rtekit/counters-and-limits/
title: 'Counters & limits'
description: Character or word counts that measure text rather than markup, with a hard or soft limit and a live counter.
archetype: B
section: features
capabilityId: counters-and-limits
group: 'Content & data'
symbols: [useCharacterCount, RichTextEditorProps, EditorInstance]
---

# 'Counters & limits'

## Basics

```demo
counter-and-limits
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

The count is of text content, so a bold word costs what a plain one costs. It is not a byte count, and it is not what a database `VARCHAR` will measure.

## API

- [useCharacterCount](/react-rtekit/api/editor-hooks/)
- [RichTextEditorProps](/react-rtekit/api/rich-text-editor/)
- [EditorInstance](/react-rtekit/api/editor-instance/)
