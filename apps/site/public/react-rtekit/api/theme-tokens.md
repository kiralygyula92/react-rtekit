---
pluginId: react-rtekit
pathname: /react-rtekit/api/theme-tokens/
title: Theme tokens
description: All 114 design tokens and the CSS custom property each one writes.
archetype: E
section: reference
---

# Theme tokens

<!--
  Generated from the TypeScript declarations. Do not author anything here:
  structure comes from reference/{symbol}.schema.json and prose from
  reference/{symbol}.strings.json, and this region is replaced wholesale.
-->

<!-- generated:reference:start -->

## Used by

- [Theming](/react-rtekit/theming/)

## Import

```ts
import { meta } from 'react-rtekit/meta';
```

## Options

| Name | Type | Required | Description |
|---|---|---|---|
| `--rte-bold-weight` | `entry` | no | Default: 700 |
| `--rte-border-color` | `entry` | no | Default: var(--rte-color-border) |
| `--rte-border-width` | `entry` | no | Default: 1px |
| `--rte-button-active-bg` | `entry` | no | Default: transparent |
| `--rte-button-active-color` | `entry` | no | Default: var(--rte-color-text) |
| `--rte-button-color` | `entry` | no | Default: #A4A7AE |
| `--rte-button-disabled-color` | `entry` | no | Default: var(--rte-color-text-disabled) |
| `--rte-button-focus-ring` | `entry` | no | Default: 0 0 0 2px var(--rte-color-accent-border) |
| `--rte-button-hover-bg` | `entry` | no | Default: rgb(0 0 0 / 4%) |
| `--rte-button-padding` | `entry` | no | Default: 8px |
| `--rte-button-radius` | `entry` | no | Default: 4px |
| `--rte-button-size` | `entry` | no | Default: 40px |
| `--rte-cell-padding` | `entry` | no | Default: 6px 8px |
| `--rte-code-bg` | `entry` | no | Default: #F5F5F5 |
| `--rte-code-color` | `entry` | no | Default: #B91C1C |
| `--rte-code-font` | `entry` | no | Default: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace |
| `--rte-color-accent` | `entry` | no | Default: #1976D2 |
| `--rte-color-accent-border` | `entry` | no | Default: #1976D280 |
| `--rte-color-accent-contrast` | `entry` | no | Default: #FFFFFF |
| `--rte-color-accent-soft` | `entry` | no | Default: #1976D21A |
| `--rte-color-border` | `entry` | no | Default: #D5D7DA |
| `--rte-color-border-subtle` | `entry` | no | Default: #E9EAEB |
| `--rte-color-danger` | `entry` | no | Default: #D92D20 |
| `--rte-color-placeholder` | `entry` | no | Default: #667085 |
| `--rte-color-success` | `entry` | no | Default: #067647 |
| `--rte-color-surface` | `entry` | no | Default: #FFFFFF |
| `--rte-color-surface-muted` | `entry` | no | Default: #FAFAFA |
| `--rte-color-surface-raised` | `entry` | no | Default: #FFFFFF |
| `--rte-color-text` | `entry` | no | Default: #212121 |
| `--rte-color-text-disabled` | `entry` | no | Default: #A4A7AE |
| `--rte-color-text-muted` | `entry` | no | Default: #667085 |
| `--rte-color-warning` | `entry` | no | Default: #B54708 |
| `--rte-content-color` | `entry` | no | Default: var(--rte-color-text) |
| `--rte-content-font-family` | `entry` | no | Default: inherit |
| `--rte-content-font-size` | `entry` | no | Default: 14px |
| `--rte-content-line-height` | `entry` | no | Default: 1.5 |
| `--rte-content-padding` | `entry` | no | Default: 12px |
| `--rte-counter-color` | `entry` | no | Default: var(--rte-color-text-muted) |
| `--rte-counter-over-color` | `entry` | no | Default: var(--rte-color-danger) |
| `--rte-counter-warn-color` | `entry` | no | Default: var(--rte-color-warning) |
| `--rte-density-scale` | `entry` | no | Default: 1 |
| `--rte-disabled-bg` | `entry` | no | Default: #FAFAFA |
| `--rte-editor-bg` | `entry` | no | Default: var(--rte-color-surface) |
| `--rte-find-active-bg` | `entry` | no | Default: #FFC0CB |
| `--rte-find-bg` | `entry` | no | Default: #FFF3A3 |
| `--rte-focus-ring` | `entry` | no | Default: inset 0 0 0 2px var(--rte-color-accent) |
| `--rte-font-family` | `entry` | no | Default: inherit |
| `--rte-font-size` | `entry` | no | Default: 14px |
| `--rte-font-size-sm` | `entry` | no | Default: 12px |
| `--rte-footer-gap` | `entry` | no | Default: 8px |
| `--rte-footer-padding` | `entry` | no | Default: 4px 0 0 |
| `--rte-h1-size` | `entry` | no | Default: 2em |
| `--rte-h2-size` | `entry` | no | Default: 1.5em |
| `--rte-h3-size` | `entry` | no | Default: 1.17em |
| `--rte-h4-size` | `entry` | no | Default: 1em |
| `--rte-h5-size` | `entry` | no | Default: 0.83em |
| `--rte-h6-size` | `entry` | no | Default: 0.67em |
| `--rte-heading-weight` | `entry` | no | Default: 600 |
| `--rte-helper-color` | `entry` | no | Default: var(--rte-color-text-muted) |
| `--rte-hr-color` | `entry` | no | Default: var(--rte-color-border-subtle) |
| `--rte-icon-size` | `entry` | no | Default: 24px |
| `--rte-indent-step` | `entry` | no | Default: 2em |
| `--rte-invalid-border-color` | `entry` | no | Default: var(--rte-color-danger) |
| `--rte-line-height` | `entry` | no | Default: 1.5 |
| `--rte-link-color` | `entry` | no | Default: var(--rte-color-accent) |
| `--rte-link-decoration` | `entry` | no | Default: underline |
| `--rte-list-indent` | `entry` | no | Default: 1.5em |
| `--rte-list-item-padding` | `entry` | no | Default: 0.5em |
| `--rte-max-height` | `entry` | no | Default: none |
| `--rte-mention-bg` | `entry` | no | Default: #F3E8FF |
| `--rte-mention-color` | `entry` | no | Default: #6941C6 |
| `--rte-mention-padding` | `entry` | no | Default: 1px 4px |
| `--rte-mention-radius` | `entry` | no | Default: 4px |
| `--rte-menu-item-active-bg` | `entry` | no | Default: var(--rte-color-accent-soft) |
| `--rte-menu-item-height` | `entry` | no | Default: 32px |
| `--rte-menu-item-hover-bg` | `entry` | no | Default: rgb(0 0 0 / 4%) |
| `--rte-menu-item-padding` | `entry` | no | Default: 0 12px |
| `--rte-mergetag-bg` | `entry` | no | Default: #EAF6FF |
| `--rte-mergetag-border` | `entry` | no | Default: 1px solid #B2DDFF |
| `--rte-mergetag-color` | `entry` | no | Default: #175CD3 |
| `--rte-mergetag-padding` | `entry` | no | Default: 1px 4px |
| `--rte-mergetag-radius` | `entry` | no | Default: 4px |
| `--rte-mergetag-selected-bg` | `entry` | no | Default: #B2DDFF |
| `--rte-min-height` | `entry` | no | Default: 287px |
| `--rte-motion-duration` | `entry` | no | Default: 150ms |
| `--rte-motion-easing` | `entry` | no | Default: cubic-bezier(0.2, 0, 0, 1) |
| `--rte-paragraph-spacing` | `entry` | no | Default: 0.5em |
| `--rte-popover-bg` | `entry` | no | Default: var(--rte-color-surface-raised) |
| `--rte-popover-border` | `entry` | no | Default: 1px solid var(--rte-color-border) |
| `--rte-popover-padding` | `entry` | no | Default: 16px |
| `--rte-popover-radius` | `entry` | no | Default: 4px |
| `--rte-popover-shadow` | `entry` | no | Default: 0 4px 12px rgb(0 0 0 / 12%) |
| `--rte-quote-border` | `entry` | no | Default: 3px solid var(--rte-color-border) |
| `--rte-quote-padding` | `entry` | no | Default: 12px |
| `--rte-radius` | `entry` | no | Default: 4px |
| `--rte-selection-bg` | `entry` | no | Default: #B2DDFF |
| `--rte-swatch-border-color` | `entry` | no | Default: var(--rte-color-border) |
| `--rte-swatch-gap` | `entry` | no | Default: 4px |
| `--rte-swatch-radius` | `entry` | no | Default: 4px |
| `--rte-swatch-selected-ring` | `entry` | no | Default: 0 0 0 2px var(--rte-color-accent) |
| `--rte-swatch-size` | `entry` | no | Default: 24px |
| `--rte-table-border` | `entry` | no | Default: 1px solid var(--rte-color-border-subtle) |
| `--rte-table-header-bg` | `entry` | no | Default: #FAFAFA |
| `--rte-toolbar-bg` | `entry` | no | Default: transparent |
| `--rte-toolbar-border` | `entry` | no | Default: none |
| `--rte-toolbar-gap` | `entry` | no | Default: 0px |
| `--rte-toolbar-margin-bottom` | `entry` | no | Default: 8px |
| `--rte-toolbar-padding` | `entry` | no | Default: 0 |
| `--rte-toolbar-radius` | `entry` | no | Default: 4px |
| `--rte-toolbar-separator` | `entry` | no | Default: var(--rte-color-border-subtle) |
| `--rte-toolbar-separator-margin` | `entry` | no | Default: 4px |
| `--rte-z-floating` | `entry` | no | Default: 1450 |
| `--rte-z-fullscreen` | `entry` | no | Default: 1400 |
| `--rte-z-popover` | `entry` | no | Default: 1500 |

## Source

- [Theme tokens](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/src/meta.ts)

<!-- generated:reference:end -->
