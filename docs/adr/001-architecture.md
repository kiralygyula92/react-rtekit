# ADR-001: Engine-adapter architecture with a headless core

- **Status:** Accepted
- **Date:** 2026-09-16

## Context

The editor this library replaces is a 514-line component that wraps `react-quill-new`,
hides Quill's toolbar, hand-builds a MUI one, and hard-codes every visual. It is
un-extendable by design: the format list is a constant, the toolbar is JSX, the styles
fight a globally imported third-party stylesheet, and there is no seam at which a
consumer could change behaviour without forking the file.

We need the opposite: a library whose every visible part is replaceable, whose every
interaction can be intercepted, and whose look is data. At the same time, the genuinely
hard parts of a rich-text editor -- contenteditable quirks, selection, IME, undo
grouping, paste -- are solved problems that we should not re-solve.

## Decision

Split the system into a **product layer** we own and a **document layer** we delegate.

1. `EditorEngine` / `EngineHandle` (02 section 2.2) is the only interface the product
   layer calls. It covers content, selection, commands, schema registration, history,
   focus and events, and nothing above that line knows which engine is mounted.
2. The core (`src/core`) is engine-agnostic and React-free: schema, normalization, the
   portable `EditorDocument`, serializers, the sanitizer, the interop profiles and the
   command registry. It is separately importable as `react-rtekit/core` and is safe on
   a server.
3. Built-in features are plugins, registered through the same API third parties use, so
   the extension surface is exercised by the library itself rather than bolted on.
4. The React layer adds slots, handler middleware, theming and field chrome on top, and
   is offered at four entry points: the all-in-one component, the same with overrides,
   composable parts, and `useEditor` with no UI at all.

## Consequences

- Swapping engines is a contained change, and a second adapter is a normal piece of
  work rather than a rewrite.
- Every feature pays a small indirection cost through the engine interface. In exchange,
  the entire product layer is testable without a browser.
- The portable document model is an extra representation to maintain, but it gives us
  engine-independent tests, stable JSON storage and a serializer boundary that the
  sanitizer can sit on.
- The public API must never leak engine types. The only exceptions are the documented
  `native` escape hatch and the optional `engine` prop.
