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
import { checkUrl } from 'react-rtekit';
import { getProfile } from 'react-rtekit';
import { mergeSanitizeConfig } from 'react-rtekit';
import { normalizeUrl } from 'react-rtekit';
import { resolveSanitizeConfig } from 'react-rtekit';
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

This symbol takes no options.

### resolveSanitizeConfig

Turns the `sanitize` prop into a resolved configuration.

A config object is merged onto `standard`; `false` is handled by the caller, which
also emits the development warning.

This symbol takes no options.

### sanitizeHtml

This symbol takes no options.

## Source

- [checkUrl](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/core/sanitize/url.ts#L80)
- [getProfile](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/core/sanitize/profiles.ts#L227)
- [mergeSanitizeConfig](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/core/sanitize/profiles.ts#L262)
- [normalizeUrl](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/core/sanitize/url.ts#L134)
- [resolveSanitizeConfig](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/core/sanitize/profiles.ts#L256)
- [sanitizeHtml](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/core/sanitize/sanitize.ts#L268)

<!-- generated:reference:end -->
