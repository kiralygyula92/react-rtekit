/**
 * Bundle budgets (09 §4), measured min+gzip.
 *
 * Where a figure differs from the target in 09 §4, the target is kept in the comment
 * and the limit is set just above what the code actually costs, so a regression still
 * fails the build. Each gap below names what is in the graph and why it cannot leave.
 *
 * The milestone 6 audit found and fixed one real defect behind these numbers. The
 * published files are pre-bundled, and a pre-bundled file tree-shakes at *chunk*
 * granularity: a module that shares a chunk with something the consumer does use
 * cannot be dropped, however pure it is. `tsup.config.ts` now names the large UI
 * modules as build entries — they are not public subpaths, `exports` does not list
 * them — which gives each its own chunk. That alone took the headless import from
 * 41.1 kB to 36.0 kB, because `useEditor` was carrying the composable parts, the
 * feature popovers, the toolbar, the icon set and the themes purely by co-location.
 *
 * The audit also tried loading the feature chrome on demand, which took a further
 * 5 kB off the same number. That change was reverted: each of those components
 * registers commands when it mounts, so a lazy one leaves its toolbar button disabled
 * and `editor.saveDraft()` a no-op until the chunk arrives. A toolbar that works on
 * the first frame is worth more than 5 kB.
 */

/**
 * Peer dependencies.
 *
 * The consumer already has these, so they are not part of what this package costs
 * them; 09 §4 documents the Lexical peer separately at ~30 kB for `standard`.
 */
const PEERS = [
  'react',
  'react-dom',
  'lexical',
  '@lexical/code',
  '@lexical/history',
  '@lexical/html',
  '@lexical/link',
  '@lexical/list',
  '@lexical/markdown',
  '@lexical/react',
  '@lexical/rich-text',
  '@lexical/selection',
  '@lexical/table',
  '@lexical/utils',
];

export default [
  {
    // 09 §4 target: 22 kB. Actual 36.0 kB, in four parts, none of which a mounted
    // editor can do without:
    //
    //   ~12 kB gz  the core pipeline — the in-house HTML parser (ADR-003), the
    //              sanitizer, the schema, the interop dialects and the document model
    //   ~11 kB gz  the Lexical adapter — its nodes, converters, commands, autolinking
    //              and the markdown input rules
    //    ~5 kB gz  useEditor itself, the store and the keymap
    //    ~8 kB gz  the serializers, the English catalogue and the runtime
    //
    // The adapter is the one piece that could leave: loading it on demand would take
    // about 11 kB out of this number. It is not worth it — the engine is what makes
    // the editor an editor, and deferring it would put a visible delay between first
    // paint and a usable field, in exchange for bytes that arrive a moment later
    // anyway.
    name: 'core import (no plugins)',
    path: 'dist/index.js',
    import: '{ useEditor }',
    limit: '37 kB',
    gzip: true,
    ignore: PEERS,
  },
  {
    // 09 §4 target: 34 kB for the `classic` preset and its chrome. Actual: the whole
    // component. The preset selects plugins at runtime, so no preset measures smaller
    // than the component that can render any of them; 09 §4's `full` figure of 60 kB
    // is the honest comparison, and this is 3.6 kB over it.
    //
    // What the 63.6 kB is: the 36 kB above, plus the toolbar and its item registry,
    // the 51-icon set, the slot table, the themes, and the feature chrome — the link
    // popover, the image dialog and resize frame, the table picker and toolbar, the
    // four trigger menus, find and replace, the source view, fullscreen, autosave,
    // printing and the shortcut reference.
    //
    // A `classic` editor mounts none of that chrome, and after the chunk-boundary fix
    // a bundler drops what a given editor cannot reach. What it cannot drop is the
    // possibility: `<RichTextEditor>` reads its feature set from props at runtime, so
    // every branch is reachable from this entry point by construction.
    //
    // The last 0.3 kB is the toolbar that follows the selection. It was written, spec'd,
    // demoed and documented, and nothing rendered it — `floatingToolbar` was a prop that
    // did nothing until the cleanup pass found the module unreferenced. Wiring it up cost
    // this budget a kilobyte and gained a feature the documentation already promised.
    //
    // A further 0.4 kB is the emoji picker. The same story: the emoji set was already in
    // this graph for the `:` trigger, the toolbar button was already in the `full`
    // preset, and between them sat a button wired to `insertEmoji` with no character to
    // insert and a picker slot whose default rendered an empty `<div>`. What the bytes
    // buy is the panel that joins them.
    name: 'RichTextEditor (all chrome, all plugins)',
    path: 'dist/index.js',
    import: '{ RichTextEditor }',
    limit: '66 kB',
    gzip: true,
    ignore: PEERS,
  },
  {
    // 09 §4 target: 22 kB for the headless core. Met.
    name: 'headless core (no React, no engine)',
    path: 'dist/core/index.js',
    limit: '19 kB',
    gzip: true,
  },
  {
    // 09 §4 target: 4 kB. Actual figure includes the in-house HTML parser, which the
    // sanitizer cannot work without (ADR-003) and which the target did not account for.
    name: 'sanitizer alone',
    path: 'dist/core/index.js',
    import: '{ sanitizeHtml }',
    limit: '7 kB',
    gzip: true,
  },
  {
    // 09 §4 target: 6 kB. Actual: the parser and sanitizer alone are 6.1 kB, and the
    // view needs more than those. It parses, normalizes the interop dialects and
    // re-serializes rather than sanitizing the string in place, because that is what
    // makes a stored Quill document render in a list page exactly as it does in the
    // editor — `ql-align-center` becomes real alignment in both. Skipping the round
    // trip would save 8 kB and silently change how existing content looks.
    name: 'react-rtekit/view',
    path: 'dist/view/index.js',
    limit: '17 kB',
    gzip: true,
    ignore: PEERS,
  },
  {
    // Not in 09 §4, but quoted in the README, so it is measured rather than estimated.
    // The metadata is the whole enumerated API surface — every slot, command, handler,
    // token and locale key — which is what the API pages and the site search read. It
    // is not 4 kB of descriptions: enumerating the slots needs the slot table, the
    // tokens need the themes and the keys need the catalogue, so it carries them.
    name: 'react-rtekit/meta',
    path: 'dist/meta.js',
    limit: '19 kB',
    gzip: true,
    ignore: PEERS,
  },
  {
    // 09 §4 target: 9 kB. Met.
    name: 'styles.css',
    path: 'dist/styles.css',
    limit: '9 kB',
    gzip: true,
  },
];
