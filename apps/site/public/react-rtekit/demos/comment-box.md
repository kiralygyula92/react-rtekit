---
pluginId: react-rtekit
pathname: /react-rtekit/demos/comment-box/
title: Comment box
description: 'A small editor for short replies: a few marks, a link, a character limit and nothing else.'
archetype: B
section: demos
---

# Comment box

## Basics

The small case: a few marks, a link, a character limit, and nothing else. This is the `comment` preset, which exists because most editors on most pages are this.

```demo
counter-and-limits
```

## Customization

Start from the preset and add what you need rather than starting from `full` and removing things — the preset decides which plugins load, and a plugin that never loads costs nothing.

## Limitations

The `comment` preset has no images, tables or block types beyond paragraphs. That is the point; if you need them, `standard` is the next step up.

## API

- [Presets](/react-rtekit/api/plugin-api/)
- [RichTextEditorProps](/react-rtekit/api/rich-text-editor/)
