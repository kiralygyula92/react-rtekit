# 04: API Reference (Source of Truth for Names and Signatures)

Everything here is public API and must carry TSDoc, because the API docs site is generated from it. Defaults appear as `// default:`. *(v1.x)* marks reserved names that may ship after 1.0.

---

## 1. Exports

```ts
// react-rtekit
export { RichTextEditor } from './react/RichTextEditor';        // all-in-one + compound parts (Rte.*)
export { useEditor, useEditorState, useFormatState, useCommand, useEditorContext,
         useUpload, useCharacterCount, useIsEmpty } from './react/hooks';
export { RteThemeProvider, RteLocaleProvider, RteDefaultsProvider } from './react/providers';
export { definePlugin, createToolbarItem, presets, plugins } from './core/plugins';
export { commands } from './core/commands';                      // typed command id catalogue
export { sanitizeHtml, htmlToDocument, documentToHtml, documentToMarkdown, documentToText,
         markdownToDocument, isEmptyHtml, countText, validateMergeTags } from './core';
export { classicTheme, lightTheme, darkTheme, compactTheme, createTheme } from './themes';
export { en as defaultLocalization } from './locales/en';
export { ToolbarButton, ToolbarToggle, ToolbarDropdown, ToolbarColorPicker, ToolbarSeparator,
         ToolbarGroup, ToolbarOverflow } from './react/toolbar';
export * from './types';

// react-rtekit/view
export { RteContentView } from './view';

// react-rtekit-rhf
export { RteField, useRteField } from 'react-rtekit-rhf';
```

## 2. `<RichTextEditor>` props

