# EXCEPTIONS

Documented deviations from `docs/ppds/02-plugin-docs-standard.md` (PPDS v1.0), per
operating rule 1 of the implementation brief: where the standard and this project
disagree, the standard wins *unless a documented exception is recorded here with a
reason*.

Acceptance criterion 8 is that this file contains no undocumented deviation. Every entry
below names the rule, what is done instead, and why.

---

## E-01 — No marketing surface

**Rule:** PPDS §2.1 requires a marketing surface at the root with mega-menus, and P1
("two surfaces, one system") assumes both exist. Archetype G (marketing product landing)
is listed as required for that surface.

**Instead:** one surface. `/` serves the docs root at `/react-rtekit/`; there is no
product landing page, no announcement bar and no newsletter capture.

**Why:** decided by the project owner — *"i do not need a homepage for the product, the
docs page is what's important that has everything, from docs, to examples and
playground."* This is a free, MIT-licensed open-source library with nothing to sell, so
the marketing surface would have no job except to delay a reader by one click. The
positioning copy that would have lived on a landing page lives on the Docs Overview,
which PPDS §6A already requires.

**Consequence:** archetype G is not implemented. The shared footer (§2.3) is rendered on
the one surface that exists. Conformance check 25's "footer columns" clause is satisfied
by a single footer.

---

## E-02 — No tiers, so no pricing page and no feature matrix

**Rule:** PPDS §6D (feature matrix) is "required for tiered plugins", §6H (pricing) is an
archetype, §8.6 defines `pricing.json`, flow F6 (convert) is a required flow, and
conformance checks 13–15 test the pricing matrix.

**Instead:** `plugin.config.json` declares a single `free` tier with `badge: null`. There
is no `pricing.json`, no `/pricing/`, no feature matrix and no tier badge anywhere.

**Why:** the package is MIT-licensed and free, confirmed by the project owner. PPDS §6D
and §6H are explicitly conditional on the plugin being tiered, and §7.1's tier badges are
conditional on tiers existing. Building a pricing page for a free library would mean
inventing prices, which operating rule 4 calls a critical failure.

**Consequence:** checks 13, 14 and 15 are **not applicable** and the conformance script
skips them with this reason recorded. Flow F6 is not applicable. `content/validate.mjs`
enforces the inverse invariant instead: an untiered plugin must have no `pricing.json`
and no nav node carrying a `plan`.

---

## E-03 — The interactive tools are Demos, not a content type of their own

**Rule:** the brief's §1.2 content-type vocabulary is `marketing · capability · how-to ·
reference · install · faq · changelog · legal · blog · orphan`, and PPDS §6 has nine
archetypes.

**Instead:** the playground and the theme editor are classified `tool` in
`audit/pages.csv`, and they live in the Demos section at
`/react-rtekit/demos/playground/` and `/react-rtekit/demos/theme-editor/`, authored
against archetype B.

**Why:** neither is documentation, marketing or reference — they are instruments the
reader operates, and forcing either into `capability` would misreport what the page is.
PPDS has no archetype for an interactive tool page; this looks like a gap in the standard
rather than in the site, and is flagged for the portfolio-level review that §12 requires
before the standard is frozen. Archetype B fits well enough in the meantime: both pages
have Basics, Customization, Limitations and API sections that say something true.

---

## E-04 — The taxonomy vocabulary is enforced on capability subheaders only

**Rule:** the `navNode.subheader` description in `plugin-site.schema.json` says "Value
must be a member of `plugin.config.json#/taxonomy`", without qualification.

**Instead:** `content/validate.mjs` enforces that only inside the Features section. The
Reference section groups its pages under Components, Hooks, Imperative API, Functions,
Catalogues and Types, none of which is in the taxonomy.

**Why:** PPDS §5's normative text scopes the vocabulary to capabilities — *"Within
section 2, capabilities MUST be grouped under `subheader` labels. Use a fixed,
portfolio-wide vocabulary"* — and §12 lists taxonomy terms as portfolio-consistent so
that different plugins' feature lists read alike. Adding "Components" and "Hooks" to that
vocabulary to satisfy a schema description would corrupt it for every other plugin in the
portfolio, which is the precise thing §12 forbids. The standard's prose wins over the
schema's one-line summary, per operating rule 1.

---

## E-05 — `/internal/performance` keeps its URL and stays out of the nav

