# 08: Demo App and API Docs Site (`apps/site`)

One Vite + React 19 + React Router 7 app serves the **examples gallery**, the **playground**, the **theme editor** and the **documentation** (guides + generated API reference). It consumes the library through the workspace (`"react-rtekit": "workspace:*"`) and deploys as a static site.

## 1. Information architecture

```
/                                Landing: live hero editor, feature grid, install snippet
/docs/getting-started            Install, CSS import, first editor, controlled vs uncontrolled
/docs/guides/value-and-formats   HTML / JSON / Markdown / text, isEmpty, counting
/docs/guides/forms               react-hook-form (RteField), Formik, TanStack Form, validation, required
/docs/guides/sanitization        Profiles, config, why it matters, the XSS test corpus
/docs/guides/html-interop        Legacy Quill content, output profiles, e-mail-safe HTML, migration
/docs/guides/merge-tags          Tags, menus, preview mode, validation
/docs/guides/toolbar             Config, custom items, responsive, overflow, floating/bubble
/docs/guides/plugins             Authoring: nodes, marks, commands, keymaps, UI, serialization
/docs/guides/slots-and-handlers  Override levels 1-10 with an example each
/docs/guides/theming             Tokens, presets, dark mode, Tailwind, unstyled, content styles
/docs/guides/uploads             onUpload, progress, errors, external URLs, security notes
/docs/guides/accessibility       Semantics, keyboard, screen-reader notes, testing
/docs/guides/localization        Locales, i18next recipe, RTL
/docs/guides/performance         Large documents, subscriptions, bundle size, lazy plugins
/docs/guides/ssr                 Next.js/Remix notes, RteContentView, hydration
/docs/guides/migration-skimmer   10 section 3: CustomRte -> react-rtekit
/examples                        Gallery (filter by tag)
/examples/:slug                  Live demo + Code / Value / State tabs + "Open in playground"
/playground                      Every option, live
/theme-editor                    Token editor with contrast checks and export
/api                             API index with search
/api/rich-text-editor            <RichTextEditor> props table
/api/editor-instance             EditorInstance methods
/api/commands                    Every command id, payload, default binding
/api/hooks · /api/slots · /api/handlers · /api/plugins · /api/theme-tokens
/api/localization · /api/icons · /api/types · /api/utilities
/changelog
```

Global chrome: top bar (Docs, Examples, API, Playground, version, GitHub, light/dark/classic switch), sidebar, "on this page" TOC, and `Ctrl+K` search over headings, API symbols and examples (a build-time in-memory index).

## 2. Example page template

```
src/examples/<slug>/index.tsx    the live demo
src/examples/<slug>/meta.ts      { title, description, tags, features, related }
src/examples/<slug>/notes.mdx    optional explanation
```

Each page shows the live editor; tabs for **Code** (source via `?raw`, Shiki-highlighted), **Value** (live HTML / JSON / Markdown / text with a copy button, plus a "sanitized output" view), and **Events** (a log of `onChange` sources, handler calls, command executions with timestamps); a width switcher (375 / 768 / 1280) for responsive behaviour; and "Open in playground".

## 3. Examples (all required for v1.0)

### 3.1 Parity example (highest priority)

| Slug | Content |
|---|---|
| `parity-skimmer-email` | The Skimmer "Send report e-mail" form reproduced 1:1: `classic` theme and preset, the exact 8-button toolbar, 287px editor, the 21-swatch colour popover, the default merge-tag message body, plus the e-mail/CC chip inputs and Send button rendered around it. Includes a "show differences" toggle listing the fixed bugs (01 §9) and a side-by-side of `classic` vs `email` preset output HTML |

### 3.2 Feature examples

