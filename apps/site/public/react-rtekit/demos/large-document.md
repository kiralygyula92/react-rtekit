---
pluginId: react-rtekit
pathname: /react-rtekit/demos/large-document/
title: Large document
description: A document large enough to make performance visible, with the numbers the budget is measured against.
archetype: B
section: demos
---

# Large document

## Basics

A document long enough to make performance visible, with the measurements the build's budgets are checked against.

```demo
large-document
```

## Customization

The props worth memoising, and the ones that cause a remount, are listed in the [performance guide](/react-rtekit/guides/performance/).

## Limitations

The budgets are measured on a quiet CI machine with a dedicated Playwright config. They are a regression signal, not a promise about a particular device.

## API

- [useEditor](/react-rtekit/api/use-editor/)
- [useEditorState](/react-rtekit/api/editor-hooks/)
