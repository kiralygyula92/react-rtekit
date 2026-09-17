---
pluginId: react-rtekit
pathname: /react-rtekit/integrations/remix/
title: Remix
description: 'Loading and submitting editor content with Remix''s data conventions.'
archetype: I
section: integrations
---

# Remix

```tsx
import { useLoaderData, Form } from '@remix-run/react';
import { useState } from 'react';
import { RichTextEditor } from 'react-rtekit';

export default function Edit() {
  const { body } = useLoaderData<typeof loader>();
  const [value, setValue] = useState(body);

  return (
    <Form method="post">
      <RichTextEditor label="Body" value={value} onChange={setValue} />
      <input type="hidden" name="body" value={value} />
      <button type="submit">Save</button>
    </Form>
  );
}
```

The hidden input is what makes a progressive-enhancement submission carry the content: the editor is a contenteditable, not a form control, so it does not serialize itself.

## Sanitize in the action

```ts
import { sanitizeHtml } from 'react-rtekit/core';

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const body = sanitizeHtml(String(form.get('body')), { sanitize: 'standard' });
  await save({ body });
  return redirect('/');
}
```

`react-rtekit/core` has no React and no engine, so importing it in a server action costs about 19 kB rather than the whole component.
