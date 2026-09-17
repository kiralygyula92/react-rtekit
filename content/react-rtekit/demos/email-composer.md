---
pluginId: react-rtekit
pathname: /react-rtekit/demos/email-composer/
title: E-mail composer
description: Merge tags, an e-mail output profile and inline styles, producing HTML that survives an e-mail client.
archetype: B
section: demos
---

# E-mail composer

## Basics

Merge tags, an e-mail output profile, and inline styles — the HTML this produces is the HTML that sends.

```demo
email-output
```

## Customization

The merge-tag syntax, the palette and the output profile are all props. The chips are a slot, so they can carry your own styling.

## Limitations

The e-mail profile makes HTML that e-mail clients can render. It does not test it against them: a complicated layout still needs a real preview service.

## API

- [documentToHtml](/react-rtekit/api/serialization/)
- [Sanitizer](/react-rtekit/api/sanitize/)
