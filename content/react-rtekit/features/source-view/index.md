---
pluginId: react-rtekit
pathname: /react-rtekit/source-view/
title: Source view
description: Edit the HTML directly, with everything you type going through the same sanitizer as a paste.
archetype: B
section: features
capabilityId: source-view
group: Interaction
symbols: [EditorInstance, sanitizeHtml]
---

# Source view

## Basics

```demo
source-view
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

The source view is not a way around the sanitizer — markup that sanitizes away to nothing is refused rather than silently emptying the field.

## API

- [EditorInstance](/react-rtekit/api/editor-instance/)
- [sanitizeHtml](/react-rtekit/api/sanitize/)
