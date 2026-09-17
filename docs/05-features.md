# 05: Feature Specifications (Source of Truth for Behaviour)

Each feature states its behaviour, UI, a11y and acceptance tests. Names match 04.

---

## 1. Presets and plugin composition

### 1.1 Presets

| Preset | Contents |
|---|---|
| `minimal` | bold, italic, underline, link, history |
| `classic` | **Exactly the Skimmer feature set**: bold, italic, underline, colour, align (left/center/right), bullet list, plus history (new) — with the classic theme defaults (07 §4) |
| `standard` (default) | classic + strike, headings, ordered list, indent/outdent, blockquote, link, clear formatting, counter, paste cleanup, markdown shortcuts |
| `email` | standard + merge tags, image (URL/upload), horizontal rule, font family/size, e-mail HTML profile, `sanitize: 'email'`, no code block |
| `comment` | bold, italic, strike, code, link, bullet/ordered list, emoji, mention, `submitOnEnter: 'mod'`, compact toolbar |
| `full` | everything: tables, code block, check list, sub/superscript, background colour, find & replace, source view, fullscreen, slash menu, floating toolbar |

A preset is just an array of plugins plus default props; `addPlugins` / `removePlugins` adjust it. `plugins` replaces it entirely.

### 1.2 Plugin lifecycle
`setup(ctx)` runs after the engine mounts and returns a cleanup. Dependencies resolve first; a missing dependency throws in dev with a clear message and is ignored in prod. Plugins may register commands, nodes/marks, keymaps, toolbar items, slash items, serializer rules, sanitizer additions, UI components, localization keys and theme tokens (02 §4).

## 2. Inline formatting

- **Marks:** bold, italic, underline, strikethrough, inline code, subscript, superscript (sub/sup are mutually exclusive), text colour, background colour, font family, font size.
- Toggling with a collapsed selection sets a **pending format** applied to the next typed character (the standard editor behaviour); moving the caret clears it.
- `clearFormatting` removes all marks in the selection; with `{ blocks: true }` it also resets the block to a paragraph and clears alignment/indent.
- Colour UI (`ToolbarColorPicker`): a grid of swatches (default = the 21 classic colours), an optional native colour input, a "recent colours" row (`recentCount`, default 6, stored per `colorStorageKey`), an "Automatic/None" entry that removes the format, and Apply/Reset buttons. Fully keyboard navigable (arrow keys move within the grid, Enter applies, Escape closes and restores focus and selection).
- The button's icon reflects the current colour (the classic look: the glyph is tinted with the active colour).
- Font size accepts a preset list; the value is stored as a CSS length and serialized inline.

**Tests:** toggle/untoggle across partial selections; pending format at the caret; mixed selections report "not active"; colour removal restores inherited colour; marks survive undo/redo.

## 3. Blocks

- Paragraph, headings (`headingLevels`), blockquote, code block (with an optional language select and no rich marks inside), horizontal rule.
- `blockType` toolbar dropdown shows the current block; a mixed selection shows a blank value.
- Splitting a block with Enter keeps alignment/indent; Enter at the end of a heading/quote produces a paragraph.
- Backspace at the start of a non-paragraph block converts it to a paragraph before merging.
- `trailingParagraph` keeps a final empty paragraph after tables/quotes/rules so the caret can always escape.

## 4. Alignment and indentation (fixes R6, R7)

