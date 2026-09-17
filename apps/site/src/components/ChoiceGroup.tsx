import { useId } from 'react';

/**
 * One labelled row of choices.
 *
 * The examples were built from bare `<div role="radiogroup" aria-label="Theme">` rows,
 * which name the group for a screen reader and for nobody else. A sighted reader saw a
 * line of pills — `light classic dark compact bordered brand` — with nothing to say what
 * they were or what pressing one would do, and where two rows sat next to each other they
 * read as one group of twelve. In the theming example that was actively misleading:
 * `light` and `compact` appear in two different groups meaning two different things.
 *
 * So the label is rendered, and `aria-labelledby` points at it rather than repeating it
 * in an attribute. The visible text and the accessible name are then the same string by
 * construction, which is what WCAG 2.5.3 asks for and what a duplicated `aria-label`
 * quietly stops being the first time one of them is edited.
 *
 * `hint` is where the group says what it *does*. A label alone tells a reader what the
 * control is called; it does not tell them what changes when they press it, which is the
 * thing an example exists to demonstrate.
 *
 * @module
 */

/** One selectable option. */
export interface Choice<Value extends string> {
  /** The value this option selects. */
  value: Value;
  /** What the chip reads; the value itself when omitted. */
  label?: string;
}

/** Props for {@link ChoiceGroup}. */
export interface ChoiceGroupProps<Value extends string> {
  /** The group's visible name, e.g. `Density`. */
  label: string;
  /** One line on what the group changes. Rendered beside the label. */
  hint?: string;
  /** The options, in the order they should be offered. */
  options: readonly (Value | Choice<Value>)[];
  /** The value currently selected. */
  value: Value;
  /** Called with the value the reader picked. */
  onChange: (value: Value) => void;
}

export function ChoiceGroup<Value extends string>({
  label,
  hint,
  options,
  value,
  onChange,
}: ChoiceGroupProps<Value>) {
  const labelId = useId();
  const hintId = useId();

  return (
    <div className="choice-group">
      <div className="choice-group__head">
        <span className="choice-group__label" id={labelId}>
          {label}
        </span>
        {hint === undefined ? null : (
          <span className="choice-group__hint" id={hintId}>
            {hint}
          </span>
        )}
      </div>

      <div
        className="button-row"
        role="radiogroup"
        aria-labelledby={labelId}
        aria-describedby={hint === undefined ? undefined : hintId}
      >
        {options.map((option) => {
          const choice: Choice<Value> = typeof option === 'string' ? { value: option } : option;
          const selected = choice.value === value;
          return (
            <button
              key={choice.value}
              type="button"
              role="radio"
              aria-checked={selected}
              className="chip"
              data-active={selected}
              onClick={() => {
                onChange(choice.value);
              }}
            >
              {choice.label ?? choice.value}
            </button>
          );
        })}
      </div>
    </div>
  );
}
