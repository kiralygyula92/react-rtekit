---
pluginId: react-rtekit
pathname: /react-rtekit/guides/accessibility/
title: Keyboard and ARIA
description: The keyboard model, the ARIA semantics, and what an override has to keep.
archetype: I
section: guides
---

# Keyboard and ARIA

```demo
accessibility
```

## The keyboard model

| Key | Does |
|---|---|
| Tab | Moves out of the editor, not into the toolbar |
| Alt+F10 | Moves into the toolbar from the text |
| Arrows | Move between toolbar controls |
| Home / End | First and last control |
| Escape | Returns the caret to where it was |
| Mod+B / I / U | Bold, italic, underline |
| Mod+K | Link |
| Mod+F | Find |
| Mod+/ | The shortcut reference |

The toolbar is one tab stop. That is the ARIA toolbar pattern, and it is why Tab does not walk through twenty buttons to get out of a form field.

## What is guaranteed

- A named textbox, from `label`.
- Errors linked with `aria-describedby`, and `aria-invalid` when invalid.
- Live-region announcements for count limits, find results and command outcomes.
- Visible focus on every control, and every shipped theme meeting WCAG AA — with a test that fails the build if one does not.
- The shortcut reference is built from the keymap actually in force, so it cannot list a shortcut that does not work.

## What an override has to keep

A slot receives its semantics in its props. A replacement `ToolbarButton` that drops `aria-pressed` turns a toggle into a button as far as a screen reader is concerned. Spread the props back.
