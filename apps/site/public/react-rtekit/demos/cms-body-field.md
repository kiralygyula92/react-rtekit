---
pluginId: react-rtekit
pathname: /react-rtekit/demos/cms-body-field/
title: CMS body field
description: A full-height body field with headings, images, tables and autosave, as a CMS would use it.
archetype: B
section: demos
---

# CMS body field

## Basics

The large case: headings, images, tables, autosave and a full-height field, with several editors on one page behaving independently.

```demo
multiple-editors
```

## Customization

Each editor gets its own id namespace, its own history and its own draft key, so nothing is shared between them by accident.

## Limitations

Every editor on a page carries its own engine instance. Ten on one screen is fine; a hundred is a virtualisation problem, not a configuration one.

## API

- [EditorInstance](/react-rtekit/api/editor-instance/)
- [RichTextEditorProps](/react-rtekit/api/rich-text-editor/)