**Rule:** P12 ("nothing is deleted"), and conformance check 8 ("every nav node's
`pathname` resolves to a real page").

**Instead:** the route is kept at `/internal/performance`, mapped in `url-map.csv` with
action `port` and redirect `(same URL)`, and is absent from `nav.json`.

**Why:** it is the Playwright performance harness, not a page — it exists so the perf
suite has a deterministic surface to measure. Deleting it would break the performance
job; listing it in the nav would put a test fixture in the reader's sidebar. It will
carry `noindex` and be excluded from `llms.txt` and `sitemap.xml`.

**Consequence:** it is the one URL in the map whose target is not a nav node, and the
validator allows exactly that case, only for rows whose redirect says `(same URL)`.

---

## E-06 — Reference pages group symbols where the symbols are a catalogue

**Rule:** PPDS §5.4 asks for "one page per public symbol **or settings group**", and §6E
describes a per-symbol reference page.

**Instead:** 21 reference pages. Components, hooks, the imperative API and the standalone
functions get a page each. The six enumerable catalogues — slots (46), toolbar items
(42), theme tokens (114), icons (52), localization keys (153) and plugins (37) — get one
page each rather than 444 pages.

**Why:** the standard's own wording allows a settings group, and these are settings
groups in the strict sense: a flat, enumerable list of named options that is generated
from one source and read as a table. A reader looking up `--rte-toolbar-gap` wants the
token table, not a page about that token. `/api/types/` is the one page that will still
be long; it is split by kind rather than by symbol and is the candidate to revisit if
check 4 (≤2,000 words) proves binding.

---

## E-07 — Generated prose is seeded from TSDoc, then owned by the strings file

**Rule:** PPDS §8.4/§8.5 and P6 require `{symbol}.schema.json` (regenerated, always
overwritten) and `{symbol}.strings.json` (prose, only ever gains keys). The current
generator emits one merged `pages.json` with descriptions inlined from TSDoc.

**Instead:** the split is adopted as the standard requires — with one addition. On first
generation, each `strings.json` key is *seeded* from the symbol's TSDoc comment.
Thereafter the generator only adds missing keys and never overwrites an existing one.

**Why:** P6's stated reason is that translation and regeneration must not fight, and the
split delivers that. But this is a code library whose TSDoc comments are already enforced
in strict mode by `docs:check` — throwing them away and retyping 507 descriptions into
JSON would lose the guarantee that the docs and the signatures were written together.
Seeding keeps that guarantee for the first write and hands ownership to the strings file
from then on, which satisfies both the letter and the reason of the rule.

**Consequence:** conformance check 10 (schema files unedited since generation, by
checksum) applies unchanged. A TSDoc comment edited after seeding will not propagate;
that is the intended trade and is noted in the generator.

---

## E-08 — `trailingParagraph` is not a capability

**Rule:** acceptance criterion 5 — every capability in `audit/capabilities.md` has
exactly one capability page, or an explicit entry explaining why not.

**Instead:** `C-13 trailingParagraph` has no page. Its behaviour is documented inside
`/react-rtekit/empty-state/`.

**Why:** it is an implementation detail that happens to be registered as a plugin. It
guarantees a paragraph after a trailing block node so the caret has somewhere to go after
a table or an image — a reader never turns it on, off, or thinks about it, and a page
about it would have nothing to put in `## Basics`. Phase 1 recorded it as the one
entirely undocumented capability (GAPS **G-04**); this is the resolution.

**Consequence:** 56 reconciled capabilities become 55 capability pages.

---

## E-09 — The site is React, not a static-site generator

**Rule:** none, strictly — PPDS is technology-agnostic. Recorded because §7.8 says docs
pages *should* render without JS for content and navigation, and a client-rendered SPA
does not.

**Instead:** the existing React + Vite + React Router application is kept and extended,
at the project owner's explicit instruction.

**Why:** the owner asked for React specifically. The site also has to host 44 live
editors, a playground and a theme editor, which are the product — a static generator
would have to hydrate all of them anyway.

**Consequence:** §7.7's Markdown twins and `llms.txt` need a build step that emits them
as real files, and §7.8's no-JS goal is not met for navigation. Phase 6 must verify the
machine surface by content type and body rather than by status code, because the SPA
catch-all answers 200 for every URL (GAPS **G-26a**).
