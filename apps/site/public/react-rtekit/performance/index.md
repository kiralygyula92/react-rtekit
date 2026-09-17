---
pluginId: react-rtekit
pathname: /react-rtekit/performance/
title: Performance
description: What a large document costs, what is measured on every build, and which props are worth memoising.
archetype: B
section: features
capabilityId: performance
group: Developer tools
symbols: [RichTextEditorProps, useEditorState]
---

# Performance

## Basics

```demo
large-document
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

The budgets are measured on a quiet machine in CI. They are a regression signal, not a promise about a given device.

## API

- [RichTextEditorProps](/react-rtekit/api/rich-text-editor/)
- [useEditorState](/react-rtekit/api/editor-hooks/)
