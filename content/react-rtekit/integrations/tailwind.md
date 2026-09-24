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

Two routes, and a skin usually uses both. The parts that are components — the toolbar controls, the label, the counter, the error — are slots, so a replacement carries your classes like any other component. The frame the editor renders itself is reached from the root's `className` with arbitrary variants on its `rte-*` class names:

```tsx
<RichTextEditor
  className={[
    'rounded-xl border border-slate-200 shadow-sm',
    '[&_.rte-toolbar]:bg-slate-50',
    '[&_.rte-content]:prose [&_.rte-content]:max-w-none [&_.rte-content]:p-4',
  ].join(' ')}
  slots={{ ToolbarButton: MyToolbarButton, ToolbarToggle: MyToolbarButton }}
/>
```

A slot component has to forward its ref and spread the props it is given: the toolbar's keyboard model moves focus through that ref, and the `mousedown` handling that keeps the selection arrives in the props.

## With `@tailwindcss/typography`

Apply `prose` to the content area, and turn off the package's own content styling to avoid two opinions about a heading:

```ts
import 'react-rtekit/base.css';   // chrome only, no content styles
```

## Dark mode

The editor reads `data-color-scheme` on an ancestor. Set it where you set Tailwind's `dark` class and the two stay in step.
