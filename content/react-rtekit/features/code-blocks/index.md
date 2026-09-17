---
pluginId: react-rtekit
pathname: /react-rtekit/code-blocks/
title: Code blocks
description: Fenced code blocks that keep their language through every format, so a snippet survives a round trip to Markdown and back.
archetype: B
section: features
capabilityId: code-blocks
group: Core features
symbols: [CommandId, documentToMarkdown]
---

# Code blocks

## Basics

```demo
formatting
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

The language is stored and serialized but not highlighted: the package ships no syntax highlighter. A `SourceView` or content-view override can add one.

## API

- [CommandId](/react-rtekit/api/types/)
- [documentToMarkdown](/react-rtekit/api/serialization/)
