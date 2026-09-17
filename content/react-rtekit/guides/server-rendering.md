---
pluginId: react-rtekit
pathname: /react-rtekit/guides/server-rendering/
title: Server rendering
description: Rendering the content on the server and hydrating without a flash or a mismatch.
archetype: I
section: guides
---

# Server rendering

## What runs where

The engine needs a DOM, so the editor itself is a client component. What the server can do is render the content, so the first paint is the text rather than an empty box.

```tsx
'use client';
import { RichTextEditor } from 'react-rtekit';
```

## The rule that matters

The server-rendered markup becomes the host element's initial HTML, and it must not change afterwards — React would replace the children, which by then are the engine's contenteditable. The component freezes the first value for this reason, and a regression test holds it there.

In practice: pass the value you have, and do not expect the server preview to track state.

## Only HTML

An HTML value can be pre-rendered. JSON and Markdown need a converter the server entry deliberately does not carry, so those render the loading state and hydrate.

## Rendering stored content without an editor

If a page only displays content, do not mount an editor at all:

```tsx
import { RteContentView } from 'react-rtekit/view';

<RteContentView value={storedHtml} />
```

That entry point has no engine and no React client requirement beyond rendering.
