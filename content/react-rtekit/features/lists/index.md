---
pluginId: react-rtekit
pathname: /react-rtekit/lists/
title: Lists
description: Bulleted and numbered lists, nested to any depth, with Tab and Shift+Tab moving items between levels.
archetype: B
section: features
capabilityId: lists
group: Core features
symbols: [CommandId, FormatState]
---

# Lists

## Basics

```demo
lists
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

A list nested deeper than five levels stops gaining an indent class, because the shipped stylesheet defines five. Deeper nesting still serializes correctly; it just stops looking deeper.

## API

- [CommandId](/react-rtekit/api/types/)
- [FormatState](/react-rtekit/api/types/)
