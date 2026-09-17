---
pluginId: react-rtekit
pathname: /react-rtekit/customization/design-system-skin/
title: Design-system skin
description: Making the editor look like the rest of your application, with your components and your tokens.
archetype: I
section: customization
---

# Design-system skin

Making the editor look like the rest of your application means replacing its parts with yours, not overriding its CSS from outside.

```demo
design-system-skin
```

The combination that usually does it:

- a **theme** for colour, radius and spacing;
- **slots** for the controls, so they are literally your buttons and menus;
- `unstyled` if you want none of the shipped chrome CSS at all.

```tsx
<RichTextEditor
  unstyled
  theme={brand}
  slots={{ ToolbarButton: MyButton, Popover: MyPopover, Dialog: MyDialog }}
/>
```

`unstyled` drops the chrome stylesheet, not the content one — the prose still needs to render the same as it will outside the editor.
