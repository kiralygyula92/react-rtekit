import { useEffect, useState } from 'react';
import type { FloatingToolbarConfig } from '../../types/config.js';
import type { ToolbarItemSpec } from '../../types/toolbar.js';
import { useEditorContext, useRteSlots } from '../context.js';
import { Toolbar } from '../toolbar/Toolbar.js';

/**
 * The bubble toolbar that follows a selection.
 *
 * Shown for a range selection and placed above it, so it never covers the text the
 * author is looking at. It is the same `Toolbar` as the docked one — same roving
 * focus, same `mousedown` prevention, same slots — because a second implementation
 * would be a second set of bugs.
 *
 * @module
 */

/** Props for {@link FloatingToolbarUi}. */
export interface FloatingToolbarUiProps {
  config: FloatingToolbarConfig;
  items: ToolbarItemSpec[][];
}

/** Default gap between the selection and the toolbar, in pixels. */
const DEFAULT_OFFSET = 8;

export function FloatingToolbarUi({ config, items }: FloatingToolbarUiProps) {
  const editor = useEditorContext();
  const { slots } = useRteSlots();
  const [rect, setRect] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    const update = (): void => {
      const selection = editor.getSelection();
      const collapsed = selection?.isCollapsed ?? true;
      if ((config.selectionOnly !== false && collapsed) || !editor.hasFocus()) {
        setRect(null);
        return;
      }
      const caret = editor.engine.getCaretRect();
      if (!caret) {
        setRect(null);
        return;
      }
      setRect({ top: caret.top - (config.offset ?? DEFAULT_OFFSET), left: caret.left + caret.width / 2 });
    };

    const offSelection = editor.on('selectionChange', update);
    const offBlur = editor.on('blur', () => {
      setRect(null);
    });
    update();
    return () => {
      offSelection();
      offBlur();
    };
  }, [config.offset, config.selectionOnly, editor]);

  if (!rect || items.length === 0) return null;

  const FloatingToolbar = slots.FloatingToolbar;
  return (
    <div
      className="rte-floating-layer"
      style={{ position: 'fixed', top: rect.top, left: rect.left, transform: 'translate(-50%, -100%)' }}
      role="presentation"
    >
      <FloatingToolbar selectionRect={null} items={items.flat()}>
        <Toolbar groups={items} size="sm" overflow="scroll" />
      </FloatingToolbar>
    </div>
  );
}
