---
pluginId: react-rtekit
pathname: /react-rtekit/customization/content-styles/
title: Content styles
description: Styling the prose itself, so stored HTML renders the same inside the editor and out.
archetype: I
section: customization
---

# Content styles

The prose inside the editor and the prose on a page that renders stored HTML have to look the same, or authors are editing something that is not what readers see.

```demo
content-styles
```

That is why content styling is a separate stylesheet:

```ts
import 'react-rtekit/content.css';   // the prose, on its own
import 'react-rtekit/styles.css';    // everything, including the above
```

Render stored HTML with the same styling using [RteContentView](/react-rtekit/content-view/), which sanitizes and applies the same classes:

```tsx
import { RteContentView } from 'react-rtekit/view';

<RteContentView value={storedHtml} />
```

Every content token — heading scale, list indent, quote border, code colours, table borders — is listed on the [theme tokens](/react-rtekit/api/theme-tokens/) page under `content`.
