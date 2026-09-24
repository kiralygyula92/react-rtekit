---
pluginId: react-rtekit
pathname: /react-rtekit/forms/
title: Forms
description: Validation, dirty state and submission, with an adapter for React Hook Form and a worked Formik example.
archetype: B
section: features
capabilityId: forms
group: Developer tools
symbols: [RichTextEditorProps, useValidationError, useIsEmpty]
---

# Forms

## Basics

```demo
validation-rhf
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](/react-rtekit/customization/) for the eight levels and how to pick one, and [Theming & tokens](/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

`required` uses `isEmpty()`, which ignores `<p><br></p>`. A form library checking the raw HTML string instead will think an empty editor has content.

## API

- [RichTextEditorProps](/react-rtekit/api/rich-text-editor/)
- [useValidationError](/react-rtekit/api/editor-hooks/)
- [useIsEmpty](/react-rtekit/api/editor-hooks/)
