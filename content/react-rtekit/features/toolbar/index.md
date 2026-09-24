---
pluginId: react-rtekit
pathname: /react-rtekit/toolbar/
title: Toolbar
description: 'A real ARIA toolbar: one tab stop, arrows between controls, configurable groups, and three overflow behaviours.'
archetype: B
section: features
capabilityId: toolbar
group: Interaction
symbols: [ToolbarItemSpec, toolbar-items, createToolbarItem, RteToolbar]
---

# Toolbar

## Basics

```demo
toolbar-config
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](/react-rtekit/customization/) for the eight levels and how to pick one, and [Theming & tokens](/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

`overflow="menu"` measures the row to decide what fits, so it needs a laid-out container. In a hidden tab or a zero-width parent every group stays visible until the container has a width.

## API

- [ToolbarItemSpec](/react-rtekit/api/types/)
- [toolbar-items](/react-rtekit/api/toolbar-items/)
- [createToolbarItem](/react-rtekit/api/plugin-api/)
- [RteToolbar](/react-rtekit/api/composable-parts/)
