---
pluginId: react-rtekit
pathname: /react-rtekit/handler-middleware/
title: Handler middleware
description: 'Eighteen interception points, each (ctx, next) => void, so you can wrap, veto or replace a behaviour without forking it.'
archetype: B
section: features
capabilityId: handler-middleware
group: Developer tools
symbols: [RteHandlers, handlers]
---

# Handler middleware

## Basics

```demo
handlers-middleware
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](/react-rtekit/customization/) for the ten levels and how to pick one, and [Theming & tokens](/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

A handler that never calls `next()` cancels the default behaviour. That is the point, and it is also the most common cause of a feature that has silently stopped working.

## API

- [RteHandlers](/react-rtekit/api/types/)
- [handlers](/react-rtekit/api/handlers/)
