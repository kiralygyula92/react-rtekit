import { useCallback, useEffect, useRef, useState } from 'react';
import { useIsomorphicLayoutEffect } from '../hooks/useIsomorphicLayoutEffect.js';
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
 * It measures itself before it settles: a toolbar positioned only from the selection
 * hangs off whichever edge the selection is near, and one placed unconditionally above
 * is cut off by the top of the window when the selection is on the first line. So the
 * placement is resolved from both rectangles — clamped horizontally, flipped below when
 * there is no room above — and the element stays hidden until that has happened, which
 * is what stops it appearing in the wrong place for a frame.
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

/** How close to the edge of the window the toolbar is allowed to sit. */
const VIEWPORT_MARGIN = 8;

/** The selection box the toolbar is placed against. */
interface Anchor {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/** Where the toolbar ended up, once it has been measured. */
interface Placement {
  top: number;
  left: number;
  side: 'top' | 'bottom';
}

export function FloatingToolbarUi({ config, items }: FloatingToolbarUiProps) {
  const editor = useEditorContext();
  const { slots } = useRteSlots();
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const elementRef = useRef<HTMLDivElement | null>(null);

  const offset = config.offset ?? DEFAULT_OFFSET;

  const readAnchor = useCallback((): void => {
    const selection = editor.getSelection();
    const collapsed = selection?.isCollapsed ?? true;
    if ((config.selectionOnly !== false && collapsed) || !editor.hasFocus()) {
      setAnchor(null);
      return;
    }
    const rect = editor.engine.getCaretRect();
    if (!rect) {
      setAnchor(null);
      return;
    }
    setAnchor({ top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right });
  }, [config.selectionOnly, editor]);

  useEffect(() => {
    const offSelection = editor.on('selectionChange', readAnchor);
    const offBlur = editor.on('blur', () => {
      setAnchor(null);
    });
    // On the next frame rather than in the effect body: a selection that already
    // exists when this mounts still has to raise the toolbar, but the rectangle it is
    // placed against is a layout measurement, and reading one during the effect means
    // reading it before the browser has finished laying the editor out.
    const first = requestAnimationFrame(readAnchor);
    return () => {
      cancelAnimationFrame(first);
      offSelection();
      offBlur();
    };
  }, [editor, readAnchor]);

  // Scrolling and resizing move the selection under a `fixed` toolbar without firing a
  // selection change, so the toolbar has to re-read the box itself. `capture` catches
  // scrolling inside the editor, which does not reach the window in the bubble phase.
  useEffect(() => {
    if (!anchor) return undefined;
    const onViewportChange = (): void => {
      readAnchor();
    };
    window.addEventListener('scroll', onViewportChange, true);
    window.addEventListener('resize', onViewportChange);
    return () => {
      window.removeEventListener('scroll', onViewportChange, true);
      window.removeEventListener('resize', onViewportChange);
    };
  }, [anchor, readAnchor]);

  // Measured before paint: `useLayoutEffect` is what keeps the first frame from showing
  // the toolbar at an unclamped position.
  useIsomorphicLayoutEffect(() => {
    const element = elementRef.current;
    if (!anchor || !element) {
      setPlacement(null);
      return;
    }
    setPlacement(resolvePlacement(anchor, element.getBoundingClientRect(), offset));
  }, [anchor, offset, items]);

  if (!anchor || items.length === 0) return null;

  const FloatingToolbar = slots.FloatingToolbar;
  return (
    <div
      ref={elementRef}
      className="rte-floating-layer"
      // Off-screen rather than `display: none` until it is placed: it has to be laid out
      // to be measured, and it must not be visible at the wrong coordinates meanwhile.
      style={
        placement
          ? { position: 'fixed', top: placement.top, left: placement.left }
          : { position: 'fixed', top: 0, left: 0, visibility: 'hidden' }
      }
      data-side={placement?.side ?? 'top'}
      role="presentation"
    >
      <FloatingToolbar selectionRect={null} items={items.flat()}>
        <Toolbar groups={items} size="sm" overflow="wrap" />
      </FloatingToolbar>
    </div>
  );
}

/**
 * Places the toolbar against the selection, inside the viewport.
 *
 * Exported for the unit test: the arithmetic is worth checking without a browser, and
 * the cases that matter — a selection near the top, near either edge — are awkward to
 * arrange in one.
 *
 * @internal
 */
export function resolvePlacement(anchor: Anchor, self: DOMRect, offset: number): Placement {
  const viewportWidth = typeof window === 'undefined' ? 0 : window.innerWidth;
  const viewportHeight = typeof window === 'undefined' ? 0 : window.innerHeight;

  // Centred on the selection, then pulled back inside whichever edge it crosses. The
  // `max` comes last so a toolbar wider than the window sits at the left margin rather
  // than at a negative offset.
  const centred = (anchor.left + anchor.right) / 2 - self.width / 2;
  const left = Math.max(
    VIEWPORT_MARGIN,
    Math.min(centred, viewportWidth - self.width - VIEWPORT_MARGIN),
  );

  // Above the selection, unless that would clip it against the top of the window.
  const above = anchor.top - self.height - offset;
  const below = anchor.bottom + offset;
  const fitsAbove = above >= VIEWPORT_MARGIN;
  const fitsBelow = below + self.height <= viewportHeight - VIEWPORT_MARGIN;
  const side: Placement['side'] = fitsAbove || !fitsBelow ? 'top' : 'bottom';

  return {
    top: Math.max(VIEWPORT_MARGIN, side === 'top' ? above : below),
    left,
    side,
  };
}
