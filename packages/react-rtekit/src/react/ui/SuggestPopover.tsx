import { useEffect } from 'react';
import type { InlineSuggestMenuItem } from '../../types/slots.js';
import type { InlineSuggestState, SuggestItem } from '../hooks/useInlineSuggest.js';
import { useEditorContext, useRteSlots } from '../context.js';

/**
 * Renders one trigger menu at the caret (05 §10).
 *
 * Positioned rather than anchored: the caret has no element to anchor to, so the menu
 * is placed from its rectangle. The keyboard is handled through the engine's keydown
 * event, which runs before the engine's own handling, so Enter chooses an item instead
 * of splitting the paragraph.
 *
 * @module
 */

/** Props for {@link SuggestPopover}. */
export interface SuggestPopoverProps<Item extends SuggestItem> {
  suggest: InlineSuggestState<Item>;
  rows: InlineSuggestMenuItem<Item>[];
  label: string;
  emptyMessage: string;
}

export function SuggestPopover<Item extends SuggestItem>({
  suggest,
  rows,
  label,
  emptyMessage,
}: SuggestPopoverProps<Item>) {
  const editor = useEditorContext();
  const { slots } = useRteSlots();

  // While the menu is open it owns the arrow keys, Enter, Tab and Escape.
  useEffect(() => {
    if (!suggest.open) return;
    return editor.engine.on('keydown', (event: KeyboardEvent) => {
      suggest.onKeyDown(event);
    });
  }, [editor, suggest]);

  if (!suggest.open) return null;

  const Menu = slots.InlineSuggestMenu;
  const rect = suggest.rect;

  return (
    <div
      className="rte-suggest-layer"
      style={{
        position: 'fixed',
        // Just under the caret, which is where every editor puts it.
        insetInlineStart: rect ? `${rect.left}px` : '0',
        insetBlockStart: rect ? `${rect.bottom + 4}px` : '0',
        zIndex: 'var(--rte-z-popover)' as unknown as number,
      }}
      role="presentation"
      aria-label={label}
    >
      <Menu
        items={rows}
        query={suggest.query}
        activeIndex={suggest.activeIndex}
        loading={suggest.loading}
        emptyMessage={emptyMessage}
        onSelect={(index: number) => {
          suggest.select(index);
        }}
        onActiveIndexChange={() => {
          // The hook owns the active index; hovering does not steal it from the
          // keyboard, which is what keeps arrow-key navigation predictable.
        }}
      />
    </div>
  );
}
