# Behaviours this library fixes

Most React applications reach a rich-text editor the same way: a thin wrapper around
Quill or a similar library, grown one prop at a time. This library was written to
replace one of those, and the twenty-six entries below are the defects that wrapper
had — each one now a named regression test in
[`regressions.test.tsx`](../packages/react-rtekit/test/react/regressions.test.tsx).

The ids are referenced from the source, so a comment saying "(fixes R14)" points here.
They are kept because the tests are the contract: if you are porting a similar wrapper,
this is the list of things you get for free, and if you are changing this library, it is
the list of things you must not undo.

| Id | The behaviour in a typical Quill wrapper | What this library does instead |
|---|---|---|
| R1 | `defaultValue` is read once into `useState`. If the form resets or the parent supplies new content (e.g. a different report), the editor keeps the old HTML | Proper controlled (`value`/`onChange`) and uncontrolled (`defaultValue`) modes, with an explicit `editor.setContent()` API for programmatic updates |
| R2 | An empty editor yields `<p><br></p>`, so yup's `required` passes and **an empty e-mail can be sent** | `isEmpty` semantics that ignore empty blocks; a `required`-aware validation helper; `getText()`/`getLength()` |
| R3 | `MESSAGE_MAX_LENGTH = 2048` is applied to the **HTML string**, so markup consumes the budget and the user sees no counter; long formatted text is rejected while long plain text passes | Limits count text characters (or words); a live counter slot; a `maxLength` option that can block input or only warn |
| R4 | The toolbar `Box` has a hard-coded `id="toolbar"`, duplicated when two editors are on one page (and unused, since Quill's toolbar module is off) | Generated ids via `useId`, and no reliance on global DOM ids |
| R5 | Toolbar buttons don't call `preventDefault` on mousedown, so clicking one moves focus out of the editor. Quill then formats a stale or missing selection | Toolbar controls use `onMouseDown={e => e.preventDefault()}`, and the engine restores the last selection before every command |
| R6 | `handleAlignLeft` sets `activeFormats.align = ''` while the tracker sets `null` for the same state, so the "left" button highlight is inconsistent | One canonical alignment state (`'left' \ |
| R7 | `setTimeout(() => quill.update(), 10)` after alignment and list commands is a race-prone hack | Commands are synchronous and state updates flow from the engine's own change events |
| R8 | `selection-change` updates the active formats only when a range exists, so the toolbar keeps stale highlights after blur | Format state is recomputed on every selection and content change, including collapse to null |
| R9 | The blur handler keeps `isFocused` true when focus moves to another input, so the editor stays visually focused | `:focus-within` semantics driven by the engine's focus state |
| R10 | The focus border changes from 1px to 2px, shifting the content by 1px | An inset box-shadow / outline ring that doesn't affect layout |
| R11 | `quill.snow.css` is imported globally and then partly overridden and partly hidden | Own scoped stylesheet in a cascade layer; no third-party global CSS |
| R12 | `setValue(name, content)` plus `onChange(content)` writes the value twice, and `setValue` is called without `shouldValidate`/`shouldDirty`, so validation state can lag | A single `onChange`; the react-hook-form binding lives in the separate `rhf` adapter |
| R13 | The component is coupled to react-hook-form via a required `setValue` prop | No form-library dependency in the core |
| R14 | Colour "Reset" applies `#000000` rather than removing the colour format, so text stops following the theme | Reset removes the format (`color: null`) |
| R15 | Colour swatches are `Box` elements with `onClick`: not focusable, no keyboard, no `aria-label`, no selected state | A proper listbox/grid of buttons with roving focus, names and `aria-selected` |
| R16 | Toolbar is not a `role="toolbar"`, buttons lack `aria-pressed`, the editor has no accessible name, and the error text is not linked with `aria-describedby` | Full WAI-ARIA toolbar + textbox semantics (05 §14) |
| R17 | `aria-label`s and the picker strings are partly hard-coded English | Every string comes from `localization` |
| R18 | `disabled` maps to Quill's `readOnly` with no visual difference and the editor stays focusable | Distinct `disabled` and `readOnly` modes, each with its own styling and semantics |
| R19 | No sanitization of the initial value, of pasted content, or of the output that is e-mailed | Sanitization at every boundary (03 §4) |
| R20 | Pasting from Word/Google Docs injects arbitrary markup and styles that the format list does not cover | A paste pipeline with cleanup profiles (03 §3) |
| R21 | No `source` distinction on change (user vs programmatic), risking loops in controlled usage | `onChange(value, { source: 'user' \ |
| R22 | `287px` magic number repeated three times; no `minRows`/`maxRows`/autogrow | Tokenized `minHeight`/`maxHeight`, autogrow and a resize handle option |
| R23 | Merge tags are raw text, so they can be split by formatting or partially deleted | First-class merge-tag nodes: atomic, styled, insertable from a menu (05 §10) |
| R24 | The editor has no placeholder, so an empty field looks broken | Placeholder support |
| R25 | No undo/redo affordance; no keyboard-shortcut discoverability | History buttons, a shortcut map and a shortcut help dialog |
| R26 | `CustomRte` is not memoized and recreates handlers each render, inside a form that re-renders on every keystroke | Memoized components, stable command references, and state subscriptions scoped per toolbar item |

## How they are enforced

Each id has a `describe` block in `regressions.test.tsx` named after the behaviour, and
several are also asserted in a real browser — the ones about focus, selection and layout
can only be proved there. The
[legacy parity example](https://kiralygyula92.github.io/react-rtekit/examples/legacy-parity)
lists all twenty-six behind a "show differences" toggle, next to a reproduction of the
editor they came from.
