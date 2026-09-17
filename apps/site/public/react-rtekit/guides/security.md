---
pluginId: react-rtekit
pathname: /react-rtekit/guides/security/
title: Security
description: Where untrusted HTML enters, what the sanitizer guarantees, and what remains your responsibility.
archetype: I
section: guides
---

# Security

## Where untrusted HTML enters

Five places, and all five run the same allowlist sanitizer:

- the initial `value` or `defaultValue`;
- every paste;
- every drop;
- every programmatic `setContent` or `insertHTML`;
- the output of `getHTML()`, unless `sanitizeOutput={false}`.

There is no code path that renders HTML the sanitizer has not seen.

## What cannot be configured off

No profile and no configuration allows any of these:

- `<script>`, `<iframe>`, `<object>`, `<embed>`, `<form>`;
- any `on*` attribute;
- `javascript:`, `vbscript:` and `data:text/html` URLs;
- `style` containing `expression()`, `url(javascript:)` or `@import`;
- `srcdoc`, and `<svg>` outside the permissive profile.

## The four profiles

| Profile | For |
|---|---|
| `strict` | marks and paragraphs only |
| `standard` | everything the editor can edit — the default |
| `email` | the inline styles an e-mail needs |
| `permissive` | the widest allowlist, and still no scripts |

`standard` accepts `data:` URLs for PNG, JPEG, GIF and WebP so that inserting a picture from your own machine works with no upload endpoint. Those four are pixels. `data:image/svg+xml` is a document that can carry script and stays blocked everywhere.

## What remains yours

Sanitize again on the server. The client can be bypassed, and a determined caller can POST whatever it likes to your endpoint. `sanitizeHtml` is exported for exactly that:

```ts
import { sanitizeHtml } from 'react-rtekit/core';

const safe = sanitizeHtml(untrusted, { sanitize: 'standard' });
```
