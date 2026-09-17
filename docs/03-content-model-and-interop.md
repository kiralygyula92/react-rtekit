# 03: Content Model, Sanitization and Interop

The current app takes whatever HTML Quill produces and e-mails it, unsanitized, to customers. This file specifies how the new library handles content at every boundary. It is the most security-sensitive part of the project.

---

## 1. Value formats

| `valueFormat` | `value` / `onChange` type | Use for |
|---|---|---|
| `'html'` (default) | `string` | Drop-in replacement for the current field; e-mail bodies; anything stored as HTML |
| `'json'` | `EditorDocument` (02 §2.4) | New storage where structure matters; safest round-tripping |
| `'markdown'` | `string` | Notes, docs-like content |
| `'text'` | `string` | Plain-text mode |

Conversions are always available regardless of `valueFormat`:

```ts
editor.getHTML(opts?) · editor.getJSON() · editor.getMarkdown(opts?) · editor.getText(opts?)
editor.setContent(value, { format?, source?, keepSelection?, history? })
```

`onChange(value, meta)` with `meta = { source, isEmpty, length, wordCount, document }`, where `document` is a lazily-built `EditorDocument`.

### 1.1 Emptiness and length (fixes R2, R3)

```ts
editor.isEmpty()                       // true for '', '<p></p>', '<p><br></p>', whitespace-only,
                                       // and for a document whose only content is empty blocks
editor.getLength('characters')         // visible text length; block boundaries count as 1 newline
editor.getLength('words')
editor.getText({ blockSeparator: '\n' })
```

- A merge tag counts as its **label** length by default (`mergeTagLengthMode: 'label' | 'key' | 'zero'`).
- `maxLength` (04 §2.4) counts the same unit as `countUnit` (`'characters' | 'words'`, default characters) and never counts markup.
- `required` validation in the form adapter uses `isEmpty()`, not string truthiness.

## 2. Schema and normalization

- The **schema** (`core/schema.ts`) declares which nodes and marks exist, their attributes, their allowed children, and which are atomic (merge tags, mentions, images, horizontal rules).
- Enabled plugins determine the **active** schema. Content containing disabled features is downgraded on input: a heading becomes a paragraph when the heading plugin is off; a table becomes its cell text; unknown inline markup keeps its text and drops its marks.
- Normalization rules applied after every input and paste: merge adjacent identical marks; drop empty inline nodes; ensure the document ends with a paragraph (`trailingParagraph` plugin) so users can escape a trailing table/quote; collapse multiple consecutive empty blocks when `collapseEmptyBlocks` is on.
- `schemaViolations` are reported through `onContentWarning(warnings)` in development so consumers can see what was dropped.

## 3. Paste, drop and input pipeline

Every piece of incoming content goes through the same ordered pipeline:

```
raw input (paste / drop / setContent / insertContent / initial value)
  → source detection      (Word, Google Docs, Excel/Sheets, Quill, plain text, unknown HTML)
  → pre-transform hooks   (handlers.onPaste can replace or cancel)
  → interop profile parse (03 §5: converts foreign markup to our schema)
  → sanitize              (03 §4: allowlist, URL policy, style policy)
  → schema downgrade      (02 §2.4 + §2 above)
  → normalization
  → insert into document  (single history entry)
```

**Paste modes** (`pasteMode`): `'rich'` (default), `'clean'` (keeps only structure: blocks, lists, links, bold/italic/underline), `'text'` (plain text only), or a function `(ctx) => PasteMode`.

- `Ctrl/Cmd+Shift+V` always pastes as plain text.
- A **paste-cleanup prompt** (`pastePrompt`, default `false`) can offer "Keep formatting / Remove formatting" as a small popover after a rich paste from an office source.
- **Word/Google Docs cleanup** removes `mso-*` styles, `<o:p>`, conditional comments, empty spans, font tags, class-only spans, and fixed pixel font sizes (configurable in `interop.office`), and it converts Word list paragraphs (`mso-list`) into real lists.
- **Images in paste/drop**: if `onUpload` is provided, binary images are uploaded and inserted with the returned URL, showing an inline progress placeholder; otherwise they are inserted as `data:` URLs only when `allowDataUrlImages` is true (default `false`), and dropped otherwise.
- **Link auto-detection**: pasting a URL over a selection wraps the selection in a link; pasting a bare URL into empty space inserts a link (`autoLinkOnPaste`, default `true`).
- Plain-text paste converts double newlines into paragraphs and single newlines into line breaks.

## 4. Sanitization

### 4.1 Where it runs

