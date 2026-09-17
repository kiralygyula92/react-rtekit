---
pluginId: react-rtekit
pathname: /react-rtekit/api/sanitize/
title: Sanitizer
description: The sanitizer, its four profiles, and the URL checker every href and src passes through.
archetype: E
section: reference
---

# Sanitizer

<!--
  Generated from the TypeScript declarations. Do not author anything here:
  structure comes from reference/{symbol}.schema.json and prose from
  reference/{symbol}.strings.json, and this region is replaced wholesale.
-->

<!-- generated:reference:start -->

## Used by

- [Links](/react-rtekit/links/)
- [Sanitization](/react-rtekit/sanitization/)
- [E-mail output](/react-rtekit/email-output/)
- [Source view](/react-rtekit/source-view/)

## Import

```ts
import { checkUrl } from 'react-rtekit/core';
import { getProfile } from 'react-rtekit/core';
import { mergeSanitizeConfig } from 'react-rtekit/core';
import { normalizeUrl } from 'react-rtekit';
import { resolveSanitizeConfig } from 'react-rtekit/core';
import { sanitizeHtml } from 'react-rtekit';
```

## Options

### checkUrl

Applies the URL policy to one attribute value.

This symbol takes no options.

### getProfile

Returns a profile by name. The returned object is a fresh copy.

This symbol takes no options.

### mergeSanitizeConfig

Merges a partial config onto a resolved one.

This symbol takes no options.

### normalizeUrl

Adds a default scheme to a bare host, as the link popover does.

Leaves anything that already has a scheme, an anchor or a mail-like shape alone.

This symbol takes no options.

### resolveSanitizeConfig

Turns the `sanitize` prop into a resolved configuration.

A config object is merged onto `standard`; `false` is handled by the caller, which
also emits the development warning.

This symbol takes no options.

### sanitizeHtml

Sanitizes an HTML string against a profile or configuration.

Runs at every content boundary in both directions. The hard rules — the blocked tags,
protocols and CSS properties — apply regardless of configuration.

This symbol takes no options.

## Source

- [checkUrl](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/core/sanitize/url.ts#L80)
- [getProfile](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/core/sanitize/profiles.ts#L249)
- [mergeSanitizeConfig](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/core/sanitize/profiles.ts#L284)
- [normalizeUrl](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/core/sanitize/url.ts#L134)
- [resolveSanitizeConfig](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/core/sanitize/profiles.ts#L278)
- [sanitizeHtml](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/core/sanitize/sanitize.ts#L268)

<!-- generated:reference:end -->