### 2.1 Value and change

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` | `string \| EditorDocument` | — | Controlled value in `valueFormat` |
| `defaultValue` | `string \| EditorDocument` | `''` | Uncontrolled initial value |
| `valueFormat` | `'html' \| 'json' \| 'markdown' \| 'text'` | `'html'` | 03 §1 |
| `onChange` | `(value, meta: ChangeMeta) => void` | — | `meta = { source, isEmpty, length, wordCount, document }` |
| `onChangeDebounced` | `(value, meta) => void` | — | Debounced by `changeDebounceMs` |
| `changeDebounceMs` | `number` | `300` | |
| `onBlur` / `onFocus` | `(event) => void` | — | |
| `onSelectionChange` | `(selection: EditorSelection \| null) => void` | — | |
| `onReady` | `(editor: EditorInstance) => void` | — | Fired once the engine is mounted |
| `onContentWarning` | `(warnings: ContentWarning[]) => void` | — | Dropped/downgraded content (dev aid) |
| `onError` | `(error: unknown) => void` | — | |

### 2.2 Editing state

| Prop | Type | Default |
|---|---|---|
| `disabled` | `boolean` | `false` |
| `readOnly` | `boolean` | `false` |
| `autoFocus` | `boolean \| 'start' \| 'end'` | `false` |
| `placeholder` | `ReactNode` | from localization |
| `spellCheck` | `boolean` | `true` |
| `dir` | `'ltr' \| 'rtl' \| 'auto'` | inherit |
| `lang` | `string` | inherit |
| `tabIndex` | `number` | `0` |
| `editorRef` | `Ref<EditorInstance>` | — |
| `engine` | `EditorEngine` | Lexical adapter | 02 §2 |

### 2.3 Features and plugins

| Prop | Type | Default | Notes |
|---|---|---|---|
| `preset` | `'full' \| 'standard' \| 'email' \| 'minimal' \| 'comment' \| 'classic'` | `'standard'` | 05 §1.1 |
| `plugins` | `RtePlugin[]` | preset's list | Replaces the preset list when given |
| `addPlugins` / `removePlugins` | `RtePlugin[]` / `string[]` | — | Adjust a preset without rebuilding it |
| `enableBold`, `enableItalic`, `enableUnderline`, `enableStrike`, `enableCode`, `enableSubSup`, `enableColor`, `enableBackgroundColor`, `enableFontFamily`, `enableFontSize`, `enableHeadings`, `enableAlign`, `enableIndent`, `enableLists`, `enableCheckList`, `enableBlockquote`, `enableCodeBlock`, `enableLinks`, `enableImages`, `enableTables`, `enableHorizontalRule`, `enableEmoji`, `enableMentions`, `enableMergeTags`, `enableHistory`, `enableMarkdownShortcuts`, `enableFindReplace`, `enableSourceView`, `enableFullscreen`, `enableClearFormatting`, `enableWordCount` | `boolean` | per preset | Sugar over plugin inclusion |
| `headingLevels` | `(1\|2\|3\|4\|5\|6)[]` | `[1,2,3]` | |
| `fontFamilies` / `fontSizes` | `{ label: string; value: string }[]` | built-ins | |
| `colors` | `ColorPaletteConfig` | 21 classic swatches | `{ palette, recentCount, allowCustom, allowClear, columns }` |
| `mergeTags` | `MergeTagsConfig` | — | 03 §6 |
| `mentions` | `MentionsConfig` | — | `{ trigger, search(query), render, insert }` |
| `slashMenu` | `boolean \| SlashMenuConfig` | `true` in `full` | |
| `markdownShortcuts` | `boolean \| MarkdownShortcutConfig[]` | `true` | |

### 2.4 Content rules and validation

| Prop | Type | Default |
|---|---|---|
| `maxLength` | `number` | — |
| `countUnit` | `'characters' \| 'words'` | `'characters'` |
| `maxLengthBehaviour` | `'block' \| 'warn'` | `'block'` |
| `showCounter` | `boolean \| 'always' \| 'nearLimit'` | `false` (`true` when `maxLength`) |
| `required` | `boolean` | `false` (drives `aria-required` and the `isEmpty` helper) |
| `error` | `boolean \| string` | `false` (a string renders as the message) |
| `helperText` | `ReactNode` | — |
| `label` | `ReactNode` | — (renders a `<label>` bound to the content element) |
| `hideLabel` | `boolean` | `false` (visually hidden but still announced) |
| `validate` | `(ctx: { value; text; isEmpty; length; document }) => string \| null` | — |
| `sanitize` | `SanitizeProfileName \| SanitizeConfig \| false` | `'standard'` |
| `sanitizeOutput` | `boolean` | `true` |
| `htmlProfile` | `'standard' \| 'quill-compatible' \| 'email' \| 'minimal'` | `'standard'` |
| `emailOptions` | `EmailOutputOptions` | — |
| `interop` | `{ input?: ('quill'\|'office'\|'standard')[]; office?: OfficeCleanupOptions; quill?: QuillInteropOptions }` | all inputs on |
| `pasteMode` | `'rich' \| 'clean' \| 'text' \| (ctx) => PasteMode` | `'rich'` |
| `pastePrompt` | `boolean` | `false` |
| `autoLinkOnPaste` | `boolean` | `true` |
| `allowDataUrlImages` | `boolean` | `false` |
| `autosave` | `AutosaveConfig` | — |

### 2.5 Layout and chrome

| Prop | Type | Default |
|---|---|---|
| `toolbar` | `ToolbarConfig \| false` | preset's toolbar |
| `toolbarPosition` | `'top' \| 'bottom' \| 'none'` | `'top'` |
| `stickyToolbar` | `boolean \| { offset?: number }` | `false` |
| `toolbarOverflow` | `'wrap' \| 'menu' \| 'scroll'` | `'menu'` |
| `floatingToolbar` | `boolean \| FloatingToolbarConfig` | `false` |
| `bubbleMenuItems` | `ToolbarItemSpec[]` | text-formatting subset |
| `minHeight` / `maxHeight` | `number \| string` | `287` / — (classic parity) |
| `autoGrow` | `boolean` | `true` |
| `resizable` | `boolean \| 'vertical'` | `false` |
| `fullscreen` | `boolean` (controlled) / `defaultFullscreen` | `false` |
| `footer` | `ReactNode \| (ctx) => ReactNode` | counter + custom |
| `renderToolbar` / `renderFooter` / `renderPlaceholder` / `renderLinkPopover` / `renderImagePopover` / `renderSlashMenu` / `renderMergeTagMenu` / `renderColorPicker` / `renderSourceView` / `renderRestoreDraftPrompt` | render props | defaults |

`ToolbarConfig`:

```ts
type ToolbarConfig =
  | ToolbarItemName[]                                   // flat list, '|' inserts a separator
  | ToolbarItemName[][]                                 // groups (rendered with separators)
  | { items: (ToolbarItemName | ToolbarItemSpec)[][]; sticky?: boolean; ariaLabel?: string;
      size?: 'sm' | 'md'; showLabels?: boolean; responsive?: ResponsiveValue<ToolbarItemName[][]> };
