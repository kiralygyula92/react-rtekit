# GAPS

Everything missing, contradictory or unverifiable, found while auditing this project
against `docs/ppds/02-plugin-docs-standard.md` (PPDS v1.0).

Opened in Phase 1. Every item needs a decision before the phase it blocks. Nothing here
has been acted on — Phase 1 restructures nothing.

| Key | Blocks | Severity |
|---|---|---|
| G-01 … G-05 | Phase 2 | data the model needs |
| G-06 … G-14 | Phase 3 | structure the scaffold needs |
| G-15 … G-18 | Phase 4 | reference generation |
| G-19 … G-24 | Phase 5 | content that has to be written or decided |
| G-25 … G-27 | Phase 6 | machine surface and QA |

Twenty-eight items. None is a blocker for Phase 2; four need a decision before it
(**G-01**, **G-04**, **G-10**, **G-11**), and **G-10** — whether this product is tiered
at all — decides whether three PPDS sections get built or excepted.

---

## Phase 1 findings that block Phase 2

### G-01 — No marketplace listing exists, so the third reconciliation source is missing
`npm view react-rtekit` returns 404. The package has never been published, so the
capability reconciliation in `audit/capabilities.md` rests on two sources plus the
package manifest rather than three. A marketplace listing is usually where over-claiming
surfaces; without it, "no fabricated claims found" is a weaker statement than it reads.

**Decision needed:** publish before or after the restructure. If after, source C stays
unavailable and `capabilities.md` should be re-reconciled once a listing exists.

### G-02 — `subSup` is demonstrated but never named
Subscript and superscript ship in the `full` preset and render in the formatting
example's fixture content (`H<sub>2</sub>O · 25 m<sup>3</sup>`). No page names the
capability, explains it, or shows how to turn it on. A reader cannot discover it.

### G-03 — Five capabilities are shipped but never explained
`codeBlock`, `horizontalRule`, `markdownShortcuts`, `fontFamily`/`fontSize`, and the
52-icon replaceable set. Each is in at least one preset and appears in the generated API,
and the site's prose never introduces any of them.

### G-04 — `trailingParagraph` is entirely undocumented
Shipped in `email`, `full` and `standard`. It appears nowhere on the site except the
generated API output. Either it is an internal behaviour that should not be a plugin in
the public list, or it needs a capability page.

**Decision needed:** is this public API or an implementation detail?

### G-05 — Server rendering has a guide but no demo
`X-11`. PPDS §6B requires a runnable demo before prose on a capability page. SSR is
genuinely hard to demo in a client-rendered site; the fallback ladder in §7.2 applies,
and the shortfall is recorded here as §7.2 requires.

---

## Structural gaps that block Phase 3

### G-06 — Eight of the eleven canonical sections do not exist
PPDS §5 mandates all except the three marked conditional. Present: Features (as
`/examples/`), Reference (`/api/`), Guides (`/docs/guides/`). Absent:

| Missing section | PPDS § | Note |
|---|---|---|
| Getting started (as a section) | 5.1 | Exists as one guide, not a section with Installation / Requirements / FAQ / Support / Versions |
| Customization | 5.5 | Content exists, scattered across theming/slots guides and 6 examples |
| Integrations | 5.7 | Forms integration exists but is not a section |
| Migration | 5.9 | One Quill guide; no version-jump pages |
| Discover more | 5.10 | No showcase, no roadmap; changelog exists but is unreachable (G-07) |
| Demos / Showcase | 5.3 | *conditional* — arguably satisfied by `/examples/` |
| Resources | 5.8 | *conditional* |
| Design/Assets | 5.11 | *conditional* — no Figma kit or brand assets exist |

### G-07 — `/changelog` is built, renders, and nothing links to it
The route returns 200 and renders 2,750 words from the real changelog. No page on the
site links to it; it was found only by seeding the crawler by hand. PPDS §5.10 puts it
under Discover more.

### G-08 — `/internal/performance` is an unlinked route in the production build
Deliberate — it is the e2e performance harness — but it ships to production and is
reachable by URL. PPDS has no archetype for it.

**Decision needed:** exclude from the production build, or give it a home and a
`noindex`.

### G-09 — No marketing surface
PPDS §2.1 requires a marketing surface distinct from docs, with mega-menus carrying
`{title, description, href}` entries. The site has one landing page and a flat nav. P1
("two surfaces, one system") is not satisfied.

