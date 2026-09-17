# Phase 1 — Audit

A factual inventory of the site as it stands, produced per §1 of
`docs/ppds/03-agent-implementation-brief.md`. **Nothing here restructures anything.**

## Artefacts

| File | What it is |
|---|---|
| `pages.csv` | Every reachable URL: title, H1, word count, heading counts, content type, inbound links, metadata presence, source file, last commit date |
| `capabilities.md` | The capability list, reconciled across three sources — **this is the Phase 1 gate** |
| `assets.csv` | Every demo, tool and image, and what each demonstrates |
| `../GAPS.md` | Everything missing, contradictory or unverifiable |
| `crawl.json` | Raw crawl output, kept so the CSVs can be regenerated without re-crawling |

## Reproducing

```sh
pnpm --filter @react-rtekit/site build
pnpm --filter @react-rtekit/site preview &   # serves :4189

node audit/crawl.mjs        # walks the site  -> crawl.json
node audit/report.mjs       # -> pages.csv, assets.csv + a summary on stdout
node audit/reconcile.mjs    # cross-references the three capability sources
node audit/reconcile.mjs --table    # the per-plugin evidence table
```

The crawl seeds two routes by hand — `/internal/performance` and `/changelog` — because
nothing links to them and a crawl cannot reach what nothing links to. That `/changelog`
needs seeding is itself a finding (GAPS **G-07**).

## Headline numbers

| | |
|---|---|
| Pages crawled | 81 |
| Capabilities reconciled | 56 |
| Live demos | 44 examples + 2 tools |
| Screenshots / videos on the site | 0 |
| Pages with a canonical URL | 0 of 81 |
| Pages with OG metadata | 0 of 81 |
| Distinct meta descriptions | 1, shared by all 81 |
| Pages with exactly one H1 | 81 of 81 |
| Hand-written reference tables | 0 |
| Marketing claims without an implementation | 0 |
| Open gaps | 28 |
