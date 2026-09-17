---
pluginId: react-rtekit
pathname: /react-rtekit/demos/theme-editor/
title: Theme editor
description: Edit the theme tokens against a running editor and copy the result out as a theme object.
archetype: B
section: demos
---

# Theme editor

## Basics

Edit the tokens against a running editor and copy the result out as a theme object.

```demo
theming
```

The full token editor, with all 114 tokens grouped, is below.

## Customization

A theme is a plain object. `createTheme` merges yours onto a base, so you override what you care about and inherit the rest.

## Limitations

Every shipped theme meets WCAG AA and a test enforces it. A theme you build here does not inherit that guarantee — `meetsContrastAA` is exported so you can check your own before shipping it.

## API

- [createTheme](/react-rtekit/api/theme-api/)
- [Theme tokens](/react-rtekit/api/theme-tokens/)
