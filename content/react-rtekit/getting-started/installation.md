---
pluginId: react-rtekit
pathname: /react-rtekit/getting-started/installation/
title: Installation
description: Install the package, its peers and the stylesheet, and check that the editor renders.
archetype: F
section: getting-started
---

# Installation

## Prerequisites

- **React** 18.2 or later, including 19.
- **TypeScript** 5.0 or later, if you use it. The package ships its own declarations.
- A bundler that understands the `exports` field: Vite, webpack 5, Rollup, esbuild, Next.js.

## Installation

One package. React and React DOM are the only peer dependencies, and there is nothing else to install:

```bash
npm install react-rtekit
```

```bash
pnpm add react-rtekit
```

Then import the stylesheet once, wherever you import your application's other global CSS:

```ts
import 'react-rtekit/styles.css';
```

The stylesheet is plain CSS in a cascade layer. There is no CSS-in-JS runtime, no UI kit and no icon package.

## Minimal working example

```tsx
import { useState } from 'react';
import { RichTextEditor } from 'react-rtekit';
import 'react-rtekit/styles.css';

export function Editor() {
  const [value, setValue] = useState('<p>Hello</p>');

  return <RichTextEditor label="Message" value={value} onChange={setValue} />;
}
```

## Verify

You should see a bordered field with a toolbar above it, the word *Hello* inside, and a caret when you click into it. Typing should update `value`; pressing Mod+B should embolden the selection.

If the field appears but has no styling, the stylesheet import is missing.

## Next steps

- [Usage](/react-rtekit/getting-started/usage/) — controlled and uncontrolled, and the four value formats.
- [Requirements](/react-rtekit/getting-started/requirements/) — what is supported.
- [All features](/react-rtekit/all-features/) — what you can turn on.
