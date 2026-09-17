# ADR-002: Lexical as the default engine adapter

- **Status:** Accepted
- **Date:** 2026-09-16
- **Related:** ADR-001, ADR-004

## Context

The library needs a document engine behind `EditorEngine`. The incumbent is Quill 2
(via `react-quill-new`), which is what the existing app uses and what produced every
byte of stored content.

## Options

| Option | Assessment |
|---|---|
| **Quill 2** | Familiar, and already the source of stored content. But: a class-based API with a weak extension model (Blots/Parchment), a global stylesheet that must be fought rather than composed with, no first-class React integration, and an architecture that resists the override depth this project requires. |
| **Lexical** | React-first, built around nodes and plugins that map almost directly onto our plugin API, good IME and accessibility handling, first-class HTML and Markdown serialization, actively maintained, and a collaboration story for v1.x. |
| **ProseMirror / TipTap** | Excellent and battle-tested. Rejected on conceptual surface area: ProseMirror's schema/transform model is a large thing to expose through our own abstraction, and TipTap adds an ecosystem and licensing overlap we would rather not inherit. |
| **Hand-written contenteditable** | A multi-year problem. Not a serious option. |

## Decision

Ship **Lexical** as the default adapter: `lexical` and `@lexical/react` plus the
feature packages actually used (`@lexical/rich-text`, `@lexical/list`, `@lexical/link`,
`@lexical/html`, `@lexical/selection`, `@lexical/utils`, and optionally
`@lexical/markdown` and `@lexical/table`), all as **peer dependencies** so consumers
control the version and no duplicate copy ends up in the bundle.

## Consequences

- Content parity with the old editor is **not** delivered by using the same engine. It
  is delivered by the interop profiles (ADR-004), which is the part that actually
  matters: stored markup has to open, edit and save correctly no matter what renders it.
- A Quill adapter stays possible for v1.x drop-in parity, and the `EditorEngine`
  interface exists precisely so that it is a contained piece of work.
- Consumers must install the peers. This is documented as a single install line, and
  npm and pnpm auto-install peers by default.
- The adapter is the one place in the codebase allowed to import Lexical.
