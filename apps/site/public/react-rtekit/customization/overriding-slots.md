---
pluginId: react-rtekit
pathname: /react-rtekit/customization/overriding-slots/
title: Overriding structure
description: Replacing a part with your own component without losing the behaviour that came with it.
archetype: I
section: customization
---

# Overriding structure

A slot is a component the editor renders instead of its own. There are 46 of them, from the root element down to a single toolbar button.

```demo
slots-custom
```

## The one rule

A slot receives props, and the behaviour lives in those props. Spread them back:

```tsx
<RichTextEditor
  slots={{
    ToolbarButton: ({ icon, label, ...rest }) => (
      <MyButton {...rest} aria-label={label}>{icon}</MyButton>
    ),
  }}
/>
```

Dropping them renders an empty shell — the part stops working rather than stops looking right. The `mousedown` prevention that keeps the editor's selection while a toolbar button is clicked arrives in exactly that way.

The full list is on the [slot catalogue](/react-rtekit/api/slots/) page.
