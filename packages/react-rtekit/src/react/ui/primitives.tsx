import {
  forwardRef,
  useId,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react';

/**
 * The small primitives.
 *
 * Roughly a dozen components that every other part of the UI is built from. Overriding
 * just these through `slots` re-skins the entire editor for a design system, which is
 * the point of keeping them this plain.
 *
 * @module
 */

/** Props for {@link Button}. */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual weight. @default 'text' */
  variant?: 'text' | 'solid' | 'outline';
  /** The button’s content. */
  children?: ReactNode;
}

/** A text, solid or outlined button. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'text', className, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={['rte-button', className].filter(Boolean).join(' ')}
      data-variant={variant}
      {...rest}
    />
  );
});

/** Props for {@link IconButton}. */
export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> {
  /** Required: the control is icon-only, so it has no other accessible name. */
  label: string;
  /** The icon. */
  children?: ReactNode;
}

/** An icon-only button. The label is always announced. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      className={['rte-button', 'rte-icon-button', className].filter(Boolean).join(' ')}
      {...rest}
    />
  );
});

/** Props for {@link TextInput}. */
export interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  /** Visible label, rendered above the field. */
  label?: string;
  /** The current value. */
  value: string;
  /** Called with the new value, not the event. */
  onChange: (value: string) => void;
  /** Marks the field as failing validation. */
  invalid?: boolean;
  /** Message rendered below the field and linked with `aria-describedby`. */
  error?: string;
}

/** A labelled text input. */
export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { label, value, onChange, invalid, error, className, id, ...rest },
  ref,
) {
  const generated = useId();
  const inputId = id ?? generated;
  const errorId = `${inputId}-error`;

  return (
    <div className="rte-field">
      {label ? (
        <label className="rte-field-label" htmlFor={inputId}>
          {label}
        </label>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        className={['rte-input', className].filter(Boolean).join(' ')}
        value={value}
        aria-invalid={invalid === true ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        {...rest}
      />
      {error ? (
        <div id={errorId} className="rte-error" role="alert">
          {error}
        </div>
      ) : null}
    </div>
  );
});

/** Props for {@link Select}. */
export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  /** Visible label, rendered above the field. */
  label?: string;
  /** The selected option’s value. */
  value: string;
  /** Everything the select offers, in order. */
  options: { value: string; label: string }[];
  /** Called with the chosen value, not the event. */
  onChange: (value: string) => void;
}

/** A labelled native select. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, value, options, onChange, className, id, ...rest },
  ref,
) {
  const generated = useId();
  const selectId = id ?? generated;
  return (
    <div className="rte-field">
      {label ? (
        <label className="rte-field-label" htmlFor={selectId}>
          {label}
        </label>
      ) : null}
      <select
        ref={ref}
        id={selectId}
        className={['rte-input', className].filter(Boolean).join(' ')}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
});

/** Props for {@link Checkbox}. */
export interface CheckboxProps {
  /** The visible label, which is also the accessible name. */
  label: string;
  /** Whether the box is ticked. */
  checked: boolean;
  /** Called with the new state, not the event. */
  onChange: (checked: boolean) => void;
  /** Whether the control can be used. */
  disabled?: boolean;
  /** Appended to the part’s own class name. */
  className?: string;
}

/** A labelled checkbox. */
export function Checkbox({ label, checked, onChange, disabled, className }: CheckboxProps) {
  return (
    <label className={['rte-checkbox', className].filter(Boolean).join(' ')}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => {
          onChange(event.target.checked);
        }}
      />
      <span>{label}</span>
    </label>
  );
}

/** Props for {@link Spinner}. */
export interface SpinnerProps {
  /** Announced to assistive technology while the spinner is visible. */
  label?: string;
  /** Appended to the spinner’s own class name. */
  className?: string;
}

/** An indeterminate progress indicator. */
export function Spinner({ label, className }: SpinnerProps) {
  return (
    <span
      className={['rte-spinner', className].filter(Boolean).join(' ')}
      role="status"
      aria-label={label}
    />
  );
}

/** Props for {@link Tooltip}. */
export interface TooltipProps {
  /** The tooltip’s text. */
  title: string;
  /** The element the tooltip describes. */
  children: ReactNode;
  /** Appended to the wrapper’s own class name. */
  className?: string;
}

/**
 * A tooltip.
 *
 * The default implementation is deliberately the native `title` attribute on a
 * wrapper: it needs no portal, no timers and no focus management, and every toolbar
 * control already carries an `aria-label`, so the tooltip is a convenience rather than
 * the accessible name. Design systems replace this slot with their own.
 */
export function Tooltip({ title, children, className }: TooltipProps) {
  return (
    <span className={['rte-tooltip', className].filter(Boolean).join(' ')} title={title}>
      {children}
    </span>
  );
}
