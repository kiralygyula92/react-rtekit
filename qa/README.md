# QA

The Phase 6 artefacts, per §6 of `docs/ppds/03-agent-implementation-brief.md`.

| File | What it records |
|---|---|
| `conformance-report.md` | The 26 PPDS §11 checks, each `pass`, `fail` or `n/a` with the exception that makes it so |
| `flow-walkthroughs.md` | The eight §9 flows, written as the clicks rather than the URLs |
| `redirect-check.csv` | All 81 legacy URLs, loaded in a browser, with where each one landed |
| `copy-report.md` | Every proofreading finding across the 123 pages: spelling, terminology, punctuation, front matter, links and undescribed table rows |

## Regenerating

```sh
pnpm build
pnpm content                  # recompile the Markdown, twins, llms.txt and sitemap
pnpm conformance              # -> qa/conformance-report.md
node content/copy-check.mjs --report qa/copy-report.md

pnpm --filter @react-rtekit/site preview &
pnpm conformance:served       # also probes the machine surface
pnpm redirects:check          # -> qa/redirect-check.csv
pnpm --filter @react-rtekit/site e2e   # includes flows.spec.ts
```

## The result

| | |
|---|---|
| Conformance checks | **22 pass · 0 fail · 4 not applicable** |
| Copy findings outstanding | **0 errors · 0 warnings** across 123 pages |
| Flows completable | **7 of 8**; F6 does not exist to complete (E-02) |
| Redirects verified in a browser | **81 of 81** |
| Pages | 123, each with one H1 and its own description |
| Browser tests | 1740 across Chromium, Firefox, WebKit and two mobile emulations |
| Visual snapshots | 6 |
| Unit tests | 1335 |
| Engine conformance | **42 of 42**, the contract every engine is graded against |
| Third-party dependencies | **none**; `react` and `react-dom` are the only peers |

## Why these check bodies, not status codes

The site is a client-rendered SPA. Its catch-all answers **200 with `index.html` for
every path**, including ones that do not exist. A conformance script written against
status codes therefore reports a perfect score on a site with no `llms.txt`, no Markdown
twins and no sitemap — which is exactly what the Phase 1 audit found could happen
(GAPS **G-26a**).

So checks 16, 17, 22 and 23 assert on content type and body. `conformance:served` and
`redirects:check` both load URLs in a real browser and read what came back.