- One canonical value per block: `left` (default, serialized as no attribute), `center`, `right`, `justify`.
- The toolbar exposes either three/four toggle buttons (classic) or one dropdown (`align`), both driven by the same state.
- Indent/outdent: 0–8 levels; inside lists it changes the nesting level instead; the unit is tokenized (`--rte-indent-step`, default `2em`; Quill's legacy `3em` maps correctly on import).
- Commands are synchronous; the toolbar updates from the engine's change event — no timers.

## 5. Lists

- Bullet, ordered and check lists, arbitrarily nested; Tab/Shift+Tab nest and outnest; Enter on an empty item outdents, and outdents out of the list at level 0.
- Ordered list `start` and `type` (`1`, `a`, `i`) are supported and serialized.
- Check lists render an accessible checkbox (`role="checkbox"`, `aria-checked`, Space toggles) and serialize as `data-checked` + a `list-style: none` style for e-mail safety.
- Mixed selections toggle to the target type.
- Markdown shortcuts: `- `, `* `, `1. `, `[] `/`[x] ` at the start of a line.

## 6. Links

- Insert/edit via toolbar, `Ctrl/Cmd+K`, or clicking an existing link.
- **Link popover** (slot `LinkPopover`): URL field with validation and protocol normalization (`example.com` → `https://example.com`, configurable `defaultProtocol`), optional text field (when the selection is collapsed), "Open in new tab" checkbox (adds `target="_blank" rel="noopener noreferrer"`), plus Apply / Remove / Open buttons. It opens anchored to the link with focus moved into the URL field, restores the selection on close, and closes on Escape.
- `autoLink` converts typed/pasted URLs and e-mail addresses into links (`autoLinkProtocols`, `autoLinkOnSpace`, default on).
- Clicking a link in the editor does not navigate (it opens the popover); `Ctrl/Cmd+click` opens it in a new tab.
- Validation: `linkValidator?: (url) => string | null` can reject or rewrite URLs (for example, requiring an internal domain).
- Sanitization refuses `javascript:` and friends regardless of settings (03 §4.3).

## 7. Images and uploads

- Insertion: toolbar dialog (URL or file), drag-and-drop, paste, or the slash menu.
- Upload flow: `onUpload` receives the file plus progress/abort; an inline placeholder shows a progress bar and can be cancelled; failures surface an inline retry, and the placeholder is removed on give-up.
- Selected images show a **resize frame** (corner handles, aspect ratio locked unless Alt, min 32px, max `imageOptions.maxWidth` or the editor width) and a toolbar popover with alignment, alt-text, caption, replace and delete.
- Alt text is requested when missing (`requireAltText`, default `false`, but the a11y demo shows it on).
- Images serialize with `width`/`height` attributes plus inline `max-width:100%` in the e-mail profile.
- Constraints: `uploadAccept`, `maxUploadSize`, and `allowDataUrlImages` (default false) are enforced before insertion.

## 8. Tables

- Insert with a size picker (grid hover, up to 10×10, or a custom size dialog).
- Cell navigation with Tab/Shift+Tab (Tab in the last cell adds a row); arrow keys move between cells at the text boundaries.
- A floating table toolbar: add/remove row/column, toggle header row/column, cell alignment, delete table; also available in the context menu.
- Column resizing by dragging a border; widths serialize as percentages for e-mail robustness.
- Selection across cells highlights them and applies formatting to all.
- *(v1.x)* merged cells, cell background colour, table styles.

## 9. History

- Undo/redo with grouping: consecutive typing coalesces within `historyGroupMs` (default 300ms); every command, paste, drop and image insertion is one entry.
- `Ctrl/Cmd+Z` / `Ctrl/Cmd+Shift+Z` (and `Ctrl+Y` on Windows).
- `historyLimit` (default 200). `editor.clearHistory()` after programmatic `setContent` from the server, so the user cannot undo into someone else's content.
- Toolbar buttons disable correctly via `canUndo`/`canRedo` (fixes R25).

## 10. Merge tags, mentions, emoji, slash menu

- **Merge tags:** 03 §6. Toolbar dropdown grouped by `group`, searchable, with descriptions and sample values; typing the trigger (default `{{`) opens an inline autocomplete; tags are atomic chips.
- **Mentions:** `trigger` (default `@`), async `search(query)` with loading/empty states, keyboard selection, and a custom `render`; inserts an atomic `mention` node carrying `id` and `label`; serializes to text or to a link, per `mentions.serialize`.
- **Emoji:** `:` trigger with a searchable picker and a category grid; inserts a plain character (no images).
- **Slash menu:** `/` at the start of an empty block opens a searchable command palette listing block insertions (heading, list, quote, code, table, image, rule, merge tag). Items come from plugins (`slashItems`), and the list is filterable, keyboard navigable and grouped.

All four use the same `InlineSuggestMenu` primitive, so their popovers, keyboard model and a11y are identical (a single slot to override).

## 11. Paste, drop and clipboard

Specified in 03 §3. Additional behaviour:
- Copy/cut preserve formatting; copying a full block includes its block markup.
- Copying from the editor writes `text/html`, `text/plain` and an internal JSON MIME type, so pasting between two instances is lossless.
- Drag-and-drop of text inside the editor moves it; dropping files triggers the upload pipeline; a drop cursor shows the insertion point.

## 12. Counter, limits and validation

- Counter slot shows `231 / 2048` (or just the count without `maxLength`), with `data-near-limit` under `counterWarnThreshold` (default 90%) and `data-over-limit` past it, and `aria-live="polite"` announcements throttled to once every 2s.
- `maxLengthBehaviour: 'block'` prevents input/paste beyond the limit (paste is truncated at a word boundary and a warning is announced); `'warn'` allows overflow and flags the error state.
- `validate` runs on change (debounced) and on blur; the returned message renders in the error slot and is linked with `aria-describedby` and `role="alert"`.
- `required` + `isEmpty()` is the empty check everywhere (fixes R2).

## 13. Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Mod+B` / `Mod+I` / `Mod+U` | Bold / italic / underline |
| `Mod+Shift+X` | Strikethrough |
| `Mod+E` | Inline code |
| `Mod+K` | Insert/edit link |
| `Mod+Z` / `Mod+Shift+Z` / `Ctrl+Y` | Undo / redo |
| `Mod+Alt+0..6` | Paragraph / heading 1–6 |
| `Mod+Shift+7` / `Mod+Shift+8` / `Mod+Shift+9` | Ordered / bullet / check list |
| `Mod+Shift+L/E/R/J` | Align left / center / right / justify |
| `Tab` / `Shift+Tab` | Indent / outdent (in lists and when `tabBehaviour: 'indent'`), otherwise move focus |
| `Mod+Shift+V` | Paste as plain text |
| `Mod+\` | Clear formatting |
| `Mod+F` | Find & replace (when enabled) |
| `Mod+Enter` | Submit (when `submitOnEnter: 'mod'`) |
| `Escape` | Close the open popover/menu, or leave the editor when `escapeExitsEditor` |
| `Alt+F10` | Move focus to the toolbar (APG pattern) |
| `Mod+/` | Shortcut help dialog |

`keymap` overrides or adds bindings; `disableShortcuts` removes them. Mod = Cmd on macOS, Ctrl elsewhere; the help dialog and tooltips render the right glyphs per platform.

## 14. Accessibility

- The content element is `role="textbox" aria-multiline="true"` with an accessible name from `label` / `aria-label` / `aria-labelledby`, `aria-describedby` linking helper text, counter and error, `aria-required`, `aria-invalid` and `aria-disabled`.
- The toolbar is `role="toolbar"` with **roving tabindex**: one tab stop, arrow keys move between controls, Home/End jump, and focus returns to the editor on Escape. Toggles expose `aria-pressed`; dropdowns expose `aria-expanded`/`aria-haspopup`.
- Toolbar buttons never steal focus (`onMouseDown → preventDefault`), and the last selection is restored before a command runs (fixes R5).
- Popovers and dialogs trap focus, close on Escape, return focus to the trigger, and are labelled.
- All icon-only controls have names from `localization`, plus tooltips with the shortcut (fixes R16, R17).
- Live-region announcements: format applied, link inserted/removed, image uploaded, list level changed, find results count, over-limit.
- Colour contrast in all presets meets WCAG AA; focus rings are visible in both themes and never rely on colour alone.
- `prefers-reduced-motion` disables popover/placeholder animation.
- Screen-reader smoke tests (NVDA/VoiceOver notes) documented in the a11y guide.

## 15. Mobile and touch

- Toolbar becomes horizontally scrollable or collapses into a "more" menu (`toolbarOverflow`).
- Optional bottom-docked toolbar above the virtual keyboard (`toolbarPosition: 'bottom'` with `visualViewport` tracking).
- Touch targets ≥ 44px in the `comfortable` density; selection handles are the platform's.
- Long-press opens the context menu with formatting; the floating toolbar is placed above the selection and avoids the keyboard.
- IME composition never triggers change events mid-composition; tests cover Japanese/Korean input.

## 16. Source view, fullscreen, find & replace, print

- **Source view:** toggles a `<textarea>` (or CodeMirror if the consumer supplies the slot) showing the current HTML, sanitized on apply; invalid HTML is reported and not applied; the toolbar disables formatting controls while active.
- **Fullscreen:** the editor fills the viewport (a portal to `document.body`, `z-index` token, scroll lock, Escape exits); controlled via prop or command.
- **Find & replace:** a panel with find, replace, replace all, match case, whole word, and regex (opt-in); matches are highlighted with decorations, and the current match is scrolled into view with a counter ("3 of 12").
- **Print:** `editor.exec('print')` opens a print view using the content styles and a print stylesheet.

## 17. Read-only, disabled and view rendering

- `readOnly`: selection and copy work, editing does not, the toolbar hides or disables (`readOnlyToolbar: 'hide' | 'disable'`, default `'hide'`).
- `disabled`: not focusable, dimmed via tokens, `aria-disabled`, toolbar hidden.
- `<RteContentView>` (04 §6) is the correct way to render stored content outside the editor, so prose styles stay identical.

## 18. Autosave and drafts

03 §7. The restore prompt is a slot; drafts are namespaced by `key`; `ttlMs` expires them; `onRestore` lets consumers log or veto.

## 19. Localization and RTL

- Every visible string, tooltip, aria-label and announcement comes from `localization` (06 §8); shipped locales `en`, `hu`, `de`, `es`.
- `dir="rtl"` mirrors the toolbar, indentation, alignment defaults and popover placement; the content element gets `dir="auto"` support per block (`autoDirection`, default off).

## 20. Feature flags at a glance

Every feature above is switchable through a plugin or an `enableX` prop (04 §2.3), and disabled features are removed from the toolbar, keymap, slash menu, schema and serializers, so content containing them downgrades gracefully (03 §2).
