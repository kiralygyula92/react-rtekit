---
pluginId: react-rtekit
pathname: /react-rtekit/getting-started/usage/
title: Usage
description: A working editor in about fifteen lines, controlled or uncontrolled, with the value in the format you want.
archetype: F
section: getting-started
---

# Usage

## A basic editor

```demo
basic
```

## Controlled and uncontrolled

Pass `value` and `onChange` for a controlled field, or `defaultValue` alone for an uncontrolled one. The two are the React conventions and they behave the way you expect:

```tsx
<RichTextEditor value={value} onChange={setValue} />   // controlled
<RichTextEditor defaultValue="<p>Draft</p>" />          // uncontrolled
```

`onChange` receives the value and a `ChangeMeta` describing what caused it — `user`, `api`, `paste` or `undo` — so you can tell a keystroke from a programmatic `setContent`.

## Choosing a value format

```tsx
<RichTextEditor valueFormat="html" />       // the default
<RichTextEditor valueFormat="json" />       // the document model
<RichTextEditor valueFormat="markdown" />
<RichTextEditor valueFormat="text" />
```

See [Value formats](/react-rtekit/value-formats/) for what each one keeps.

## Verify

Type in the demo above and watch the value under it change. Select a word and press Mod+B; the HTML should gain a `<strong>`.

## Next steps

- [All features](/react-rtekit/all-features/) — what else you can turn on.
- [Toolbar](/react-rtekit/toolbar/) — choosing and arranging the controls.
- [Forms](/react-rtekit/forms/) — validation and submission.
