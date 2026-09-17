---
pluginId: react-rtekit
pathname: /react-rtekit/check-lists/
title: Check lists
description: Task lists whose items can be ticked in place, serialized as data-checked so stored HTML keeps the state.
archetype: B
section: features
capabilityId: check-lists
group: Core features
symbols: [CommandId]
---

# Check lists

## Basics

```demo
lists
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

The checkbox is drawn by the stylesheet in the first 20px of the item, which is the region the engine treats as a click on the box. A custom theme that indents check items past that point makes them unclickable.

## API

- [CommandId](/react-rtekit/api/types/)
