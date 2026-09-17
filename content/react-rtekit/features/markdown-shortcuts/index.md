---
pluginId: react-rtekit
pathname: /react-rtekit/markdown-shortcuts/
title: Markdown shortcuts
description: 'Typing ##  or -  or >  turns the block into the thing it looks like, as you type.'
archetype: B
section: features
capabilityId: markdown-shortcuts
group: 'Content & data'
symbols: [RichTextEditorProps, plugins]
---

# Markdown shortcuts

## Basics

```demo
markdown
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

Shortcuts fire on the block you are typing in. Pasting Markdown does not convert it — use `valueFormat="markdown"` or `markdownToDocument` for that.

## API

- [RichTextEditorProps](/react-rtekit/api/rich-text-editor/)
- [plugins](/react-rtekit/api/plugins/)
