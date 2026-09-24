---
pluginId: react-rtekit
pathname: /react-rtekit/theme-presets/
title: Theme presets
description: Five ready themes — light, dark, classic, compact and bordered — each a token set you can extend rather than fight.
archetype: B
section: features
capabilityId: theme-presets
group: 'Display & layout'
symbols: [lightTheme, darkTheme, classicTheme, compactTheme, borderedTheme, themes]
---

# Theme presets

## Basics

```demo
presets
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](/react-rtekit/customization/) for the eight levels and how to pick one, and [Theming & tokens](/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

Every shipped preset meets WCAG AA, and a test enforces it. A theme you derive from one does not inherit that guarantee — `meetsContrastAA` is exported so you can check your own.

## API

- [lightTheme](/react-rtekit/api/theme-api/)
- [darkTheme](/react-rtekit/api/theme-api/)
- [classicTheme](/react-rtekit/api/theme-api/)
- [compactTheme](/react-rtekit/api/theme-api/)
- [borderedTheme](/react-rtekit/api/theme-api/)
- [themes](/react-rtekit/api/theme-api/)
