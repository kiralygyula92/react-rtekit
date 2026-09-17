# react-rtekit-rhf

## 1.0.0

### Major Changes

- 1.0.0.

  The public API is now covered by semantic versioning, as written down in
  [VERSIONING.md](https://github.com/kiralygyula92/react-rtekit/blob/main/VERSIONING.md): props, instance methods, command ids and payloads,
  slot names and their context props, handler names and contexts, the plugin API, theme
  tokens, localization keys, CSS class names, CSS variables, data attributes and the
  portable document shape. The lists those live in are generated from the library's own
  runtime metadata, so they cannot fall behind the implementation.

  The `classic` theme's token values are frozen from this release: reproducing one
  specific editor pixel for pixel is the point of it, so changing a value there is a major
  release even where the same change to `light` or `dark` would not be.

### Minor Changes

- Scaffold the monorepo: strict TypeScript, ESLint and Prettier, Vitest projects,
  Playwright, tsup (ESM + CJS + d.ts), Lightning CSS builds that preserve the `rtekit`
  cascade layers, size-limit budgets, Changesets and CI. Adds the public type surface,
  the default English catalogue, the token and structural stylesheets with the `classic`
  and `dark` presets, the fixture corpus (Quill, Word, Google Docs, Excel, XSS and the
  legacy editor defaults) and the demo/docs site shell.
- Chrome, toolbar and `classic` parity.

  - A replaceable slot for every part of the UI — 44 of them, from `Root` down to the
    twelve design-system primitives — resolved through one `slots` prop and listed in the
    runtime metadata.
  - A toolbar registry with flat, grouped and object configurations, overflow behaviour,
    visible labels, two sizes and custom items. It is a real `role="toolbar"` with roving
    tabindex, `aria-pressed` toggles, a separator at every group boundary, and controls
    that prevent `mousedown` so a command never runs against a stale selection.
  - Plugins for bold, italic, underline, strike, colour, background colour, alignment,
    lists, indent, history, placeholder, counter and the paste pipeline.
  - A colour picker with the palette, recents, a custom input and a clear action, built as
    a radiogroup of named buttons with arrow-key navigation. Clearing removes the colour
    format instead of writing black.
  - Field chrome: label, helper text, error with `aria-describedby`, counter, and distinct
    `disabled` and `readOnly` modes.
  - The theme token system and the `light` and `classic` presets. `preset="classic"` now
    carries the classic tokens, so the parity reproduction needs one prop rather than two.
  - `react-rtekit-rhf`: `RteField` and `useRteField`, with `required` validated against
    `isEmpty()` so `<p><br></p>` no longer passes.

  Fixes found while building the parity page:

  - Theme tokens reached the DOM under names no stylesheet read (`--rte-editor-border-width`
    rather than `--rte-border-width`), so most of a theme silently did nothing. The
    mapping in 07 §3 is now explicit and a test asserts both directions of it.
  - `Mod+B`, `Mod+I` and `Mod+U` were handled by both the keymap and the engine, so the
    format toggled twice and the shortcut appeared to do nothing. `disableShortcuts` now
    also stops the engine's own handling, rather than only unbinding our command.
  - `editor.focus()` placed the selection without making the editor the active element,
    so the focus state could lag the caret.
  - Placeholder text and the toolbar dropdown value failed WCAG AA contrast.
  - Marked the theme, plugin, icon and memoized-component constructions as pure, which
    takes 5.5 kB off a `useEditor`-only import.

### Patch Changes

- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
  - react-rtekit@1.0.0
