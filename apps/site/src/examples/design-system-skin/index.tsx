import { useEffect, useRef, useState, type ReactNode } from 'react';
import { RichTextEditor, type RteSlots } from 'react-rtekit';

/**
 * Re-skinning through the twelve primitives.
 *
 * This is the argument for having primitives at all. Replace `Button`, `Popover`,
 * `Dialog`, `TextInput` and the rest, and every feature that uses them follows — the
 * link popover, the image dialog, the colour picker, the table controls, the find
 * panel. No feature knows it has been re-skinned.
 */

/** A stand-in for a design system's own components. */
function DsButton({
  variant = 'text',
  className,
  children,
  ...rest
}: {
  variant?: 'text' | 'solid' | 'outline';
  className?: string;
  children?: ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...rest} className={['ds-button', className].filter(Boolean).join(' ')} data-variant={variant}>
      {children}
    </button>
  );
}

/** A dialog built on the platform's own, which gives focus trapping for free. */
function DsDialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  return (
    <dialog ref={ref} className="ds-dialog" onClose={onClose} aria-label={title}>
      <header className="ds-dialog__header">{title}</header>
      <div className="ds-dialog__body">{children}</div>
    </dialog>
  );
}

const slots: Partial<RteSlots> = {
  Button: DsButton,

  IconButton: ({ label, className, children, ...rest }) => (
    <button
      {...rest}
      aria-label={label}
      title={label}
      className={['ds-button', 'ds-button--icon', className].filter(Boolean).join(' ')}
    >
      {children}
    </button>
  ),

  Dialog: DsDialog,

  TextInput: ({ label, value, onChange, invalid, className }) => (
    <label className={['ds-field', className].filter(Boolean).join(' ')}>
      {label ? <span className="ds-field__label">{label}</span> : null}
      <input
        className="ds-field__input"
        value={value}
        aria-invalid={invalid === true}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      />
    </label>
  ),

  Select: ({ label, value, options, onChange, className }) => (
    <label className={['ds-field', className].filter(Boolean).join(' ')}>
      {label ? <span className="ds-field__label">{label}</span> : null}
      <select
        className="ds-field__input"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  ),

  Checkbox: ({ label, checked, onChange, disabled, className }) => (
    <label className={['ds-check', className].filter(Boolean).join(' ')}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => {
          onChange(event.target.checked);
        }}
      />
      {label}
    </label>
  ),

  Spinner: ({ label, className }) => (
    <span className={['ds-spinner', className].filter(Boolean).join(' ')} role="status" aria-label={label} />
  ),

  Tooltip: ({ title, children, className }) => (
    <span className={['ds-tooltip', className].filter(Boolean).join(' ')} title={title}>
      {children}
    </span>
  ),
};

const SAMPLE =
  '<p>Open the <strong>link</strong> popover, the image dialog or the table picker: all three ' +
  'are built from the primitives replaced in this file.</p>';

export default function DesignSystemSkinExample() {
  const [html, setHtml] = useState(SAMPLE);

  return (
    <div className="stack">
      <RichTextEditor
        preset="full"
        label="Message"
        slots={slots}
        value={html}
        onChange={(value) => {
          setHtml(value as string);
        }}
      />

      <p className="callout">
        Eight replacements, and every dialog, popover, field and busy indicator in the
        editor changed with them. The features themselves were not touched — they ask
        for a <code>Dialog</code>, not for this one.
      </p>
    </div>
  );
}
