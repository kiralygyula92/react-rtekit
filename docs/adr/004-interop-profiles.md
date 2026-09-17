# ADR-004: HTML interop profiles instead of a Quill engine

- **Status:** Accepted
- **Date:** 2026-09-16
- **Related:** ADR-002

## Context

Years of stored content were produced by Quill 2: `<p class="ql-align-center">`,
`<ul><li data-list="bullet">`, `<span class="ql-size-large">`, `class="ql-indent-3"`,
`<p><br></p>` for emptiness, and merge tags as raw text. That content must keep
opening, editing and saving after the editor is replaced, and during a phased rollout
the *old* editor may still have to read what the new one writes.

Using Quill as the engine would give byte-level parity, but ADR-002 rejects it for
every other reason.

## Decision

Make interop an explicit, tested layer rather than a side effect of the engine.

**On input** (`interop.input`, default `['quill', 'office', 'standard']`): a parser per
dialect converts foreign markup into the portable document model before sanitization.
The Quill parser consumes `ql-align-*`, `text-align` styles, `data-list`, `ql-size-*`,
`ql-indent-N`, coloured spans and the `ql-cursor` / `ql-ui` artefacts.

**On output** (`htmlProfile`): four dialects.

| Profile | Purpose |
|---|---|
| `standard` | Semantic HTML with `rte-*` classes |
| `quill-compatible` | `ql-align-*`, `data-list`, `ql-indent-*` -- readable by the old editor during a gradual migration |
| `email` | Inline styles only, no classes or ids, e-mail-safe CSS properties |
| `minimal` | Smallest valid markup |

## Consequences

- No data migration is required. A team can roll the new editor out behind
  `htmlProfile: 'quill-compatible'`, run both editors against the same rows, and switch
  to `email` or `standard` once the old one is gone.
- Parsing is order-independent and lossless for everything the schema supports, and a
  round-trip matrix in CI asserts it: Quill HTML to document to `quill-compatible` HTML
  is semantically identical, and to `standard` or `email` preserves every visible
  format.
- Interop is a maintained surface with its own fixtures. New dialects (Word, Google
  Docs, Excel) plug into the same pipeline, which is why paste cleanup and legacy
  parsing share one code path.
