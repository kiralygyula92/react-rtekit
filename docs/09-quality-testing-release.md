# 09: Quality, Testing, Packaging and Release

Rich-text editors fail in ways unit tests miss: selection, IME, paste, undo grouping, and browser quirks. The strategy below is weighted accordingly, with **real-browser tests as the primary gate** for editing behaviour.

## 1. Test layers

| Layer | Tool | Scope |
|---|---|---|
| Core unit | Vitest (node) | Schema, normalization, serializers (HTML/Markdown/text/JSON), sanitizer, interop profiles, counting, `isEmpty`, keymap parsing, merge-tag parsing, command registry and middleware ordering |
| Security | Vitest + fixture corpus + `fast-check` fuzzing | The XSS corpus produces no executable markup in every profile; fuzzed HTML never throws and never emits disallowed tags/attributes/protocols |
| Round-trip property tests | Vitest + `fast-check` | `document → html → document` is stable; `document → markdown → document` preserves supported nodes; Quill HTML → document → quill-compatible HTML is semantically equal |
| Type tests | Vitest `expectTypeOf` | Value type by `valueFormat`, command payload typing, plugin/slot/handler context types, registry augmentation |
| React component | Vitest (jsdom) + Testing Library + `user-event` | Rendering, props, controlled/uncontrolled, slots, localization, counter/validation, toolbar state, focus management. jsdom cannot do real contenteditable editing, so these use the engine's programmatic API, not typing |
| **Editing behaviour (primary)** | **Playwright** (Chromium, Firefox, WebKit) | Typing, selection, toolbar commands with real carets, list nesting, link popover flows, paste from real clipboard payloads (`text/html` + `text/plain`), drag-drop, undo grouping, IME composition (CDP `Input.imeSetComposition`), mobile emulation, multiple editors on one page |
| A11y | `vitest-axe` + `@axe-core/playwright` + manual notes | Zero serious/critical violations; keyboard-only journeys; roving toolbar focus; announcements |
| Visual | Playwright `toHaveScreenshot` | Parity page (classic) at 1440/390, light/dark, focus/error/disabled/empty states, popovers open, merge-tag chips |
| Performance | Playwright traces + Vitest bench | Budgets in §4 |

Coverage gates: core ≥ 90% lines / 85% branches; react ≥ 80%.

## 2. Mandatory test cases

- [ ] Every bug in 01 §9 has a named regression test (`R1`–`R26`). Specifically:
  - `R2`: `isEmpty()` is true for `<p><br></p>`; the RHF adapter's `required` rejects it.
  - `R3`: a 2000-character message with heavy formatting passes a `maxLength: 2048` check.
  - `R4`/`R10`: three editors on one page have independent popovers, hotkeys and colours, and focusing one causes no layout shift.
  - `R5`: clicking a toolbar button with a text selection applies the format to that selection (all browsers).
  - `R14`: colour Reset removes the inline colour rather than setting `#000000`.
  - `R21`: a controlled parent re-render with an equivalent value does not move the caret or fire `onChange`.
- [ ] Sanitization: XSS corpus per profile; `sanitize: false` warns; hard-blocked tags cannot be re-enabled by config.
- [ ] Interop: the Quill fixture corpus round-trips; Word/Google Docs fixtures clean up; e-mail profile emits no `class`/`id` and only allowlisted CSS.
- [ ] Merge tags: atomic selection/deletion, survive formatting, undo/redo, copy/paste between editors, markdown round-trip, unknown-tag validation.
- [ ] Paste: rich / clean / text modes; `Mod+Shift+V`; URL over a selection creates a link; image paste triggers upload; oversize file rejected.
- [ ] History: typing coalescing within `historyGroupMs`; each command is one entry; `clearHistory()` after programmatic load.
- [ ] Lists: nesting via Tab, outdent on empty Enter, conversion between types, check-list toggling by keyboard.
- [ ] Links: protocol normalization, validation rejection, popover focus return, `Mod+click` opens.
- [ ] Uploads: progress, cancel, failure + retry, abort on unmount.
- [ ] Keyboard: every shortcut in 05 §13, plus `Alt+F10` toolbar focus and Escape return.
- [ ] Localization: a pseudo-locale run asserts no untranslated visible string (every string wrapped in markers).
- [ ] Theming: a lint script asserts no literal colour/length in `theme.css` outside `:root` token blocks; all presets resolve every token.
- [ ] SSR: `renderToString` of `<RichTextEditor>` and `<RteContentView>` without errors; hydration without warnings.
- [ ] IME: Japanese and Korean composition produces no intermediate `onChange` and no lost characters.
- [ ] Mobile emulation: toolbar reachable, taps apply formats, virtual keyboard does not cover the toolbar in bottom mode.

