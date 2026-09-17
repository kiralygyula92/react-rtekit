# 02: Architecture

## 1. Repository layout (pnpm monorepo)

```
react-rtekit/
├─ package.json                   # private root; scripts; devDeps; "packageManager": "pnpm@9"
├─ pnpm-workspace.yaml            # packages/*, apps/*
├─ tsconfig.base.json             # strict, moduleResolution "bundler", jsx "react-jsx"
├─ eslint.config.js               # typescript-eslint strict, react-hooks, jsx-a11y
├─ .changeset/ · .github/workflows/{ci,release}.yml
├─ docs/                          # ← THIS documentation set
├─ packages/
│  ├─ react-rtekit/               # the main package
│  │  ├─ src/
│  │  │  ├─ core/                 # engine-agnostic, no React
│  │  │  │  ├─ engine.ts          # EditorEngine interface (§2)
│  │  │  │  ├─ commands.ts        # command registry + built-in command ids
│  │  │  │  ├─ schema.ts          # node/mark catalogue, allowed nesting, attributes
│  │  │  │  ├─ selection.ts       # normalized selection + format snapshot
│  │  │  │  ├─ history.ts         # undo/redo contract
│  │  │  │  ├─ serialize/         # html.ts, markdown.ts, text.ts, json.ts
│  │  │  │  ├─ sanitize/          # sanitizer + profiles (03 §4)
│  │  │  │  ├─ interop/           # quill.ts, word.ts, gdocs.ts, email.ts (03 §5)
│  │  │  │  ├─ plugins/           # plugin types + built-in plugin definitions
│  │  │  │  └─ utils/             # debounce, ids, keymap parsing, dom helpers
│  │  │  ├─ engines/
│  │  │  │  └─ lexical/           # default EditorEngine implementation
│  │  │  ├─ react/
│  │  │  │  ├─ RichTextEditor.tsx # all-in-one component
│  │  │  │  ├─ useEditor.ts       # headless hook
│  │  │  │  ├─ context.ts         # EditorContext, SlotsContext, ThemeContext, LocaleContext
│  │  │  │  ├─ slots/             # default slot components (one file each)
│  │  │  │  ├─ toolbar/           # toolbar registry, items, groups, overflow
│  │  │  │  ├─ ui/                # unstyled primitives: Button, Menu, Popover, Dialog, Tooltip, ColorPicker
│  │  │  │  ├─ plugins/           # React parts of built-in plugins (popovers, menus)
│  │  │  │  └─ hooks/             # useEditorState, useCommand, useFormatState, useUpload…
│  │  │  ├─ styles/               # base.css, theme.css, content.css, presets/*.css
│  │  │  ├─ locales/              # en.ts (default) + hu, de, es
│  │  │  ├─ icons/                # inline SVG icons (no icon dependency)
│  │  │  ├─ meta.ts               # runtime metadata for the docs site (slots, commands, tokens)
│  │  │  └─ index.ts
│  │  └─ test/
│  └─ react-rtekit-rhf/           # react-hook-form adapter (tiny, separate package)
└─ apps/site/                     # Vite + React Router: demo, playground, API docs
```

## 2. The engine adapter

### 2.1 Why

A rich-text editor's hard parts are contenteditable quirks, selection, IME, undo/redo and paste. Those are solved by mature engines. The library therefore owns the **product layer** (toolbar, plugins, slots, theming, interop, validation, a11y) and delegates the **document layer** to a pluggable engine.

### 2.2 Interface

