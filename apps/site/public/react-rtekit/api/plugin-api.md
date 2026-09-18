---
pluginId: react-rtekit
pathname: /react-rtekit/api/plugin-api/
title: Plugin API
description: Defining a plugin, resolving plugin order, and the preset bundles.
archetype: E
section: reference
---

# Plugin API

<!--
  Generated from the TypeScript declarations. Do not author anything here:
  structure comes from reference/{symbol}.schema.json and prose from
  reference/{symbol}.strings.json, and this region is replaced wholesale.
-->

<!-- generated:reference:start -->

## Used by

- [Toolbar](/react-rtekit/toolbar/)
- [Plugin authoring](/react-rtekit/plugin-authoring/)
- [Presets](/react-rtekit/presets/)

## Import

```ts
import { createToolbarItem } from 'react-rtekit';
import { definePlugin } from 'react-rtekit';
import { featuresOf } from 'react-rtekit';
import { presets } from 'react-rtekit';
import { resolvePluginOrder } from 'react-rtekit';
import { resolvePlugins } from 'react-rtekit';
```

## Options

### createToolbarItem

Declares a toolbar item.

This symbol takes no options.

### definePlugin

Declares a plugin.

This symbol takes no options.

### featuresOf

The feature ids a plugin list enables, for the schema downgrade.

This symbol takes no options.

### presets

Every shipped preset.

This symbol takes no options.

### resolvePluginOrder

Resolves a plugin list: dependencies first, duplicates removed.

A plugin registered twice keeps its last definition, which is what makes
`addPlugins` able to replace a built-in by name.

This symbol takes no options.

### resolvePlugins

Resolves the plugin list for a set of props.

Order of precedence: `plugins` replaces the preset entirely, then `removePlugins`
drops names, then `addPlugins` appends, then the `enableX` flags turn individual
features off.

This symbol takes no options.

## Source

- [createToolbarItem](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/core/plugins/define.ts#L44)
- [definePlugin](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/core/plugins/define.ts#L26)
- [featuresOf](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/core/plugins/define.ts#L91)
- [presets](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/core/plugins/presets.ts#L117)
- [resolvePluginOrder](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/core/plugins/define.ts#L57)
- [resolvePlugins](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/core/plugins/presets.ts#L207)

<!-- generated:reference:end -->
