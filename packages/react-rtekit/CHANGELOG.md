# react-rtekit

## 1.0.0

### Major Changes

- 1.0.0.

  The public API is now covered by semantic versioning, as written down in
  [VERSIONING.md](https://github.com/kiralygyula92/react-rtekit/blob/main/VERSIONING.md): props, instance methods, command ids and payloads,
  slot names and their context props, handler names and contexts, the plugin API, theme
  tokens, localization keys, CSS class names, CSS variables, data attributes and the
  portable document shape. The lists those live in are generated from the library's own
  runtime metadata, so they cannot fall behind the implementation.

  The `classic` theme's token values are frozen from this release: reproducing one
  specific editor pixel for pixel is the point of it, so changing a value there is a major
  release even where the same change to `light` or `dark` would not be.

### Minor Changes

- Pro chrome, the complete keyboard model, and mobile.

  - **Find and replace**: a panel with match case, whole word and regex, a live counter,
    and next/previous navigation. Matches are highlighted with a positioned overlay
    rather than by marking up the document — searching must not change what you would
    save, and must not put an entry on the undo stack. Replacement works on the portable
    document, so a match that straddles a formatting boundary is found and replaced like
    any other.
  - **Source view**: edit the HTML directly. What comes back goes through the same
    sanitizer as a paste, and markup that sanitizes away to nothing is reported rather
    than silently emptying the field.
  - **Fullscreen**: the root is promoted in place rather than moved into a portal, so the
    selection, the undo stack and every listener survive. Page scroll is locked and
    Escape exits.
  - **Autosave**: debounced drafts, a restore prompt slot, a TTL, an `onRestore` veto and
    `editor.saveDraft()` / `clearDraft()`.
  - **Print**: prints the content through the content stylesheet, not the page, with a
    print stylesheet that drops the chrome and writes link destinations out.
  - **Floating toolbar**, sticky docking, and a measured overflow menu — the same
    `Toolbar` in all three placements, so the roving focus and slots are the same too.
  - **Keyboard model complete** (05 §13): `Alt+F10` moves focus to the toolbar, `Mod+/`
    opens the shortcut reference, Tab indents inside a list and moves focus outside one,
    `Mod+Enter` submits, and Escape exits when `escapeExitsEditor` is on. The reference
    is built from the keymap in force, so a rebound or disabled shortcut is shown as it
    actually is.
  - **Mobile**: a bottom-docked toolbar that tracks the visual viewport so it sits above
    the on-screen keyboard, a scrollable toolbar row with its own tab stop, and 44px
    touch targets on coarse pointers.

  Fixes:

  - **Tab could not leave the editor.** The engine binds Tab itself, so returning
    without preventing the default left it in charge and focus never moved — a keyboard
    trap in any form with a field after the editor. A keydown listener can now claim a
    key without preventing the browser's default.
  - The `Dialog` primitive had no Escape handling and no focus trap, which made the
    shortcut reference — of all things — a keyboard trap of its own.
  - `Alt+F10` focused the first toolbar control even when it was disabled, which does
    nothing at all; it now finds the first enabled one.
  - The default `FindReplacePanel`, `SourceView`, `RestoreDraftPrompt` and
    `ShortcutHelpDialog` slots were placeholders with hard-coded English. They are real
    components now, and every string comes from `localization` (R17).
  - A toolbar measured before layout hid itself entirely; no width now means everything
    fits.

- Scaffold the monorepo: strict TypeScript, ESLint and Prettier, Vitest projects,
  Playwright, tsup (ESM + CJS + d.ts), Lightning CSS builds that preserve the `rtekit`
  cascade layers, size-limit budgets, Changesets and CI. Adds the public type surface,
  the default English catalogue, the token and structural stylesheets with the `classic`
  and `dark` presets, the fixture corpus (Quill, Word, Google Docs, Excel, XSS, the
  Skimmer defaults) and the demo/docs site shell.
- Core, engine adapter and content model.

  - `EditorEngine` / `EngineHandle` plus the Lexical adapter: content, selection, commands,
    history, focus and events, with every command flushed synchronously so the toolbar
    never needs a timer.
  - The portable `EditorDocument`, the schema and normalization, and serializers for HTML,
    JSON, Markdown and plain text, including the e-mail `text/plain` alternative.
  - `isEmpty()` that ignores empty blocks and counting that measures text rather than
    markup, which is what makes `required` and `maxLength` behave.
  - An in-house allowlist sanitizer with the `strict`, `standard`, `email` and `permissive`
    profiles, hard rules no configuration can disable, and a dedicated security suite.
  - HTML interop: legacy Quill parsing and the `standard`, `quill-compatible`, `email` and
    `minimal` output profiles, plus Word, Google Docs and Excel paste cleanup.
  - `useEditor`, `<Rte.Root>`, `<Rte.Content>` and the field parts, with caret-stable
    controlled values and a subscription store so a toolbar button re-renders on its own
    state alone.
  - `<RteContentView>` and `content.css`, which render stored content byte-identically to
    the editor.

- Hardening: cross-browser, IME, server rendering, and a bundle audit that found a real
  tree-shaking defect.

  - **The end-to-end suite is green on five browser targets** — Chromium, Firefox, WebKit,
    and mobile emulation of both — rather than on Chromium alone. Getting there meant
    separating what is a browser difference from what is a bug: a phone's 44px touch
    targets are not a parity regression, and Shift+Enter is a desktop gesture.
  - **IME composition is covered** (05 §15). No change event fires between
    `compositionstart` and `compositionend`, exactly one fires when the composition
    commits, and a half-composed reading never reaches an autosaved draft — a Japanese or
    Korean user was previously able to save `にほn` as their message.
  - **Server rendering is covered**, including the one case that was broken: see below.
  - **The performance budgets from 09 §4 are measured** in a real browser, in their own CI
    job, because a timing budget that shares a machine with eight parallel browsers
    measures the machine. All four pass with room: mounting a `standard` editor takes 3 ms
    against a budget of 50, typing in a 50 KB document is 8 ms at the 95th percentile
    against 16, a 200 KB Word paste settles in 51 ms against 400, and serializing a 100 KB
    document to HTML takes 2 ms.
  - **`VERSIONING.md`** says exactly what semantic versioning covers here — including the
    class names, CSS variables, data attributes and locale keys people build against, and
    the two deliberate exceptions where a minor may change behaviour rather than keep a
    bug.

  Fixes:

  - **A headless `useEditor` import carried the entire React chrome.** The published files
    are pre-bundled, and a pre-bundled file tree-shakes at chunk granularity: the
    composable parts, the feature popovers, the toolbar, the 51-icon set and the themes
    all shared a chunk with something reachable, so none of them could be dropped. Giving
    the large UI modules their own chunk boundaries took that import from 41.1 kB to
    36.0 kB with no change in behaviour.
  - **Safari left merge tags behind when a selection was deleted.** A
    `contenteditable="false"` node inside a deleted range survives WebKit's own handling,
    so "select all, delete, write a new message" kept every placeholder — and
    `{first_name}` went out to a recipient whose name had never been substituted in.
    Deleting a range now goes through the document model on every browser.
  - **`<RichTextEditor>` server-rendered an empty box** and logged a hydration warning in
    every application that rendered it. It now sends the same sanitized static markup the
    composable parts do, which is what 02 §8 asked for, and suppresses the warning the
    engine's own normalization causes.
  - **The documentation site could not have been deployed.** It had no base path, so every
    asset URL on a GitHub Pages project site would have been wrong by exactly the
    repository prefix, and every deep link would have 404ed. Both are fixed, and the
    README's bundle-size table is now generated from measured budgets rather than
    estimates — two of the five figures it previously claimed were wrong.

- Chrome, toolbar and `classic` parity.

  - A replaceable slot for every part of the UI — 44 of them, from `Root` down to the
    twelve design-system primitives — resolved through one `slots` prop and listed in the
    runtime metadata.
  - A toolbar registry with flat, grouped and object configurations, overflow behaviour,
    visible labels, two sizes and custom items. It is a real `role="toolbar"` with roving
    tabindex, `aria-pressed` toggles, a separator at every group boundary, and controls
    that prevent `mousedown` so a command never runs against a stale selection.
  - Plugins for bold, italic, underline, strike, colour, background colour, alignment,
    lists, indent, history, placeholder, counter and the paste pipeline.
  - A colour picker with the palette, recents, a custom input and a clear action, built as
    a radiogroup of named buttons with arrow-key navigation. Clearing removes the colour
    format instead of writing black.
  - Field chrome: label, helper text, error with `aria-describedby`, counter, and distinct
    `disabled` and `readOnly` modes.
  - The theme token system and the `light` and `classic` presets. `preset="classic"` now
    carries the classic tokens, so the parity reproduction needs one prop rather than two.
  - `react-rtekit-rhf`: `RteField` and `useRteField`, with `required` validated against
    `isEmpty()` so `<p><br></p>` no longer passes.

  Fixes found while building the parity page:

  - Theme tokens reached the DOM under names no stylesheet read (`--rte-editor-border-width`
    rather than `--rte-border-width`), so most of a theme silently did nothing. The
    mapping in 07 §3 is now explicit and a test asserts both directions of it.
  - `Mod+B`, `Mod+I` and `Mod+U` were handled by both the keymap and the engine, so the
    format toggled twice and the shortcut appeared to do nothing. `disableShortcuts` now
    also stops the engine's own handling, rather than only unbinding our command.
  - `editor.focus()` placed the selection without making the editor the active element,
    so the focus state could lag the caret.
  - Placeholder text and the toolbar dropdown value failed WCAG AA contrast.
  - Marked the theme, plugin, icon and memoized-component constructions as pure, which
    takes 5.5 kB off a `useEditor`-only import.

- Rich features: blocks, links, media, tables and the trigger menus.

  - Headings, blockquote, code blocks with syntax highlighting, horizontal rules, check
    lists, sub/superscript, font family and size, and clear formatting — each with a
    node, both converters, a command and a round-trip test.
  - Links: a popover with URL validation and protocol normalization, autolinking as you
    type, `linkValidator` for a consumer policy, and click-to-edit rather than navigate.
  - Images: an insert dialog, uploads with progress and failure handling, drag and paste,
    a resize frame that commits one history entry per drag, alt text and captions.
    `uploadAccept` and `maxUploadSize` are enforced before an upload starts.
  - Tables: a size picker, the row and column controls, header-row toggling, and cell
    navigation through the engine.
  - Merge tags, mentions, emoji and the slash palette, all four on one `useInlineSuggest`
    primitive and one slot, so their keyboard model and accessibility are identical
    rather than merely similar.
  - Markdown input rules, filtered by the enabled features so a preset never creates a
    block its own schema would downgrade.

  **Security: pasted HTML now goes through the sanitizer.** The engine's own paste
  handling imported the clipboard's markup with its DOM importer, which never saw the
  sanitizer — so a paste could carry markup a `value` could not. Paste and drop are now
  claimed by the library and routed through `insertHTML`, with the XSS corpus and the
  office fixtures asserted against them.

  Other fixes:

  - Default placeholder colour raised to `#717680`; `#A4A7AE` is 2.4:1 on white, and
    placeholder text has to meet AA.
  - A check list is now `role="group"`, because a `<ul>` whose children are checkboxes is
    an ARIA violation that screen readers announce.
  - `clearFormatting({ blocks: true })` re-reads the selection after replacing the
    blocks, so alignment no longer survives the clear.
  - `<figure><img><figcaption>` imports as one captioned image instead of an image and a
    stray paragraph.
  - An image always serializes with an `alt` attribute, including an empty one.
  - `subSup` provides two schema features, so the preset flag now checks for the feature
    rather than the plugin name; sub- and superscript survive a round trip again.
  - Insertion commands fall back to the end of the document when there is no selection,
    so an upload that finishes after focus moved still lands.

- Customization depth, the documentation site, and a readable default theme.

  - **The composable parts are complete** (06 §6). `<Rte.Root>` now provides the slot
    table and the resolved configuration that the other parts read, and `<Rte.Label>`,
    `<Rte.Toolbar>` and `<Rte.Portals>` join it. A field assembled by hand gets the same
    toolbar, the same colour picture and the same popovers as `<RichTextEditor>`, because
    they are the same components reading the same context rather than a second
    implementation.
  - **The guides are written** — sixteen of them, from getting started to migrating off
    the Quill wrapper — each with an "on this page" list, previous/next in reading order,
    and live editors where a code sample alone would not settle the question.
  - **Site search** over guide headings, API symbols and examples, on `Ctrl+K`. The index
    is built from the same sources the pages render: guide headings are parsed out of the
    guide modules, and slots, commands, handlers and tokens come from the runtime
    metadata, so a result can never point at something that no longer exists.
  - **Thirteen more examples**, finishing 08 §3: plugin authoring, command overrides,
    handler middleware, custom slots, a Tailwind skin, a design-system skin, theming,
    content styles, localization, Formik validation, a 100 KB document with a latency
    meter, headless, and the composable card layout.
  - **Every public symbol is documented.** `docs:check` now runs in `--strict` mode, which
    requires a description on every interface member, not only on every export. That took
    852 new TSDoc comments, and it is what makes the generated props and method tables
    worth reading: every row on `/api/rich-text-editor` and `/api/editor-instance` has
    prose, where before only a fifth of them did.

  Fixes:

  - **Three of the shipped themes failed WCAG AA on text.** In the light theme the muted
    text, the placeholder, the error message, the success and warning colours and a solid
    button's label were all below 4.5:1 — the error text worst of all at 3.8:1, which is
    the message a user most needs to read. The dark theme's placeholder was 3.9:1. All are
    now above 4.5:1 against both surfaces, and a contrast test covers every shipped theme
    so a nicer-looking shade cannot quietly undo it. The `classic` theme keeps its pinned
    parity values for the accent, the focus ring and the 1px invalid border; only its
    error _text_ changes, which is recorded as a deliberate deviation from 07 §4.
  - **`useEditorReady` never became true outside `<RichTextEditor>`.** Mounting sets a ref,
    which re-renders nothing; the hook worked only because the surrounding chrome happened
    to re-render around it. Under `<Rte.Root>`, where the children are elements the root
    does not re-create, every feature popover stayed unmounted and the link, image and
    suggestion menus silently did nothing. It now subscribes to the `ready` event.
  - **`<Rte.Content>` cleared the accessible name that `<Rte.Label>` had just set.** It
    wrote `aria-labelledby: null` for a prop it had not been given, and sibling effects run
    in order, so the content element ended up with no accessible name at all. It now writes
    only the attributes it was actually given.
  - **A plugin's toolbar item could not be referenced by name.** `toolbar={[['bold',
'highlight']]}` — the form 06 §5 documents — did not typecheck, because the entry type
    only admitted built-in names. `ToolbarEntry` now accepts any string while keeping
    autocomplete on the built-ins.
  - The `Checkbox` slot did not expose `disabled`, though the primitive behind it always
    had it.
