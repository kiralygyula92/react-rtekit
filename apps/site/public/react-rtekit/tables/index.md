---
pluginId: react-rtekit
pathname: /react-rtekit/tables/
title: Tables
description: Tables with a size picker, per-cell editing, and controls for adding and removing rows, columns and the table itself.
archetype: B
section: features
capabilityId: tables
group: 'Display & layout'
symbols: [TableOptions, CommandId]
---

# Tables

## Basics

```demo
tables
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

No merged cells. `colspan` and `rowspan` survive a round trip through stored HTML, but nothing in the editor creates them.

## API

- [TableOptions](/react-rtekit/api/types/)
- [CommandId](/react-rtekit/api/types/)