| Slug | Content |
|---|---|
| `basic` | Minimal uncontrolled editor |
| `controlled` | Controlled value with an external "set content" button; proves no caret jumping |
| `value-formats` | Switch `valueFormat` live; show all four serializations side by side |
| `presets` | minimal / classic / standard / email / comment / full switcher |
| `toolbar-config` | Flat, grouped, responsive, overflow menu, labels, custom item |
| `floating-toolbar` | Bubble menu on selection + slash menu |
| `formatting` | Every mark and block, mixed selections, clear formatting |
| `lists` | Bullet/ordered/check, nesting, markdown shortcuts |
| `links` | Popover, autolink, validation, custom `linkValidator` |
| `images` | Upload with progress (mock service), drag-drop, paste, resize, alt text, external URL |
| `tables` | Insert, navigate, edit, resize |
| `merge-tags` | Insert menu, `{{` trigger, preview mode, unknown-tag validation |
| `mentions` | Async search with loading/empty states |
| `emoji-and-slash` | Emoji picker and slash command palette |
| `paste-cleanup` | Paste fixtures from Word, Google Docs, Excel and Quill, with a before/after HTML diff |
| `sanitization` | A malicious HTML playground: paste XSS payloads and see exactly what each profile strips (read-only demo, safe) |
| `html-interop` | Load legacy Quill HTML, edit, and export as standard / quill-compatible / e-mail HTML with a diff |
| `email-output` | E-mail profile, inline styles, plain-text alternative, a simulated client preview |
| `counter-and-limits` | maxLength block vs warn, characters vs words, counter states |
| `validation-rhf` | react-hook-form with required + maxLength, proving `<p><br></p>` no longer passes |
| `validation-formik` | The same with Formik |
| `autosave` | Draft saving, restore prompt, TTL, clear on submit |
| `history` | Undo/redo grouping, clearHistory after a programmatic load |
| `find-replace` | Panel, match highlighting, regex |
| `source-view` | HTML source editing with sanitize-on-apply |
| `fullscreen` | Fullscreen mode |
| `readonly-and-disabled` | Both states, plus `<RteContentView>` rendering the same content |
| `markdown` | Markdown value format + shortcuts |
| `plugin-authoring` | The highlight plugin from 06 §5, built live with its code |
| `command-overrides` | Forcing link targets, remapping the colour command to design tokens |
| `handlers-middleware` | Analytics, plain-text-only paste policy, confirm on external link, veto a change |
| `slots-custom` | Replacing ToolbarButton, LinkPopover, Counter and Placeholder |
| `tailwind-skin` | Unstyled mode + a full Tailwind skin |
| `design-system-skin` | Re-skinning the 12 primitives |
| `theming` | Presets, custom brand theme, dark mode, density |
| `content-styles` | The same HTML in the editor and in `<RteContentView>`, proving they match |
| `localization` | en / hu / de / es switcher + RTL |
| `accessibility` | Keyboard-only walkthrough with a live announcement log and a shortcut legend |
| `mobile` | Bottom toolbar, touch targets, virtual-keyboard handling (iframe at phone width) |
| `large-document` | A 100 KB document, typing latency meter, plugin cost breakdown |
| `headless` | `useEditor` with a completely custom UI |
| `composable` | Composable parts in a custom card layout |
| `multiple-editors` | Three editors on one page: independent toolbars, popovers, hotkeys and colours (regression demo for R4/R10) |

## 4. Playground

- **Left panel** generated from a schema: preset, value format, every `enableX`, toolbar builder (drag items between groups), sanitize profile, html profile, paste mode, maxLength/countUnit, placeholder, min/max height, autogrow, sticky/floating toolbar, merge tags on/off, theme preset, colour scheme, density, locale, dir, readOnly/disabled.
- **Centre:** the live editor.
- **Right:** tabs for **Code** (generated TSX with only non-default props), **Value** (all four formats), **Events**, **State** (`getFormatState()` live).
- Control state is serialized into the URL hash for sharing.

## 5. Theme editor

Token groups from 07 §3 with colour/length inputs, a live preview covering toolbar, popovers, content, merge tags, counter and error states, an AA contrast badge per text/background pair, and export to `createTheme()` / CSS variables / JSON.

## 6. API docs generation

1. `pnpm --filter react-rtekit docs:json` runs **TypeDoc** (`--json`) over `src/index.ts` with TSDoc tags `@default`, `@example`, `@group`, `@since`, `@deprecated`.
2. A site script transforms it into per-page JSON (props: name, type, default, description, group).
3. Pages render searchable, filterable, anchored props tables with expandable type popovers.
4. Slots, commands, handlers, tokens, localization keys and icons come from **runtime metadata** (`react-rtekit/meta`), so those lists can never drift.
5. CI fails when a public symbol has no TSDoc description.

## 7. Fixtures and mock services

- `src/fixtures/`: Quill HTML captured from the real app (alignment, nested lists, coloured text, `<p><br></p>`, merge tags), Word paste HTML, Google Docs paste HTML, an XSS corpus (rendered only inside the sanitization demo, never executed), a 100 KB document, and the Skimmer default e-mail body.
- `src/mock/upload.ts`: a fake upload service with configurable latency, progress, failure rate and max size, backed by object URLs.
- `src/mock/mentions.ts`: an async directory search with latency.

## 8. Site quality bar

Axe-clean, responsive to 375px, dark mode, Lighthouse ≥ 90 on the landing page, route-level code splitting, and an e2e smoke test per example (renders, no console errors, axe passes).
