---
pluginId: react-rtekit
pathname: /react-rtekit/guides/testing/
title: Testing
description: 'Testing an editor: what unit tests can reach, what needs a real browser, and why.'
archetype: I
section: guides
---

# Testing

## What unit tests can reach

jsdom does not lay anything out and cannot drive a contenteditable. That puts a hard line through the middle of an editor's test suite:

| Testable in jsdom | Needs a real browser |
|---|---|
| Serialization, sanitization, interop | Typing, selection, the caret |
| The document model and commands | Where a popover lands |
| Props, slots, handler wiring | Whether a mark is visible |
| Rendering and accessibility roles | Which toolbar items fit on a row |

A unit test that appears to cover the right column is asserting against a simulation of a browser, not a browser.

## Testing your own integration

For a form, assert on the value your `onChange` receives rather than on the DOM:

```tsx
render(<RichTextEditor label="Body" onChange={onChange} />);
await user.type(screen.getByRole('textbox', { name: 'Body' }), 'Hello');
expect(onChange).toHaveBeenLastCalledWith('<p>Hello</p>', expect.anything());
```

For anything involving a caret, use Playwright.

## The accessible name

Pass `label`, and the textbox has a name you can query by. Without one, `getByRole('textbox')` finds an anonymous element and your test is fragile.
