---
pluginId: react-rtekit
pathname: /react-rtekit/content-view/
title: Content view
description: A read-only renderer for stored HTML that applies the same content stylesheet, so a list page looks like the editor.
archetype: B
section: features
capabilityId: content-view
group: 'Display & layout'
symbols: [RteContentView, RteContentViewProps]
---

# Content view

## Basics

```demo
content-styles
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

It renders; it does not edit. It also sanitizes on every render, so passing a new string on every keystroke is measurably slower than passing a stable one.

## API

- [RteContentView](/react-rtekit/api/rte-content-view/)
- [RteContentViewProps](/react-rtekit/api/rte-content-view/)
