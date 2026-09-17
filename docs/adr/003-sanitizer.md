# ADR-003: In-house allowlist sanitizer over DOMParser

- **Status:** Accepted
- **Date:** 2026-09-16

## Context

This editor's output is e-mailed to customers. The implementation it replaces sanitizes
nothing -- not the initial value, not pasted content, not the output (bug R19).
Whatever we build has to sanitize at every boundary in both directions, and has to do
so on the server too, since `<RteContentView>` renders stored HTML during SSR.

DOMPurify is the obvious dependency. It is excellent, well-audited, and roughly 20 kB
gzipped; `isomorphic-dompurify` pulls in `jsdom` for Node, which is far too heavy to
put in a library's dependency tree.

## Decision

Write the sanitizer in-house against `DOMParser` in the browser and a small tokenizing
parser on the server, budgeted at 4 kB gzipped or less, with four profiles (`strict`,
`standard`, `email`, `permissive`) and a configurable allowlist.

Offer `sanitizer: 'dompurify'` as a documented opt-in that delegates to
`isomorphic-dompurify` when the consumer installs it, for teams whose security review
requires a named third-party sanitizer.

A set of rules is **hard**: `script`, `style`, `iframe`, `object`, `embed`, `form`,
`input`, `link`, `meta`, `base`, SVG `use` and `foreignObject`, every `on*` attribute,
`javascript:`, `vbscript:` and `data:text/html` URLs, and CSS containing `expression(`,
`url(javascript:` or `@import`. No configuration can re-enable them.

## Consequences

- We own a security-critical component, so it gets the heaviest test weighting in the
  suite: a payload corpus per profile, `fast-check` fuzzing that asserts no disallowed
  tag, attribute or protocol ever survives, and a dedicated CI job that fails the build
  on any violation.
- Zero runtime dependencies for the default path, and the sanitizer is usable from
  `react-rtekit/core` in a worker or on a server.
- If a vector is found, the fix ships in our release cadence rather than a dependency
  bump. `SECURITY.md` documents the disclosure process.
