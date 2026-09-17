---
pluginId: react-rtekit
pathname: /react-rtekit/guides/writing-a-plugin/
title: Writing a plugin
description: 'Building a plugin end to end: a mark, a command, a keyboard shortcut and a toolbar item.'
archetype: I
section: guides
---

# Writing a plugin

```demo
plugin-authoring
```

## The shape

A plugin is an object. `definePlugin` is an identity function that exists for the inference:

```tsx
import { definePlugin } from 'react-rtekit';

export const highlight = definePlugin({
  name: 'highlight',
  commands: {
    toggleHighlight: ({ editor }) => editor.exec('setBackgroundColor', { color: '#ff0' }),
  },
  keymap: { 'Mod+Shift+H': 'toggleHighlight' },
  toolbarItems: [
    { name: 'highlight', label: 'Highlight', icon: <PenIcon />, command: 'toggleHighlight' },
  ],
});
```

Then add it:

```tsx
<RichTextEditor addPlugins={[highlight]} toolbar={[['bold', 'highlight']]} />
```

## Order

Plugins resolve by dependency and then by priority, and a later registration of the same name replaces an earlier one — which is how you override a built-in: give yours the built-in's name.

A `dependsOn` that names something absent produces a warning and still loads. A missing dependency should not hand the reader an editor with a feature silently gone.

## Typing a new command

Augment the catalogue so `editor.exec` knows about it:

```ts
declare module 'react-rtekit' {
  interface CommandMap {
    toggleHighlight: void;
  }
}
```
