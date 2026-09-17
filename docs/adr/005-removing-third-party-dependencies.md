# ADR-005: Removing third-party dependencies

- **Status:** Superseded by ADR-006 — option C was chosen and carried out
- **Date:** 2026-09-17
- **Related:** ADR-001, ADR-002
- **Supersedes:** nothing; revisits ADR-002's engine choice

## Context

A request to make the package stand-alone: *"remove any third party dependencies … we
want everything written in house if possible, so reliance on the lexical npm package
should not be acceptable."*

ADR-002 chose Lexical and dismissed a hand-written contenteditable in one line. That
dismissal deserves a better answer than one line, so this records what the request
actually costs, what has been done, and what is left to decide.

## What the package depends on today

| | |
|---|---|
| Runtime dependencies | **0** — `dependencies: {}` |
| Bundled third-party code | **none**; nothing is vendored |
| Peer dependencies | React, React DOM, and twelve Lexical packages |

The distinction matters. Nothing third-party is *shipped*: a consumer installing
`react-rtekit` downloads only this project's code. Lexical is a peer, so the consumer
owns the version and no duplicate copy reaches their bundle. "Stand-alone" in the
packaging sense is already true.

What is not true is independence: without Lexical installed, the editor does not run.

## What has already been brought in-house

Everything that could be. 6,108 lines of `src/core` are this project's own:

- the HTML parser (ADR-003 — the sanitizer cannot use the browser's);
- the sanitizer and its four profiles;
- the document schema and model;
- the HTML, JSON, Markdown and plain-text serializers;
- the Quill and Office interop profiles.

Removed in the course of this work:

- **`marked`** — the documentation site now renders its Markdown with the package's own
  `markdownToHtml`. The docs are 123 pages of the library's own parser under test on
  every build.

`ajv` remains as a build-time devDependency for validating `plugin.config.json` against
a JSON Schema. It ships to nobody.

## What removing Lexical would cost

Measured, not estimated:

| | |
|---|---|
| Lexical code in use | **~41,200 lines** across the twelve packages |
| Distinct Lexical symbols the adapter calls | **117** |
| Our adapter (the glue on top) | 3,061 lines |
| `EditorEngine` methods to reimplement | 30 |
| Tests that must keep passing | 1,121 unit + 335 e2e × 5 browsers |

The 41,200 lines are not features that could be trimmed. They are the parts of a
contenteditable engine that only exist because browsers disagree:

- **Selection normalization** across Blink, Gecko and WebKit, each of which reports a
  different selection for the same user action at a node boundary.
- **`beforeinput` handling** and the twenty-odd input types, several of which fire
  differently or not at all per engine.
- **IME composition** — the single largest source of data-loss bugs in editors, and
  untestable without a real IME.
- **DOM reconciliation** — applying a model diff to a live contenteditable without
  destroying the caret.
- **Undo coalescing**, so a typed sentence is one entry and not forty.
- List nesting, table selection, code highlighting and markdown input rules.

This project has already met that class of bug from *outside* Lexical: a lost Safari
selection, a `dangerouslySetInnerHTML` that destroyed the contenteditable, a popover that
stole focus mid-command. Each took a browser-matrix run to find. Owning the engine means
owning all of them, in five browsers, permanently.

## Options

| Option | Assessment |
|---|---|
| **A. Keep Lexical as a peer** *(current)* | Zero shipped dependencies. The editor needs a peer installed. The `EditorEngine` boundary means no Lexical type or concept reaches the public API — verified by a grep that returns nothing outside `src/engines/`. |
| **B. Vendor Lexical** | Copies 41k lines of someone else's code into the tree. Removes the install-time dependency and takes on maintenance of a fork. Satisfies the letter of "no npm reliance" and none of its spirit. **Not recommended.** |
| **C. Write an engine in-house** | The only option that genuinely delivers independence. Realistically a multi-quarter project: a document model, a reconciler, a selection layer, IME, history, and the plugin behaviours — then re-earning the confidence the existing 1,656 tests currently give. |
| **D. A minimal in-house engine for a reduced feature set** | Achievable in weeks rather than quarters *if* the scope drops to paragraphs, marks and lists, with no tables, no IME guarantee and no mobile support. That is a different product. |

## Decision

**A stands for now, and the choice is the owner's to make.** The architecture that makes
B, C and D possible is already in place and is not an accident: `EditorEngine` is 30
methods, Lexical sits behind it, and nothing outside `src/engines/lexical/` imports it.
Swapping the engine is a contained change to one directory — it is the *writing* of the
replacement that is large, not the wiring of it.

Recorded as **GAPS G-30** so it stays open rather than being quietly settled by this
document.

## Consequences

- The published package continues to ship no third-party code.
- `marked` is gone; the docs render on the library's own Markdown path.
- If C is chosen, the first deliverable is not code but a conformance suite for
  `EditorEngine` that the Lexical adapter passes today — so a second adapter has a
  definition of done rather than a moving target.