At **every boundary**, in both directions: initial value, `setContent`, `insertContent`, paste, drop, and on output when `sanitizeOutput` is on (default `true`). The read-only `<RteContentView>` sanitizes before rendering. This is non-negotiable: the output of this editor is e-mailed to customers.

### 4.2 Profiles

```ts
sanitize?: SanitizeProfileName | SanitizeConfig | false;   // default: 'standard'
type SanitizeProfileName = 'strict' | 'standard' | 'email' | 'permissive';
```

| Profile | Allows |
|---|---|
| `strict` | `p, br, strong, em, u, s, ul, ol, li, a` and nothing else; no styles; no classes |
| `standard` (default) | The full library schema: headings, lists, blockquote, code, tables, images, links, plus `style` limited to the allowlisted properties and `class` limited to `rte-*` |
| `email` | `standard` minus `codeBlock`; forces inline styles instead of classes; strips `id`; restricts CSS to e-mail-safe properties (§5.3) |
| `permissive` | Everything the schema knows plus unknown tags preserved as `html` blocks. Use only for trusted internal content |

`sanitize: false` is allowed but logs a loud dev-only warning and is documented as unsafe.

### 4.3 Config

```ts
interface SanitizeConfig {
  allowTags?: string[];
  allowAttributes?: Record<string, string[]>;             // tag → attributes ('*' supported)
  allowStyles?: string[];                                 // CSS property allowlist
  allowClasses?: (string | RegExp)[];
  allowProtocols?: string[];                              // default ['http','https','mailto','tel']
  allowDataUrls?: boolean | { mimeTypes: string[] };      // default false
  allowRelative?: boolean;                                // default true for images/links
  transform?: (el: Element, ctx: SanitizeContext) => Element | null | 'unwrap';
  onViolation?: (info: { tag: string; attribute?: string; reason: string }) => void;
}
```

Hard rules that no config can disable:

- `<script>`, `<style>`, `<iframe>`, `<object>`, `<embed>`, `<form>`, `<input>`, `<link>`, `<meta>`, `<base>` and SVG `<use>`/`<foreignObject>` are removed.
- All `on*` attributes are removed.
- `javascript:`, `vbscript:` and `data:text/html` URLs are removed.
- CSS values containing `expression(`, `url(javascript:` or `@import` are removed.
- External links get `rel="noopener noreferrer"` when `target="_blank"` (`linkRel` configurable).

### 4.4 Implementation

In-house sanitizer over `DOMParser` in the browser and a small parser on the server (so SSR and Node tests work), ~3 kB gzipped. A `sanitizer: 'dompurify'` option delegates to `isomorphic-dompurify` if the consumer installs it (documented as an optional dependency). The in-house sanitizer is fuzz-tested against a corpus of XSS payloads (09 §2).

## 5. HTML interop profiles

The point of this section: **existing Skimmer content must open, edit and save correctly**, and the output must be safe to e-mail.

### 5.1 Input parsing: legacy Quill markup

Quill 2 with the current format list emits, among others:

| Quill markup | Parsed as |
|---|---|
| `<p class="ql-align-center">` / `ql-align-right` / `ql-align-justify` | paragraph with `align` |
| `<p style="text-align: center">` | paragraph with `align` |
| `<ul><li data-list="bullet">` | bullet list item (the `data-list` attribute is consumed, not rendered) |
| `<ol><li data-list="ordered">` | ordered list item |
| `<li data-list="unchecked" / "checked">` | check-list item |
| `<span class="ql-size-large">` etc. | `fontSize` mark mapped through `interop.quill.sizeMap` |
| `<span style="color: #FF0000">` | `color` mark |
| `<span class="ql-cursor">`, `<span class="ql-ui">` | removed |
| `<p><br></p>` | an empty paragraph, and `isEmpty()` stays true if it's the only content |
| `class="ql-indent-1..8"` | `indent` level (8 × 3em in Quill; mapped to our indent unit) |

This is implemented as `interop/quill.ts` and enabled by `interop.input: ['quill', 'office', 'standard']` (default). Parsing is order-independent and lossless for everything the schema supports.

### 5.2 Output profiles

```ts
htmlProfile?: 'standard' | 'quill-compatible' | 'email' | 'minimal';   // default 'standard'
```

| Profile | Output |
|---|---|
| `standard` | Semantic HTML with classes for alignment/indent (`class="rte-align-center"`), no inline styles except colours/fonts |
| `quill-compatible` | Emits `class="ql-align-…"`, `data-list` attributes and `ql-indent-…`, so content stays readable by the **old** editor during a gradual migration |
| `email` | Inline styles only, no classes (see §5.3) |
| `minimal` | The smallest valid markup: no wrapper spans, merged marks, no empty attributes |

