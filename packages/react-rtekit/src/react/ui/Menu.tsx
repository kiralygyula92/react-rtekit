import { useCallback, useEffect, useRef, type ReactNode } from 'react';

/**
 * The menu primitive.
 *
 * A `role="menu"` list with the APG keyboard model: arrows move, Home/End jump, typing
 * a character jumps to the next matching item, Enter activates. Used by the toolbar's
 * dropdowns and its overflow menu.
 *
 * @module
 */

/** One row of a {@link Menu}. */
export interface MenuOption {
  /** What `onSelect` receives, and what `value` is compared against. */
  value: string;
  /** What the row shows. */
  label: ReactNode;
  /** A second line in the row. */
  description?: ReactNode;
  /** A leading icon for the row. */
  icon?: ReactNode;
  /** Whether the row can be chosen. */
  disabled?: boolean;
  /** Groups adjacent items under a heading. */
  group?: string;
  /** Plain text used for type-ahead; falls back to `value`. */
  text?: string;
}

/** Props for {@link Menu}. */
export interface MenuProps {
  /** The rows, in display order. */
  options: MenuOption[];
  /** The currently applied value, marked with `aria-checked`. */
  value?: string | null;
  /** Called with the chosen row’s value. */
  onSelect: (value: string) => void;
  /** Accessible name for the menu. */
  label: string;
  /** Appended to the menu’s own class name. */
  className?: string;
}

/** A keyboard-navigable menu. */
export function Menu({ options, value, onSelect, label, className }: MenuProps) {
  const listRef = useRef<HTMLDivElement | null>(null);
  const typeAhead = useRef({ query: '', at: 0 });

  const items = useCallback(
    (): HTMLButtonElement[] =>
      [...(listRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]:not(:disabled)') ?? [])],
    [],
  );

  // Focus the applied item, or the first one, so the menu opens where the user is.
  useEffect(() => {
    const all = items();
    const active = all.find((item) => item.dataset.value === value);
    (active ?? all[0])?.focus();
  }, [items, value]);

  const move = (from: HTMLElement, delta: number): void => {
    const all = items();
    const index = all.indexOf(from as HTMLButtonElement);
    const next = all[(index + delta + all.length) % all.length];
    next?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    const target = event.target as HTMLElement;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        move(target, 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        move(target, -1);
        break;
      case 'Home':
        event.preventDefault();
        items()[0]?.focus();
        break;
      case 'End': {
        event.preventDefault();
        const all = items();
        all[all.length - 1]?.focus();
        break;
      }
      default: {
        if (event.key.length !== 1 || event.metaKey || event.ctrlKey || event.altKey) return;
        const now = Date.now();
        const state = typeAhead.current;
        state.query = now - state.at > 700 ? event.key : state.query + event.key;
        state.at = now;
        const match = items().find((item) =>
          (item.dataset.text ?? '').toLowerCase().startsWith(state.query.toLowerCase()),
        );
        match?.focus();
      }
    }
  };

  // Headings are derived before rendering: a variable reassigned inside the map would
  // be read after the render completes.
  const headings = options.map((option, index) =>
    option.group && option.group !== options[index - 1]?.group ? option.group : null,
  );

  return (
    <div
      ref={listRef}
      className={['rte-menu', className].filter(Boolean).join(' ')}
      role="menu"
      aria-label={label}
      // A composite widget owns a tab stop even though focus lives on its items.
      tabIndex={-1}
      onKeyDown={onKeyDown}
    >
      {options.map((option, index) => {
        const heading = headings[index];
        return (
          <div key={option.value} className="rte-menu__section">
            {heading ? (
              <div className="rte-menu__group-label" role="presentation">
                {heading}
              </div>
            ) : null}
            <button
              type="button"
              role="menuitemradio"
              aria-checked={option.value === value}
              className="rte-menu__item"
              data-value={option.value}
              data-text={option.text ?? option.value}
              data-active={option.value === value}
              disabled={option.disabled}
              tabIndex={-1}
              onMouseDown={(event) => {
                // Keep the editor's selection: the command runs against it.
                event.preventDefault();
              }}
              onClick={() => {
                onSelect(option.value);
              }}
            >
              {option.icon ? <span className="rte-menu__icon">{option.icon}</span> : null}
              <span className="rte-menu__label">{option.label}</span>
              {option.description ? (
                <span className="rte-menu__description">{option.description}</span>
              ) : null}
            </button>
          </div>
        );
      })}
    </div>
  );
}