## 3. Parity verification

1. Capture reference screenshots of the current Skimmer editor (Send report e-mail section and Resend modal) at 1440×900 and 390×844, in idle, focused, error and colour-popover-open states. Store under `apps/site/e2e/visual/reference/skimmer/`.
2. Build `/examples/parity-skimmer-email` until a side-by-side overlay page (`?compare=1`, opacity slider) matches.
3. Lock Playwright baselines (`maxDiffPixelRatio: 0.001`) once approved.
4. Allowed deviations, documented on the page: the focus ring, the colour Reset semantics, focusable swatches, the ARIA toolbar, in-house icons (same size/colour as the Material ones), and the placeholder.
5. Content parity: the Quill fixture corpus rendered by `<RteContentView>` must visually match the old `.ql-editor` rendering (a separate screenshot test with the two stylesheets side by side).

## 4. Budgets

| Metric | Budget |
|---|---|
| `react-rtekit` core import (no plugins), min+gz | ≤ 22 kB |
| `classic` preset (its plugins + chrome), min+gz | ≤ 34 kB |
| `full` preset, min+gz | ≤ 60 kB |
| `react-rtekit/view`, min+gz | ≤ 6 kB |
| `styles.css` min+gz | ≤ 9 kB |
| Sanitizer alone | ≤ 4 kB |
| Lexical peer (not counted in the above, but documented) | ~30 kB for the packages used by `standard` |
| Typing latency, 50 KB document | < 16 ms per keystroke (p95, Playwright trace) |
| Mount time, `standard` preset | < 50 ms |
| Word paste, 200 KB | < 400 ms to settle |

Plugins must be individually tree-shakeable; `size-limit` entries verify that importing `minimal` does not pull in tables, images or find-replace.

## 5. CI gates (every PR)

`lint` → `typecheck` → `test` (unit/component/property/type, with coverage) → `build` → `size` → `e2e` (Chromium on PRs; all three browsers plus mobile emulation on main) → `a11y` → `docs:check` (TypeDoc validation) → `publint` + `@arethetypeswrong/cli` on the packed tarball → changeset presence.

A dedicated **security job** runs the XSS corpus and fails the build on any violation, and `npm audit --production` must be clean.

## 6. Packaging

- tsup: entries `index`, `core/index`, `view/index`, `engines/lexical/index`, `plugins/*`, `locales/*`, `meta`; `format: ['esm','cjs']`; `dts`; `treeshake`; `splitting`; `target: es2020`; externals `react`, `react-dom`, `lexical`, `@lexical/*`.
- CSS built with Lightning CSS into `styles.css`, `base.css`, `content.css` and the presets, preserving `@layer`.
- `"use client"` banner on the React entries; `core` and `view` stay server-safe (`view` renders sanitized HTML with no engine).
- `package.json`: `exports` per 02 §9, `sideEffects: ["**/*.css"]`, `engines.node >= 18`, keywords (react, rich-text-editor, wysiwyg, editor, lexical, html, sanitize, email), `repository`, `homepage`, `license: MIT` (confirm with the owner), and size badges in the README.
- Browser support: last 2 evergreen versions, Safari ≥ 15.4, iOS Safari ≥ 15.4, Android Chrome. Documented, and enforced by the Playwright matrix.

## 7. Versioning and release

- **Changesets**; `release.yml` publishes on merge of the version PR with `--provenance --access public` and creates a GitHub release.
- **Public API for semver** (per 04, 06, 07): props, editor instance methods, command ids and payloads, plugin API, slot names and their context props, handler names and contexts, CSS class names, CSS variables, data attributes and localization keys. Changing any of these is a major change.
- `classic` token values are frozen (parity guarantee); other presets may change values in minors.
- Deprecations: `@deprecated` TSDoc + a one-per-session dev console warning, removed in the next major.
- The docs site is versioned per major.

## 8. Repository hygiene

`CONTRIBUTING.md` (setup, scripts, test policy, Conventional Commits), `docs/adr/` (ADR-001 architecture, ADR-002 engine choice, ADR-003 sanitizer implementation, ADR-004 interop profiles), issue templates that ask for a playground URL, `SECURITY.md` with a disclosure process (this package handles untrusted HTML, so it needs one), and Renovate for devDependencies.
