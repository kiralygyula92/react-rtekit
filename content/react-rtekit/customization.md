---
pluginId: react-rtekit
pathname: /react-rtekit/customization/
title: How to customize
description: The eight levels of customization, from a theme token to a fully headless editor, and how to pick the lowest one that does the job.
archetype: I
section: customization
---

# How to customize

There are eight ways to change what the editor looks like and how it behaves. They are ordered here from least invasive to most, and the rule is to use the lowest one that does the job — each level leaves everything above it working.

1. **Theme tokens** — 114 CSS custom properties. Changes colour, size and spacing. [Theming & tokens](/react-rtekit/customization/theme-tokens/)
2. **Toolbar config** — choose items, group them, decide the overflow. [Toolbar layout](/react-rtekit/customization/toolbar-layout/)
3. **Custom toolbar items** — add a control of your own, in the same shape as the built-ins.
4. **Slots** — replace a part with your component. [Overriding structure](/react-rtekit/customization/overriding-slots/)
5. **Handler middleware** — wrap, veto or replace a behaviour. [Handler middleware](/react-rtekit/handler-middleware/)
6. **Command overrides** — change what a command does. [Commands](/react-rtekit/commands/)
7. **Composable parts** — assemble the editor yourself. [Composable parts](/react-rtekit/composable-parts/)
8. **Headless** — `useEditor`, and you draw everything. [Headless](/react-rtekit/headless/)

Content styling — how the prose itself looks — is separate from all eight, because stored HTML has to render the same outside the editor. See [Content styles](/react-rtekit/customization/content-styles/).
