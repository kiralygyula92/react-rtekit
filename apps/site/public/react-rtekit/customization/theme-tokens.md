---
pluginId: react-rtekit
pathname: /react-rtekit/customization/theme-tokens/
title: 'Theming & tokens'
description: Changing colours, sizes and radii with tokens, and building a theme that keeps its contrast.
archetype: I
section: customization
---

# Theming & tokens

A theme is a plain object of tokens that becomes CSS custom properties on the editor's root. There is no CSS-in-JS: the properties are set once and the stylesheet reads them.

```demo
theming
```

## Building one

`createTheme` merges your overrides onto a base, so you change what you care about and inherit the rest.

```tsx
import { createTheme, lightTheme } from 'react-rtekit';

const brand = createTheme(lightTheme, {
  color: { accent: '#6C4BF4' },
  editor: { radius: '12px' },
  toolbar: { background: 'transparent' },
});
```

## Contrast

Every shipped theme meets WCAG AA and a test enforces it. A theme you derive does not inherit that, so `meetsContrastAA` is exported:

```tsx
import { meetsContrastAA } from 'react-rtekit';

meetsContrastAA(brand.color.text, brand.color.surface); // true
```

The full token list is on the [theme tokens](/react-rtekit/api/theme-tokens/) reference page.