```

Built-in `ToolbarItemName`s: `undo, redo, bold, italic, underline, strike, code, subscript, superscript, color, backgroundColor, clearFormatting, fontFamily, fontSize, heading, blockType, alignLeft, alignCenter, alignRight, alignJustify, align (dropdown), indent, outdent, bulletList, orderedList, checkList, blockquote, codeBlock, link, unlink, image, table, horizontalRule, emoji, mergeTag, mention, findReplace, sourceView, fullscreen, print, wordCount`.

### 2.6 Uploads and media

| Prop | Type | Description |
|---|---|---|
| `onUpload` | `(file: File, ctx: { signal: AbortSignal; onProgress(p: number): void }) => Promise<UploadResult>` | `UploadResult = { url: string; alt?: string; width?: number; height?: number }` |
| `uploadAccept` | `string` | default `'image/*'` |
| `maxUploadSize` | `number` (bytes) | default `5 * 1024 * 1024` |
| `onUploadError` | `(error, file) => void` | |
| `imageOptions` | `{ resizable?: boolean; alignable?: boolean; captions?: boolean; maxWidth?: number; allowExternalUrl?: boolean }` | |

### 2.7 Customization and theming (06, 07)

| Prop | Type |
|---|---|
| `slots` | `Partial<RteSlots>` |
| `slotProps` | `Partial<RteSlotProps>` (object or `(ctx) => object`) |
| `classNames` / `styles` | `Partial<Record<SlotName, string \| ((ctx) => string)>>` / same with `CSSProperties` |
| `handlers` | `Partial<RteHandlers>` (middleware, 06 §5) |
| `commandOverrides` | `Partial<Record<CommandId, CommandHandler>>` |
| `icons` | `Partial<RteIcons>` |
| `localization` | `DeepPartial<RteLocalization>` |
| `theme` | `RteTheme \| DeepPartial<RteTheme>` |
| `colorScheme` | `'light' \| 'dark' \| 'auto'` |
| `contentClassName` | `string` (applied to `.rte-content`, for prose overrides) |
| `unstyled` | `boolean` |
| `className` / `style` / `id` | root |

### 2.8 Keyboard

| Prop | Type | Default |
|---|---|---|
| `keymap` | `Record<string, CommandId \| ((ctx) => boolean)>` | built-ins (05 §13) |
| `disableShortcuts` | `string[]` | — |
| `tabBehaviour` | `'indent' \| 'focus' \| 'insertTab'` | `'indent'` in lists, otherwise `'focus'` |
| `submitOnEnter` | `boolean \| 'mod'` | `false` (`'mod'` = Ctrl/Cmd+Enter calls `onSubmit`) |
| `onSubmit` | `(value, meta) => void` | — |

## 3. `EditorInstance`

```ts
interface EditorInstance {
  // content
  getHTML(options?: SerializeOptions): string;
  getJSON(): EditorDocument;
  getMarkdown(options?: SerializeOptions): string;
  getText(options?: { blockSeparator?: string }): string;
  getPlainTextAlternative(): string;                     // e-mail text/plain part
  setContent(value: EditorValue, options?: SetContentOptions): void;
  insertContent(value: EditorValue, options?: InsertOptions): void;
  clear(options?: { history?: boolean }): void;
  isEmpty(): boolean;
  getLength(unit?: 'characters' | 'words'): number;
  // selection & focus
  getSelection(): EditorSelection | null;
  setSelection(sel: EditorSelection | 'start' | 'end' | 'all'): void;
  saveSelection(): SelectionSnapshot; restoreSelection(s: SelectionSnapshot): void;
  getFormatState(): FormatState;
  focus(position?: 'start' | 'end' | 'restore'): void; blur(): void; hasFocus(): boolean;
  // commands
  exec(command: CommandId, payload?: unknown): boolean;
  canExec(command: CommandId, payload?: unknown): boolean;
  isActive(command: CommandId, payload?: unknown): boolean;
  registerCommand(id: CommandId, handler: CommandHandler, priority?: number): Unregister;
  // history
  undo(): void; redo(): void; canUndo(): boolean; canRedo(): boolean; clearHistory(): void;
  // links, media, tags
  insertLink(attrs: LinkAttrs): void; removeLink(): void; getLinkAtSelection(): LinkAttrs | null;
  insertImage(attrs: ImageAttrs): void; uploadFiles(files: File[]): Promise<void>;
  insertMergeTag(key: string): void; getMergeTags(): string[];
  insertTable(rows: number, cols: number, options?: TableOptions): void;
  // state & misc
  setEditable(editable: boolean): void; isEditable(): boolean;
  setFullscreen(on: boolean): void; isFullscreen(): boolean;
  toggleSourceView(): void; isSourceView(): boolean;
  find(query: string, options?: FindOptions): FindResult;
  replace(query: string, replacement: string, options?: FindOptions): number;
  clearDraft(): void; saveDraft(): void;
  validate(): string | null;
  on<K extends keyof EditorEvents>(event: K, cb: EditorEvents[K]): Unregister;
  readonly engine: EngineHandle;                         // escape hatch (02 §2.2)
}
```

## 4. Commands

`commands` is a typed catalogue; `editor.exec(id, payload)` runs one. Built-ins:

| Command | Payload | Notes |
|---|---|---|
| `toggleBold`, `toggleItalic`, `toggleUnderline`, `toggleStrike`, `toggleCode`, `toggleSubscript`, `toggleSuperscript` | — | Marks |
| `setColor` / `setBackgroundColor` | `{ color: string \| null }` | `null` removes (fixes R14) |
| `setFontFamily` / `setFontSize` | `{ value: string \| null }` | |
| `clearFormatting` | — | Removes marks; optionally block type (`{ blocks?: boolean }`) |
| `setBlockType` | `{ type: 'paragraph' \| 'heading' \| 'blockquote' \| 'codeBlock'; level?: 1..6 }` | |
| `setAlign` | `{ align: 'left' \| 'center' \| 'right' \| 'justify' \| null }` | |
| `indent` / `outdent` | — | |
| `toggleBulletList`, `toggleOrderedList`, `toggleCheckList` | — | |
| `insertLink`, `updateLink`, `removeLink`, `openLinkEditor` | `LinkAttrs` | |
| `insertImage`, `updateImage`, `removeImage`, `openImageDialog` | `ImageAttrs` | |
| `insertTable`, `addRowBefore/After`, `addColumnBefore/After`, `deleteRow`, `deleteColumn`, `deleteTable`, `toggleHeaderRow` | table payloads | |
| `insertHorizontalRule`, `insertLineBreak`, `insertEmoji`, `insertMergeTag`, `insertMention`, `insertText`, `insertHTML` | | |
| `undo`, `redo` | — | |
| `selectAll`, `focusStart`, `focusEnd` | — | |
| `toggleSourceView`, `toggleFullscreen`, `openFindReplace`, `print` | — | |
| `pastePlainText` | `{ text: string }` | |

Custom commands: `editor.registerCommand('myCommand', handler)` or a plugin's `commands` map. Command ids are augmentable:

```ts
declare module 'react-rtekit' { interface CommandRegistry { insertSignature: { name?: string }; } }
```

## 5. Hooks

| Hook | Signature | Purpose |
|---|---|---|
| `useEditor` | `(options: UseEditorOptions) => EditorInstance` | Headless creation; the component uses it internally |
| `useEditorContext` | `() => EditorInstance` | Inside slots/plugins |
| `useEditorState` | `<T>(selector: (s: EditorSnapshot) => T, isEqual?) => T` | Fine-grained subscription |
| `useFormatState` | `() => FormatState` | Active marks/block/align/list/link |
| `useCommand` | `(id: CommandId, payload?) => { exec(); canExec: boolean; isActive: boolean }` | Toolbar buttons |
| `useIsEmpty` / `useCharacterCount` | `() => boolean` / `(unit?) => number` | |
| `useUpload` | `() => { upload(files): Promise<void>; uploads: UploadState[] }` | Progress UI |

## 6. `<RteContentView>` (read-only renderer, `react-rtekit/view`)

```tsx
<RteContentView value={html} valueFormat="html" sanitize="email" theme={classicTheme}
                className="my-prose" mergeTagPreview={{ contact_first_name: 'Jane' }} />
