---
pluginId: react-rtekit
pathname: /react-rtekit/guides/localization/
title: Translating the editor
description: 'Translating the editor''s strings, handling direction, and finding the keys you missed.'
archetype: I
section: guides
---

# Translating the editor

```demo
localization
```

## Catalogues

Five ship — `en`, `hu`, `de`, `es` and `pseudo` — each covering all 153 keys:

```tsx
import { RichTextEditor, de } from 'react-rtekit';

<RichTextEditor localization={de} />
```

Or for a whole tree:

```tsx
<RteLocaleProvider value={de}>{children}</RteLocaleProvider>
```

## Finding what you missed

`pseudo` replaces every string with an accented, lengthened version of itself. Anything still in plain English is a string that is not going through the catalogue:

```tsx
<RichTextEditor localization={pseudo} />
```

It also makes layouts that assume English-length labels obvious, because everything is about 30% longer.

## Direction

`dir="rtl"` flips the toolbar, the alignment defaults, the indentation and the popover placement. The content's own direction is `dir="auto"` per block, so a right-to-left paragraph in a left-to-right document behaves correctly.

## What is not covered

The catalogue is the editor's own chrome. Date formats, number formats and your application's strings are yours.
