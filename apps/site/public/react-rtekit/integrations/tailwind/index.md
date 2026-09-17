---
pluginId: react-rtekit
pathname: /react-rtekit/integrations/tailwind/
title: Tailwind CSS
description: Using the editor inside a Tailwind project without the two stylesheets fighting.
archetype: I
section: integrations
---

# Tailwind CSS

```demo
tailwind-skin
```

The editor's CSS lives in a cascade layer called `rtekit`, so it does not fight Tailwind's utilities — a utility class always wins, because unlayered styles beat layered ones.

## Skinning with utilities

```tsx
<RichTextEditor
  classNames={{
    root: 'rounded-xl border border-slate-200 shadow-sm',
    toolbar: 'bg-slate-50',
    content: 'prose max-w-none p-4',
  }}
/>
```

`classNames` adds to the shipped class rather than replacing it, so the behaviour that depends on those classes keeps working.

## With `@tailwindcss/typography`

Apply `prose` to the content area, and turn off the package's own content styling to avoid two opinions about a heading:

```ts
import 'react-rtekit/base.css';   // chrome only, no content styles
```

## Dark mode

The editor reads `data-color-scheme` on an ancestor. Set it where you set Tailwind's `dark` class and the two stay in step.
