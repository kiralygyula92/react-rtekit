---
pluginId: react-rtekit
pathname: /react-rtekit/value-formats/
title: Value formats
description: HTML, JSON, Markdown or plain text — one valueFormat prop decides what value takes and what onChange hands back.
archetype: B
section: features
capabilityId: value-formats
group: 'Content & data'
symbols: [EditorValue, ChangeMeta, htmlToDocument, documentToHtml, documentToMarkdown, documentToText, markdownToHtml, markdownToDocument, EditorDocument]
---

# Value formats

## Basics

```demo
value-formats
```

### Controlled and uncontrolled

```demo
controlled
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](/react-rtekit/customization/) for the eight levels and how to pick one, and [Theming & tokens](/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

Markdown is a lossy target. Tables, merge tags and inline colour survive the round trip; arbitrary inline styles do not, because Markdown has nowhere to put them.

## API

- [EditorValue](/react-rtekit/api/types/)
- [ChangeMeta](/react-rtekit/api/types/)
- [htmlToDocument](/react-rtekit/api/serialization/)
- [documentToHtml](/react-rtekit/api/serialization/)
- [documentToMarkdown](/react-rtekit/api/serialization/)
- [documentToText](/react-rtekit/api/serialization/)
- [markdownToHtml](/react-rtekit/api/serialization/)
- [markdownToDocument](/react-rtekit/api/serialization/)
- [EditorDocument](/react-rtekit/api/types/)
