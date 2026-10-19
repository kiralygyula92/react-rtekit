---
pluginId: react-rtekit
pathname: /react-rtekit/integrations/react-hook-form/
title: React Hook Form
description: Wiring the editor to a React Hook Form field with a Controller, including validation and focus.
archetype: I
section: integrations
---

# React Hook Form

```demo
validation-rhf
```

There is no React Hook Form adapter package — the editor is a controlled input, so a `Controller` wires it to a field directly:

```tsx
import { Controller, useForm } from 'react-hook-form';
import { RichTextEditor, isEmptyHtml } from '@kingtech/react-rtekit';

const { control, handleSubmit } = useForm({ defaultValues: { body: '' } });

<Controller
  control={control}
  name="body"
  rules={{ validate: (value) => (isEmptyHtml(value) ? 'A message is required' : true) }}
  render={({ field, fieldState }) => (
    <RichTextEditor
      label="Message"
      value={field.value}
      onChange={(value) => field.onChange(value)}
      onBlur={field.onBlur}
      editorRef={(editor) => {
        field.ref(editor ? { focus: () => editor.focus('end') } : null);
      }}
      error={fieldState.error?.message ?? false}
    />
  )}
/>
```

## Why `validate` rather than `required`

React Hook Form's `required` is a truthiness check. An editor that looks empty contains `<p><br></p>`, a truthy string, so `required` passes when it should not — which is one of the 26 bugs this library was written to fix. Validate with `isEmptyHtml` instead.

Pass the value to `field.onChange` and nothing else: also calling `setValue` writes every change twice. Because `value` comes from the form, `reset()` reaches the editor, and `editorRef` lets the form focus the editor when a submit fails.
