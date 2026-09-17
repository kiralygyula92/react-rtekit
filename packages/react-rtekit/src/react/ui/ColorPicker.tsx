import { useEffect, useRef, useState } from 'react';
import type { ColorPickerSlotProps } from '../../types/slots.js';
import { normalizeColor } from '../../core/utils/color.js';
import { useLocalization } from '../context.js';
import { resolveMessage } from '../localization.js';
import { Button } from './primitives.js';

/**
 * The colour picker (05 §2).
 *
 * The old implementation's swatches were `<Box onClick>`: not focusable, no keyboard,
 * no names, no selected state (R15). These are real buttons in a `grid`, with roving
 * focus, arrow-key navigation and a per-swatch accessible name, and "Reset" removes the
 * colour rather than forcing black (R14).
 *
 * @module
 */

// Re-exported from where it has always been imported from.
export { CLASSIC_COLORS } from '../../core/classic-parity.js';

/** A keyboard-navigable swatch grid with an optional custom-colour input. */
export function ColorPicker({
  value,
  palette,
  recent,
  columns,
  allowCustom,
  allowClear,
  onSelect,
  onClear,
  onClose,
}: ColorPickerSlotProps) {
  const t = useLocalization();
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [custom, setCustom] = useState(() => normalizeColor(value) ?? '#000000');

  // Focus the applied swatch when the picker opens, so arrow keys start from it.
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const applied = grid.querySelector<HTMLButtonElement>('[aria-checked="true"]');
    (applied ?? grid.querySelector<HTMLButtonElement>('button'))?.focus();
  }, []);

  const swatches = (): HTMLButtonElement[] => [
    ...(gridRef.current?.querySelectorAll<HTMLButtonElement>('button') ?? []),
  ];

  const onGridKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    const all = swatches();
    const index = all.indexOf(event.target as HTMLButtonElement);
    if (index < 0) return;
    const deltas: Record<string, number> = {
      ArrowRight: 1,
      ArrowLeft: -1,
      ArrowDown: columns,
      ArrowUp: -columns,
    };
    const delta = deltas[event.key];
    if (delta !== undefined) {
      event.preventDefault();
      const next = Math.max(0, Math.min(all.length - 1, index + delta));
      all[next]?.focus();
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      all[0]?.focus();
    }
    if (event.key === 'End') {
      event.preventDefault();
      all[all.length - 1]?.focus();
    }
  };

  const swatch = (color: string, key: string) => {
    const normalized = normalizeColor(color);
    const selected = normalized !== null && normalized === normalizeColor(value);
    return (
      <button
        key={key}
        type="button"
        // A radio, not a plain button: the author picks exactly one colour, and
        // `aria-selected` is not allowed on a button's implicit role.
        role="radio"
        aria-checked={selected}
        className="rte-color-picker__swatch"
        style={{ background: color }}
        aria-label={resolveMessage(t.color.swatch, { color })}
        // Never move focus out of the editor: the command applies to its selection.
        onMouseDown={(event) => {
          event.preventDefault();
        }}
        onClick={() => {
          onSelect(color);
        }}
      />
    );
  };

  return (
    <div className="rte-color-picker">
      {allowCustom ? (
        <label className="rte-color-picker__custom">
          <span className="rte-field-label">{resolveMessage(t.color.custom)}</span>
          <input
            type="color"
            className="rte-input rte-color-picker__input"
            value={custom}
            onChange={(event) => {
              setCustom(event.target.value);
            }}
          />
        </label>
      ) : null}

      {recent.length > 0 ? (
        <>
          <div className="rte-color-picker__section-label">{resolveMessage(t.color.recent)}</div>
          <div
            className="rte-color-picker__grid"
            role="radiogroup"
            aria-label={resolveMessage(t.color.recent)}
            style={{ '--rte-swatch-columns': columns } as React.CSSProperties}
          >
            {recent.map((color, index) => swatch(color, `recent-${index}-${color}`))}
          </div>
        </>
      ) : null}

      <div
        ref={gridRef}
        className="rte-color-picker__grid"
        role="radiogroup"
        aria-label={resolveMessage(t.color.title)}
        // A composite widget owns a tab stop; focus lives on the swatch inside it.
        tabIndex={-1}
        style={{ '--rte-swatch-columns': columns } as React.CSSProperties}
        onKeyDown={onGridKeyDown}
      >
        {palette.map((color, index) => swatch(color, `${index}-${color}`))}
      </div>

      <div className="rte-color-picker__actions">
        <Button
          onClick={() => {
            onSelect(custom);
          }}
        >
          {resolveMessage(t.color.apply)}
        </Button>
        {allowClear ? (
          <Button
            onClick={() => {
              // Removes the format rather than writing black, so the text follows the
              // theme again (fixes R14).
              onClear();
            }}
          >
            {resolveMessage(t.color.reset)}
          </Button>
        ) : null}
        <Button className="rte-color-picker__close" onClick={onClose}>
          {resolveMessage(t.shortcuts.close)}
        </Button>
      </div>
    </div>
  );
}
