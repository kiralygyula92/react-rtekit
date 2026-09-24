---
pluginId: react-rtekit
pathname: /react-rtekit/clear-formatting/
title: Clear formatting
description: Strips every inline mark from the selection, leaving the text and the block structure.
archetype: B
section: features
capabilityId: clear-formatting
group: Core features
symbols: [CommandId]
---

# Clear formatting

## Basics

```demo
formatting
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](/react-rtekit/customization/) for the eight levels and how to pick one, and [Theming & tokens](/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

Clears inline marks only. The block type, alignment and indentation are structure, not formatting, and are left alone.

## API

- [CommandId](/react-rtekit/api/types/)
