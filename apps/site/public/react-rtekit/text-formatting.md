---
pluginId: react-rtekit
pathname: /react-rtekit/text-formatting/
title: Text formatting
description: Bold, italic, underline, strikethrough and inline code, as marks on the selection rather than tags in a string.
archetype: B
section: features
capabilityId: text-formatting
group: Core features
symbols: [CommandId, FormatState, commands]
---

# Text formatting

## Basics

```demo
formatting
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](/react-rtekit/customization/) for the eight levels and how to pick one, and [Theming & tokens](/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

Underline and strikethrough render through a class of their own when both are applied, because the engine treats the pair as one format. An override that styles `.rte-underline` and `.rte-strike` separately must also style `.rte-underline-strike`, or text carrying both shows only one.

## API

- [CommandId](/react-rtekit/api/types/)
- [FormatState](/react-rtekit/api/types/)
- [commands](/react-rtekit/api/commands/)