```

No engine is loaded (≈4 kB), it sanitizes before rendering, and it applies the same content styles as the editor, so previews match exactly.

## 7. Providers

- `<RteDefaultsProvider value={Partial<RichTextEditorProps>}>`: app-wide defaults (theme, localization, sanitize profile, htmlProfile, onUpload, mergeTags). Props beat the provider; nested providers merge.
- `<RteThemeProvider theme colorScheme>` and `<RteLocaleProvider localization formatters>`.

## 8. react-hook-form adapter (`react-rtekit-rhf`)

```tsx
<RteField
  control={control}
  name="message"
  rules={{ required: 'Message is required', maxLength: { value: 2048, message: 'Too long' } }}
  emptyCheck="text"            // 'text' (default) uses isEmpty(); 'string' uses raw value
  valueFormat="html"
  mode="onBlur"                // maps to RHF field behaviour
  {...rteProps}                // every RichTextEditor prop is forwarded
/>
```

- Registers with `Controller` internally, wires `onChange`/`onBlur`, sets `error`/`helperText` from `fieldState`, focuses the editor when RHF focuses the field (`setFocus`), and validates emptiness with `isEmpty()` rather than string truthiness (fixes R2).
- `useRteField({ control, name, ... })` is the headless version.
- Also documented: Formik and TanStack Form recipes in the guides (no extra packages).

## 9. Types (non-exhaustive)

`RichTextEditorProps, EditorInstance, EditorEngine, EngineHandle, EditorDocument, BlockNode, InlineNode, Mark, EditorValue, EditorSelection, SelectionSnapshot, FormatState, ChangeMeta, ChangeSource, CommandId, CommandHandler, CommandRegistry, RtePlugin, PluginContext, ToolbarConfig, ToolbarItemName, ToolbarItemSpec, SlashItemSpec, RteSlots, RteSlotProps, SlotName, RteHandlers, HandlerContext, RteIcons, RteLocalization, RteTheme, ResolvedRteTheme, SanitizeConfig, SanitizeProfileName, MergeTagDefinition, MergeTagsConfig, MentionsConfig, AutosaveConfig, UploadResult, LinkAttrs, ImageAttrs, TableOptions, FindOptions, FindResult, ContentWarning, EmailOutputOptions`.

`FormatState`:

```ts
interface FormatState {
  marks: { bold: boolean; italic: boolean; underline: boolean; strike: boolean; code: boolean;
           subscript: boolean; superscript: boolean;
           color: string | null; backgroundColor: string | null;
           fontFamily: string | null; fontSize: string | null };
  block: { type: 'paragraph' | 'heading' | 'blockquote' | 'codeBlock' | 'listItem' | 'table' | 'image';
           headingLevel?: 1|2|3|4|5|6; align: 'left'|'center'|'right'|'justify'; indent: number };
  list: { type: 'bullet' | 'ordered' | 'check' | null; depth: number };
  link: LinkAttrs | null;
  canUndo: boolean; canRedo: boolean;
  isEmpty: boolean; isCollapsed: boolean;
}
```
