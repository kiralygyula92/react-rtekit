# Capability reconciliation — Phase 1

Reconciled from three independent sources, per the implementation brief §1.3. Nothing in
this list is asserted from one source alone; where the sources disagree, the row says so
and the disagreement is carried into `GAPS.md`.

**Status of this document: awaiting human review.** It is the Phase 1 gate.

---

## Method

| Source | What it is | Why it is trustworthy | Coverage |
|---|---|---|---|
| **A — code** | `react-rtekit/meta`, the runtime metadata the package exports: 37 plugins, 57 commands, 46 slots, 18 handlers, 42 toolbar items, 114 theme tokens, 153 locale keys, 52 icons | Built from the source at compile time, and a unit test asserts it matches the modules it enumerates, so it cannot drift from the shipped code | Complete for enumerable surfaces |
| **B — site** | 44 example pages, 16 guides, the landing page's six claims, the README's six "Why" bullets | Hand-written, so it can overstate or omit | Complete |
| **C — listing** | `package.json` `description` + 11 keywords | Stands in for a marketplace page | **Does not exist** — see below |

**Source C is unavailable.** `react-rtekit` is not published: `npm view react-rtekit`
returns 404, and the package has never been released. There is therefore no store or
marketplace listing to reconcile against, and the third source is reduced to the
package manifest. This weakens the reconciliation — a marketplace listing is usually
where over-claiming shows up — and it is recorded in `GAPS.md` as **G-01**.

**On evidence strength.** `demo:` entries were matched by name across every example's
`meta.ts` and `index.tsx`. That match is generous: an example that merely uses the word
"bold" in prose counts as a mention. Where the column says *demonstrates*, the example's
own authored `tags` or title name the capability; where it says *mentions*, the evidence
is weaker and a reviewer should not read it as coverage.

---

## Reconciled capabilities

56 capabilities. Grouping uses the PPDS §5 portfolio vocabulary — no group invented.

### Core features

| # | Capability | A — code | B — site | C — listing | Status |
|---|---|---|---|---|---|
| C-01 | Text formatting (bold, italic, underline, strike, code) | `meta.plugins`: bold, italic, underline, strike, code | demo:formatting, demo:composable; guide:getting-started | kw:wysiwyg | **documented** |
| C-02 | Subscript & superscript | `meta.plugins`: subSup | demo:formatting *(fixture markup only — never named)* | — | **under-documented** → G-02 |
| C-03 | Headings | `meta.plugins`: heading | demo:markdown, demo:presets; guide:html-interop | — | **documented** |
| C-04 | Lists (bullet, ordered) | `meta.plugins`: list | demo:lists; guide:getting-started, guide:toolbar | — | **documented** |
| C-05 | Check lists | `meta.plugins`: checkList | demo:lists | — | **demo only, no guide** |
| C-06 | Links | `meta.plugins`: link | demo:links; guide:getting-started, guide:sanitization | — | **documented** |
| C-07 | Blockquote | `meta.plugins`: blockquote | demo:content-styles, demo:formatting | — | **demo only, no guide** |
| C-08 | Code blocks | `meta.plugins`: codeBlock | demo:formatting *(mentions)* | — | **under-documented** → G-03 |
| C-09 | Horizontal rule / divider | `meta.plugins`: horizontalRule | demo:command-overrides *(mentions)* | — | **under-documented** → G-03 |
| C-10 | Undo / redo history | `meta.plugins`: history | demo:history; guide:getting-started, guide:forms | — | **documented** |
| C-11 | Clear formatting | `meta.plugins`: clearFormatting | demo:formatting | — | **demo only, no guide** |
| C-12 | Placeholder & empty state | `meta.plugins`: placeholder, trailingParagraph; `isEmpty()` | demo:basic, demo:controlled; guide:forms; readme bullet | — | **documented** (but see C-13) |
| C-13 | Trailing paragraph | `meta.plugins`: trailingParagraph | **none** — appears only in generated API output | — | **undocumented** → G-04 |

### Content & data

