import { forwardRef } from 'react';
import type {
  RteSlots,
  SlotBaseProps,
  ToolbarButtonSlotProps,
  ToolbarDropdownSlotProps,
} from '../../types/slots.js';
import { ColorPicker } from '../ui/ColorPicker.js';
import { Dialog } from '../ui/Dialog.js';
import { LinkForm } from '../ui/LinkForm.js';
import { RestoreDraftPrompt, ShortcutHelpDialog } from '../ui/chrome-panels.js';
import { FindReplacePanel } from '../plugins/FindReplaceUi.js';
import { SourceViewPanel } from '../plugins/SourceViewUi.js';
import { defaultIcons } from '../../icons/index.js';

/**
 * The default slot implementations.
 *
 * Every one is a plain element that spreads the props it is given, so an override that
 * spreads them back keeps all the behaviour — including the `mousedown` prevention that
 * makes toolbar commands apply to the selection (fixes R5).
 *
 * @module
 */

/** Joins class names, dropping the empty ones. */
function cx(...values: (string | false | null | undefined)[]): string {
  return values.filter(Boolean).join(' ');
}

const DefaultToolbarButton = forwardRef<HTMLButtonElement, ToolbarButtonSlotProps & SlotBaseProps>(
  function DefaultToolbarButton(
    {
      active,
      disabled,
      label,
      shortcut,
      icon,
      showLabel,
      className,
      command,
      type: _type,
      ...rest
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type="button"
        className={cx('rte-toolbar__button', className)}
        data-active={active}
        data-command={command}
        {...(showLabel ? { 'data-show-label': 'true' } : {})}
        disabled={disabled}
        title={shortcut ? `${label} (${shortcut})` : label}
        {...rest}
      >
        {icon}
        {showLabel ? <span className="rte-toolbar__button-label">{label}</span> : null}
      </button>
    );
  },
);

const DefaultToolbarToggle = forwardRef<HTMLButtonElement, ToolbarButtonSlotProps>(
  function DefaultToolbarToggle(props, ref) {
    // The only difference from a button is `aria-pressed`, which the caller supplies.
    return <DefaultToolbarButton ref={ref} {...props} />;
  },
);

const DefaultToolbarDropdown = forwardRef<
  HTMLButtonElement,
  ToolbarDropdownSlotProps & SlotBaseProps
>(function DefaultToolbarDropdown(
  {
    value,
    options,
    onSelect: _onSelect,
    open,
    onOpenChange: _onOpenChange,
    icon,
    label,
    className,
    shortcut: _shortcut,
    active: _active,
    showLabel: _showLabel,
    command: _command,
    type: _type,
    ...rest
  },
  ref,
) {
  const current = options.find((option) => option.value === value);
  return (
    <button
      ref={ref}
      type="button"
      className={cx('rte-toolbar__button', 'rte-toolbar__dropdown', className)}
      data-open={open}
      title={label}
      {...rest}
    >
      {icon}
      <span className="rte-toolbar__dropdown-value">{current?.label ?? label}</span>
      {defaultIcons.chevronDown}
    </button>
  );
});

/** The default implementation of every slot. */
export const defaultSlots: RteSlots = {
  ToolbarSeparator: ({ className }) => (
    <span
      className={cx('rte-toolbar__separator', className)}
      role="separator"
      aria-orientation="vertical"
    />
  ),
  ToolbarButton: DefaultToolbarButton as RteSlots['ToolbarButton'],
  ToolbarToggle: DefaultToolbarToggle as RteSlots['ToolbarToggle'],
  ToolbarDropdown: DefaultToolbarDropdown as RteSlots['ToolbarDropdown'],
  ColorPicker,
  Label: ({ htmlFor, required, hidden, children, className }) => (
    <label
      className={cx('rte-label', hidden && 'rte-visually-hidden', className)}
      htmlFor={htmlFor}
      data-required={required}
    >
      {children}
    </label>
  ),
  HelperText: ({ id, children, className }) => (
    <div id={id} className={cx('rte-helper', className)}>
      {children}
    </div>
  ),
  ErrorText: ({ id, children, className }) => (
    <div id={id} className={cx('rte-error', className)} role="alert">
      {children}
    </div>
  ),
  Counter: ({ id, text, nearLimit, overLimit, className }) => (
    <div
      id={id}
      className={cx('rte-counter', className)}
      data-near-limit={nearLimit}
      data-over-limit={overLimit}
      aria-live="polite"
    >
      {text}
    </div>
  ),
  LinkPopover: LinkForm,
  ImagePopover: ({ children, className }) => (
    <div className={cx('rte-image-popover', className)}>{children}</div>
  ),
  TableToolbar: ({ children, className }) => (
    <div className={cx('rte-table-toolbar', className)}>{children}</div>
  ),
  InlineSuggestMenu: ({ items, activeIndex, onSelect, emptyMessage, className }) => (
    <div className={cx('rte-suggest', className)} role="listbox">
      {items.length === 0 ? (
        <div className="rte-suggest__empty">{emptyMessage}</div>
      ) : (
        items.map((item, index) => (
          <button
            key={item.key}
            type="button"
            role="option"
            aria-selected={index === activeIndex}
            className="rte-menu__item"
            data-highlighted={index === activeIndex}
            onMouseDown={(event) => {
              event.preventDefault();
            }}
            onClick={() => {
              onSelect(index);
            }}
          >
            {item.icon ? <span className="rte-menu__icon">{item.icon}</span> : null}
            <span className="rte-menu__label">{item.label}</span>
            {item.description ? (
              <span className="rte-menu__description">{item.description}</span>
            ) : null}
          </button>
        ))
      )}
    </div>
  ),
  EmojiPicker: ({ items, activeIndex, onSelect, emptyMessage, className }) =>
    items.length === 0 ? (
      <div className={cx('rte-emoji-picker', className)}>
        <div className="rte-suggest__empty">{emptyMessage}</div>
      </div>
    ) : (
      <div className={cx('rte-emoji-picker', className)} role="listbox" aria-label="Emoji">
        {items.map((item, index) => (
          <button
            key={item.key}
            type="button"
            role="option"
            aria-selected={index === activeIndex}
            aria-label={typeof item.label === 'string' ? item.label : undefined}
            title={typeof item.label === 'string' ? item.label : undefined}
            className="rte-emoji-picker__item"
            data-highlighted={index === activeIndex}
            onMouseDown={(event) => {
              // The editor keeps the selection the emoji is going to be inserted into.
              event.preventDefault();
            }}
            onClick={() => {
              onSelect(index);
            }}
          >
            {item.icon}
          </button>
        ))}
      </div>
    ),
  FloatingToolbar: ({ children, className }) => (
    <div className={cx('rte-floating-toolbar', className)}>{children}</div>
  ),
  FindReplacePanel,
  SourceView: SourceViewPanel,
  RestoreDraftPrompt,
  ShortcutHelpDialog,
  // ── primitives ───────────────────────────────────────────────────────────
  Dialog,
};

/** Merges consumer slot overrides onto the defaults. */
export function resolveSlots(overrides: Partial<RteSlots> | undefined): RteSlots {
  return overrides ? { ...defaultSlots, ...overrides } : defaultSlots;
}
