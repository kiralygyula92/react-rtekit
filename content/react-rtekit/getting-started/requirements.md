---
pluginId: react-rtekit
pathname: /react-rtekit/getting-started/requirements/
title: Requirements
description: The React, TypeScript and browser versions this package supports, and what it expects of your bundler.
archetype: F
section: getting-started
---

# Requirements

## Prerequisites

None beyond a React application.

## Installation

See [Installation](/react-rtekit/getting-started/installation/).

## Supported versions

| | Supported |
|---|---|
| React | 18.2 and later, including 19 |
| TypeScript | 5.0 and later |
| Node (for the build) | 18 and later |
| Lexical | 0.21 and later, as a peer dependency |

## Browsers

The editing behaviour is tested on every release against Chromium, Firefox and WebKit, plus mobile Chrome and mobile Safari emulation. Those five are the supported set.

The package targets modern evergreen browsers and uses `:has()`, `color-mix()` and cascade layers. It does not support Internet Explorer and does not ship a polyfill bundle.

## Module formats

ESM and CommonJS, with TypeScript declarations for both. `publint` and `are-the-types-wrong` run on every build, so the `exports` map is checked rather than assumed.

## Minimal working example

See [Usage](/react-rtekit/getting-started/usage/).

## Verify

If your bundler resolves `react-rtekit/styles.css`, the `exports` map is being read correctly.

## Next steps

- [Server rendering](/react-rtekit/server-rendering/) — what runs where.
- [Performance](/react-rtekit/guides/performance/) — what it costs.
- [Versions](/react-rtekit/getting-started/versions/) — the support policy.
