import { forwardRef, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  RichTextEditor,
  type RteSlots,
  type SlotBaseProps,
  type ToolbarButtonSlotProps,
} from 'react-rtekit';

/**
 * Re-skinning the editor's chrome with a design system's own components.
 *
 * The slots replaced here are the ones a design system usually has an opinion about: the
 * toolbar's buttons and toggles, the field label, the helper text, the counter and the
 * dialog. The features that use them are untouched — the toolbar asks for a
 * `ToolbarButton`, not for this one — and keep their keyboard model, because the
 * replacement forwards the ref and spreads the props it is given.
 */

type ToolbarControlProps = ToolbarButtonSlotProps & SlotBaseProps;

/**
 * A toolbar control in the design system's style.
 *
 * The ref is forwarded and the remaining props are spread: the toolbar's roving focus
 * moves between controls through that ref, and `tabIndex`, `aria-label`, `aria-pressed`
 * and `onMouseDown` arrive in the props. Dropping either breaks the keyboard model.
 */
const DsToolbarControl = forwardRef<HTMLButtonElement, ToolbarControlProps>(
  function DsToolbarControl(
    { active, label, shortcut, icon, showLabel, className, command, type: _type, ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type="button"
        className={['ds-button', 'ds-button--icon', className].filter(Boolean).join(' ')}
        data-active={active}
        data-command={command}
        title={shortcut ? `${label} (${shortcut})` : label}
        {...rest}
      >
        {icon}
        {showLabel ? <span className="ds-button__label">{label}</span> : null}
      </button>
    );
  },
);

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
  ToolbarButton: DsToolbarControl as RteSlots['ToolbarButton'],
  ToolbarToggle: DsToolbarControl as RteSlots['ToolbarToggle'],

  ToolbarSeparator: ({ className }) => (
    <span className={['ds-divider', className].filter(Boolean).join(' ')} role="separator" />
  ),

  Label: ({ htmlFor, required, hidden, children, className }) => (
    <label
      htmlFor={htmlFor}
      className={['ds-field__label', hidden ? 'rte-visually-hidden' : '', className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
      {required ? <span aria-hidden="true"> *</span> : null}
    </label>
  ),

  HelperText: ({ id, children, className }) => (
    <p id={id} className={['ds-hint', className].filter(Boolean).join(' ')}>
      {children}
    </p>
  ),

  Counter: ({ id, text, overLimit, className }) => (
    <span
      id={id}
      className={['ds-hint', className].filter(Boolean).join(' ')}
      data-over={overLimit}
    >
      {text}
    </span>
  ),

  Dialog: DsDialog,
};

const SAMPLE =
  '<p>The toolbar, the label, the hint below the field and the counter are the design ' +
  "system's components. Open the keyboard reference with <strong>Ctrl+/</strong> to see its dialog.</p>";

export default function DesignSystemSkinExample() {
  const [html, setHtml] = useState(SAMPLE);

  return (
    <div className="stack">
      <RichTextEditor
        preset="standard"
        label="Message"
        helperText="Seven slots replaced; every feature behind them unchanged."
        maxLength={500}
        showCounter
        slots={slots}
        value={html}
        onChange={(value) => {
          setHtml(value as string);
        }}
      />

      <p className="callout">
        Seven replacements — the toolbar controls, the field chrome and the dialog. The features
        themselves were not touched: they ask for a <code>ToolbarButton</code> or a{' '}
        <code>Dialog</code>, not for this one, and keep their keyboard model because the replacement
        forwards its ref.
      </p>
    </div>
  );
}
