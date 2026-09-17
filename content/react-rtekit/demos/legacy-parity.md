---
pluginId: react-rtekit
pathname: /react-rtekit/demos/legacy-parity/
title: Legacy parity
description: The legacy editor this package replaces, side by side with the replacement, and the 26 bugs that are fixed.
archetype: B
section: demos
---

# Legacy parity

## Basics

The legacy editor this package was written to replace, reproduced exactly — the same eight toolbar buttons, the same 287px box, the same 1px border — and then the 26 bugs it had, each one fixed.

```demo
legacy-parity
```

## Customization

The `classic` preset and theme exist so a migration can be done in two steps: first look identical, then change what you want. Nothing about the parity is hard-coded — it is tokens and a toolbar list.

## Limitations

Parity is visual and behavioural, not internal. Code that reached into the old editor's DOM or its instance will not find the same things here.

## API

- [classicTheme](/react-rtekit/api/theme-api/)
- [Presets](/react-rtekit/api/plugin-api/)
