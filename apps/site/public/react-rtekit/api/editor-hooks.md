---
pluginId: react-rtekit
pathname: /react-rtekit/api/editor-hooks/
title: Editor hooks
description: 'The hooks that read editor state: focus, emptiness, counts, format and validation.'
archetype: E
section: reference
---

# Editor hooks

<!--
  Generated from the TypeScript declarations. Do not author anything here:
  structure comes from reference/{symbol}.schema.json and prose from
  reference/{symbol}.strings.json, and this region is replaced wholesale.
-->

<!-- generated:reference:start -->

## Used by

- [Counters & limits](/react-rtekit/counters-and-limits/)
- [Commands](/react-rtekit/commands/)
- [Headless](/react-rtekit/headless/)
- [Read-only & disabled](/react-rtekit/read-only-and-disabled/)
- [Performance](/react-rtekit/performance/)
- [Empty state](/react-rtekit/empty-state/)
- [Forms](/react-rtekit/forms/)
- [Localization](/react-rtekit/localization/)
- [Presets](/react-rtekit/presets/)
- [Slots](/react-rtekit/slots/)
- [Theming](/react-rtekit/theming/)
- [Images & uploads](/react-rtekit/images/)
- [Accessibility](/react-rtekit/accessibility/)

## Import

```ts
import { useCharacterCount } from 'react-rtekit';
import { useCommand } from 'react-rtekit';
import { useEditorContext } from 'react-rtekit';
import { useEditorState } from 'react-rtekit';
import { useFormatState } from 'react-rtekit';
import { useIsEmpty } from 'react-rtekit';
import { useIsFocused } from 'react-rtekit';
import { useLocalization } from 'react-rtekit';
import { useRteConfig } from 'react-rtekit';
import { useRteDefaults } from 'react-rtekit';
import { useRteSlots } from 'react-rtekit';
import { useRteTheme } from 'react-rtekit';
import { useUpload } from 'react-rtekit';
import { useValidationError } from 'react-rtekit';
```

## Options

### useCharacterCount

The live character or word count.

Counts text, never markup (fixes R3).

This symbol takes no options.

### useCommand

Binds a toolbar control to a command.

This symbol takes no options.

### useEditorContext

The editor instance for the nearest `<Rte.Root>` or `<RichTextEditor>`.

This symbol takes no options.

### useEditorState

Subscribes to a slice of editor state.

This symbol takes no options.

### useFormatState

The formatting that applies to the current selection.

This symbol takes no options.

### useIsEmpty

True when the editor holds nothing a reader would see (fixes R2).

This symbol takes no options.

### useIsFocused

True while the editor has focus. Drives `:focus-within` styling (fixes R9).

This symbol takes no options.

### useLocalization

The active message catalogue. Falls back to the shipped English one.

This symbol takes no options.

### useRteConfig

The resolved configuration for the nearest editor.

This symbol takes no options.

### useRteDefaults

App-wide prop defaults from `<RteDefaultsProvider>`. Props still win.

This symbol takes no options.

### useRteSlots

The slot table, including the defaults.

This symbol takes no options.

### useRteTheme

The active theme, or `null` when no provider is above.

This symbol takes no options.

### useUpload

In-flight uploads plus the function that starts one.

This symbol takes no options.

### useValidationError

The current validation message, or `null`.

This symbol takes no options.

## Source

- [useCharacterCount](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/src/react/hooks.ts#L138)
- [useCommand](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/src/react/hooks.ts#L106)
- [useEditorContext](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/src/react/context.ts#L55)
- [useEditorState](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/src/react/hooks.ts#L30)
- [useFormatState](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/src/react/hooks.ts#L83)
- [useIsEmpty](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/src/react/hooks.ts#L129)
- [useIsFocused](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/src/react/hooks.ts#L168)
- [useLocalization](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/src/react/context.ts#L129)
- [useRteConfig](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/src/react/context.ts#L194)
- [useRteDefaults](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/src/react/context.ts#L211)
- [useRteSlots](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/src/react/context.ts#L110)
- [useRteTheme](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/src/react/context.ts#L152)
- [useUpload](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/src/react/hooks.ts#L158)
- [useValidationError](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/src/react/hooks.ts#L175)

<!-- generated:reference:end -->
