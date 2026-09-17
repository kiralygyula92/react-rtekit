---
pluginId: react-rtekit
pathname: /react-rtekit/guides/best-practices/
title: Best practices
description: The habits that keep an editor fast, accessible and predictable as an application grows around it.
archetype: I
section: guides
---

# Best practices

## Keep the value stable

A new string identity on every render makes the editor reconcile content it already has. Hold the value in state and pass the same reference until it genuinely changes.

## Memoise the object props

`theme`, `slots`, `handlers`, `toolbar` and `localization` are compared by identity. An object literal in JSX is a new one every render:

```tsx
const theme = useMemo(() => createTheme(lightTheme, brand), []);
<RichTextEditor theme={theme} />
```

## Do not switch preset or locale to change a setting

Both are resolved when the editor mounts, so changing either remounts it and starts a new undo stack. Change the individual props instead.

## Use the lowest customization level that works

A token beats a class name, which beats a slot, which beats a fork. Each level leaves the ones above it working; a fork leaves nothing working.

## Check emptiness with `isEmpty()`

Not with `value === ''` and not with a length check on the HTML. An empty editor is `<p><br></p>`, which is neither empty nor meaningful.

## Sanitize on the server too

The client sanitizer is a usability feature and a defence in depth. It is not a boundary you can trust, because the client is not a boundary you can trust.
