---
pluginId: react-rtekit
pathname: /react-rtekit/accessibility/
title: Accessibility
description: A named textbox, a real ARIA toolbar with roving focus, linked errors, live announcements and AA contrast.
archetype: B
section: features
capabilityId: accessibility
group: Developer tools
symbols: [RichTextEditorProps, useValidationError]
---

# Accessibility

## Basics

```demo
accessibility
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](/react-rtekit/customization/) for the eight levels and how to pick one, and [Theming & tokens](/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

Every shipped theme meets WCAG AA and a test enforces it. A theme you write does not inherit that — and a slot you replace does not inherit the semantics either.

## API

- [RichTextEditorProps](/react-rtekit/api/rich-text-editor/)
- [useValidationError](/react-rtekit/api/editor-hooks/)
