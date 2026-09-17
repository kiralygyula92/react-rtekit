---
pluginId: react-rtekit
pathname: /react-rtekit/api/serialization/
title: Serialization
description: Converting between HTML, the document model, Markdown and plain text.
archetype: E
section: reference
---

# Serialization

<!--
  Generated from the TypeScript declarations. Do not author anything here:
  structure comes from reference/{symbol}.schema.json and prose from
  reference/{symbol}.strings.json, and this region is replaced wholesale.
-->

<!-- generated:reference:start -->

## Used by

- [Value formats](/react-rtekit/value-formats/)
- [HTML interop](/react-rtekit/html-interop/)
- [E-mail output](/react-rtekit/email-output/)
- [Code blocks](/react-rtekit/code-blocks/)
- [Empty state](/react-rtekit/empty-state/)

## Import

```ts
import { documentToHtml } from 'react-rtekit';
import { documentToMarkdown } from 'react-rtekit';
import { documentToText } from 'react-rtekit';
import { htmlToDocument } from 'react-rtekit';
import { isEmptyHtml } from 'react-rtekit';
import { markdownToDocument } from 'react-rtekit';
import { markdownToHtml } from 'react-rtekit';
```

## Options

### documentToHtml

Serializes a document to HTML.

This symbol takes no options.

### documentToMarkdown

Serializes a document to Markdown.

This symbol takes no options.

### documentToText

Extracts the visible text of a document.

This symbol takes no options.

### htmlToDocument

Parses HTML into the portable document model.

Runs the whole input pipeline: source detection, interop, sanitization,
schema downgrade and normalization.

This symbol takes no options.

### isEmptyHtml

True when an HTML string holds no visible content (fixes R2).

The cheap path for callers that only need the boolean and do not want to build a
document: `''`, `'<p></p>'`, `'<p><br></p>'` and whitespace-only markup are empty,
while `'<p>&nbsp;</p>'` is not.

This symbol takes no options.

### markdownToDocument

Parses Markdown into a document.

Implemented by converting to HTML and reusing the HTML pipeline, so Markdown input
gets the same sanitization, interop and schema downgrade as everything else.

This symbol takes no options.

### markdownToHtml

Converts Markdown to HTML. Exported for the interop demo's before/after view.

This symbol takes no options.

## Source

- [documentToHtml](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/core/serialize/to-html.ts#L412)
- [documentToMarkdown](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/core/serialize/markdown.ts#L198)
- [documentToText](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/core/document.ts#L307)
- [htmlToDocument](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/core/serialize/from-html.ts#L706)
- [isEmptyHtml](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/core/serialize/from-html.ts#L773)
- [markdownToDocument](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/core/serialize/markdown.ts#L301)
- [markdownToHtml](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/core/serialize/markdown.ts#L333)

<!-- generated:reference:end -->
