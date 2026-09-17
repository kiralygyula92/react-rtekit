---
pluginId: react-rtekit
pathname: /react-rtekit/integrations/next-js/
title: Next.js
description: App Router and Pages Router, client boundaries, and rendering content on the server.
archetype: I
section: integrations
---

# Next.js

The editor is a client component: the engine needs a DOM.

## App Router

```tsx
'use client';

import { useState } from 'react';
import { RichTextEditor } from 'react-rtekit';

export function Body({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  return <RichTextEditor label="Body" value={value} onChange={setValue} />;
}
```

Import the stylesheet in the root layout:

```tsx
import 'react-rtekit/styles.css';
```

## Displaying content in a server component

A page that only renders stored HTML does not need an editor, or a client boundary:

```tsx
import { RteContentView } from 'react-rtekit/view';

export default async function Page() {
  const post = await getPost();
  return <RteContentView value={post.body} />;
}
```

## Pages Router

The same, without the directive. The first paint renders the content and hydrates into an editor; see [Server rendering](/react-rtekit/server-rendering/) for why the pre-rendered value is frozen.
