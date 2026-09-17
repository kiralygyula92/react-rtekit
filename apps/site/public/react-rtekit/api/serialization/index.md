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

This symbol takes no options.

### documentToMarkdown

This symbol takes no options.

### documentToText

This symbol takes no options.

### htmlToDocument

This symbol takes no options.

### isEmptyHtml

This symbol takes no options.

### markdownToDocument

This symbol takes no options.

### markdownToHtml

Converts Markdown to HTML. Exported for the interop demo's before/after view.

This symbol takes no options.

## Source

- [documentToHtml](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/core/serialize/to-html.ts#L412)
- [documentToMarkdown](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/core/serialize/markdown.ts#L151)
- [documentToText](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/core/document.ts#L307)
- [htmlToDocument](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/core/serialize/from-html.ts#L706)
- [isEmptyHtml](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/core/serialize/from-html.ts#L773)
- [markdownToDocument](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/core/serialize/markdown.ts#L254)
- [markdownToHtml](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/core/serialize/markdown.ts#L263)

<!-- generated:reference:end -->
