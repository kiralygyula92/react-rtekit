---
pluginId: react-rtekit
pathname: /react-rtekit/integrations/react-hook-form/
title: React Hook Form
description: 'The dedicated adapter package: registration, validation and dirty state.'
archetype: I
section: integrations
---

# React Hook Form

```demo
validation-rhf
```

`react-rtekit-rhf` is a separate package so that a project not using React Hook Form does not pay for it:

```bash
npm install react-rtekit-rhf
```

```tsx
import { useForm } from 'react-hook-form';
import { RhfRichTextEditor } from 'react-rtekit-rhf';

const { control, handleSubmit } = useForm({ defaultValues: { body: '' } });

<RhfRichTextEditor
  name="body"
  control={control}
  label="Message"
  rules={{ required: 'A message is required' }}
/>
```

## Why an adapter rather than a Controller

The adapter reports emptiness with `isEmpty()` rather than by string comparison. An editor that looks empty contains `<p><br></p>`, so a `required` rule written against the raw value passes when it should not — which is one of the 26 bugs this package was written to fix.

It also maps dirty state to real content changes, so focusing and blurring does not mark a form dirty.
