import { useEffect, useState } from 'react';

/**
 * Tracks the visual viewport, for a toolbar docked above the keyboard.
 *
 * On a phone the on-screen keyboard covers the bottom of the layout viewport without
 * resizing it, so a bottom-docked toolbar positioned with `bottom: 0` ends up behind
 * the keyboard. The visual viewport is the only thing that knows where the visible
 * area actually ends.
 *
 * Returns the number of pixels the keyboard covers, which is `0` everywhere the API
 * is missing — desktop browsers included.
 *
 * @module
 */
export function useKeyboardInset(enabled: boolean): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    const viewport = window.visualViewport;
    if (!viewport) return;

    const update = (): void => {
      // What the layout viewport has that the visual one does not is the keyboard,
      // plus whatever the page is scrolled by inside it.
      const covered = window.innerHeight - viewport.height - viewport.offsetTop;
      setInset(Math.max(0, Math.round(covered)));
    };

    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
    };
  }, [enabled]);

  return inset;
}
