---
pluginId: react-rtekit
pathname: /react-rtekit/api/editor-instance/
title: EditorInstance
description: 'TODO: one line, reused in nav, meta and llms.txt'
archetype: E
section: reference
---

# EditorInstance

<!--
  Generated from the TypeScript declarations. Do not author anything here:
  structure comes from reference/{symbol}.schema.json and prose from
  reference/{symbol}.strings.json, and this region is replaced wholesale.
-->

<!-- generated:reference:start -->

## Used by

Nothing on this site declares these symbols in its frontmatter. They are part of the library’s own surface rather than of one capability.

## Import

```ts
import { EditorInstance } from 'react-rtekit';
```

## Options

| Name | Type | Required | Description |
|---|---|---|---|
| `getHTML` | `object` | yes | The document as HTML, in the editor's profile unless one is given. |
| `getJSON` | `object` | yes | The document as the portable JSON shape. |
| `getMarkdown` | `object` | yes | The document as Markdown; anything Markdown cannot express is downgraded. |
| `getText` | `object` | yes | The document's text, with blocks joined by `blockSeparator`. |
| `getPlainTextAlternative` | `object` | yes | The `text/plain` alternative for a multipart e-mail. |
| `setContent` | `object` | yes | Replaces the whole document. |
| `insertContent` | `object` | yes | Inserts content at the selection, or at `at`. |
| `clear` | `object` | yes | Empties the document, optionally clearing the undo stack with it. |
| `isEmpty` | `object` | yes | True for `''`, `<p></p>`, `<p><br></p>` and whitespace-only content (fixes R2). |
| `getLength` | `object` | yes | The document's length in `unit`, defaulting to the configured `countUnit`. |
| `getSelection` | `object` | yes | Where the selection is, or `null` when the editor is not focused. |
| `setSelection` | `object` | yes | Moves the selection, either to a range or to a named position. |
| `saveSelection` | `object` | yes | Captures the selection so it survives focus moving to a popover. |
| `restoreSelection` | `object` | yes | Puts back a selection captured by EditorInstance.saveSelection. |
| `getFormatState` | `object` | yes | Every mark and block format at the selection. |
| `focus` | `object` | yes | Focuses the content element, optionally placing the caret. |
| `blur` | `object` | yes | Moves focus out of the content element. |
| `hasFocus` | `object` | yes | True while the caret is inside the content element. |
| `exec` | `object` | yes | Runs a command through its middleware chain; returns whether it did anything. |
| `canExec` | `object` | yes | Whether the command could run right now, which is what disables a control. |
| `isActive` | `object` | yes | Whether the command's effect is already applied, which is what presses a toggle. |
| `registerCommand` | `object` | yes | Adds a handler to a command's middleware chain; returns its unregister function. |
| `undo` | `object` | yes | Steps back one undo entry. |
| `redo` | `object` | yes | Steps forward one undo entry. |
| `canUndo` | `object` | yes | Whether there is anything to undo. |
| `canRedo` | `object` | yes | Whether there is anything to redo. |
| `clearHistory` | `object` | yes | Drops the undo stack, so loaded content cannot be undone away. |
| `insertLink` | `object` | yes | Links the selection, or inserts a new link when it is collapsed. |
| `removeLink` | `object` | yes | Unwraps the link at the selection, leaving its text. |
| `getLinkAtSelection` | `object` | yes | The link the caret is inside, or `null`. |
| `insertImage` | `object` | yes | Inserts an image from attributes you already have. |
| `uploadFiles` | `object` | yes | Runs files through the upload handler and inserts the results. |
| `insertMergeTag` | `object` | yes | Inserts a merge tag as an atomic node (fixes R23). |
| `getMergeTags` | `object` | yes | The keys of every merge tag currently in the document. |
| `insertTable` | `object` | yes | Inserts a table and places the caret in its first cell. |
| `setEditable` | `object` | yes | Turns editing on or off without changing the disabled or read-only props. |
| `isEditable` | `object` | yes | Whether the content can currently be edited. |
| `setFullscreen` | `object` | yes | Enters or leaves fullscreen. |
| `isFullscreen` | `object` | yes | Whether the editor is in fullscreen. |
| `toggleSourceView` | `object` | yes | Opens or closes the HTML source view. |
| `isSourceView` | `object` | yes | Whether the HTML source view is open. |
| `find` | `object` | yes | Searches the document and selects the first match from the caret. |
| `replace` | `object` | yes | Replaces every match in one undo step; returns how many were replaced. |
| `clearDraft` | `object` | yes | Removes the autosaved draft, which is what a successful submit should do. |
| `saveDraft` | `object` | yes | Writes an autosave draft now rather than waiting for the interval. |
| `validate` | `object` | yes | Runs `required`, `maxLength` and the `validate` prop. Returns the message or `null`. |
| `announce` | `object` | yes | Announce a message through the editor's polite live region. |
| `on` | `object` | yes | Subscribes to one editor event; returns its unregister function. |
| `getSnapshot` | `object` | yes | Current derived state; the same object `useEditorState` selects from. |
| `engine` | `EngineHandle` | yes | The engine adapter. Escape hatch. |
| `id` | `string` | yes | Stable per-instance id, used to namespace DOM ids (fixes R4). |

## Source

- [EditorInstance](https://github.com/kiralygyula92/react-rtekit/blob/main/packages/react-rtekit/types/editor.ts#L164)

<!-- generated:reference:end -->
