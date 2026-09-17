# 10: Roadmap, Definition of Done, and Migration Guide

## 1. Milestones (build in this order)

Each milestone ends with every CI gate green (09 §5) and a short report against its checklist.

### M0: Scaffold
- [ ] pnpm monorepo (`packages/react-rtekit`, `packages/react-rtekit-rhf`, `apps/site`), strict TS, ESLint/Prettier, Vitest, Playwright (3 browsers + mobile), tsup, size-limit, Changesets, CI.
- [ ] Site shell: routing, layout, theme switch, empty gallery, placeholder API page.
- [ ] Fixtures imported (Quill corpus, Word/GDocs paste, XSS corpus, the Skimmer default e-mail body).
- [ ] ADR-001 (architecture) and ADR-002 (engine = Lexical) written.
**Accept when:** an empty library builds, publishes types cleanly (`publint`, `attw`), and the site deploys.

### M1: Core + engine adapter + content model
- [ ] `EditorEngine` interface and the Lexical adapter: content, selection, commands, history, focus, events.
- [ ] Schema, normalization, portable `EditorDocument`, serializers (HTML/JSON/Markdown/text), `isEmpty`, counting.
- [ ] **Sanitizer** with all four profiles + the security test job passing.
- [ ] **Interop**: Quill input parsing, output profiles (`standard`, `quill-compatible`, `email`, `minimal`), plain-text alternative.
- [ ] `useEditor` + `<Rte.Content>` with controlled/uncontrolled value handling (no caret jumps).
- [ ] `<RteContentView>` + `content.css`.
**Accept when:** the Quill corpus round-trips, the XSS corpus is neutralized, and property tests pass.

### M2: Chrome, toolbar, classic parity
- [ ] Slot system, toolbar registry (items, groups, overflow, responsive), primitives (Button, Menu, Popover, Dialog, Tooltip, TextInput, Select, Checkbox, Spinner).
- [ ] Plugins: bold, italic, underline, strike, colour, background colour, align, lists, indent, history, placeholder, counter, paste pipeline.
- [ ] Colour picker with palette, recents, custom, clear, full keyboard support.
- [ ] Field chrome: label, helper text, error, counter, disabled/readOnly, focus ring.
- [ ] Theme tokens + `light` and `classic` presets; `classic` preset plugin bundle.
- [ ] `react-rtekit-rhf` with `RteField` and `isEmpty`-aware required validation.
- [ ] Examples: `parity-skimmer-email`, `basic`, `controlled`, `presets`, `toolbar-config`, `validation-rhf`, `multiple-editors`.
**Accept when:** the parity page matches the reference screenshots and the R1–R26 regression tests pass.

### M3: Rich features
- [ ] Headings, blockquote, code block, horizontal rule, check lists, sub/superscript, font family/size, clear formatting.
- [ ] Links (popover, autolink, validation), images (upload, drag-drop, paste, resize, alt/caption), tables.
- [ ] Merge tags, mentions, emoji, slash menu, the shared `InlineSuggestMenu`.
- [ ] Markdown shortcuts and Markdown value format.
- [ ] Examples for each, plus `paste-cleanup`, `sanitization`, `html-interop`, `email-output`.

### M4: Pro chrome and behaviour
- [ ] Floating/bubble toolbar, sticky toolbar, fullscreen, source view, find & replace, autosave/drafts, print.
- [ ] Keyboard model complete (05 §13), shortcut help dialog, `Alt+F10` toolbar focus.
- [ ] Mobile: bottom toolbar, touch targets, visual-viewport handling.
- [ ] Accessibility pass: roving toolbar, announcements, focus traps, axe clean everywhere.

### M5: Customization depth and docs site
- [x] Handler middleware for every entry in 06 §4; command overrides; plugin authoring API finalized and documented.
- [x] `dark`, `compact`, `bordered` presets; unstyled mode; Tailwind skin; density.
- [x] Localization complete (en/hu/de/es) + RTL; pseudo-locale test.
- [x] Playground, theme editor, all guides, generated API pages from TypeDoc + runtime metadata, search.
**Accept when:** every public symbol is documented and every slot/command/handler/token/locale key appears on the API pages from metadata.

### M6: Hardening and 1.0
- [x] Cross-browser + mobile e2e green; IME tests; SSR smoke; performance budgets met; bundle audits.
- [x] README, CONTRIBUTING, SECURITY, CHANGELOG, semver policy.
- [ ] `1.0.0` published with provenance; docs site deployed.

### v1.x
Collaboration (Yjs), comments/suggestions, track changes, advanced tables, AI-assist hooks, a Quill engine adapter, more locales.

## 2. Definition of Done (per feature)

1. Implemented as a plugin where applicable, with commands registered through the registry.
2. Public names exactly as in 04, with TSDoc (`@default`, `@example`, `@group`).
3. Default slot(s) registered with runtime metadata; all strings localized; all visuals tokenized; state exposed via data attributes.
4. Keyboard support, ARIA semantics and live-region announcements.
5. Sanitizer rules and serializer rules for any new markup, in **both** directions, plus interop mapping if the old editor could produce it.
6. Tests: unit + Playwright editing test + a11y; a regression test for any related 01 §9 bug; visual test if it has a distinctive look.
7. A demo example page, a guide section, and playground controls.
8. A changeset.

## 3. Migration guide: `CustomRte` → `react-rtekit`

