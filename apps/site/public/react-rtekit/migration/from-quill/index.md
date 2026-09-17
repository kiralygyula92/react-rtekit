---
pluginId: react-rtekit
pathname: /react-rtekit/migration/from-quill/
title: From Quill
description: A field-by-field migration from Quill, with the stored markup read as it is rather than converted.
archetype: I
section: migration
---

# From Quill

```demo
html-interop
```

## Your stored content does not need converting

The `quill-compatible` interop profile reads Quill's markup as it is — `ql-align-*`, `data-list`, indent classes — and can emit it again. A migration is a component swap, not a data migration.

```tsx
<RichTextEditor htmlProfile="quill-compatible" value={existingQuillHtml} />
```

When you are ready to stop writing Quill's dialect, switch the output profile and the content converts as it is edited:

```tsx
<RichTextEditor htmlProfile="standard" />
```

## Prop mapping

| Quill | Here |
|---|---|
| `modules.toolbar` | `toolbar` — an array of arrays |
| `theme: 'snow'` | `theme={classicTheme}`, or `preset="classic"` |
| `formats` | the plugin list, via `preset` / `addPlugins` / `removePlugins` |
| `readOnly` | `readOnly`, and `disabled` for the other state |
| `placeholder` | `placeholder` |
| `getContents()` / `setContents()` | `editor.getJSON()` / `editor.setContent()` |
| `getText()` | `editor.getText()` |
| `on('text-change')` | `onChange`, with a `ChangeMeta` saying what caused it |

## What is different on purpose

- **Emptiness.** Quill's `getText()` on an empty editor returns `\n`. `isEmpty()` here returns `true`, and `required` believes it.
- **The toolbar is a real ARIA toolbar.** One tab stop, arrows between controls.
- **Sanitization is not optional.** Quill will render what you give it; this will not.

## The parity demo

[Legacy parity](/react-rtekit/demos/legacy-parity/) reproduces the old editor exactly and lists the 26 bugs that are fixed.
