# react-rtekit

[![license](https://img.shields.io/github/license/kiralygyula92/react-rtekit)](LICENSE)

A React rich-text editor for products that have to live with their own HTML: sanitized
on every boundary, themeable down to the token, replaceable at every level from a CSS
variable to the whole UI, and able to round-trip the markup your old editor already
stored.

```bash
pnpm add react-rtekit
```

```tsx
import { useState } from 'react';
import { RichTextEditor } from 'react-rtekit';
import 'react-rtekit/styles.css';

export function MessageField() {
  const [value, setValue] = useState('<p>Hello</p>');

  return (
    <RichTextEditor
      label="Message"
      value={value}
      onChange={setValue}
      maxLength={2048}
      showCounter
      required
    />
  );
}
```

[Documentation](https://react-rtekit.vercel.app/react-rtekit/) ·
[Features](https://react-rtekit.vercel.app/react-rtekit/all-features/) ·
[Playground](https://react-rtekit.vercel.app/react-rtekit/demos/playground/) ·
[API reference](https://react-rtekit.vercel.app/react-rtekit/api/)

## Why

- **Sanitized at every boundary.** The initial value, every paste, every drop, every
  programmatic insert and the output all pass an allowlist sanitizer with four profiles
  and hard rules no configuration can switch off. There is no code path that renders
  HTML the sanitizer has not seen.
- **Your stored HTML keeps working.** Interop profiles read legacy Quill markup —
  `ql-align-*`, `data-list`, indent classes — and emit standards-compliant,
  Quill-compatible or e-mail-safe HTML, so existing content needs no migration in
  either direction.
- **An engine adapter, not a wrapper.** An `EditorEngine` interface owns the document
  layer, and the engine behind it is this project's own. Nothing above
  `src/engines/` knows how the document is edited, which is what let the
  engine be replaced without the public API moving.
- **Emptiness is a first-class concept.** `isEmpty()` ignores `<p><br></p>`, and length
  limits count text rather than markup — so `required` actually means required, and a
  bold word does not eat your character budget.
- **Accessible by construction.** A real ARIA toolbar with roving focus, a named
  textbox, errors linked with `aria-describedby`, live-region announcements, a complete
  keyboard model and a shortcut reference built from the keymap that is actually in
  force. Every shipped theme meets WCAG AA, and a test enforces it.
- **Replaceable at eight levels.** Theme tokens, toolbar config, custom toolbar
  items, slots, handler middleware, command overrides, composable parts, and fully
  headless `useEditor`. Use the lowest level that does the
  job; each one leaves the rest working.

## Entry points

| Import | What it gives you | Size (min+gz) |
|---|---|---|
| `react-rtekit` | The editor, the parts, the hooks, the plugins, the themes | 71 kB for the full component, 42 kB headless |
| `react-rtekit/core` | Parse, sanitize, serialize and count. No React, no engine. | 18 kB |
| `react-rtekit/view` | `<RteContentView>`: stored content, rendered read-only and sanitized | 17 kB |
| `react-rtekit/meta` | Runtime metadata: every slot, command, handler, token and locale key | 17 kB |
| `react-rtekit/styles.css` | Structure, prose styles and the default theme, in a cascade layer | 6 kB |
| `react-rtekit-rhf` | `<RteField>`, the react-hook-form adapter | under 1 kB |

`react-rtekit/core` has no browser dependency: the HTML parser is in-house precisely so
that sanitizing and serializing work identically in a Node handler, in a worker and
during server rendering.

## Requirements

React 18 or 19. Nothing else — there are no other dependencies, peer or otherwise.
TypeScript is optional but the types are first-class: command payloads, slot context
props and theme tokens are all typed, and the command registry is open for augmentation.

Browsers: current Chrome, Edge, Firefox and Safari, on desktop and mobile. The
end-to-end suite runs on Chromium, Firefox and WebKit, plus mobile Chrome and mobile
Safari emulation.

## Server rendering

The editor renders its content as static HTML on the server and mounts the engine on
the client, so a server-rendered form is not a blank box before hydration. For content
that is only ever read — a list page, an e-mail preview — use `<RteContentView>`, which
carries no engine at all.

## Documentation

- [Getting started](https://react-rtekit.vercel.app/react-rtekit/getting-started/installation/)
  and a page for every [feature](https://react-rtekit.vercel.app/react-rtekit/all-features/),
  each with a live demo.
- [Guides](https://react-rtekit.vercel.app/react-rtekit/guides/): security, performance,
  testing, accessibility, localization, server rendering and writing a plugin.
- [API reference](https://react-rtekit.vercel.app/react-rtekit/api/) — generated from TypeDoc and the library's runtime
  metadata, so the lists cannot drift.
- [AI context](https://react-rtekit.vercel.app/react-rtekit/getting-started/ai-context/) — the whole documentation and the
  source of every example in one Markdown file, for AI coding agents.

## Packages

| Package | What it is |
|---|---|
| [`react-rtekit`](packages/react-rtekit) | The library |
| [`react-rtekit-rhf`](packages/react-rtekit-rhf) | The react-hook-form adapter |
| [`apps/site`](apps/site) | Demo gallery, playground, theme editor and API docs |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Security issues go through
[SECURITY.md](SECURITY.md), never a public issue. What semantic versioning covers here
is written down in [VERSIONING.md](VERSIONING.md).

## License

[MIT](LICENSE) © kiralygyula92. Third-party attributions are listed in
[`packages/react-rtekit/NOTICE`](packages/react-rtekit/NOTICE).
