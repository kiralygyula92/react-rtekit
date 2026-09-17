---
pluginId: react-rtekit
pathname: /react-rtekit/api/theme-api/
title: Theme API
description: Building a theme, and the five that ship.
archetype: E
section: reference
---

# Theme API

<!--
  Generated from the TypeScript declarations. Do not author anything here:
  structure comes from reference/{symbol}.schema.json and prose from
  reference/{symbol}.strings.json, and this region is replaced wholesale.
-->

<!-- generated:reference:start -->

## Used by

- [Theme presets](/react-rtekit/theme-presets/)
- [Theming](/react-rtekit/theming/)

## Import

```ts
import { borderedTheme } from 'react-rtekit';
import { classicTheme } from 'react-rtekit';
import { compactTheme } from 'react-rtekit';
import { createTheme } from 'react-rtekit';
import { darkTheme } from 'react-rtekit';
import { lightTheme } from 'react-rtekit';
import { themes } from 'react-rtekit';
```

## Options

### borderedTheme

Toolbar and content share one bounding box, and the toolbar sticks.

This symbol takes no options.

### classicTheme

1:1 parity with the legacy editor.

**These values are frozen.** The parity guarantee is part of the versioning contract:
changing one is a major release. Other presets may move in a minor.

Deliberate deviations, documented on the parity page:
the focus ring replaces the 1px→2px border swap so focusing shifts nothing (R10),
colour Reset clears the format instead of writing `#000000` (R14), swatches are
focusable buttons (R15), the toolbar is a real ARIA toolbar (R16), the icons are
in-house at the same size and colour, and there is now a placeholder (R24).

This symbol takes no options.

### compactTheme

A denser theme: 32px buttons, 20px icons, a 160px minimum.

This symbol takes no options.

### createTheme

Merges overrides onto a base theme.

This symbol takes no options.

### darkTheme

The dark theme. Contrast pairs are AA-verified against text and surface.

This symbol takes no options.

### lightTheme

The default theme.

Subtle toolbar hover states, a visible placeholder, paragraph spacing — the modern
look, as opposed to `classic`'s reproduction of the old editor.

This symbol takes no options.

### themes

Every shipped theme, keyed by name.

This symbol takes no options.

## Source

- [borderedTheme](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/themes/index.ts#L351)
- [classicTheme](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/themes/index.ts#L225)
- [compactTheme](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/themes/index.ts#L342)
- [createTheme](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/themes/index.ts#L201)
- [darkTheme](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/themes/index.ts#L304)
- [lightTheme](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/themes/index.ts#L60)
- [themes](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/themes/index.ts#L364)

<!-- generated:reference:end -->
