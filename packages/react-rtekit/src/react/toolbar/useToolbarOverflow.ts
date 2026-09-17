import { useEffect, useRef, useState } from 'react';

/**
 * Splits toolbar groups into what fits and what does not (05 §14, §15).
 *
 * Measured rather than guessed: how many buttons fit depends on the container, the
 * density, the font and whether labels are showing, and every guess at that is wrong
 * on somebody's screen. A `ResizeObserver` re-measures when the container changes.
 *
 * @module
 */

/** What {@link useToolbarOverflow} reports. */
export interface OverflowState<Group> {
  /** Groups that fit, in order. */
  visible: Group[];
  /** Groups that did not, for the overflow menu. */
  hidden: Group[];
  /** Attach to the element the groups live in. */
  containerRef: (element: HTMLElement | null) => void;
}

/** Width reserved for the "more" button while measuring, in pixels. */
const MORE_BUTTON_WIDTH = 40;

/**
 * Measures which groups fit on one row.
 *
 * `enabled` is false for the `wrap` and `scroll` behaviours, where everything stays
 * visible and the browser handles it.
 */
export function useToolbarOverflow<Group>(
  groups: Group[],
  enabled: boolean,
): OverflowState<Group> {
  const [count, setCount] = useState(groups.length);
  const container = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!enabled) {
      setCount(groups.length);
      return;
    }
    const element = container.current;
    if (!element || typeof ResizeObserver === 'undefined') return;

    const measure = (): void => {
      // No width yet — before layout, inside a hidden tab, or in a test environment
      // that does not lay out at all. Hiding the whole toolbar because nothing has
      // been measured would be the worst possible reading of "it does not fit".
      if (element.clientWidth === 0) {
        setCount(groups.length);
        return;
      }
      const available = element.clientWidth - MORE_BUTTON_WIDTH;
      // Groups are measured in place, so the numbers include their real gaps.
      const children = [...element.children].filter(
        (child): child is HTMLElement =>
          child instanceof HTMLElement && child.classList.contains('rte-toolbar__group'),
      );

      let used = 0;
      let fits = 0;
      for (const child of children) {
        used += child.offsetWidth;
        if (used > available && fits > 0) break;
        fits += 1;
        // Separators sit between groups and cost a few pixels each.
        used += 8;
      }
      setCount(fits === 0 ? 1 : fits);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [enabled, groups.length]);

  return {
    visible: enabled ? groups.slice(0, count) : groups,
    hidden: enabled ? groups.slice(count) : [],
    containerRef: (element) => {
      container.current = element;
    },
  };
}
