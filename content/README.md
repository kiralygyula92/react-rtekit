# Phase 2 — Model

The data files that define the new site, per §2 of
`docs/ppds/03-agent-implementation-brief.md`. **No pages are authored here** — that is
Phase 5, and it is deliberately downstream of this, because these files decide what
exists and Phase 5 only fills it in.

```
content/
├── validate.mjs                 ← the Phase 2 gate
└── react-rtekit/
    ├── plugin.config.json       ← identity, tiers, links, taxonomy, sections
    ├── nav.json                 ← 132 nodes, hand-ordered
    ├── titles.json              ← pathname -> title, the only place a rename happens
    └── migration/
        ├── url-map.csv          ← all 81 legacy URLs, generated from the Phase 1 crawl
        └── build-url-map.mjs
```

There is no `pricing.json`: the package is free and single-tier, and `validate.mjs`
enforces its *absence* (EXCEPTIONS **E-02**).

## Running the gate

```sh
node content/react-rtekit/migration/build-url-map.mjs   # rebuild the map from the crawl
node content/validate.mjs                               # the gate
```

The gate checks the three things the brief names — the config validates against
`plugin-site.schema.json`, every crawled URL appears exactly once in the map with an
action and a redirect, and no row targets a page that does not exist — plus the PPDS §4
nav invariants, which are cheap now and expensive later: a missing title, a subheader
outside the taxonomy, depth over 3, a duplicate pathname, a capability whose URL encodes
its category, a path without a trailing slash.

## The shape

| | |
|---|---|
| Nav nodes | 132 (9 virtual groups, 123 pages) |
| Capability pages | 55 |
| Reference pages | 21 |
| Sections enabled | 9 of 11 |
| Legacy URLs mapped | 81, none retired |
| Max nav depth | 2 |

Actions across the 81 legacy URLs: 49 `port`, 17 `split`, 13 `generate`, 1 `rewrite`,
1 `merge`, **0 `retire`** — the brief forbids retiring anything.

## Decisions taken here

- **Namespace.** Everything moves under `/react-rtekit/`, per PPDS §3. The root serves
  the docs overview, since there is no marketing surface (**E-01**).
- **Taxonomy.** Five of the nine portfolio terms: Core features, Content & data,
  Display & layout, Interaction, Developer tools. None invented.
- **Ordering is editorial, not alphabetical** (N1). Capabilities appear in the order a
  new reader meets them — text formatting before tables, tables before slots — not in
  the order the registry happens to hold them.
- **Titles live in `titles.json` only** (N2). No nav node carries a `title` except the
  nine virtual section groups, which have no page to take one from.
- **`capabilityId` is on all 55 capability nodes**, which is what will join nav data to
  page frontmatter and to the generated reference's `usedBy` back-links in Phase 4.

## Layout, for Phase 3

Settled from the reference screenshots supplied with the Phase 2 instruction, so Phase 3
builds against a decision rather than a guess. React + Vite + React Router, extending the
existing app (**E-09**) — no static-site generator.

- **Full-bleed three-column shell**, MUI-style: the page fills the viewport width rather
  than sitting in a centred max-width column.
- **Header:** product name, version selector, search (with `/` to focus), repository
  link, theme toggle. No mega-menus — there is one surface.
- **Left sidebar:** the nine sections from `nav.json`, expanding in place; capability
  groups rendered from `subheader` as small upper-case labels; the current page marked
  with a filled block, not just colour.
- **Right rail:** "ON THIS PAGE", H2/H3 from the rendered content, active section
  highlighted.
- **Breadcrumb** above the H1: `React RTE Kit › {Section}`.
- **Page footer actions** on every docs page: *Edit this page* and *Was this page
  helpful?* (§7.3).
- **Light and dark**, both first-class. Dark is the default in the reference; the
  existing theme switch already drives `data-theme` and is reused.

The sidebar, the features index and — were there one — the feature matrix must all
render from `nav.json`. Check 6 makes divergence between them a defect, so Phase 3 wires
one reader, not three.
