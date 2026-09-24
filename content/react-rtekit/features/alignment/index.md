---
pluginId: react-rtekit
pathname: /react-rtekit/alignment/
title: Alignment
description: Left, centre, right and justify, applied to blocks and serialized so legacy Quill alignment classes still read.
archetype: B
section: features
capabilityId: alignment
group: 'Display & layout'
symbols: [CommandId, FormatState]
---

# Alignment

## Basics

```demo
formatting
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](/react-rtekit/customization/) for the eight levels and how to pick one, and [Theming & tokens](/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

Alignment is a block property. There is no way to align part of a paragraph, because there is nowhere in the document model to put it.

## API

- [CommandId](/react-rtekit/api/types/)
- [FormatState](/react-rtekit/api/types/)