| # | Capability | A — code | B — site | C — listing | Status |
|---|---|---|---|---|---|
| D-01 | Value formats (HTML, JSON, Markdown, text) | `src/core/serialize/*`; `valueFormat` prop | demo:value-formats, demo:markdown; guide:value-and-formats | kw:html | **documented** |
| D-02 | Sanitization (4 profiles + hard rules) | `src/core/sanitize/*`; ADR-003 | demo:sanitization; guide:sanitization; readme bullet; landing claim | kw:sanitize | **documented** |
| D-03 | HTML interop profiles (Quill, e-mail, standard) | `src/core/interop/*`; ADR-004 | demo:html-interop, demo:paste-cleanup; guide:html-interop, guide:migration-from-quill | kw:quill | **documented** |
| D-04 | E-mail-safe output | `email` profile in interop + sanitize | demo:email-output | kw:email | **demo only, no guide** |
| D-05 | Paste clean-up | `meta.plugins`: paste | demo:paste-cleanup; guide:sanitization, guide:html-interop | — | **documented** |
| D-06 | Merge tags / variables | `meta.plugins`: mergeTag | demo:merge-tags, demo:email-output, demo:legacy-parity; guide:merge-tags | — | **documented** |
| D-07 | Markdown shortcuts | `meta.plugins`: markdownShortcuts | demo:markdown *(mentions)* | — | **under-documented** → G-03 |
| D-08 | Character & word limits | `meta.plugins`: counter; `maxLength`, `countUnit` | demo:counter-and-limits; guide:value-and-formats, guide:forms | — | **documented** |

### Display & layout

| # | Capability | A — code | B — site | C — listing | Status |
|---|---|---|---|---|---|
| L-01 | Theming & design tokens | `meta.tokens` (114); `src/themes/*` | demo:theming, demo:content-styles; guide:theming; `/theme-editor` | — | **documented** |
| L-02 | Theme presets (light, classic, dark, compact, bordered) | `src/themes/index.ts` | demo:presets, demo:theming | — | **documented** |
| L-03 | Alignment | `meta.plugins`: align | demo:formatting; guide:migration-from-quill | — | **documented** |
| L-04 | Indentation | `meta.plugins`: indent | demo:formatting, demo:lists; guide:localization | — | **documented** |
| L-05 | Text & background colour | `meta.plugins`: color, backgroundColor | demo:command-overrides, demo:content-styles; guide:theming, guide:plugins | — | **documented** |
| L-06 | Font family & size | `meta.plugins`: fontFamily, fontSize | demo:content-styles *(mentions)* | — | **under-documented** → G-03 |
| L-07 | Tables | `meta.plugins`: table | demo:tables; guide:getting-started, guide:html-interop | — | **documented** |
| L-08 | Images & uploads | `meta.plugins`: image; `onUpload` | demo:images; guide:uploads, guide:sanitization | — | **documented** |
| L-09 | Content styles for stored HTML (`<RteContentView>`) | `react-rtekit/view` export | demo:content-styles | — | **demo only, no guide** |

### Interaction

| # | Capability | A — code | B — site | C — listing | Status |
|---|---|---|---|---|---|
| I-01 | Toolbar (config, overflow, sticky, position) | `meta.toolbarItems` (42) | demo:toolbar-config; guide:toolbar | — | **documented** |
| I-02 | Selection ("bubble") toolbar | `meta.plugins`: floatingToolbar | demo:floating-toolbar; guide:toolbar | — | **documented** |
| I-03 | Slash menu | `meta.plugins`: slashMenu | demo:emoji-and-slash | — | **demo only, no guide** |
| I-04 | Emoji | `meta.plugins`: emoji | demo:emoji-and-slash | — | **demo only, no guide** |
| I-05 | Mentions | `meta.plugins`: mention | demo:mentions | — | **demo only, no guide** |
| I-06 | Find & replace | `meta.plugins`: findReplace | demo:find-replace | — | **demo only, no guide** |
| I-07 | Fullscreen | `meta.plugins`: fullscreen | demo:fullscreen | — | **demo only, no guide** |
| I-08 | HTML source view | `meta.plugins`: sourceView | demo:source-view; guide:sanitization | — | **documented** |
| I-09 | Keyboard model & shortcut reference | keymap; `ShortcutHelp` | demo:accessibility; guide:accessibility | kw:accessibility | **documented** |
| I-10 | Autosave & draft restore | `autosave` prop; `saveDraft()` | demo:autosave | — | **demo only, no guide** |
| I-11 | Read-only & disabled states | `readOnly`, `disabled` props | demo:readonly-and-disabled | — | **demo only, no guide** |
| I-12 | Mobile behaviour | `useVisualViewport`; touch targets | demo:mobile | — | **demo only, no guide** |