A round-trip test matrix (09 §2) asserts: Quill HTML → document → `quill-compatible` HTML is semantically identical, and → `standard`/`email` HTML preserves all visible formatting.

### 5.3 E-mail-safe output

`htmlProfile: 'email'` (plus `sanitize: 'email'`) produces markup that survives Gmail/Outlook:

- Every style is inline (`style="text-align:center"`, `style="color:#FF0000"`); no `class`, no `id`, no `<style>` block.
- Only e-mail-safe CSS properties: `color, background-color, font-family, font-size, font-weight, font-style, text-decoration, text-align, padding, margin, border, width, height, vertical-align, line-height, list-style-type`.
- Lists get explicit `margin`/`padding` so clients that reset them still indent.
- Images get `width`/`height` attributes alongside styles, plus `alt`, and `style="max-width:100%"`.
- Optional `emailOptions`: `{ wrapInTable?: boolean; containerWidth?: number; fontFallback?: string; forceAbsoluteUrls?: string /* base URL */; inlineImagesAsCid?: boolean }`.
- `editor.getPlainTextAlternative()` generates the text/plain part (links become `text (url)`, lists become `- item`), so consumers can send multipart e-mail.

### 5.4 Markdown

`getMarkdown()`/`setContent(md, { format: 'markdown' })` using CommonMark plus GFM tables, strikethrough and task lists. Unsupported nodes (merge tags, mentions) serialize to their text form by default, or to a configurable syntax (`markdownOptions.mergeTagSyntax`, default `{{key}}`).

## 6. Merge tags / variables (fixes R23)

The e-mail use case depends on `{contact_first_name}`-style tokens, and today they are fragile plain text.

```ts
mergeTags?: {
  tags: MergeTagDefinition[];                 // { key, label, description?, sample?, group? }
  syntax?: { open: string; close: string };   // default { open: '{', close: '}' }
  parseOnInput?: boolean;                     // default true: typing/pasting {key} creates a tag node
  atomic?: boolean;                           // default true: the tag is a single, non-editable unit
  render?: (tag: MergeTagDefinition) => ReactNode;
  showMenu?: boolean;                         // default true: a toolbar dropdown to insert one
  trigger?: string;                           // default '{{' opens an inline autocomplete
  unknownTagBehaviour?: 'keep' | 'warn' | 'strip';   // default 'warn'
};
```

- A tag renders as an inline chip (tokenized styling: `--rte-mergetag-*`), is selected as one unit, deletes as one unit, and cannot be split by formatting.
- On serialization it becomes exactly `{key}` text again (or the configured syntax), so the backend substitution is unchanged.
- `editor.exec('insertMergeTag', { key })`, and the insert menu is grouped and searchable.
- A **preview mode** (`mergeTagPreview: Record<string, string>`) swaps tags for sample values so authors can see the final e-mail; it never changes the stored value.
- Validation helper `validateMergeTags(value, allowedKeys)` returns unknown/misspelled keys, which the demo shows wired to a field error.

## 7. Autosave and drafts

```ts
autosave?: { key: string; storage?: Storage; debounceMs?: number /*1000*/;
             restorePrompt?: boolean /*true*/; serialize?: 'html' | 'json' /*json*/;
             ttlMs?: number; onRestore?(draft, meta): void };
```

Stores a draft per key, restores it on mount (optionally behind a "Restore draft?" prompt slot), and clears it on successful submit via `editor.clearDraft()`.

## 8. Required tests

1. Quill fixture corpus (captured from the real app: alignment, nested bullets, coloured spans, `<p><br></p>`, merge tags) round-trips through every profile.
2. `isEmpty()` truth table across `''`, `<p></p>`, `<p><br></p>`, `<p> </p>`, `<p>&nbsp;</p>` (not empty), and a single empty list item.
3. Length counting ignores markup, counts merge tags per mode, and matches `getText().length`.
4. XSS corpus (payloads with `<script>`, `onerror`, `javascript:`, CSS `expression`, SVG vectors, nested encodings) produces no executable output in all profiles.
5. Word and Google Docs paste fixtures produce clean documents (no `mso-*`, no empty spans, lists preserved).
6. E-mail profile output contains no `class`/`id` and only allowlisted CSS properties.
7. Merge tags survive bold/italic application, cut/paste, undo/redo, and markdown round-trip.
8. Controlled-mode round-trip does not move the caret when the parent re-renders with an equivalent value.
