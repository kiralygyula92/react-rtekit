---
pluginId: react-rtekit
pathname: /react-rtekit/discover-more/roadmap/
title: Roadmap
description: What is being considered next, and what has been decided against.
archetype: I
section: discover-more
---

# Roadmap

There is no dated roadmap. This is a free project maintained in the open, and promising dates for work that has not started would be inventing them.

What is **being considered**, in no order and with no commitment:

- A second engine adapter, to prove the `EditorEngine` interface is real.
- Syntax highlighting inside code blocks, as an opt-in so the highlighter is not in everyone's bundle.
- Merged table cells.
- A Figma kit, once the component set stops moving.

What has been **decided against**:

- **Real-time collaboration.** Lexical supports it; exposing it well is a project of its own, and doing it badly is worse than not doing it.
- **Document management.** This edits text and hands it back.
- **A CSS-in-JS build.** Tokens in a cascade layer do the same job without the runtime.

If you need one of these, say so in [discussions](https://github.com/kiralygyula92/react-rtekit/discussions) — what people actually ask for is what moves.
