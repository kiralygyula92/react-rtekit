# Versioning policy

`react-rtekit` follows [semantic versioning](https://semver.org/). This document says
exactly what that covers, because "the public API" means something unusually wide for
an editor: a rich-text field is styled by its class names, themed by its CSS variables,
targeted in tests by its data attributes and translated through its message keys. All
of those are things you build against, so all of them are covered.

## What is covered

A change to any of the following is a **major** release.

| Surface | Where it is enumerated |
|---|---|
| `<RichTextEditor>` props, and their defaults | [`/api/rich-text-editor`](https://react-rtekit.vercel.app/react-rtekit/api/rich-text-editor/) |
| `EditorInstance` methods and their signatures | [`/api/editor-instance`](https://react-rtekit.vercel.app/react-rtekit/api/editor-instance/) |
| Command ids and their payloads | [`/api/commands`](https://react-rtekit.vercel.app/react-rtekit/api/commands/) |
| Slot names and the props each slot receives | [`/api/slots`](https://react-rtekit.vercel.app/react-rtekit/api/slots/) |
| Handler names and their context objects | [`/api/handlers`](https://react-rtekit.vercel.app/react-rtekit/api/handlers/) |
| The plugin API: `definePlugin`, node and mark specs, serializer and sanitizer rules | [`/api/plugins`](https://react-rtekit.vercel.app/react-rtekit/api/plugins/) |
| Theme tokens and the CSS variables they produce | [`/api/theme-tokens`](https://react-rtekit.vercel.app/react-rtekit/api/theme-tokens/) |
| Localization keys | [`/api/localization`](https://react-rtekit.vercel.app/react-rtekit/api/localization-keys/) |
| CSS class names (`rte-*`) and data attributes (`data-*`) on the rendered elements | `styles.css` |
| The exported entry points and what each one exports | `package.json#exports` |
| The portable document shape (`EditorDocument`) and its `version` field | [`/api/types`](https://react-rtekit.vercel.app/react-rtekit/api/types/) |

Those pages are generated from the library's own runtime metadata rather than written
by hand, so the list cannot fall behind the implementation.

### The `classic` theme is frozen

`classic` exists to reproduce one specific editor pixel for pixel. Its token values are
part of the contract: changing one is a major release, even though the same change to
`light` or `dark` would not be. The one place it has deviated from its reference is
recorded in the theme source and in the parity example's "show differences" list.

## What is not covered

- **Rendered HTML structure inside the content**, beyond the class names above. The
  engine decides how a paragraph is nested; that is what the engine adapter is for.
- **The engine's internals**, including anything reached through
  `editor.engine.native`. It is a documented escape hatch, and an escape hatch is not
  a contract.
- **Anything marked `@internal`** in the TSDoc, which is excluded from the published
  types.
- **The exact bytes of serialized output** where the change is a normalization — for
  example attribute order, or whitespace between blocks. What round-trips is covered;
  what it looks like in between is not.
- **The demo site's URLs**, other than the versioned documentation root.

## Minor releases

A minor release may add props, commands, slots, handlers, tokens, locale keys, plugins
and entry points. It may also:

- change the token *values* of any preset except `classic`;
- add a sanitizer rule that removes something previously allowed, when that something
  turns out to be a vector — a security fix is never held back for a major;
- change how a foreign dialect is parsed, when the current reading loses content.

The last two are the deliberate exceptions. Both are cases where "no behaviour change"
would mean "keep the bug".

## Deprecations

A deprecated symbol keeps working for the rest of the major. It is marked
`@deprecated` in the TSDoc, so your editor strikes it through and the API pages label
it, and it warns once per session in development builds — once, because a warning on
every keystroke is a warning people turn off. It is removed in the next major, and the
release notes say what replaced it.

## Supported versions

The current major receives fixes. The previous major receives security fixes for six
months after the new major is released. See [SECURITY.md](SECURITY.md).

## Release process

Every user-visible change carries a [changeset](https://github.com/changesets/changesets).
Merging to `main` opens a version PR; merging that PR publishes to npm with
[provenance](https://docs.npmjs.com/generating-provenance-statements) and creates a
GitHub release. The per-package `CHANGELOG.md` files are generated from the changesets,
so the release notes are written when the change is made rather than reconstructed
afterwards.
