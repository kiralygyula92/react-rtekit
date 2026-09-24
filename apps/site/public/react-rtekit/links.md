---
pluginId: react-rtekit
pathname: /react-rtekit/links/
title: Links
description: Adding, editing and removing links, with every URL checked against the protocol allowlist before it reaches the document.
archetype: B
section: features
capabilityId: links
group: Core features
symbols: [LinkAttrs, checkUrl, normalizeUrl, RteHandlers]
---

# Links

## Basics

```demo
links
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](/react-rtekit/customization/) for the eight levels and how to pick one, and [Theming & tokens](/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

`javascript:`, `vbscript:` and `data:text/html` URLs are refused whatever the configuration says. There is no option to allow them, and there will not be one.

## API

- [LinkAttrs](/react-rtekit/api/types/)
- [checkUrl](/react-rtekit/api/sanitize/)
- [normalizeUrl](/react-rtekit/api/sanitize/)
- [RteHandlers](/react-rtekit/api/types/)
