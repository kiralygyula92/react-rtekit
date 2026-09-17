import type { EditorInstance } from '../../types/editor.js';

/**
 * Finding the toolbar control a popover belongs to.
 *
 * The colour picker and the dropdowns anchor to their own button because the popover is
 * rendered inside the item that owns it. The link editor and the image dialog are not:
 * they are mounted once, next to the editor, and reached through a command, so they have
 * no reference to whatever dispatched it — and they fell back to anchoring on the
 * content element, which put them under the whole text area rather than under the button
 * that opened them.
 *
 * @module
 */

/**
 * The toolbar button for `name` in this editor, if it is on screen.
 *
 * Scoped to the editor's own root, so one of several editors on a page anchors to its
 * own toolbar. Returns `null` when the item is not currently rendered — it may be in the
 * overflow menu, or the toolbar may be hidden entirely — and the caller decides what to
 * fall back to.
 *
 * @example
 * ```ts
 * const anchor = toolbarControl(editor, 'link') ?? editor.engine.contentElement;
 * ```
 */
export function toolbarControl(editor: EditorInstance, name: string): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  const root = editor.engine.contentElement.closest('.rte-root');
  if (!root) return null;

  const own = root.querySelector<HTMLElement>(`[data-item="${name}"]`);
  if (own) return own;

  // The item is in the overflow menu, which is a portal and is closing as the command
  // runs. Its button stays where it is, so it is the honest thing to point at.
  return root.querySelector<HTMLElement>('[data-item="overflow"]');
}
