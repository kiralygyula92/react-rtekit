---
pluginId: react-rtekit
pathname: /react-rtekit/sanitization/
title: Sanitization
description: An allowlist sanitizer on every content boundary — the initial value, every paste, every drop, every programmatic insert and the output.
archetype: B
section: features
capabilityId: sanitization
group: 'Content & data'
symbols: [SanitizeConfig, SanitizeProfileName, sanitizeHtml, getProfile, checkUrl, resolveSanitizeConfig, mergeSanitizeConfig]
---

# Sanitization

## Basics

```demo
sanitization
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

`sanitize={false}` exists and is almost always the wrong answer. It disables the input sanitizer only; the hard rules — no `<script>`, no `on*` attribute, no `javascript:` URL — are not configurable and still apply.

## API

- [SanitizeConfig](/react-rtekit/api/types/)
- [SanitizeProfileName](/react-rtekit/api/types/)
- [sanitizeHtml](/react-rtekit/api/sanitize/)
- [getProfile](/react-rtekit/api/sanitize/)
- [checkUrl](/react-rtekit/api/sanitize/)
- [resolveSanitizeConfig](/react-rtekit/api/sanitize/)
- [mergeSanitizeConfig](/react-rtekit/api/sanitize/)
