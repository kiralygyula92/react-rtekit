---
pluginId: react-rtekit
pathname: /react-rtekit/integrations/typescript/
title: TypeScript
description: What the types give you, how to extend the command and slot catalogues, and the strictness settings this package assumes.
archetype: I
section: integrations
---

# TypeScript

The package is written in TypeScript with `strict` on and ships declarations for both ESM and CJS. `are-the-types-wrong` runs on every build, so the `exports` map is checked rather than assumed.

## Typing the value

`EditorValue` is the union of what `valueFormat` can produce. Narrow it by telling the component which format you are using:

```tsx
<RichTextEditor valueFormat="html" onChange={(value: string) => setHtml(value)} />
```

## Adding a command

Augment the catalogue, and `editor.exec` accepts it with the right payload:

```ts
declare module 'react-rtekit' {
  interface CommandMap {
    toggleHighlight: void;
    insertCallout: { variant: 'info' | 'warning' };
  }
}
```

## Adding a slot

```ts
declare module 'react-rtekit' {
  interface RteSlots {
    CalloutChrome: SlotComponent<{ variant: string }>;
  }
}
```

## What this package assumes

`strict`, `verbatimModuleSyntax` and `moduleResolution: 'bundler'` or `'node16'`. It does not require them of you, but the declarations are written as though they are on.