### G-10 — No pricing page, no tiers, no plans
PPDS §6H and the whole of F6 assume a commercial product. This is MIT-licensed and free.

**Decision needed:** confirm the project is not tiered, in which case §6D (feature
matrix), §6H (pricing), flow F6 (convert), and checks 13–15 are **not applicable** and
belong in `EXCEPTIONS.md` rather than being built. This is the single biggest scope
question in the audit.

### G-11 — URLs do not match the PPDS taxonomy
PPDS §3 requires `/{plugin-id}/…`. Everything here is at the root: `/docs`, `/examples`,
`/api`. There is no plugin namespace because the site serves exactly one plugin.

**Decision needed:** adopt `/react-rtekit/…` now for portfolio consistency (§12), or
record a documented exception. Choosing wrongly here is expensive: R6 makes every URL
permanent, so this decision cannot be revisited without a redirect layer.

### G-12 — Navigation is derived from registries, not from nav data
PPDS §4 requires an explicit hand-ordered `NavNode` tree with `plan` and `lifecycle`.
The sidebar is generated from `GUIDES` in `apps/site/src/guides/index.ts` and the
examples registry. Ordering is editorial today, which is the important half of N1, but
there is no nav data model, so there is nowhere to declare a badge (N4).

### G-13 — No badges anywhere
None of the six in PPDS §7.1 are rendered. With no tiers (G-10) the `Pro`/`Premium`
badges are moot, but `New`, `Preview`, `Beta`, `Planned` and `Deprecated` all apply to a
1.0.0 library and none exist.

### G-14 — No trailing-slash canonicalisation, and no redirects at all
PPDS R4 requires a trailing slash as canonical. The router serves `/docs` and `/docs/`
without preferring either, and no page emits a canonical link (G-25). There is no
redirect layer, so R6 has nothing to build on.

---

## Reference gaps that block Phase 4

### G-15 — A real source of truth exists — this is the strongest part of the audit
TypeScript declarations → TypeDoc (`api.json`) → `apps/site/scripts/generate-api.mjs` →
`apps/site/src/api/pages.json`, 507 symbols across 5 generated pages. A `docs:check`
script enforces TSDoc coverage on every public symbol in strict mode, and
`react-rtekit/meta` independently enumerates 46 slots, 57 commands, 18 handlers, 42
toolbar items, 114 tokens, 153 locale keys and 52 icons. **No hand-written reference
table was found anywhere.** Phase 4 has what it needs.

