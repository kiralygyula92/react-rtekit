---
pluginId: react-rtekit
pathname: /react-rtekit/html-interop/
title: HTML interop
description: Reads legacy Quill markup and emits standards-compliant, Quill-compatible or e-mail-safe HTML, so stored content needs no migration.
archetype: B
section: features
capabilityId: html-interop
group: 'Content & data'
symbols: [htmlToDocument, documentToHtml, RichTextEditorProps]
---

# HTML interop

## Basics

```demo
html-interop
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

Interop covers the constructs Quill and the office suites actually produce. Markup outside that set is normalized to the nearest thing the schema has, which may not be what its author meant.

## API

- [htmlToDocument](/react-rtekit/api/serialization/)
- [documentToHtml](/react-rtekit/api/serialization/)
- [RichTextEditorProps](/react-rtekit/api/rich-text-editor/)
