# 06: Customization and Override System

Every visible part can be replaced, every interaction intercepted, and every default remains reachable so overrides can wrap rather than reimplement.

## 0. Override levels

| Level | Mechanism | Use for |
|---|---|---|
| 1 | **Theme tokens** (07) | Colours, spacing, radii, typography, prose styles |
| 2 | **`classNames` / `styles`** | Utility classes (Tailwind), one-off tweaks |
| 3 | **`slotProps`** | Extra attributes, aria, data-*, event handlers |
| 4 | **`toolbar` config** | Which items appear, their order and grouping |
| 5 | **Render props** (`renderToolbar`, `renderLinkPopover`, …) | Replacing a whole region's markup |
| 6 | **`handlers`** middleware | Changing interaction behaviour |
| 7 | **`commandOverrides`** / `registerCommand` | Changing what a command does |
| 8 | **`slots`** | Swapping components (design-system adoption) |
| 9 | **Plugins** | New nodes, marks, commands, UI, serialization |
| 10 | **Composable parts / `useEditor`** | A completely custom UI |

Precedence (highest first): props > `<RteDefaultsProvider>` > preset defaults > library defaults. `slotProps`, `classNames` and `styles` merge across levels; class names concatenate, styles shallow-merge, and event handlers chain (the user's handler runs first and may call `event.preventRteDefault()`).

---

## 1. Slots

| Slot | Default element | Key context props |
|---|---|---|
| `Root` | `div.rte-root` | `editor, focused, disabled, empty` |
| `Toolbar` | `div[role=toolbar]` | `items, groups, editor` |
| `ToolbarGroup` / `ToolbarSeparator` | `div` / `span` | |
| `ToolbarButton` | `button` | `command, active, disabled, label, shortcut, icon, onMouseDown` |
| `ToolbarToggle` | `button[aria-pressed]` | as above |
| `ToolbarDropdown` | `button` + `Menu` | `value, options, onSelect, open` |
| `ToolbarOverflow` | `button` + `Menu` | `hiddenItems` |
| `ColorPicker` | popover | `value, palette, recent, onSelect, onClear, allowCustom` |
| `ContentWrapper` / `Content` | `div` / `div[contenteditable]` | `editable, placeholder` |
| `Placeholder` | `div` | `text` |
| `Label` / `HelperText` / `ErrorText` / `Counter` / `Footer` | | `count, max, nearLimit, overLimit` |
| `LinkPopover` | popover | `href, text, target, onApply, onRemove, onOpen, validate` |
| `ImageDialog` / `ImagePopover` / `UploadPlaceholder` | | `progress, error, retry, cancel` |
| `TablePicker` / `TableToolbar` | | |
| `InlineSuggestMenu` | popover list | `items, query, activeIndex, onSelect` (shared by slash, mention, emoji, merge tag) |
| `MergeTagChip` | `span` | `tag, selected` |
| `SlashMenu` / `EmojiPicker` / `MentionList` | wrappers over `InlineSuggestMenu` | |
| `FloatingToolbar` / `BubbleMenu` | popover | `selectionRect, items` |
| `FindReplacePanel` | panel | `query, replacement, matches, index, actions` |
| `SourceView` | `textarea` | `html, onApply, error` |
| `FullscreenPortal` | portal | `open` |
| `RestoreDraftPrompt` | banner | `savedAt, restore, discard` |
| `ShortcutHelpDialog` | dialog | `shortcuts` |
| `Tooltip` / `Menu` / `MenuItem` / `Popover` / `Dialog` / `Button` / `IconButton` / `TextInput` / `Select` / `Checkbox` / `Spinner` | primitives | The whole design-system integration surface (~12 components) |

### Slot contract

```ts
type SlotComponent<P> = React.ComponentType<P & { className?: string; style?: CSSProperties; ref?: Ref<any> }>;
```

Slots receive fully computed props (classes, aria, handlers, state). A replacement that spreads them keeps all behaviour. `useRteSlots().defaults` exposes the default implementations so a replacement can wrap one:

```tsx
const MyToolbarButton: RteSlots['ToolbarButton'] = (props) => {
  const { ToolbarButton: Default } = useRteSlots().defaults;
  return <Tooltip title={`${props.label} ${props.shortcut ?? ''}`}><Default {...props} /></Tooltip>;
};
<RichTextEditor slots={{ ToolbarButton: MyToolbarButton }} />
```

### slotProps / classNames / styles

```tsx
<RichTextEditor
  slotProps={{ content: { 'data-testid': 'message-editor' },
               toolbarButton: ({ command }) => ({ 'data-cmd': command }) }}
  classNames={{ root: 'ring-1 ring-slate-200', content: 'prose prose-sm max-w-none',
                counter: ({ overLimit }) => overLimit ? 'text-red-600' : undefined }}
  styles={{ content: { minHeight: 287 } }}
/>
```

## 2. Toolbar composition

```tsx
// 1. Names only (the Skimmer layout)
toolbar={[['bold','italic','underline'], ['color'], ['alignLeft','alignCenter','alignRight','bulletList']]}

// 2. Custom items mixed with built-ins
toolbar={{ items: [['undo','redo'], ['bold','italic', myItem], ['mergeTag']], size: 'sm' }}

// 3. Responsive
toolbar={{ items: base, responsive: { base: [['bold','italic','link']], md: base } }}

// 4. Fully custom markup, default buttons still available
renderToolbar={({ editor, defaultRender, items }) => (
  <MyBar>
    {defaultRender({ items: items.filter(i => i.name !== 'fontSize') })}
    <MySendButton onClick={() => submit(editor.getHTML())} />
  </MyBar>
)}
```

Custom item:

```ts
const myItem = createToolbarItem({
  name: 'insertSignature',
  icon: <SignatureIcon />,
  label: (t) => t.custom.insertSignature,            // localization-aware
  shortcut: 'Mod+Shift+S',
  isActive: ({ editor }) => false,
  isDisabled: ({ editor }) => editor.isEmpty(),
  onClick: ({ editor }) => editor.insertContent(signatureHtml),
  group: 'insert',
  showIn: ['toolbar', 'slash', 'bubble'],
});
```

## 3. Command overrides

```tsx
<RichTextEditor
  commandOverrides={{
    // Force every inserted link to open in a new tab
    insertLink: (ctx, next) => next({ ...ctx.payload, target: '_blank', rel: 'noopener noreferrer' }),
    // Replace colour behaviour with a design-token picker
    setColor: ({ payload, editor }) => { editor.engine.exec('setColor', { color: tokens[payload.color] }); return true; },
  }}
/>
```

Command handlers are middleware: `(ctx, next) => boolean | void`, where `ctx = { editor, payload, source }`. Calling `next(payloadOverride?)` runs the previous handler (ultimately the built-in). Not calling it cancels. Plugins register with a priority, so ordering is explicit.

## 4. Handler middleware (interactions)

```ts
type Handler<Ctx> = (ctx: Ctx, next: (override?: Partial<Ctx>) => void | Promise<void>) => void | Promise<void>;
```

| Handler | Context | Default behaviour |
|---|---|---|
| `onBeforeChange` | `{ value, meta }` | Commit the change (cancel to veto, e.g. a hard content rule) |
| `onPaste` | `{ event, html, text, files, source, mode }` | The paste pipeline (03 §3) |
| `onDrop` | `{ event, files, html, text }` | Insert/upload |
| `onUploadStart` / `onUploadError` | `{ file }` / `{ file, error }` | Upload placeholder handling |
| `onKeyDown` | `{ event, keymapMatch }` | Run the bound command |
| `onLinkClick` | `{ event, href, attrs }` | Open the link popover |
| `onLinkOpen` | `{ href }` | `window.open(href, '_blank', 'noopener')` |
| `onToolbarCommand` | `{ command, payload, item }` | `editor.exec(...)` |
| `onFocus` / `onBlur` | `{ event }` | State update |
| `onSelectionChange` | `{ selection }` | Format state recompute |
| `onMaxLengthExceeded` | `{ attempted, max }` | Block or warn per `maxLengthBehaviour` |
| `onSanitizeViolation` | `{ tag, attribute, reason }` | Dev warning |
| `onFullscreenChange` / `onSourceViewToggle` | `{ open }` | Toggle |
| `onDraftRestore` / `onDraftSave` | `{ draft }` | Autosave |

Examples:

```tsx
handlers={{
  // Analytics, then default
  onToolbarCommand: (ctx, next) => { track('rte', ctx.command); next(); },
  // Company policy: plain-text paste only
  onPaste: (ctx, next) => next({ mode: 'text' }),
  // Confirm before opening external links
  onLinkOpen: async ({ href }, next) => { if (await confirm(href)) next(); },
}}
```

## 5. Plugin authoring

```tsx
const highlightPlugin = definePlugin({
  name: 'highlight',
  marks: [{ name: 'highlight', tag: 'mark', attrs: { color: { default: '#FFF3A3' } },
            parseHTML: [{ tag: 'mark' }, { style: 'background-color', priority: 10 }],
            toHTML: (attrs) => ['mark', { style: `background-color:${attrs.color}` }] }],
  commands: {
    toggleHighlight: ({ editor, payload }, next) => editor.engine.exec('toggleMark', { mark: 'highlight', ...payload }),
  },
  keymap: { 'Mod+Shift+H': 'toggleHighlight' },
  toolbar: [createToolbarItem({ name: 'highlight', icon: <HighlightIcon/>, label: (t) => t.custom.highlight,
                                onClick: ({ editor }) => editor.exec('toggleHighlight'),
                                isActive: ({ format }) => !!format.marks.highlight })],
  sanitize: { allowTags: ['mark'], allowAttributes: { mark: ['style'] } },
  localization: { 'custom.highlight': 'Highlight' },
  theme: { highlight: { background: '#FFF3A3' } },
  ui: HighlightColorPopover,
});

<RichTextEditor addPlugins={[highlightPlugin]} toolbar={[['bold','italic','highlight']]} />
```

Rules for plugin authors (documented in the guide): register everything through `ctx` so cleanup is automatic; never reach into the engine's internals except via `editor.engine.native` (and say so); always add sanitizer rules for new markup; always add localization keys; always add tokens rather than hard-coded colours.

## 6. Composable parts

```tsx
const editor = useEditor({ defaultValue, valueFormat: 'html', plugins: presets.email });

<Rte.Root editor={editor} theme={classicTheme}>
  <MyCard>
    <MyCardHeader>
      <Rte.Toolbar items={[['bold','italic','underline'],['color'],['alignLeft','alignCenter','alignRight','bulletList']]} />
    </MyCardHeader>
    <Rte.Content />
    <MyCardFooter>
      <Rte.Counter /> <Rte.ErrorText />
      <button onClick={() => send(editor.getHTML({ profile: 'email' }))}>Send</button>
    </MyCardFooter>
  </MyCard>
  <Rte.Portals />     {/* popovers, menus, dialogs */}
</Rte.Root>
```

## 7. Headless usage

```tsx
const editor = useEditor({ defaultValue: html, plugins: [plugins.bold, plugins.italic, plugins.link] });
const { marks } = useFormatState();
return (
  <>
    <MyIconButton pressed={marks.bold} onMouseDown={(e) => e.preventDefault()}
                  onClick={() => editor.exec('toggleBold')} />
    <Rte.Content className="my-surface" />
  </>
);
```

## 8. Localization

```ts
interface RteLocalization {
  editor: { label: string; placeholder: string; empty: string };
  toolbar: { label: string; more: string;
             bold: string; italic: string; underline: string; strike: string; code: string;
             subscript: string; superscript: string; color: string; backgroundColor: string;
             clearFormatting: string; fontFamily: string; fontSize: string;
             heading: string; headingLevel: string /* "Heading {level}" */; paragraph: string;
             alignLeft: string; alignCenter: string; alignRight: string; alignJustify: string; align: string;
             indent: string; outdent: string; bulletList: string; orderedList: string; checkList: string;
             blockquote: string; codeBlock: string; link: string; unlink: string; image: string;
             table: string; horizontalRule: string; emoji: string; mergeTag: string; mention: string;
             undo: string; redo: string; findReplace: string; sourceView: string; fullscreen: string;
             exitFullscreen: string; print: string; wordCount: string };
  color: { title: string; custom: string; apply: string; reset: string; automatic: string;
           recent: string; swatch: string /* "Color {color}" */ };
  link: { title: string; url: string; text: string; newTab: string; apply: string; remove: string;
          open: string; invalidUrl: string };
  image: { title: string; url: string; upload: string; alt: string; caption: string; replace: string;
           remove: string; uploading: string; uploadFailed: string; retry: string; cancel: string;
           tooLarge: string /* "Max {size}" */; wrongType: string };
  table: { insert: string; rows: string; columns: string; addRowBefore: string; addRowAfter: string;
           addColumnBefore: string; addColumnAfter: string; deleteRow: string; deleteColumn: string;
           deleteTable: string; headerRow: string };
  mergeTag: { title: string; search: string; noResults: string; unknown: string /* "Unknown tag {key}" */;
              preview: string };
  mention: { search: string; noResults: string; loading: string };
  slash: { title: string; search: string; noResults: string };
  find: { title: string; find: string; replace: string; replaceAll: string; matchCase: string;
          wholeWord: string; regex: string; results: string /* "{index} of {total}" */; noResults: string };
  counter: { characters: string /* "{count} characters" */; words: string;
             limit: string /* "{count} / {max}" */; overLimit: string };
  validation: { required: string; maxLength: string; invalidHtml: string };
  draft: { restoreTitle: string; restoreBody: string /* "saved {time}" */; restore: string; discard: string };
  shortcuts: { title: string; close: string };
  paste: { keepFormatting: string; removeFormatting: string };
  announce: { formatApplied: string; linkInserted: string; linkRemoved: string; imageInserted: string;
              listLevel: string; overLimit: string; draftRestored: string };
}
```

Interpolation uses `{name}`; any value may be a function for plural rules. `formatters` covers numbers, relative times (draft "saved 2 minutes ago") and file sizes. The i18next recipe wires `t('rte.*')` once in `<RteLocaleProvider>`.

## 9. Icons

`icons: Partial<RteIcons>` keyed by toolbar item name plus `chevronDown, close, check, search, spinner, dragHandle, external, more, alert`. Defaults are in-house 20px inline SVGs using `currentColor`. The classic preset maps the built-ins to Material-style glyphs so parity holds.

## 10. Design-system adapters

Overriding the ~12 primitive slots re-skins everything. The demo ships a Tailwind skin and a "MUI-like" skin to prove the surface is sufficient; a published `react-rtekit-mui` package is *(v1.x)*.
