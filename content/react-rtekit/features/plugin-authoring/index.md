---
pluginId: react-rtekit
pathname: /react-rtekit/plugin-authoring/
title: Plugin authoring
description: Add a mark, a block, a command or a toolbar item with definePlugin, in the same shape the built-ins use.
archetype: B
section: features
capabilityId: plugin-authoring
group: Developer tools
symbols: [RtePlugin, definePlugin, resolvePluginOrder, featuresOf]
---

# Plugin authoring

## Basics

```demo
plugin-authoring
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](/react-rtekit/customization/) for the eight levels and how to pick one, and [Theming & tokens](/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

A plugin whose `dependsOn` names something absent still loads, with a warning — a missing dependency should not hand the reader an editor with a feature silently gone.

## API

- [RtePlugin](/react-rtekit/api/types/)
- [definePlugin](/react-rtekit/api/plugin-api/)
- [resolvePluginOrder](/react-rtekit/api/plugin-api/)
- [featuresOf](/react-rtekit/api/plugin-api/)
