# react-rtekit

## 1.0.0

The first public release.

A React rich-text editor with its own editing engine and no dependencies: React and
React DOM are the only peers, and installing it installs nothing else.

### The editor

- **Three shapes, one editor.** `<RichTextEditor>` is a complete field — toolbar, label,
  helper text, validation message and counter. The same editor is available as nine
  composable parts (`Rte.Root`, `Rte.Toolbar`, `Rte.Content`, …) for layouts the
  all-in-one shape cannot make, and headless through `useEditor`.
- **An engine of its own.** A keyed document tree, a DOM reconciler that keeps the caret
  where it is, selection mapping, IME composition and grouped undo, behind the
  `EditorEngine` interface. Nothing above that interface depends on how the document is
  edited.
- **Features as plugins.** 37 plugins and 57 commands: text formatting, colours, fonts,
  headings, lists and check lists, indentation, alignment, links, images with uploads
  and resizing, tables, code blocks, blockquotes, dividers, merge tags, mentions, emoji,
  a slash menu, Markdown shortcuts, find and replace, an HTML source view, fullscreen,
  autosave with a restore prompt, print, and a floating selection toolbar.
- **Value formats.** HTML, Markdown, plain text or the portable JSON document, as a
  controlled or uncontrolled value. `isEmpty()` ignores `<p><br></p>`, and `maxLength`
  counts characters or words rather than markup, so `required` and a length limit mean
  what they say.

### Safe with untrusted content

- Every way content gets in — the initial value, a paste, a drop, a programmatic
  insert, a stored JSON document — and the HTML that comes out goes through an
  allowlist sanitizer built on an in-house HTML parser. Four profiles (`strict`,
  `standard`, `email`, `permissive`) and hard rules no configuration switches off: no
  script, no event handlers, no `javascript:` or `data:text/html` URLs, no SVG data
  URLs, and `rel="noopener noreferrer"` on every `target="_blank"` link.
- Removals are reported through the `onSanitizeViolation` handler, for a security log or
  a message to the author.
- `markdownToHtml` holds to the same URL rules, escapes every attribute, and runs in
  linear time on adversarial input.

### Existing content keeps working

- Interop profiles read legacy Quill markup — `ql-align-*`, `data-list`, indent classes —
  and write standard, Quill-compatible or e-mail-safe HTML, so stored content needs no
  migration in either direction.
- Paste cleanup for Word, Google Docs and Excel.
- `<RteContentView>` renders stored content exactly as the editor does, and is safe to
  use in a React Server Component.

### Customization, in eight levels

114 theme tokens, toolbar configuration, custom toolbar items, 20 replaceable slots, 18
handler middleware points, command overrides, the composable parts, and the headless
hook. Presets: `light`, `dark` (which follows `prefers-color-scheme` or a
`data-color-scheme` ancestor), `classic`, `compact` and `bordered`.

### Accessible and localized

A real ARIA toolbar with roving focus, a named textbox, errors linked with
`aria-describedby`, live announcements, a keyboard reference built from the keymap in
force, and every shipped theme meeting WCAG AA. 153 localization keys, with English,
German, Spanish and Hungarian included.

### Compatibility

React 18.2 and 19; server rendering, including the Next.js App Router, where the client
entry carries `'use client'`; ESM and CommonJS; TypeScript declarations for both.

What semantic versioning covers from this release on is written down in
[VERSIONING.md](https://github.com/kiralygyula92/react-rtekit/blob/main/VERSIONING.md):
props, instance methods, commands, slots, handlers, the plugin API, theme tokens,
localization keys, CSS class names, data attributes and the document shape. The
`classic` theme's token values are frozen.
