import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * The modal dialog primitive (05 §14).
 *
 * The same contract as {@link Popover}: focus moves in, Tab is trapped, Escape closes,
 * and focus returns to whatever had it. A dialog without those is a keyboard trap, and
 * the shortcut reference — of all things — must not be one.
 *
 * @module
 */

/** Props for {@link Dialog}. */
export interface DialogProps {
  open: boolean;
  onClose: () => void;
  /** The accessible name. */
  title: string;
  children?: ReactNode;
  className?: string;
}

/** Everything inside `root` that can take focus, in tab order. */
function focusable(root: HTMLElement): HTMLElement[] {
  return [
    ...root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ].filter((element) => element.offsetParent !== null || element === document.activeElement);
}

export function Dialog({ open, onClose, title, children, className }: DialogProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    returnFocusRef.current = document.activeElement as HTMLElement | null;
  }, [open]);

  // Focus moves into the dialog, because a modal nobody is inside is not modal.
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel || panel.contains(document.activeElement)) return;
    const [first] = focusable(panel);
    (first ?? panel).focus();
  }, [open]);

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

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, [onClose, open]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className={['rte-dialog', className].filter(Boolean).join(' ')}>
      {/*
        A real button behind the panel, so dismissing by clicking away is reachable
        from the keyboard and announces what it does.
      */}
      <button type="button" className="rte-dialog__backdrop" aria-label={title} onClick={onClose} />
      <div
        ref={panelRef}
        className="rte-dialog__panel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
