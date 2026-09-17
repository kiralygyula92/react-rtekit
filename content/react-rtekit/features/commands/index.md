---
pluginId: react-rtekit
pathname: /react-rtekit/commands/
title: Commands
description: Fifty-seven commands, each overridable, dispatched by the toolbar, the shortcuts and your own code alike.
archetype: B
section: features
capabilityId: commands
group: Developer tools
symbols: [CommandId, commands, useCommand, EditorInstance]
---

# Commands

## Basics

```demo
command-overrides
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

A command runs against the current selection. Calling one while the editor has no focus applies it to the saved selection, and if there is none, to nothing.

## API

- [CommandId](/react-rtekit/api/types/)
- [commands](/react-rtekit/api/commands/)
- [useCommand](/react-rtekit/api/editor-hooks/)
- [EditorInstance](/react-rtekit/api/editor-instance/)
