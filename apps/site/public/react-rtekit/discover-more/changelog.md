---
pluginId: react-rtekit
pathname: /react-rtekit/discover-more/changelog/
title: Changelog
description: Every released version of React RTE Kit and what changed in it, from the changesets recorded with each change.
archetype: I
section: discover-more
---

# Changelog

Every user-facing change is recorded with a changeset and released under [Semantic Versioning](/react-rtekit/getting-started/versions/).

The full changelog is kept in the repository as [CHANGELOG.md](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/CHANGELOG.md).

## 1.0.2 (2026-10-21)

### Patch Changes

- Toolbar dropdowns (block type, heading, alignment, font and font size) include the option they show in their accessible name, so "Block type Paragraph" rather than "Block type" alone. Speech-input users can now reach them by the text they see (WCAG 2.5.3, label in name).
- Built with updated development dependencies, including tsup 9 and Vitest 4 (for a security advisory that affected development only). The published entry points and their exports are unchanged.

## 1.0.1 (2026-10-19)

### Patch Changes

- Publish from GitHub Actions with provenance. The README no longer mentions the react-hook-form adapter, which was never published. The library's code and API are unchanged.

## 1.0.0

The initial release. Everything listed under [All features](/react-rtekit/all-features/) ships in it.
