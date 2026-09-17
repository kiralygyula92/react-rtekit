# react-rtekit: Handoff Documentation

> **Audience:** an AI coding agent (or a developer) starting in a **fresh, empty repository**.
> **Goal:** build a production-grade, publishable React rich-text-editor library (working name **`react-rtekit`**) plus a **demo site** and an **API docs site**. It must reproduce the editor currently used in the Skimmer Retail app **1:1** and then go far beyond it.

---

## 1. What this is

The Skimmer Retail client (`src/skimmer.retail.client`, React 19 + MUI 7) contains one rich-text editor: `components/common/CustomRte.tsx` (514 lines). It wraps **react-quill-new** (Quill 2), disables Quill's own toolbar, and hand-builds a MUI toolbar with six capabilities: bold, italic, underline, text colour, three alignments, and a bullet list. It is used by one form (`SendEmailForm`) that appears in two places: the "Resend report email" modal and the "Send report email" section of the pool report page. The HTML it produces is sent to the notifications API as the body of a customer e-mail.

This documentation set does three things:

1. **Reverse-engineers** the current implementation completely: props, types, every handler, every style value, the form and e-mail pipeline around it, and every bug. A builder can reproduce it without access to the original code.
2. **Specifies a new standalone library**: an engine-adapter architecture with a headless core, a plugin system, slot-level component overrides, handler middleware, full theming, and the feature set a professional editor needs (links, images, tables, lists, history, paste cleanup, merge tags, sanitization, HTML/Markdown/JSON interop, e-mail-safe output, accessibility, i18n).
3. **Specifies the demo app and API docs site**, plus testing, packaging and release.

## 2. Reading order

| # | File | What it gives you |
|---|------|-------------------|
| 00 | `README.md` (this file) | Index, principles, key decisions, the **agent kick-off prompt** |
| 01 | `01-current-implementation.md` | Full reverse-engineering of `CustomRte`, `SendEmailForm`, the modal/section consumers, the e-mail pipeline, exact styles, and the known bugs |
| 02 | `02-architecture.md` | Package architecture, repo layout, the **engine adapter** design, headless core, plugin system, state and value model, performance, SSR |
| 03 | `03-content-model-and-interop.md` | The value model (HTML / JSON / Markdown / plain text), **sanitization**, paste pipeline, **HTML interop profiles** (reading legacy Quill markup, e-mail-safe export), merge tags |
| 04 | `04-api-reference.md` | Full TypeScript API: `<RichTextEditor>` props, editor instance, commands, hooks, plugin API, types |
| 05 | `05-features.md` | Behavioural spec of every feature (formatting, blocks, lists, links, media, tables, history, counters, find & replace, source view, fullscreen, floating/slash menus, shortcuts, a11y, mobile) |
| 06 | `06-customization-overrides.md` | Slots, slotProps, render props, toolbar composition, handler middleware, command overrides, plugin authoring, icons, localization |
| 07 | `07-theming-styling.md` | Design tokens, CSS variables, content (prose) styling, presets including the 1:1 **`classic`** preset, dark mode, unstyled mode |
| 08 | `08-demo-and-docs-site.md` | Demo app + API docs site: routes, every example page, playground, parity pages, doc generation |
| 09 | `09-quality-testing-release.md` | Testing strategy (including editing/paste/IME tests), a11y, security tests, budgets, CI, publishing |
| 10 | `10-roadmap-and-migration.md` | Milestones with acceptance criteria, Definition of Done, and the migration guide from `CustomRte` + react-hook-form |

Files 01, 03, 04 and 06 matter most. If anything conflicts, **04 (API reference)** is the source of truth for names and signatures, and **05** is the source of truth for behaviour.

## 3. Key architectural decisions (made here; revisit only with an ADR)

1. **Engine-adapter architecture.** The library is not a thin Quill wrapper. It defines an `EditorEngine` interface (document state, selection, commands, serialization, events) and ships **Lexical** as the default engine adapter (a peer dependency). Rationale: Lexical is React-first, plugin-oriented, accessible, actively maintained, and far easier to extend than Quill for the override depth this project requires. See ADR-002 in 02 §2.3.
2. **Legacy content must keep working.** Skimmer has stored HTML produced by Quill (`<p class="ql-align-center">`, `<ul><li data-list="bullet">`), so the library ships **HTML interop profiles** that parse legacy Quill markup on input and can emit standards HTML, Quill-compatible HTML, or e-mail-safe inline-styled HTML. See 03 §5. This is what makes "1:1" safe.
3. **Security is not optional.** Everything entering the editor (initial value, paste, drag-drop, programmatic insert) and everything leaving it is sanitized against a configurable allowlist. The current app sanitizes nothing and e-mails the result. See 03 §4.
4. **No form-library coupling.** The current component takes react-hook-form's `setValue` as a prop. The new one is a normal controlled/uncontrolled component; a separate optional `react-rtekit/rhf` adapter provides `<RteField control={...}>`. See 04 §8.
5. **Emptiness is a first-class concept.** `isEmpty` ignores `<p><br></p>`, and length limits count **text**, not markup. This fixes the two most damaging current bugs.
6. **Everything visible is a slot; every interaction is an overridable handler; every visual is a token.** The same philosophy as the table library documented in `react-tablekit-docs`.