### Developer tools

| # | Capability | A — code | B — site | C — listing | Status |
|---|---|---|---|---|---|
| X-01 | Slots (46 replaceable parts) | `meta.slots` (46) | demo:slots-custom, demo:composable; guide:slots-and-handlers | — | **documented** |
| X-02 | Handler middleware (18) | `meta.handlers` (18) | demo:handlers-middleware; guide:slots-and-handlers | — | **documented** |
| X-03 | Commands & overrides (57) | `meta.commands` (57) | demo:command-overrides; guide:plugins | — | **documented** |
| X-04 | Plugin authoring | `definePlugin`, `RtePlugin` | demo:plugin-authoring; guide:plugins | — | **documented** |
| X-05 | Headless `useEditor` | `useEditor` export | demo:headless; guide:performance | — | **documented** |
| X-06 | Composable parts | `react-rtekit` parts exports | demo:composable; guide:slots-and-handlers | — | **documented** |
| X-07 | Presets (6) | `meta` / `presets` export | demo:presets | — | **demo only, no guide** |
| X-08 | Forms integration (RHF, Formik) | `react-rtekit-rhf` package | demo:validation-rhf, demo:validation-formik; guide:forms | — | **documented** |
| X-09 | Localization (5 locales, 153 keys) | `meta.localizationKeys`; `src/locales/*` | demo:localization; guide:localization | — | **documented** |
| X-10 | Accessibility | ARIA toolbar, roving focus, WCAG AA test | demo:accessibility; guide:accessibility; readme bullet | kw:accessibility | **documented** |
| X-11 | Server rendering | `react-rtekit` SSR entry | guide:ssr | — | **guide only, no demo** → G-05 |
| X-12 | Performance / large documents | budgets; `playwright.perf.config.ts` | demo:large-document; guide:performance | — | **documented** |
| X-13 | Engine adapter (`EditorEngine`) | `src/types/engine.ts`; ADR-002 | demo:headless; readme bullet; landing claim | kw:lexical | **documented** |
| X-14 | Icons (52, replaceable) | `meta.icons` (52) | guide:theming *(mentions)* | — | **under-documented** → G-03 |

---

## Reconciliation outcome

| Outcome | Count | Meaning |
|---|---|---|
| Documented in all available sources | 34 | Demo **and** guide, or demo and a README/landing claim |
| Demo only, no guide | 14 | Real and demonstrated; no prose explains when to reach for it |
| Under-documented | 6 | Implemented and shipped in a preset; the site never names it |
| Guide only, no demo | 1 | `X-11` server rendering — explained, never shown |
| Undocumented | 1 | `C-13` trailing paragraph — code only |
| **Total** | **56** | |
| Claimed but not implemented | **0** | No marketing claim was found without an implementation |

**No fabricated claims.** Every claim on the landing page and in the README was checked
against the code: the four sanitize profiles exist, the five ADRs exist, and the
strongest claim — "nothing outside `src/engines/` imports Lexical" — is true, verified
by `grep` returning zero matches outside that directory. The "replaceable at ten levels"
bullet lists ten mechanisms that all exist; eight of them have their own example.

**No capability found in the listing that the code does not have.** All 11 keywords map
to shipped capabilities.

---

## Bearing on later phases

- 56 capabilities → 56 capability pages under PPDS §5 section 2. The site today has 44
  example pages and 16 guides covering them in a different shape, so Phase 2 is a
  re-cut, not a rewrite: most content exists, cut along different lines.
- The 14 "demo only" rows are where Phase 5 has the most writing to do — they already
  have a runnable demo, which is PPDS §6B's hardest requirement, and no prose at all.
- 56 pages against 44 existing examples means roughly a dozen capability pages have no
  single demo to inherit and will need one built (PPDS §7.2), which per the brief's
  effort shape is the dominant cost of Phase 5.
- `symbols` frontmatter (PPDS §8.3) can be derived from `meta`, which already maps every
  command, slot, handler and token. Phase 4 has a real source of truth.
