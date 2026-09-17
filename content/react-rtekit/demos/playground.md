---
pluginId: react-rtekit
pathname: /react-rtekit/demos/playground/
title: Playground
description: 'Every prop, live: change the configuration and read the code that produces it.'
archetype: B
section: demos
---

# Playground

## Basics

Every option, live. The configuration lives in the URL, so a link carries the whole setup — which makes it the fastest way to report a bug.

```demo
presets
```

The full playground — every prop, grouped, with the code it produces — is below.

## Customization

The playground is built from the same public props you would use. Its generated Code tab is what you would paste into your own application.

## Limitations

It configures one editor with the shipped slots. Anything that needs your own components — a design-system skin, a custom slot — is shown in [Customization](/react-rtekit/customization/) instead, because a playground cannot import code that does not exist yet.

## API

- [RichTextEditorProps](/react-rtekit/api/rich-text-editor/)
- [Presets](/react-rtekit/api/plugin-api/)
