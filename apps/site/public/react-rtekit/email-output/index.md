---
pluginId: react-rtekit
pathname: /react-rtekit/email-output/
title: E-mail output
description: An output profile that inlines styles and drops what e-mail clients strip, so the HTML you store is the HTML that sends.
archetype: B
section: features
capabilityId: email-output
group: 'Content & data'
symbols: [documentToHtml, SanitizeProfileName, getProfile]
---

# E-mail output

## Basics

```demo
email-output
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

The profile makes HTML that e-mail clients can render. It does not test it against them — there is no Litmus in this package, and a complicated layout still needs a real preview.

## API

- [documentToHtml](/react-rtekit/api/serialization/)
- [SanitizeProfileName](/react-rtekit/api/types/)
- [getProfile](/react-rtekit/api/sanitize/)