## 4. Naming conventions

| Pattern | Meaning | Example |
|---|---|---|
| `enableX` | Feature flag | `enableLinks`, `enableSourceView` |
| `onXChange` | Controlled state callback | `onChange`, `onSelectionChange` |
| `renderX` | Render prop | `renderToolbar`, `renderLinkPopover` |
| `slots.X` / `slotProps.X` | Component replacement / props | `slots.ToolbarButton` |
| `handlers.onX` | Interaction middleware `(ctx, next)` | `handlers.onPaste` |
| `commands.x` | Editor command id | `editor.exec('toggleBold')` |
| CSS class | `rte-` prefix | `rte-toolbar`, `rte-content` |
| CSS variable | `--rte-` prefix | `--rte-color-border` |
| Data attribute | State hooks for CSS | `data-active`, `data-disabled`, `data-focused` |

## 5. Package name

Working name **`react-rtekit`** (`import { RichTextEditor } from 'react-rtekit'`). Check npm availability before the first publish. Fallbacks: `@<scope>/react-rtekit`, `react-rte-forge`, `rtekit-react`. Keep the name in one place so renaming is a one-line change.

## 6. Agent kick-off prompt (copy-paste into the new repo's agent)

```
You are building "react-rtekit", a production-grade React rich-text-editor library published
to npm, plus a demo site and an API-docs site, in this empty repository.

The complete specification is in /docs (files 00-10). Read README.md first, then 01-10 in
order before writing code. Treat 04-api-reference.md as the source of truth for names and
signatures and 05-features.md as the source of truth for behaviour.

Hard requirements:
- pnpm monorepo: packages/react-rtekit (library), packages/react-rtekit-rhf (form adapter),
  apps/site (demo + API docs).
- TypeScript strict, React 18/19 peer deps, Lexical as the default engine adapter behind the
  EditorEngine interface (02 section 2), plain CSS + CSS variables in @layer rtekit,
  ESM+CJS+d.ts.
- Sanitization on every content boundary (03 section 4). Never ship an XSS hole.
- HTML interop profiles must round-trip legacy Quill markup (03 section 5).
- Every UI part is a replaceable slot; every interaction goes through overridable handler
  middleware; every visual is a theme token (06, 07).
- Ship the "classic" theme preset and the parity demo page reproducing the Skimmer editor
  1:1 (01 section 7, 07 section 4), and fix every bug listed in 01 section 9 rather than
  reproducing it.
- Follow the milestones in 10-roadmap-and-migration.md in order; at the end of each, run
  lint, typecheck, unit tests, e2e tests and size-limit and make sure they pass.
- Write tests alongside code (Vitest + Testing Library; Playwright for e2e/visual/editing; axe).

Start with Milestone 0 (scaffold). Report progress per milestone using the checklist in
10-roadmap-and-migration.md.
```

## 7. Scope

**In scope for v1.0:** everything in 05 not marked *(v1.x)*.
**Marked *(v1.x)*:** real-time collaboration, comments/suggestions, track changes, advanced table editing (merged cells), AI-assist hooks, and a Quill compatibility engine adapter.
**Out of scope:** a backend, an image hosting service, or document conversion beyond HTML / Markdown / plain text.

## 8. Where the source material came from

All facts in `01-current-implementation.md` come from the Skimmer monorepo, path `src/skimmer.retail.client/src/`:

```
components/common/CustomRte.tsx                           the editor (514 lines)
components/form/SendEmailForm.tsx                         the only consumer (490 lines)
pages/lab/components/ResendEmailModal.tsx                 consumer #1 (dialog)
pages/lab/sections/poolReport/SendReportEmailSection.tsx  consumer #2 (page section)
hooks/report/useReportEmailSend.ts                        send pipeline
utils/reportEmailUtils.ts                                 request builder (memoBodyContent)
utils/emailFormHelpers.ts                                 e-mail chip parsing helpers
types/uiInterfaces.ts                                     CustomRteProps, RteActiveFormats, SendEmailFormType
constants.ts                                              RTE_MODULES, RTE_FORMATS, RTE_PREDEFINED_COLORS,
                                                          DEFAULT_WATER_TEST_EMAIL_MESSAGE, MESSAGE_MAX_LENGTH
config/locales/enUS/common.json                           customRte.* strings
theme/{variants,typography,breakpoints}.ts                colour and type tokens
package.json                                              react-quill-new 3.6.0 -> quill 2.0.3
```
