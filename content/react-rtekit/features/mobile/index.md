---
pluginId: react-rtekit
pathname: /react-rtekit/mobile/
title: Mobile
description: Touch targets at the platform minimum, a toolbar that docks above the on-screen keyboard, and no layout jumps on focus.
archetype: B
section: features
capabilityId: mobile
group: Interaction
symbols: [RichTextEditorProps]
---

# Mobile

## Basics

```demo
mobile
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](/react-rtekit/customization/) for the eight levels and how to pick one, and [Theming & tokens](/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

The bottom-docked toolbar tracks the visual viewport, which iOS and Android report differently. It is tested on both, and a third mobile browser may need a check.

## API

- [RichTextEditorProps](/react-rtekit/api/rich-text-editor/)
