# AGENTS.md

Instructions for AI coding agents working in this repository. Claude Code reads them through
`CLAUDE.md`. Humans: see [CONTRIBUTING.md](CONTRIBUTING.md).

## What this repo is

A pnpm monorepo:

- `packages/react-rtekit`: the published library `react-rtekit`, an accessible, themeable
  rich-text editor for React with no dependencies.
- `packages/react-rtekit-rhf`: the published react-hook-form adapter `react-rtekit-rhf`.
- `apps/site`: the demo gallery, playground, theme editor and API docs, which doubles as the
  Playwright test bed.
- `content`: the documentation content (`content/react-rtekit`) and its build, reference and
  redirect scripts.

## Rules

1. **Backwards-compatible defaults.** New behavior is opt-in behind a prop; changing a default is a
   breaking change.
2. **Generic and app-agnostic.** No app-specific coupling in the packages: integration points are
   props, slots, handlers, plugins or CSS variables.
3. **No dependencies.** `react` and `react-dom` are the only peers of `react-rtekit`;
   `react-rtekit-rhf` adds `react-hook-form` and `react-rtekit`.
4. **One engine interface.** Nothing outside `src/engines/` depends on how the engine edits the
   document, only on the `EditorEngine` interface.
5. **Safe by default.** Untrusted HTML is sanitized. Every change to `src/core/sanitize` or
   `src/core/interop` comes with a security fixture, and `target="_blank"` links always get
   `rel="noopener noreferrer"`.
6. **Server rendering works:** the editor renders its content as static HTML on the server and
   mounts the engine on the client.
7. **Strict TypeScript:** no `any` in public types; every public symbol has TSDoc
   (`pnpm docs:check`).
8. **Every behavior has an automated test:** core logic in Vitest (Node), anything involving a caret
   in Playwright against real browsers, never jsdom. The regression tests `R1`–`R26` are never
   removed.
9. **Accessibility is required:** every feature is reachable by keyboard and described to
   assistive technology.
10. **Localized and tokenized:** no hard-coded user-visible strings and no inline styles; styling
    hooks are theme tokens and data attributes.
11. **The public API is wide:** CSS class names, CSS variables, data attributes and localization
    keys follow semantic versioning ([VERSIONING.md](VERSIONING.md)). The `classic` theme's token
    values are frozen.
12. **Only original or permissively licensed material.** Third-party code or assets need a
    compatible license and an entry in `packages/react-rtekit/NOTICE`.

## Workflow

- Run `pnpm build && pnpm lint && pnpm typecheck && pnpm test:coverage && pnpm size`, then
  `pnpm docs:json && pnpm docs:check && pnpm copy:check && pnpm e2e`, before committing.
- Conventional Commits (`feat(engines): …`, `fix(site): …`), small and focused.
- User-facing changes need a changeset (`pnpm changeset`): `patch` for fixes, `minor` for
  features, `major` for breaking changes.
- Public API changes: TSDoc on the export, `pnpm docs:json && pnpm content`, and an example, a guide
  and the playground updated.
- Never publish to npm, push tags or bump versions yourself; releases go through the Release
  workflow (see [RELEASING.md](RELEASING.md)).
