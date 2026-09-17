---
pluginId: react-rtekit
pathname: /react-rtekit/indentation/
title: Indentation
description: 'Block indentation in steps, for quotes and nested structure, with the legacy ql-indent-* classes read on the way in.'
archetype: B
section: features
capabilityId: indentation
group: 'Display & layout'
symbols: [CommandId, FormatState]
---

# Indentation

## Basics

```demo
lists
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

Indenting a list item changes its nesting level rather than its margin, which is what makes the output valid HTML rather than a flat list with padding.

## API

- [CommandId](/react-rtekit/api/types/)
- [FormatState](/react-rtekit/api/types/)