```ts
export interface EditorEngine {
  readonly id: string;                                   // 'lexical' | 'quill' | custom
  mount(container: HTMLElement, options: EngineMountOptions): EngineHandle;
}

export interface EngineHandle {
  destroy(): void;
  // content
  getHTML(options?: SerializeOptions): string;
  getJSON(): EditorDocument;                             // portable document model (§2.4)
  getMarkdown(options?: SerializeOptions): string;
  getText(options?: { blockSeparator?: string }): string;
  setContent(value: EditorValue, options?: { source?: ChangeSource; keepSelection?: boolean; history?: boolean }): void;
  insertContent(value: EditorValue, options?: { at?: Position; source?: ChangeSource }): void;
  isEmpty(): boolean;
  getLength(unit?: 'characters' | 'words'): number;
  // selection
  getSelection(): EditorSelection | null;
  setSelection(selection: EditorSelection | 'start' | 'end' | 'all'): void;
  saveSelection(): SelectionSnapshot; restoreSelection(snap: SelectionSnapshot): void;
  getFormatState(): FormatState;                         // marks + block type + alignment + list + link…
  // commands
  exec(command: CommandId, payload?: unknown): boolean;   // returns whether it ran
  canExec(command: CommandId, payload?: unknown): boolean;
  registerCommand(id: CommandId, handler: CommandHandler, priority?: number): Unregister;
  // nodes / schema
  registerNode(node: NodeSpec): Unregister;
  registerMark(mark: MarkSpec): Unregister;
  // history, focus, state
  undo(): void; redo(): void; canUndo(): boolean; canRedo(): boolean; clearHistory(): void;
  focus(position?: 'start' | 'end' | 'restore'): void; blur(): void; hasFocus(): boolean;
  setEditable(editable: boolean): void;
  // events
  on<K extends keyof EngineEvents>(event: K, cb: EngineEvents[K]): Unregister;
  // escape hatch
  readonly native: unknown;                               // the underlying engine instance
}

export interface EngineEvents {
  change: (payload: { source: ChangeSource }) => void;
  selectionChange: (selection: EditorSelection | null) => void;
  focus: () => void; blur: () => void;
  paste: (event: ClipboardEvent) => void;
  drop: (event: DragEvent) => void;
  keydown: (event: KeyboardEvent) => void;
  error: (error: unknown) => void;
}
```

### 2.3 ADR-002: default engine = Lexical