### G-16 — The generated reference is not split into structure and prose
PPDS §8.4/§8.5 and P6 require `{symbol}.schema.json` (overwritten) and
`{symbol}.strings.json` (only ever gains keys). The current generator emits one merged
`pages.json` with descriptions inlined from TSDoc. Prose therefore lives in the source
comments — which is a defensible single source of truth, but it is not the split the
standard requires, and it makes translation impossible (P6's stated reason).

**Decision needed:** adopt the split, or record an exception arguing that TSDoc-as-prose
is better for a code library. This one deserves a real argument rather than compliance.

### G-17 — Reference pages are grouped, not one-per-symbol
PPDS §5.4 wants one page per public symbol. There are 5 pages holding 507 symbols —
`/api/types` alone is 2,762 words with 217 symbols and zero H2s. This also breaks check 4
(no page over ~2,000 words).

### G-18 — No `symbols` frontmatter, so no `usedBy` back-links
PPDS §8.3 makes `symbols` load-bearing: it drives each capability page's `## API` and the
reverse "Used by" list. Neither exists. The data to derive it does (`meta`), but the link
between a capability and its symbols is not recorded anywhere today.

---

## Content gaps that block Phase 5

### G-19 — No page follows the capability archetype
PPDS §6B mandates, in order: Basics → variations → recipes → Customization → escape
hatch → Limitations → API. Example pages are title + lead + demo/code tabs. **No page on
the site has a `## Limitations` section**, which P11 makes mandatory on every capability
page. 56 capability pages need writing against this archetype.

### G-19a — Eight pages are reachable only through the chrome
`/api`, `/docs`, `/docs/guides/getting-started`, `/docs/guides/merge-tags`,
`/playground`, `/theme-editor`, `/changelog` and `/internal/performance` have **zero
inbound links from any page's prose** — the header and footer are the only way in.
Counting chrome links hides this: by that measure every page has 80 inbound links.
`audit/pages.csv` records the two counts separately.

This is what PPDS §6A's "Start now" cards and §6B's `## API` links exist to fix, and it
bears on flows F2 and F3, which are specified as click paths through content.

### G-20 — `/examples` is a 44-H2 mega-page
1,150 words, 44 H2s, one per example. PPDS anti-patterns list "one Features page with 20
H2s" as reject-on-sight (violates P3). It should become the Features index (§6C) with
card grids grouped by `subheader`.

### G-21 — `/examples/large-document` is 9,456 words with 67 H2s
By far the largest page. It is a performance fixture rather than prose, but it fails
check 4 as written and needs either a split or a documented exception.

### G-22 — Demos have no sandbox and no reset
PPDS §7.2 requires copy · show/hide source · **open in a live sandbox** · **reset**.
Present: copy, show/hide source, plus a preview-width control. Missing: the last two,
on all 44 demos.

### G-23 — No screenshots, no videos, no OG images anywhere
The only images in the repository are 6 Playwright regression snapshots (never served)
and a favicon. Every demo is a live component, which is the *best* form under §7.2 — this
is recorded not as a defect but because §7.6 requires a generated `og:image` per page and
there is no image pipeline of any kind to build on.

### G-24 — No FAQ, Support, Requirements, Versions, Showcase or Roadmap page
All required by PPDS §5.1 and §5.10. Requirements exist as a README section; the rest
have no content anywhere, so Phase 5 is authoring from nothing, not porting.

**Decision needed for Support:** there is no support channel to document beyond a GitHub
repository. Flow F7 requires one.

---

## Machine-surface and QA gaps that block Phase 6

### G-25 — The metadata contract is almost entirely unimplemented
Measured across all 81 pages:

| Requirement | PPDS § | State |
|---|---|---|
| `<link rel="canonical">` | 7.6, R4 | **0 / 81 pages** |
| `og:*` and `twitter:*` | 7.6 | **0 / 81 pages** |
| Unique `description` per page | 7.6, P10 | **1 distinct value across 81 pages** |
| `search:version`, `plugin:id` | 7.6 | absent |
| Exactly one H1 | 11.2 | **81 / 81 pass** |

The single shared description is the sharpest finding: P10 requires the title and
description to be written once *per page* and reused across H1 subtitle, meta, OG,
`llms.txt` and nav tooltip. Here one string in `index.html` serves every page, so check
20 cannot pass for any page.

### G-26 — No machine-readable surface at all
No `llms.txt`, no `.md` twins, no `sitemap.xml`, no RSS. PPDS §7.7 requires all four, and
flow F8 depends on them entirely. The site is a client-rendered SPA, so `.md` twins need
a build step that does not exist.

### G-26a — The SPA catch-all makes status-code checks report false passes
`/llms.txt`, `/sitemap.xml`, `/docs/guides/theming.md` and `/this-does-not-exist` all
return **200 with the application's `index.html`**. Nothing is missing in the sense a
crawler can detect: the router renders its not-found component client-side, and a
`404.html` exists in the build but is never served.

This matters for Phase 6 more than Phase 3. Conformance checks 16, 17 and 23 test that
URLs resolve; written against status codes alone, every one of them passes today on a
site that has no `llms.txt`, no Markdown twins and no sitemap. **The conformance script
must assert on content type and body, not on status.** Any redirect verification
(check 22, brief §6.7) has the same problem.

### G-27 — No version selector and no version policy page
PPDS §7.5 requires a selector on every docs page, a Versions page, previous majors kept
online, and version-scoped search. At 1.0.0 there is nothing to select between yet, but
none of the machinery exists and `VERSIONING.md` is not surfaced on the site.

---

## Not gaps — recorded so they are not re-litigated

- **Analytics and search queries are unavailable.** Brief §1.6 asks for the top 50 pages
  by traffic and top 30 internal search queries. The site is not deployed and has no
  analytics, so prioritisation in Phase 5 cannot be traffic-led and will have to be
  argued from the capability list instead.
- **`tool` is not one of the brief's ten content types.** `/playground` and
  `/theme-editor` are interactive instruments, not documentation or marketing. They are
  classified `tool` in `audit/pages.csv` rather than forced into `capability`. PPDS has
  no archetype for an interactive tool page; this may be a gap in the standard rather
  than in the site.
- **Every landing-page and README claim verified against the code.** Four sanitize
  profiles, five ADRs, ten replaceability mechanisms, and zero Lexical imports outside
  `src/engines/`. No fabricated metric, testimonial, price or compatibility claim exists
  — there are no testimonials or metrics on the site at all.
