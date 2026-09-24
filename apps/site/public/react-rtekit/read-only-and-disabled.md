---
pluginId: react-rtekit
pathname: /react-rtekit/read-only-and-disabled/
title: 'Read-only & disabled'
description: 'Two different states: read-only keeps the content selectable and copyable, disabled takes it out of the tab order.'
archetype: B
section: features
capabilityId: read-only-and-disabled
group: Interaction
symbols: [RichTextEditorProps, useEditorState]
---

# Read-only & disabled

## Basics

```demo
readonly-and-disabled
```

## Customization

Every part of this is a slot, a token or a handler. See [How to customize](/react-rtekit/customization/) for the eight levels and how to pick one, and [Theming & tokens](/react-rtekit/customization/theme-tokens/) for the visual side.

## Limitations

Neither is a security boundary. Both are UI states; a client can always change them, so the server has to check too.

## API

- [RichTextEditorProps](/react-rtekit/api/rich-text-editor/)
- [useEditorState](/react-rtekit/api/editor-hooks/)
