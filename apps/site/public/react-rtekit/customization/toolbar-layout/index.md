---
pluginId: react-rtekit
pathname: /react-rtekit/customization/toolbar-layout/
title: Toolbar layout
description: Choosing items, grouping them, adding your own, and deciding what happens when they do not fit.
archetype: I
section: customization
---

# Toolbar layout

The toolbar takes an array of arrays: each inner array is a group, and the gaps between groups are where the separators go.

```demo
toolbar-config
```

```tsx
<RichTextEditor
  toolbar={[
    ['undo', 'redo'],
    ['bold', 'italic', 'underline'],
    ['link', 'image'],
  ]}
  toolbarOverflow="menu"
/>
```

## Overflow

- `menu` — groups that do not fit move into a "more" menu.
- `wrap` — the row grows taller.
- `scroll` — the row scrolls, with its own tab stop.

## Adding an item

`createToolbarItem` builds one in the same shape the built-ins use, so nothing about them is privileged:

```tsx
import { createToolbarItem } from 'react-rtekit';

const highlight = createToolbarItem({
  name: 'highlight',
  label: 'Highlight',
  icon: <HighlightIcon />,
  command: 'toggleHighlight',
});
```
