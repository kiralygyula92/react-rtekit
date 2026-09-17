---
'react-rtekit': major
---

Remove Lexical. The package has no dependencies.

`peerDependencies` is React and React DOM, and nothing else. `pnpm install` removes 35
packages, and a bundle that included this editor loses a 323 kB Lexical chunk — 103 kB
gzipped.

The editing engine is now this project's own: a keyed document tree, a reconciler that
applies a model diff to a live `contenteditable` without moving the caret, selection
mapping normalized across Chromium, Firefox and WebKit, `beforeinput` and keyboard
handling, IME composition, undo with coalescing, and the model operations behind every
command. 4,179 lines, on top of the 6,166 lines of `src/core` — the HTML parser, the
sanitizer, the document model and the serializers — that were already in-house.

It is graded by an `EngineHandle` conformance suite that was written first, against the
engine it replaced, and passed by that engine before a line of the replacement existed.
1,335 unit tests and 1,638 of 1,639 browser tests across five browsers pass; the one
that does not is a documentation navigation flow that failed with the old engine too.

**Breaking:** `lexicalEngine` and the `react-rtekit/engines/lexical` entry point are
gone, and Lexical is no longer a peer dependency. The default engine needs no
configuration, so anyone passing `engine={lexicalEngine}` should drop the prop; anyone
who installed the twelve Lexical packages for this can uninstall them.

One visible change comes with it. The editor now renders marks as the elements the
serializer writes — `<strong>`, `<em>`, `<u>` — rather than labelling them with classes,
so the editor and `<RteContentView>` are finally the same DOM. `content.css` styles both
spellings, and stored HTML is unchanged. Code that selected `.rte-bold` inside the live
editor should select `strong` as well.
