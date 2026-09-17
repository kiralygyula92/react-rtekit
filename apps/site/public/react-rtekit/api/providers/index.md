---
pluginId: react-rtekit
pathname: /react-rtekit/api/providers/
title: Providers
description: Theme, locale and defaults providers, for configuring several editors at once.
archetype: E
section: reference
---

# Providers

<!--
  Generated from the TypeScript declarations. Do not author anything here:
  structure comes from reference/{symbol}.schema.json and prose from
  reference/{symbol}.strings.json, and this region is replaced wholesale.
-->

<!-- generated:reference:start -->

## Used by

- [Presets](/react-rtekit/presets/)
- [Localization](/react-rtekit/localization/)
- [Theming](/react-rtekit/theming/)

## Import

```ts
import { RteDefaultsProvider } from 'react-rtekit';
import { RteLocaleProvider } from 'react-rtekit';
import { RteThemeProvider } from 'react-rtekit';
```

## Options

### RteDefaultsProvider

Sets app-wide prop defaults.

The one place a team configures sanitization, the HTML profile, merge tags and the
upload handler, so no individual field can get it wrong.

This symbol takes no options.

### RteLocaleProvider

Sets the message catalogue for every editor below.

This symbol takes no options.

### RteThemeProvider

Sets the theme for every editor below.

This symbol takes no options.

## Source

- [RteDefaultsProvider](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/react/providers.tsx#L102)
- [RteLocaleProvider](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/react/providers.tsx#L73)
- [RteThemeProvider](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/react/providers.tsx#L44)

<!-- generated:reference:end -->
