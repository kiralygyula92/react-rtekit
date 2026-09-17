---
pluginId: react-rtekit
pathname: /react-rtekit/slots/
title: Slots
description: Forty-six replaceable parts, from the root element to a single toolbar button, each one an ordinary component.
archetype: B
section: features
capabilityId: slots
group: Developer tools
symbols: [RteSlots, slots, useRteSlots]
---

# Slots

## Basics

```demo
slots-custom
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

A slot that drops the props it is given renders an empty shell — the behaviour lives in those props. Spread them back, or the part stops working rather than stops looking right.

## API

- [RteSlots](/react-rtekit/api/types/)
- [slots](/react-rtekit/api/slots/)
- [useRteSlots](/react-rtekit/api/editor-hooks/)
