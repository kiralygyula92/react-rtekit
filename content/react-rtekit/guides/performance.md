---
pluginId: react-rtekit
pathname: /react-rtekit/guides/performance/
title: Performance tuning
description: What costs what, what is measured on every build, and which props are worth memoising.
archetype: I
section: guides
---

# Performance tuning

## What is measured

Every build checks bundle budgets and a separate Playwright config measures interaction timings on a quiet machine. Both fail the build rather than warn.

| Entry point | Budget |
|---|---|
| `useEditor` — headless | 43 kB |
| `RichTextEditor` — everything | 72 kB |
| `react-rtekit/core` — no React | 19 kB |
| `sanitizeHtml` alone | 7 kB |
| `styles.css` | 9 kB |

All min+gzip. There are no peers to exclude: React and React DOM are the only ones, and the consumer already has them.

These numbers include the editing engine, which is this package's own code. That is worth saying because it makes them look worse than they are: an editor that leaves the engine to a peer dependency reports a smaller figure and costs the reader more. Bringing the engine in-house added about 4 kB here and removed 103 kB gzipped from what a consumer downloads.

## Why the component is larger than the hook

`<RichTextEditor>` reads its feature set from props at runtime, so every branch — the link popover, the image dialog, the table controls, find and replace — is reachable from that entry point by construction. A bundler cannot drop what it cannot prove unreachable. Import `useEditor` instead and the chrome goes.

## Large documents

```demo
large-document
```

## What to memoise

`theme`, `slots`, `handlers`, `toolbar` and `localization`, all compared by identity. An object literal in JSX is a new object on every render and will re-resolve the thing it configures.

## What causes a remount

`preset` and `localization` are resolved at mount. Changing either rebuilds the editor and empties the undo stack, which is almost never what you wanted.
