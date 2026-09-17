import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

/**
 * The popover primitive.
 *
 * Every floating surface in the library — the colour picker, the link editor, the
 * overflow menu, the slash menu — is one of these, so focus trapping, Escape handling
 * and focus return are implemented once.
 *
 * @module
 */

/** Where the popover sits relative to its anchor. */
export type PopoverPlacement = 'bottom-start' | 'bottom' | 'bottom-end' | 'top-start' | 'top';

/** Props for {@link Popover}. */
export interface PopoverProps {
  /** Whether the popover is showing. */
  open: boolean;
  /** The element the popover is positioned against. */
  anchor: HTMLElement | null;
  /** Called on Escape, on an outside click and on a chosen action. */
  onClose: () => void;
  /** Accessible name for the dialog. */
  label: string;
  /** Which side of the anchor it prefers. @default 'bottom-start' */
  placement?: PopoverPlacement;
  /** Distance from the anchor, in pixels. @default 4 */
  offset?: number;
  /** Remove the panel's padding, for menus that manage their own. @default false */
  noPadding?: boolean;
  /**
   * Keep focus where it is when the panel opens.
   *
   * For a panel whose controls act on the editor's *selection* — the toolbar's overflow
   * menu is the one that matters — taking focus loses the selection the command is meant
   * to apply to, and the command then runs against nothing. That is R5 again, one level
   * further out: the buttons prevent `mousedown` so clicking one keeps the caret, and
   * then the panel that contains them moved focus anyway.
   *
   * @default false
   */
  keepFocus?: boolean;
  /** Appended to the panel’s own class name. */
  className?: string;
  /** The panel’s content. */
  children?: ReactNode;
}

/** Focusable descendants, in tab order. */
function focusable(root: HTMLElement): HTMLElement[] {
  return [
    ...root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ].filter((element) => element.offsetParent !== null || element.getClientRects().length > 0);
}

/**
 * A floating panel anchored to an element.
 *
 * Opens into a portal on `document.body` so it is never clipped by the editor's
 * `overflow`, traps Tab, closes on Escape or an outside click, and returns focus to
 * whatever had it before.
 */
export function Popover({
  open,
  anchor,
  onClose,
  label,
  placement = 'bottom-start',
  offset = 4,
  noPadding = false,
  keepFocus = false,
  className,
  children,
}: PopoverProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  /** Set once the panel has been measured; hidden until then so it cannot flash. */
  const [position, setPosition] = useState<CSSProperties | null>(null);

  // Where focus goes on close. The anchor comes first: a toolbar button prevents
  //  so the editor keeps its selection, which means the button never
  // received focus and there is nothing to "return" to (fixes R5).
  useEffect(() => {
    if (!open) return;
    returnFocusRef.current = anchor ?? (document.activeElement as HTMLElement | null);
  }, [anchor, open]);

  const reposition = useCallback(() => {
    const panel = panelRef.current;
    if (!panel || !anchor) return;
    const rect = anchor.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    let top = rect.bottom + scrollY + offset;
    let left = rect.left + scrollX;

    if (placement === 'bottom') left = rect.left + scrollX + rect.width / 2 - panelRect.width / 2;
    if (placement === 'bottom-end') left = rect.right + scrollX - panelRect.width;
    if (placement === 'top' || placement === 'top-start') {
      top = rect.top + scrollY - panelRect.height - offset;
      if (placement === 'top') left = rect.left + scrollX + rect.width / 2 - panelRect.width / 2;
    }

    // Keep the panel inside the viewport rather than letting it hang off the edge.
    const maxLeft = scrollX + document.documentElement.clientWidth - panelRect.width - 8;
    left = Math.max(scrollX + 8, Math.min(left, maxLeft));

    /*
     * The same, vertically — which nothing did.
     *
     * A panel was placed under its anchor whatever the height of either, so a tall one
     * near the bottom of a short window was drawn past the end of it: on a phone the
     * link editor and the image dialog opened off the screen entirely. It flips above
     * the anchor when there is more room there, and is clamped to the viewport in any
     * case, so the top of the panel is always reachable.
     */
    const viewportHeight = document.documentElement.clientHeight;
    const below = viewportHeight - rect.bottom - offset;
    const above = rect.top - offset;
    const wantsAbove = placement === 'top' || placement === 'top-start';
    const flip = wantsAbove
      ? // Asked for above, but there is not room and there is more below.
        panelRect.height > above && below > above
      : // Asked for below, but there is not room and there is more above.
        panelRect.height > below && above > below;

    if (flip) {
      top = wantsAbove
        ? rect.bottom + scrollY + offset
        : rect.top + scrollY - panelRect.height - offset;
    }

    const minTop = scrollY + 8;
    const maxTop = scrollY + viewportHeight - panelRect.height - 8;
    top = Math.max(minTop, maxTop > minTop ? Math.min(top, maxTop) : top);

    setPosition({ top, left });
  }, [anchor, offset, placement]);

  useLayoutEffect(() => {
    if (!open) return undefined;
    reposition();
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [open, reposition]);

  // Move focus into the panel, unless its content already placed it somewhere better:
  // the colour picker focuses the applied swatch, and child effects run first.
  useEffect(() => {
    if (!open || keepFocus) return;
    const panel = panelRef.current;
    if (!panel) return;
    if (panel.contains(document.activeElement)) return;
    const [first] = focusable(panel);
    (first ?? panel).focus();
  }, [open, keepFocus]);

  // Keeping the editor's selection while the popover is open is a DOM concern, not a
  // user interaction, so the guard is attached imperatively rather than through JSX
  // (fixes R5).
  useEffect(() => {
    const panel = panelRef.current;
    if (!open || !panel) return undefined;
    const keepSelection = (event: MouseEvent): void => {
      if ((event.target as HTMLElement).closest('input, textarea, select, [contenteditable]')) return;
      event.preventDefault();
    };
    panel.addEventListener('mousedown', keepSelection);
    return () => {
      panel.removeEventListener('mousedown', keepSelection);
    };
  }, [open, position]);

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        returnFocusRef.current?.focus();
        return;
      }
      if (event.key !== 'Tab') return;
      const panel = panelRef.current;
      if (!panel) return;
      const items = focusable(panel);
      if (items.length === 0) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const onPointerDown = (event: MouseEvent): void => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (anchor?.contains(target)) return;
      onClose();
    };

    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [anchor, onClose, open]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="rte-popover rte-portal"
      style={position ?? { visibility: 'hidden' }}
      data-placement={placement}
    >
      <div
        ref={panelRef}
        className={['rte-popover__panel', className].filter(Boolean).join(' ')}
        role="dialog"
        aria-label={label}
        aria-modal="false"
        tabIndex={-1}
        data-padding={noPadding ? 'none' : undefined}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
