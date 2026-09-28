---
pluginId: react-rtekit
pathname: /react-rtekit/getting-started/versions/
title: Versions
description: Which versions are supported, how they are numbered, and where the documentation for older ones lives.
archetype: F
section: getting-started
---

# Versions

## Supported versions

| Version | Status | Documentation |
|---|---|---|
| 1.0.x | Current | This site |

1.0.0 is the initial release, so there is no previous major to keep online yet. When there is, it stays at a stable URL and is reachable from the version selector in the header — nothing is deleted.

## Versioning policy

The package follows [Semantic Versioning](https://semver.org). Every user-facing change is recorded with a changeset and appears in the [changelog](/react-rtekit/discover-more/changelog/).

- **Patch** (`1.0.x`): bug fixes that do not change the API.
- **Minor** (`1.x.0`): new, backwards-compatible capabilities.
- **Major** (`x.0.0`): breaking changes, each with a guide under [Migration](/react-rtekit/migration/).

The public API is what the `exports` map exposes. Anything reachable only through a deep import is internal and can change in a patch.

## Installing a version

```bash
npm install react-rtekit@^1.0.0
```

## Checking the installed version

`npm ls react-rtekit` should report the version you expect, and one copy of it.

## Next steps

- [Changelog](/react-rtekit/discover-more/changelog/)
- [Migration](/react-rtekit/migration/)
