---
pluginId: react-rtekit
pathname: /react-rtekit/integrations/formik/
title: Formik
description: Wiring the editor to a Formik field, including validation and submission.
archetype: I
section: integrations
---

# Formik

```demo
validation-formik
```

There is no Formik adapter package — the editor wires to a field directly:

```tsx
import { useField } from 'formik';
import { RichTextEditor, isEmptyHtml } from 'react-rtekit';

function BodyField() {
  const [field, meta, helpers] = useField('body');

  return (
    <RichTextEditor
      label="Message"
      value={field.value}
      onChange={(next) => helpers.setValue(next)}
      onBlur={() => helpers.setTouched(true)}
      invalid={meta.touched && Boolean(meta.error)}
      error={meta.touched ? meta.error : undefined}
    />
  );
}
```

Validate with `isEmptyHtml` rather than a string check:

```ts
validate: (value) => (isEmptyHtml(value) ? 'A message is required' : undefined);
```
