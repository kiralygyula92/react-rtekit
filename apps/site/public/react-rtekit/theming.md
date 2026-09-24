---
pluginId: react-rtekit
pathname: /react-rtekit/theming/
title: Theming
description: 114 CSS custom properties in a cascade layer — every colour, size and radius, with no CSS-in-JS and no UI kit.
archetype: B
section: features
capabilityId: theming
group: 'Display & layout'
symbols: [RteTheme, createTheme, theme-tokens, RteThemeProvider, useRteTheme]
---

# Theming

## Basics

```demo
theming
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](/react-rtekit/customization/) for the eight levels and how to pick one, and [Theming & tokens](/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

Tokens cover what the editor draws. Content styling — how a heading or a table looks inside the text — lives in `content.css` and is a separate stylesheet on purpose, so stored HTML renders the same outside the editor.

## API

- [RteTheme](/react-rtekit/api/types/)
- [createTheme](/react-rtekit/api/theme-api/)
- [theme-tokens](/react-rtekit/api/theme-tokens/)
- [RteThemeProvider](/react-rtekit/api/providers/)
- [useRteTheme](/react-rtekit/api/editor-hooks/)
