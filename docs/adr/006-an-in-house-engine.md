# ADR-006: An in-house engine

- **Status:** Accepted — in progress
- **Date:** 2026-09-17
- **Related:** ADR-002 (chose Lexical), ADR-003 (the in-house HTML parser), ADR-005
- **Supersedes:** the deferred decision in ADR-005

## Context

ADR-005 laid out four options for the Lexical dependency and left the choice to the
owner. The owner has chosen **C — write an engine in-house**: *"remove any lexical npm
package dependency, if there is a core dependency, analyse it, and write a similar
functionality within our plugin, we do not need external dependencies."*

This records what that means concretely, so the work can be done in reviewable pieces
instead of as one unreviewable rewrite.

## Where Lexical actually is

Measured on this tree, not estimated.

| | |
|---|---|
| Packages in use | 12 |
| Lexical source behind them | **28,059 lines** (dev builds) |
| Distinct Lexical symbols the adapter imports | **119** |
| Our adapter on top | 3,061 lines, 13 files |
| `EngineHandle` methods to satisfy | **34** |
| Files outside `src/engines/lexical/` importing Lexical | **0** |

ADR-005 quoted ~41,200 lines. That figure came from a different measurement basis; 28,059
is the line count of the twelve dev bundles actually imported, and supersedes it.

The last row is the one that matters: the boundary holds. Nothing above `src/engines/`
knows Lexical exists, so this is a rewrite of one directory rather than of the library.

### What is already ours

Most of a rich-text editor is not the engine, and that part is written:

| | Lines | What |
|---|---|---|
| `src/core` | 6,128 | HTML parser (ADR-003), sanitizer and its four profiles, document schema and model, HTML/JSON/Markdown/text serializers, Quill and Office interop, find, emoji, presets |

`EngineMountOptions` already takes `parseHtml` and `serializeHtml` **from the host**, so
serialization is outside the engine boundary today. A new engine inherits all of it.

### What Lexical is doing for us

The 119 symbols, by what replacing them costs:

| Group | Symbols | What it is | Replacing it |
|---|---|---|---|
| Node types | ~34 | paragraph, text, heading, quote, list, list item, link, code, table/row/cell, line break | **Mechanical.** These map one-to-one onto the `EditorDocument` schema we already own. |
| Registrations | 8 | `registerRichText`, `registerList`, `registerTablePlugin`, … | **Mechanical.** Wiring, once the behaviours exist. |
| Markdown shortcuts | 16 | the input-rule transformers | **Small.** Regex-on-type, and `src/core` already parses Markdown. |
| History | 2 | `registerHistory`, `createEmptyHistoryState` | **Small.** An undo stack with a coalescing window; the model is immutable-ish already. |
| Selection helpers | ~12 | `$getSelection`, `$patchStyleText`, `$setBlocksType`, … | **Medium.** Model-side once selection is mapped. |
| Commands and events | ~15 | `FORMAT_TEXT_COMMAND`, `KEY_*`, `PASTE`, `DROP`, undo/redo | **Medium.** We already own the command layer; this is the event plumbing beneath it. |
| **The engine itself** | ~30 | `createEditor`, `LexicalEditor`, the reconciler, `EditorConfig` | **This is the project.** |

The last row is not a long list of small things. It is:

1. a keyed, mutable document tree with an update transaction;
2. a **reconciler** that applies a model diff to a live `contenteditable` without
   destroying the caret;
3. **selection mapping** DOM ⇄ model, normalized across Blink, Gecko and WebKit, which
   report different selections for the same user action at a node boundary;
4. **`beforeinput`** and its twenty-odd input types, several of which fire differently or
   not at all per engine;
5. **IME composition**, the largest single source of data-loss bugs in editors.

Nothing in this ADR pretends those are quick. The estimate in ADR-005 — multiple quarters
— stands. What changes is that it is now the plan.

## Decision

Build `src/engines/native/` to the `EngineHandle` contract, behind the existing boundary,
and switch the default engine when it passes.

Both engines ship side by side until then, so `main` is never broken and the two can be
compared on the same test suite rather than by argument.

### The order of work

| Stage | Deliverable | State |
|---|---|---|
| **0** | An executable definition of done: the `EngineHandle` conformance suite, which the Lexical adapter passes | **Done** — `test/engines/conformance.ts`, 42 tests, 34 methods |
| **1** | Engine-agnostic primitives moved into `src/core`, each with tests that do not need a browser | **In progress** — `utils/graphemes.ts` |
| **2** | The live document tree: keyed nodes, an update transaction, and dirty tracking | **Done** — `src/engines/native/tree.ts`, 30 tests, no DOM |
| **3** | The reconciler: model diff → DOM, caret preserved | **Done** — `render.ts`, `reconcile.ts` |
| **4** | Selection mapping, normalized across engines | **Done** — `selection.ts` |
| **5** | `beforeinput`, keyboard, and composition | **Done** — in `engine.ts` |
| **6** | History with coalescing | **Done** — `history.ts` |
| **7** | Node behaviours: marks, blocks, lists, links, tables | **Done** — `operations.ts`, `structure.ts` |
| **8a** | `native` passes the `EngineHandle` conformance suite | **Done** — 42/42, same suite Lexical passes |
| **8b** | `native` passes the product and browser suites, becomes the default, Lexical leaves `peerDependencies` | **Open** — see below |

### Where stage 8b stands

Measured with `nativeEngine` wired in as the default, then reverted so `main` stays green:

| | With `nativeEngine` as default |
|---|---|
| `EngineHandle` conformance | **42 / 42** |
| Unit tests | **1371 / 1375** |
| Browser tests (chromium) | **326 / 341** |

The engine is real: it renders, reconciles without moving the caret, maps selections,
types through `beforeinput`, undoes with coalescing, and does marks, blocks, lists,
links and tables. What the last 19 failures cover is browser-level behaviour that only a
browser can exercise:

- keyboard shortcuts through the editor (Ctrl+B, Enter, Shift+Enter, Tab in a list);
- the check-list box and the table controls, which are chrome bound to engine state;
- deleting a range that ends on an atomic chip;
- the selection toolbar's positioning against a live range.

**The default is still Lexical, and the package still requires it.** Shipping an engine
with nineteen known failures as the default would be worse than keeping the dependency,
and `main` is green either way. `nativeEngine` is exported: `engine={nativeEngine}`
opts in.

Each stage lands on `main` on its own. Stage 8 is the only one that changes what a
consumer installs.

### Why stage 0 first

Without it, "finished" is whatever the Lexical adapter happens to do, which makes Lexical
the specification rather than the implementation. With it, a behavioural disagreement is
settled by a test rather than by reading someone else's source.

It has already paid for itself: writing it found that `deleteBackward` was implemented on
`Selection.modify`, which does not exist in jsdom, so the method silently did nothing
outside a browser — and its only caller, the trigger menus, had no coverage in either
environment. That is now model-side and ours (`src/core/utils/graphemes.ts`), which is
stage 1 work arriving early because a bug asked for it.

## Consequences

- The published package still ships no third-party code. Until stage 8b it still *needs*
  Lexical installed, so **the dependency is not yet removed** and no documentation should
  claim otherwise.
- Every stage-1 primitive makes the Lexical adapter better as a side effect, because both
  engines call the same core.
- The conformance suite is a permanent asset: it also protects the Lexical adapter from
  regressions for as long as it exists.
- `GAPS G-30` moves from "open question" to "tracked work", with this ADR as its plan.
