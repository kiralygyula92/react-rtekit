---
'react-rtekit': patch
---

Security and robustness fixes.

- **CSS sanitization** now checks a style value with its CSS escapes decoded and its
  comments removed, so `url(\6a avascript:…)`, `e\78 pression(…)` and
  `expression/**/(…)` are rejected like their plain spellings. Quoted text and the
  author's own escapes are kept as written.
- **HTML parsing** no longer resolves `&constructor;` or a `<constructor>` tag through
  `Object.prototype`: unknown entity names stay as they are, and such a tag is an
  ordinary unknown element.
- **Uploads** get unique ids after a removal, an async `onUploadStart` handler is
  awaited before the upload proceeds, and an upload still in flight when the editor
  unmounts is cancelled rather than inserted into it.
- **Autosave** falls back cleanly when merely reading `localStorage` throws, as it does
  in sandboxed frames.
- **Image resizing** restores the image when a drag is cancelled, and cleans up when
  the image goes away mid-drag.
- **`useEditorState`** re-selects when its selector or equality function changes, not
  only when the editor state does.
- **Rebuilt nodes** leave no stale entries in the engine's DOM index, and check-list
  items take the right attributes when their list changes type.