- **Chosen:** Lexical (`lexical`, `@lexical/react`, plus the feature packages actually used: `@lexical/rich-text`, `@lexical/list`, `@lexical/link`, `@lexical/html`, `@lexical/selection`, `@lexical/utils`, `@lexical/markdown`, `@lexical/table`) as **peer dependencies** so consumers control the version and the bundle isn't duplicated.
- **Why:** React-first, node/plugin architecture that maps directly onto our plugin API, good accessibility and IME handling, first-class HTML/Markdown serialization, active maintenance, and a collaboration story for v1.x.
- **Rejected:** Quill (weak extension model, class-based, global CSS, harder React integration), ProseMirror/TipTap (excellent but a heavier conceptual surface and TipTap's own licence/ecosystem overlap), a hand-written contenteditable engine (a multi-year problem).
- **Consequence:** a Quill adapter remains possible for drop-in legacy parity *(v1.x)*; content parity is instead guaranteed by the interop profiles in 03 §5, which is the part that actually matters.
- The engine choice is *not* leaked into the public API: nothing in 04 mentions Lexical types except the `native` escape hatch and the optional `engine` prop.

### 2.4 Portable document model (`EditorDocument`)

A JSON shape the library owns, independent of the engine, used for `getJSON`, for tests, and for storage when consumers prefer JSON over HTML:

```ts
type EditorDocument = { type: 'doc'; version: 1; content: BlockNode[] };
type BlockNode =
  | { type: 'paragraph'; align?: Align; indent?: number; content: InlineNode[] }
  | { type: 'heading'; level: 1|2|3|4|5|6; align?: Align; content: InlineNode[] }
  | { type: 'list'; listType: 'bullet'|'ordered'|'check'; start?: number; items: ListItemNode[] }
  | { type: 'blockquote'; content: BlockNode[] }
  | { type: 'codeBlock'; language?: string; text: string }
  | { type: 'horizontalRule' }
  | { type: 'image'; src: string; alt?: string; title?: string; width?: number; height?: number; align?: Align }
  | { type: 'table'; rows: TableRowNode[] }
  | { type: 'html'; html: string };                        // preserved raw block (opt-in)
type InlineNode =
  | { type: 'text'; text: string; marks?: Mark[] }
  | { type: 'link'; href: string; target?: string; rel?: string; content: InlineNode[] }
  | { type: 'mergeTag'; key: string; label?: string }
  | { type: 'mention'; id: string; label: string }
  | { type: 'emoji'; char: string }
  | { type: 'lineBreak' };
type Mark =
  | { type: 'bold' | 'italic' | 'underline' | 'strike' | 'code' | 'subscript' | 'superscript' }
  | { type: 'color'; value: string } | { type: 'backgroundColor'; value: string }
  | { type: 'fontFamily'; value: string } | { type: 'fontSize'; value: string };
```

Any node the schema doesn't know is dropped or preserved as `html`, depending on the sanitization profile.

## 3. Layering

```
┌───────────────────────────────────────────────────────────────────────┐
│ <RichTextEditor>  (all-in-one: field chrome + toolbar + content)       │
│   slots → default components (Toolbar, Button, Popovers, Counter…)    │
├───────────────────────────────────────────────────────────────────────┤
│ Composable parts: <Rte.Root> <Rte.Toolbar> <Rte.Content> <Rte.Footer> │
│ Hooks: useEditor, useEditorState, useCommand, useFormatState          │
├───────────────────────────────────────────────────────────────────────┤
│ Plugin system: toolbar items, commands, nodes, keymaps, hooks, UI      │
├───────────────────────────────────────────────────────────────────────┤
│ core: schema · commands · selection · serialize · sanitize · interop   │
├───────────────────────────────────────────────────────────────────────┤
│ EditorEngine adapter (default: Lexical)                               │
└───────────────────────────────────────────────────────────────────────┘
```

Entry points for consumers: (1) `<RichTextEditor>` with props; (2) the same plus `slots`/`handlers`/`theme`; (3) composable parts in a custom layout; (4) `useEditor` with fully custom UI.

## 4. Plugin system

```ts
export interface RtePlugin {
  name: string;                                        // unique id
  dependsOn?: string[];                                // plugin names
  setup?(ctx: PluginContext): void | (() => void);     // register commands/nodes/listeners; returns cleanup
  commands?: Record<CommandId, CommandHandler>;
  nodes?: NodeSpec[]; marks?: MarkSpec[];
  keymap?: Record<string, CommandId | ((ctx: PluginContext, e: KeyboardEvent) => boolean)>;
  toolbar?: ToolbarItemSpec[];                          // contributed items (06 §3)
  slashItems?: SlashItemSpec[];
  serialize?: { toHTML?: HtmlSerializerRule[]; fromHTML?: HtmlParserRule[];
                toMarkdown?: MarkdownRule[]; fromMarkdown?: MarkdownRule[] };
  sanitize?: { allowTags?: string[]; allowAttributes?: Record<string, string[]> };
  ui?: React.ComponentType;                             // rendered inside the editor root (popovers, menus)
  localization?: Record<string, string>;                // additional keys
  theme?: DeepPartial<RteTheme>;                        // additional tokens
}

export interface PluginContext {
  editor: EditorInstance; engine: EngineHandle;
  on: EngineHandle['on']; exec: EngineHandle['exec'];
  registerCommand(id: CommandId, handler: CommandHandler, priority?: number): Unregister;
  getOptions<T>(): T;                                   // this plugin's options
  localization: RteLocalization; theme: ResolvedRteTheme;
}
```

Built-in features are themselves plugins (`bold`, `italic`, `underline`, `strike`, `code`, `color`, `backgroundColor`, `fontFamily`, `fontSize`, `heading`, `paragraph`, `align`, `indent`, `list`, `checkList`, `blockquote`, `codeBlock`, `link`, `autoLink`, `image`, `table`, `horizontalRule`, `emoji`, `mention`, `mergeTag`, `history`, `markdownShortcuts`, `paste`, `placeholder`, `counter`, `findReplace`, `sourceView`, `fullscreen`, `floatingToolbar`, `slashMenu`, `autosave`, `dropCursor`, `trailingParagraph`). `presets` bundle them (05 §1.1), so `preset="email"` or `preset="minimal"` is one prop.

Plugin ordering: dependencies first, then registration order. Command handlers registered later with a higher priority win and may call the previous handler (`ctx.next()`), which is how 06 §5 handler middleware is implemented for commands.

## 5. State and value model

- **Value formats:** `valueFormat: 'html' | 'json' | 'markdown' | 'text'` (default `'html'`). `value`/`defaultValue`/`onChange` all speak that format. `onChange(value, meta)` where `meta = { source, isEmpty, length, wordCount, document }`.
- **Controlled vs uncontrolled:** `value` + `onChange` is controlled; `defaultValue` is uncontrolled. In controlled mode, incoming values are diffed against the current serialization and applied only when they differ, preserving selection (`setContent(..., { keepSelection: true })`), which avoids the cursor-jump problem typical of naive controlled editors.
- **Debounced change events:** `changeDebounceMs` (default 0 for `onChange`, 300 for `onChangeDebounced`), so forms can validate on a calmer signal without losing keystroke fidelity.
- **Derived state is subscription-based:** `useEditorState(selector, isEqual?)` and `useFormatState()` re-render only the subscribing component. Toolbar buttons subscribe individually, so typing never re-renders the whole editor tree (fixes R26).
- **Read-only vs disabled:** `readOnly` keeps selection and copy; `disabled` also removes focusability and dims the UI, and is what forms should use.

## 6. Rendered DOM structure

```html
<div class="rte-root" data-focused data-disabled="false" data-empty="false" style="--rte-…">
  <div class="rte-toolbar" role="toolbar" aria-label="Formatting" aria-controls="rte-content-x">
    <div class="rte-toolbar__group">
      <button class="rte-toolbar__button" type="button" aria-pressed="true" aria-label="Bold" data-active>…</button>
    </div>
    <span class="rte-toolbar__separator" role="separator" aria-orientation="vertical"></span>
    <div class="rte-toolbar__overflow">…</div>
  </div>
  <div class="rte-content-wrapper">
    <div id="rte-content-x" class="rte-content" contenteditable="true" role="textbox"
         aria-multiline="true" aria-label="Message" aria-describedby="rte-help-x rte-error-x"
         spellcheck="true" data-placeholder="Write your message…">…</div>
    <div class="rte-placeholder" aria-hidden="true">Write your message…</div>
  </div>
  <div class="rte-footer">
    <div class="rte-help" id="rte-help-x">…</div>
    <div class="rte-counter" aria-live="polite">231 / 2048</div>
  </div>
  <div class="rte-error" id="rte-error-x" role="alert">Message is required</div>
  <!-- portals: link popover, colour picker, slash menu, floating toolbar, dialogs -->
</div>
```

Content styling is scoped to `.rte-content` (and reused by `<RteContentView>` for read-only rendering), so what the author sees matches what is rendered elsewhere.

## 7. Performance rules

1. Toolbar items subscribe to format state individually and are memoized.
2. Format state is computed once per selection/content change and shared.
3. Serialization is lazy: `onChange` hands over a getter-backed object, so `getHTML()` runs only if the consumer reads it (`onChange(value)` materializes the configured `valueFormat` only).
4. Large documents: virtualized decorations are avoided; expensive plugins (find & replace, counters) debounce.
5. Images are never base64-inlined by default (uploads go through `onUpload`), keeping document size sane.
6. Bundle: every plugin is a separate module; presets are the only thing that pulls many in. `react-rtekit/plugins/<name>` subpaths allow cherry-picking.
7. Benchmarks: typing latency < 16ms per keystroke in a 50 KB document; initial mount < 50ms; paste of a 200 KB Word document processed < 400ms.

## 8. SSR and hydration

- Nothing touches `window`/`document` at module scope. The contenteditable surface renders as static HTML on the server (via the same serializer used for `<RteContentView>`), and the engine mounts on the client in an effect.
- `suppressHydrationWarning` on the content element, since the engine normalizes markup on mount.
- A dedicated export `react-rtekit/view` renders sanitized HTML read-only with the content styles and **no** engine, which is what e-mail previews and list views should use.

## 9. Public entry points

```jsonc
{
  "name": "react-rtekit",
  "type": "module",
  "sideEffects": ["**/*.css"],
  "exports": {
    ".":                 { "types": "./dist/index.d.ts", "import": "./dist/index.js", "require": "./dist/index.cjs" },
    "./core":            { "...": "headless core: schema, sanitize, serialize, interop (no React, no engine)" },
    "./view":            { "...": "<RteContentView> read-only renderer" },
    "./plugins/*":       { "...": "individual plugins" },
    "./engines/lexical": { "...": "default engine adapter" },
    "./styles.css":      "./dist/styles.css",      // base + theme + content (light tokens)
    "./base.css":        "./dist/base.css",        // structural only (unstyled mode)
    "./content.css":     "./dist/content.css",     // prose styles only (for rendering stored HTML)
    "./presets/classic.css": "./dist/presets/classic.css",
    "./presets/dark.css":    "./dist/presets/dark.css",
    "./locales/*":       { "...": "en, hu, de, es" },
    "./meta":            { "...": "docs-site metadata (slots, commands, tokens)" }
  },
  "peerDependencies": {
    "react": ">=18.2", "react-dom": ">=18.2",
    "lexical": ">=0.21", "@lexical/react": ">=0.21"
  },
  "peerDependenciesMeta": { "lexical": { "optional": false } }
}
```

`react-rtekit-rhf` is a separate package depending on `react-rtekit` and `react-hook-form` (peer).

**Runtime dependencies of the library:** none beyond the peers. The sanitizer is written in-house against the browser's `DOMParser` (with an `isomorphic-dompurify` adapter available via `sanitizer: 'dompurify'` if the consumer installs it) — see 03 §4.4.
