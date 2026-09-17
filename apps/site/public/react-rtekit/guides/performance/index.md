---
pluginId: react-rtekit
pathname: /react-rtekit/guides/performance/
title: Performance
description: What costs what, what is measured on every build, and which props are worth memoising.
archetype: I
section: guides
---

# Performance

## What is measured

Every build checks bundle budgets and a separate Playwright config measures interaction timings on a quiet machine. Both fail the build rather than warn.

| Entry point | Budget |
|---|---|
| `useEditor` — headless | 37 kB |
| `RichTextEditor` — everything | 67 kB |
| `react-rtekit/core` — no React | 19 kB |
| `sanitizeHtml` alone | 7 kB |
| `styles.css` | 9 kB |

All min+gzip, with the Lexical peers excluded because the consumer already has them.

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