### 3.1 Concept mapping

| Skimmer | react-rtekit |
|---|---|
| `<CustomRte name defaultValue setValue error helperText onChange onBlur />` | `<RteField control name />` (RHF adapter) or `<RichTextEditor value onChange />` |
| `setValue` prop (RHF coupling) | Removed; the adapter owns form wiring (R13) |
| `defaultValue` read once | `value` (controlled) or `defaultValue` (uncontrolled) + `editor.setContent()` (R1) |
| `disabled` → Quill `readOnly` | `disabled` and `readOnly` as distinct props (R18) |
| `error` + `helperText` | `error` (boolean or message) + `helperText`, linked via `aria-describedby` (R16) |
| `InputProps.startAdornment/endAdornment` | `renderToolbar` (wrap `defaultRender()`), or toolbar items, or `slotProps.toolbar` |
| `RTE_MODULES`, `RTE_FORMATS`, `RTE_FORMATS_ARRAY` | `preset="classic"` or an explicit `plugins` array |
| `RTE_PREDEFINED_COLORS` | `colors.palette` (the same 21 values are the classic default) |
| Custom toolbar JSX | `toolbar={[['bold','italic','underline'],['color'],['alignLeft','alignCenter','alignRight','bulletList']]}` |
| `activeFormats` state | `useFormatState()` (or `useCommand(id).isActive`) |
| `quill.format(...)` calls | `editor.exec('toggleBold')`, `editor.exec('setAlign', { align })`, … |
| `quillRef.current.getEditor()` | `editorRef.current` (the `EditorInstance`); `editor.engine.native` only as a last resort |
| Global `quill.snow.css` import | `import 'react-rtekit/styles.css'` + a preset (R11) |
| `MESSAGE_MAX_LENGTH` on the HTML string | `maxLength` + `countUnit: 'characters'` on text (R3) |
| yup `.required()` on the HTML string | `required` + the adapter's `isEmpty()` check (R2) |
| `{contact_first_name}` raw text | `mergeTags.tags` with atomic chips; serialization is unchanged (R23) |
| No sanitization | `sanitize: 'email'` + `htmlProfile: 'email'` before sending (R19) |

### 3.2 The Skimmer form rewritten

```tsx
// rteConfig.ts: shared once for the app
export const skimmerRteDefaults = {
  theme: classicTheme,
  preset: 'classic',
  htmlProfile: 'quill-compatible',   // switch to 'email' once all stored content is migrated
  sanitize: 'email',
  maxLength: MESSAGE_MAX_LENGTH,
  countUnit: 'characters',
  showCounter: true,
  mergeTags: {
    tags: [
      { key: 'contact_first_name', label: 'Contact first name', sample: 'Jane' },
      { key: 'next_test_date',     label: 'Next test date',     sample: 'May 3' },
      { key: 'report_date',        label: 'Report date',        sample: 'Apr 26' },
      { key: 'org_name',           label: 'Company name',       sample: 'Blue Pools' },
      { key: 'org_address',        label: 'Company address',    sample: '1 Main St' },
    ],
  },
} satisfies Partial<RichTextEditorProps>;
```

```tsx
// SendEmailForm.tsx: the message field
<RteField
  control={control}
  name="message"
  {...skimmerRteDefaults}
  label={tLab('waterTestReport.sendEmail.message')}
  placeholder={tLab('waterTestReport.sendEmail.messagePlaceholder')}
  rules={{ required: tCommon('validation.required') }}   // now correctly rejects <p><br></p>
  localization={rteLocalization}                          // from i18next
/>
```

The 514-line `CustomRte` and its constants disappear; the form keeps its e-mail chip inputs unchanged.

### 3.3 Sending

```ts
// Before: memoBodyContent: data.message  (raw Quill HTML, unsanitized)
// After:
const html = editorRef.current.getHTML({ profile: 'email' });       // inline styles, sanitized
const text = editorRef.current.getPlainTextAlternative();           // optional text/plain part
buildSendReportByEmailRequest(customerId, { ...data, message: html, messageText: text });
```

If the backend cannot accept a new field, keep sending `memoBodyContent` only; the e-mail profile alone is already a significant improvement.

### 3.4 Handling stored legacy content

1. Keep `htmlProfile: 'quill-compatible'` at first, so anything the new editor saves stays readable by the old one during a phased rollout.
2. Verify with the `html-interop` example against a sample of real stored bodies.
3. Once the old editor is gone, switch to `htmlProfile: 'email'` (or `'standard'` for non-e-mail fields). No data migration is required because parsing accepts both.

### 3.5 Adoption plan inside Skimmer (outside the scope of the new repo)

1. Publish `react-rtekit@1.0.0` (or link it locally for evaluation).
2. Add `<RteDefaultsProvider value={skimmerRteDefaults}>` at the app root, with localization wired to i18next.
3. Replace the `message` field in `SendEmailForm` and compare the two consumers (`ResendEmailModal`, `SendReportEmailSection`) against the reference screenshots.
4. Send test e-mails through the real pipeline and verify rendering in Gmail, Outlook web and Outlook desktop, and on iOS Mail.
5. Delete `CustomRte.tsx`, the `RTE_*` constants, the `CustomRteProps`/`RteActiveFormats` types and the `react-quill-new` dependency.
6. Re-use the same field anywhere else rich text is needed (notes, templates, alerts), which is now a one-line addition.
