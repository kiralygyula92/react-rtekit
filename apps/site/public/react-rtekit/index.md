---
pluginId: react-rtekit
pathname: /react-rtekit/
title: Overview
description: 'An accessible, themeable React rich-text editor built on Lexical: 46 replaceable slots, handler middleware, theme tokens, sanitization at every boundary and HTML interop that reads Quill markup.'
archetype: A
section: getting-started
---

# React RTE Kit — Overview

## Introduction

React RTE Kit is a React component and a set of building blocks for editing rich text. It renders with [Lexical](https://lexical.dev), Meta's editor engine, and wraps it in a complete field: a real ARIA toolbar, a sanitizer on every content boundary, HTML interop that reads legacy Quill markup, and 114 design tokens instead of a UI-kit dependency.

Everything is controlled through props, CSS variables, slots and handler middleware, so the editor fits into your design system and your state management rather than the other way round. When the all-in-one component is the wrong shape, the same editor is available as eleven composable parts and as a headless hook.

The package edits text. It does not manage documents, collaborate in real time, or store anything — the value goes in as a string and comes out as one.

## Why React RTE Kit

- **Sanitized at every boundary:** the initial value, every paste, every drop, every programmatic insert and the output all pass an allowlist sanitizer with four profiles and hard rules no configuration can switch off.
- **Your stored HTML keeps working:** interop profiles read legacy Quill markup and emit standards-compliant, Quill-compatible or e-mail-safe HTML, so existing content needs no migration in either direction.
- **An engine adapter, not a wrapper:** an `EditorEngine` interface owns the document layer. Nothing outside `src/engines/` imports Lexical, and none of it reaches the public API.
- **Emptiness is a first-class concept:** `isEmpty()` ignores `<p><br></p>` and limits count text rather than markup, so `required` actually means required.
- **Accessible by construction:** a real ARIA toolbar with roving focus, a named textbox, errors linked with `aria-describedby`, live announcements, and every shipped theme meeting WCAG AA with a test enforcing it.
- **Replaceable at ten levels:** theme tokens, class names, slot props, toolbar config, custom items, slots, handler middleware, command overrides, composable parts and a headless hook. Use the lowest level that does the job.

## Start now

- [Installation](/react-rtekit/getting-started/installation/) — the package, its peers and the stylesheet.
- [Usage](/react-rtekit/getting-started/usage/) — a working editor in fifteen lines.
- [All features](/react-rtekit/all-features/) — every capability, grouped.
- [Playground](/react-rtekit/demos/playground/) — every prop, live.
- [API reference](/react-rtekit/api/) — generated from the TypeScript declarations.
- [Customization](/react-rtekit/customization/) — the ten levels, and how to pick one.

Nothing in this documentation is behind a plan. The package is MIT licensed and every capability is available to everyone.
