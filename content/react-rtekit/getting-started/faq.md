---
pluginId: react-rtekit
pathname: /react-rtekit/getting-started/faq/
title: FAQ
description: 'The questions that come up while adopting it: bundle size, engine choice, server rendering, and what it deliberately does not do.'
archetype: F
section: getting-started
---

# FAQ

## What does it depend on?

React and React DOM, and nothing else. The document model, the editing engine, the HTML parser, the sanitizer and every serializer are this project's own code. The `EditorEngine` interface keeps the engine replaceable, and the package ships one — its own.

## Can it edit Markdown directly?

It can take and return Markdown with `valueFormat="markdown"`, converting on each boundary. It is not a Markdown source editor: what you type into is rich text.

## Is the output safe to render?

The output passes the sanitizer, and the hard rules — no `<script>`, no `on*` attribute, no `javascript:` or `data:text/html` URL — cannot be configured off. That does not remove your own responsibility to sanitize on the server; a client can be bypassed.

## Does it do collaborative editing?

No. There is no CRDT or presence layer, and adding one would be a different product.

## Why is the bundle that size?

Because `<RichTextEditor>` reads its feature set from props at runtime, so every branch is reachable from that entry point. Import `useEditor` instead and the chrome drops out. The measured numbers are in [Performance](/react-rtekit/guides/performance/).

## Can I use it with a UI kit?

Yes, and you do not have to. Every part is a slot, so you can render your own buttons, dialogs and menus while keeping the behaviour — see [Design-system skin](/react-rtekit/customization/design-system-skin/).

## Next steps

- [Support](/react-rtekit/getting-started/support/) — where to ask something this does not answer.
- [Architecture](/react-rtekit/discover-more/architecture/) — why it is built this way.
