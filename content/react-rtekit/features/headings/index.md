---
pluginId: react-rtekit
pathname: /react-rtekit/headings/
title: Headings
description: Six heading levels, restricted to the set your schema allows and reachable from the block-type dropdown or Markdown shortcuts.
archetype: B
section: features
capabilityId: headings
group: Core features
symbols: [CommandId, RichTextEditorProps]
---

# Headings

## Basics

```demo
markdown
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

The heading levels offered are fixed when the editor mounts. Changing `headingLevels` afterwards does not re-resolve the dropdown until the component remounts.

## API

- [CommandId](/react-rtekit/api/types/)
- [RichTextEditorProps](/react-rtekit/api/rich-text-editor/)
