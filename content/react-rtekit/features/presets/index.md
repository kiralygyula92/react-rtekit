---
pluginId: react-rtekit
pathname: /react-rtekit/presets/
title: Presets
description: Six bundles — minimal, comment, standard, classic, email and full — each a plugin list plus prop defaults.
archetype: B
section: features
capabilityId: presets
group: Developer tools
symbols: [presets, resolvePlugins, plugins, useRteConfig, useRteDefaults, RteDefaultsProvider]
---

# Presets

## Basics

```demo
presets
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

A preset is resolved when the editor mounts, so changing `preset` remounts it and starts a new undo stack.

## API

- [presets](/react-rtekit/api/plugin-api/)
- [resolvePlugins](/react-rtekit/api/plugin-api/)
- [plugins](/react-rtekit/api/plugins/)
- [useRteConfig](/react-rtekit/api/editor-hooks/)
- [useRteDefaults](/react-rtekit/api/editor-hooks/)
- [RteDefaultsProvider](/react-rtekit/api/providers/)
