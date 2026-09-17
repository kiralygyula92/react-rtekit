# 01: Current Implementation (Reverse-Engineered)

Exactly how the Skimmer rich-text editor works today, written so it can be rebuilt without the original code. The MUI theme uses `spacing: 4`, so `sx={{ p: 4 }}` = `16px`; conversions below are already applied.

---

## 1. Context

| Item | Value |
|---|---|
| Component | `components/common/CustomRte.tsx`, 514 lines, default export, **not** memoized |
| Engine | `react-quill-new@3.6.0` → `quill@2.0.3`; global CSS import `react-quill-new/dist/quill.snow.css` |
| Quill config | `modules = { toolbar: false }` (Quill's own toolbar disabled), `formats = ['bold','italic','underline','color','align','list']` |
| UI kit | MUI 7 (`FormControl`, `FormHelperText`, `Box`, `IconButton`, `Divider`, `InputAdornment`, `Popover`, `TextField`, `Button`) + `@mui/icons-material` |
| Forms | react-hook-form 7 + yup (via `@hookform/resolvers`) |
| i18n | `react-i18next`, namespace `common`, keys `customRte.customColor`, `customRte.apply`, `customRte.reset` |
| Consumers | `SendEmailForm` → `ResendEmailModal` (dialog) and `SendReportEmailSection` (page section) |
| Output | An HTML string, sent verbatim to the API as `memoBodyContent` for a customer e-mail |
| Sanitization | **None anywhere** in the client |

## 2. Public surface

```ts
export interface CustomRteProps {
  name: string;                       // react-hook-form field name
  defaultValue?: string;              // initial HTML; read ONCE (see bug R1)
  disabled?: boolean;                 // mapped to Quill readOnly
  error?: boolean;                    // red border + helper text
  helperText?: React.ReactNode;       // shown only when error is true
  setValue: UseFormSetValue<any>;     // react-hook-form setter (hard coupling)
  InputProps?: { startAdornment?: React.ReactNode; endAdornment?: React.ReactNode };
  onChange?: (value: string) => void;
  onBlur?: () => void;
}

export interface RteActiveFormats {
  bold: boolean; italic: boolean; underline: boolean;
  color: string | null; align: string | null; list: boolean;
}
```

Constants (`constants.ts`):

```ts
export const RTE_MODULES = { toolbar: false } as const;
export const RTE_FORMATS = { BOLD:'bold', ITALIC:'italic', UNDERLINE:'underline',
                             COLOR:'color', ALIGN:'align', LIST:'list' } as const;
export const RTE_FORMATS_ARRAY: string[] = ['bold','italic','underline','color','align','list'];
export const RTE_PREDEFINED_COLORS = [
  '#000000','#FF0000','#00FF00','#0000FF','#FFFF00','#FF00FF','#00FFFF',
  '#800000','#008000','#000080','#808000','#800080','#008080','#C0C0C0',
  '#808080','#FFA500','#FFC0CB','#A52A2A','#00CED1','#FFD700','#DDA0DD',
] as const;                                   // 21 swatches, 3 rows of 7 at 24px
export const MESSAGE_MAX_LENGTH = 2048;       // validated against the HTML string
export const DEFAULT_WATER_TEST_EMAIL_MESSAGE =
  '<p>Hi {contact_first_name}, </p><p>Your next water test is due {next_test_date}. Here is your ' +
  'water test report from {report_date}. A support specialist will get in touch with you to discuss ' +
  'the results soon. </p><p>Thank you, </p><p>{org_name} </p><p>{org_address}</p>';
```

The merge tags `{contact_first_name}`, `{next_test_date}`, `{report_date}`, `{org_name}`, `{org_address}` are plain text inside the HTML and are substituted by the backend. They must survive editing untouched.

## 3. Internal state

| State | Purpose |
|---|---|
| `value: string` | The HTML; initialized from `defaultValue \|\| ''`, then owned locally |
| `activeFormats: RteActiveFormats` | Toolbar highlighting; initial `{ bold:false, italic:false, underline:false, color: '#000000', align: null, list: false }` |
| `colorPickerAnchor: HTMLElement \| null` | Popover anchor |
| `customColor: string` | The `<input type="color">` value, initial `#000000` |
| `isFocused: boolean` | Drives the focus border |
| `quillRef: RefObject<ReactQuill>` | Access via `quillRef.current?.getEditor()` |

## 4. Behaviour of every handler

| Handler | Implementation |
|---|---|
| `handleChange(content)` | `setValueLocal(content)`; `setValue(name, content)` (react-hook-form, **no** `shouldValidate`/`shouldDirty`); `onChange?.(content)`. So the value is written twice through two different paths |
| `handleBlur()` | Calls `onBlur?.()` only |
| `handleBold` / `handleItalic` / `handleUnderline` | `const isActive = !quill?.getFormat().bold` then `quill?.format('bold', isActive)` and mirrors it into `activeFormats` |
| `handleColorChange(color)` | `quill?.format('color', color)`, sets `activeFormats.color`, closes the popover |
| `handleColorPickerOpen/Close` | Sets/clears the anchor element |
| `handleAlignLeft` | `quill.formatLine(range.index, range.length, 'align', false)`; if no selection, `formatLine(cursor, 0, ...)`; then `setTimeout(() => quill.update(), 10)`; sets `activeFormats.align = ''` |
| `handleAlignCenter` / `handleAlignRight` | Same with `'center'` / `'right'`; sets `activeFormats.align` accordingly |
| `handleBulletList` | Reads `quill.getFormat().list`; toggles `quill.format('list', 'bullet')` or `quill.format('list', false)`; `setTimeout(update, 10)`; sets `activeFormats.list` |
| Format tracking effect (`[]` deps) | Subscribes to `selection-change` (only updates when `range` is truthy) and `text-change`. Recomputes `activeFormats` from `quill.getFormat()`, and reads the line alignment via `quill.getLine(range.index)` + `getFormat(line.offset(), line.length())`. Unsubscribes on unmount |
| Focus effect (`[]` deps) | Adds native `focus`/`blur` listeners on `quill.root`. On blur, if `relatedTarget` is an `INPUT`, `TEXTAREA`, `SELECT` or a `contentEditable` element, it **returns without clearing** `isFocused` |

There is no undo/redo UI, no link support, no headings, no ordered list, no indent, no strike, no clear-formatting, no image, no placeholder, no character counter, and no explicit keyboard-shortcut wiring (Quill's built-in Ctrl+B/I/U still work and update the toolbar through `text-change`).

## 5. Rendered structure and exact styles

```
<FormControl error={error} fullWidth>
  <Box id="toolbar" …>                       ← hard-coded DOM id (bug R4)
    <Box flex>
      [startAdornment]
      IconButton Bold · Italic · Underline
      Divider (vertical, mx 4px)
      IconButton Color
      Divider (vertical, mx 4px)
      IconButton AlignLeft · AlignCenter · AlignRight
      IconButton BulletList
    </Box>
    [endAdornment]
  </Box>
  <Box …border wrapper…>
    <ReactQuill ref value onChange onBlur modules formats readOnly={disabled} style={{minHeight:287}} />
  </Box>
  {error && <FormHelperText>{helperText}</FormHelperText>}
  <Popover …colour picker… />
</FormControl>
```

| Element | Styles |
|---|---|
| Toolbar row | `display:flex; align-items:center; justify-content:space-between; margin-bottom:8px`; `padding-right:8px` only when `endAdornment` exists; `padding-left:8px` only when `startAdornment` exists |
| Toolbar buttons | MUI `IconButton` defaults (40×40, 8px padding, 24px icon). Colour: `inherit` when the format is active, otherwise `customColors.grey400` = `#A4A7AE`. The colour button instead uses `activeFormats.color \|\| #A4A7AE` and also sets `& .MuiSvgIcon-root { fill: <color> }` |
| Icons | MUI `FormatBold`, `FormatItalic`, `FormatUnderlined`, `FormatColorText`, `FormatAlignLeft`, `FormatAlignCenter`, `FormatAlignRight`, `FormatListBulleted` |
| `aria-label`s | `"bold"`, `"italic"`, `"underline"`, `"text color"`, `"align left"`, `"align center"`, `"align right"`, `"bulleted list"` (hard-coded English, no `aria-pressed`) |
| Editor wrapper | `border-radius:4px; overflow:hidden; transition: border-color .2s ease-in-out`. Border: error → `1px solid #F04438` (`red500`); focused → `2px solid` primary `#2196F3`; otherwise `1px solid #D5D7DA` (`customColors.border`) |
| Quill container | `.ql-container { height:100%; min-height:287px; border:none }` |
| Quill editor | `.ql-editor { outline:none; min-height:287px; padding:12px }`, `ul,ol { padding-left:1.5em; margin:0 }`, `li { padding-left:.5em }`, plus `!important` alignment rules for `.ql-align-center/right/left` and `p[style*="text-align: …"]` |
| Hidden bits | `.ql-snow .ql-toolbar { display:none }` and `.ql-clipboard { display:none; outline:none }` |
| Helper text | MUI `FormHelperText` in error colour; rendered **only** when `error` is true |
| Popover | Anchored bottom-left → top-left; paper `border-radius:4px`, background `#FFFFFF`, `1px solid #D5D7DA`; content padding `16px`, `min-width:100px`, `max-width:200px` |
| Popover contents | A `TextField type="color"` (size small, full width, label "Custom color"); then a wrapping flex of 21 swatches, each `24×24`, `border:1px solid #D5D7DA`, `border-radius:4px`, `cursor:pointer`, hover `border:2px solid #D5D7DA`, gap `4px`, margin-bottom `8px`; then two text `Button`s: "Apply" (applies `customColor`) and "Reset" (applies `#000000`) with `gap:8px` |

Typography inside the editor comes from Quill's `snow` stylesheet plus the app's global font (`Open Sans Variable`, base 13px, `body1` 14px).

## 6. The form and e-mail pipeline around it

**`SendEmailForm`** (490 lines, `forwardRef`, exposes `{ submit(): void }`):

- Fields: `message` (the RTE), `email: string[]`, `ccAddress?: string[]`.
- Validation (yup, `mode:'onBlur'`, `reValidateMode:'onChange'`): `message` required + `max(2048)`; `email` an array of valid e-mails, min 1; `ccAddress` optional array of valid e-mails; each address `max(255)`.
- Defaults: `message` = `DEFAULT_WATER_TEST_EMAIL_MESSAGE`; `email` = `[primaryEmail]` from the customer store; `ccAddress` = the customer's remaining e-mails. An effect re-applies these when customer details load.
- The e-mail fields are MUI `Autocomplete multiple freeSolo` with chips; typing a space or blurring extracts addresses from free text; options already used in the other field are disabled.
- `submit()` first flushes any un-chipped text, then `handleSubmit(onValid, onInvalid)()`; `onInvalid` focuses the first invalid field.
- The RTE is wired through a react-hook-form `Controller`:
  ```tsx
  <Controller name="message" control={control} render={({ field, fieldState }) => (
    <CustomRte name={field.name} defaultValue={field.value} disabled={false} setValue={setValue}
               error={!!fieldState.error} helperText={fieldState.error?.message}
               onChange={field.onChange} onBlur={field.onBlur} />
  )} />
  ```
- Layout: the editor sits in a `p:20px` box; then a divider (`margin-top:32px`, `margin-bottom:4px`, colour `#E9EAEB`); then the e-mail fields with `body1` labels in `customColors.label` (`#414651`) and `margin-bottom:6px`, each field `margin-bottom:20px`.

**Send path:** `useReportEmailSend(customerId, successMessage)` → `buildSendReportByEmailRequest` maps the form to `{ customerId, recipientEmail: email.join(', '), recipientCCEmail: ccAddress.join(', '), memoBodyContent: data.message, reportId, treatmentPlanId }` → `sendNotification(...)`. A global loading overlay shows while sending, then a success toast or an API error message.

**Consumers:** `ResendEmailModal` is an MUI dialog (`maxWidth="sm"`, full-screen below 960px, 8px radius, title row with a close icon, actions row with Cancel and Send). `SendReportEmailSection` is a `Paper` card (1px `#E9EAEB` border, 8px radius) with an `h4` title, the form, a divider and a full-width-on-mobile Send button (44px tall).

## 7. Visual reference for the `classic` preset

| Token | Value |
|---|---|
| Editor min height | `287px` |
| Content padding | `12px` |
| Border radius | `4px` |
| Border, idle | `1px solid #D5D7DA` |
| Border, focused | `2px solid #2196F3` |
| Border, error | `1px solid #F04438` |
| Toolbar gap to editor | `8px` |
| Toolbar icon, inactive | `#A4A7AE` |
| Toolbar icon, active | `inherit` (`#212121` text colour) |
| Toolbar button box | 40×40, 8px padding, 24px icon |
| Separator | vertical divider, `#E9EAEB`-ish MUI divider, 4px horizontal margin |
| Swatch | 24×24, 4px radius, 1px `#D5D7DA` border, 4px gap |
| Popover | 4px radius, white, 1px `#D5D7DA` border, 16px padding, 100–200px wide |
| Font | Open Sans Variable, 14px |
| List indent | `padding-left:1.5em` on the list, `padding-left:.5em` on items |

## 8. What it does *not* support (feature gaps to close)

No links, headings, ordered lists, indent/outdent, blockquote, code, strikethrough, sub/superscript, font family/size, background colour, horizontal rule, images, tables, emoji, mentions, merge-tag UI, undo/redo buttons, clear formatting, find & replace, source view, fullscreen, placeholder, character/word counter, autosave, paste cleanup, markdown shortcuts, floating/bubble toolbar, slash menu, drag-drop, mobile-specific toolbar, RTL, or dark mode.

## 9. Known bugs and weaknesses: FIX in the rebuild

| # | Issue | Fix in the new library |
|---|---|---|
| R1 | `defaultValue` is read once into `useState`. If the form resets or the parent supplies new content (e.g. a different report), the editor keeps the old HTML | Proper controlled (`value`/`onChange`) and uncontrolled (`defaultValue`) modes, with an explicit `editor.setContent()` API for programmatic updates |
| R2 | An empty editor yields `<p><br></p>`, so yup's `required` passes and **an empty e-mail can be sent** | `isEmpty` semantics that ignore empty blocks; a `required`-aware validation helper; `getText()`/`getLength()` |
| R3 | `MESSAGE_MAX_LENGTH = 2048` is applied to the **HTML string**, so markup consumes the budget and the user sees no counter; long formatted text is rejected while long plain text passes | Limits count text characters (or words); a live counter slot; a `maxLength` option that can block input or only warn |
| R4 | The toolbar `Box` has a hard-coded `id="toolbar"`, duplicated when two editors are on one page (and unused, since Quill's toolbar module is off) | Generated ids via `useId`, and no reliance on global DOM ids |
| R5 | Toolbar buttons don't call `preventDefault` on mousedown, so clicking one moves focus out of the editor. Quill then formats a stale or missing selection | Toolbar controls use `onMouseDown={e => e.preventDefault()}`, and the engine restores the last selection before every command |
| R6 | `handleAlignLeft` sets `activeFormats.align = ''` while the tracker sets `null` for the same state, so the "left" button highlight is inconsistent | One canonical alignment state (`'left' \| 'center' \| 'right' \| 'justify'`), with `left` treated as the default |
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
| R21 | No `source` distinction on change (user vs programmatic), risking loops in controlled usage | `onChange(value, { source: 'user' \| 'api' \| 'paste' \| 'history' })` |
| R22 | `287px` magic number repeated three times; no `minRows`/`maxRows`/autogrow | Tokenized `minHeight`/`maxHeight`, autogrow and a resize handle option |
| R23 | Merge tags are raw text, so they can be split by formatting or partially deleted | First-class merge-tag nodes: atomic, styled, insertable from a menu (05 §10) |
| R24 | The editor has no placeholder, so an empty field looks broken | Placeholder support |
| R25 | No undo/redo affordance; no keyboard-shortcut discoverability | History buttons, a shortcut map and a shortcut help dialog |
| R26 | `CustomRte` is not memoized and recreates handlers each render, inside a form that re-renders on every keystroke | Memoized components, stable command references, and state subscriptions scoped per toolbar item |
