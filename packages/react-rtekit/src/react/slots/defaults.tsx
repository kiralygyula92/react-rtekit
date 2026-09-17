import { forwardRef } from 'react';
import type {
  RteSlots,
  SlotBaseProps,
  ToolbarButtonSlotProps,
  ToolbarDropdownSlotProps,
} from '../../types/slots.js';
import { ColorPicker } from '../ui/ColorPicker.js';
import { Popover } from '../ui/Popover.js';
import { Dialog } from '../ui/Dialog.js';
import { LinkForm } from '../ui/LinkForm.js';
import { RestoreDraftPrompt, ShortcutHelpDialog } from '../ui/chrome-panels.js';
import { FindReplacePanel } from '../plugins/FindReplaceUi.js';
import { SourceViewPanel } from '../plugins/SourceViewUi.js';
import {
  Button,
  Checkbox,
  IconButton,
  Select,
  Spinner,
  TextInput,
  Tooltip,
} from '../ui/primitives.js';
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
    { active, disabled, label, shortcut, icon, showLabel, className, command, type: _type, ...rest },
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

const DefaultToolbarDropdown = forwardRef<HTMLButtonElement, ToolbarDropdownSlotProps & SlotBaseProps>(
  function DefaultToolbarDropdown(
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
  },
);

/** The default implementation of every slot. */
export const defaultSlots: RteSlots = {
  Root: ({ children, className, style }) => (
    <div className={cx('rte-root', className)} style={style}>
      {children}
    </div>
  ),
  Toolbar: ({ children, className, style, ...rest }) => (
    <div className={cx('rte-toolbar', className)} style={style} {...rest}>
      {children}
    </div>
  ),
  ToolbarGroup: ({ children, className }) => (
    <div className={cx('rte-toolbar__group', className)} role="group">
      {children}
    </div>
  ),
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
  ToolbarOverflow: ({ hiddenItems, label, className }) => (
    <div className={cx('rte-toolbar__overflow', className)} aria-label={label}>
      {hiddenItems.length}
    </div>
  ),
  ColorPicker,
  ContentWrapper: ({ children, className }) => (
    <div className={cx('rte-content-wrapper', className)}>{children}</div>
  ),
  Content: ({ className, style, ...rest }) => (
    // The engine owns the real contenteditable; this is only the host element.
    <div className={cx('rte-content-host', className)} style={style} {...rest} />
  ),
  Placeholder: ({ text, className }) => (
    <div className={cx('rte-placeholder', className)} aria-hidden="true">
      {text}
    </div>
  ),
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
  Footer: ({ children, className }) => <div className={cx('rte-footer', className)}>{children}</div>,
  LinkPopover: LinkForm,
  ImageDialog: ({ children, className }) => (
    <div className={cx('rte-image-dialog', className)}>{children}</div>
  ),
  ImagePopover: ({ children, className }) => (
    <div className={cx('rte-image-popover', className)}>{children}</div>
  ),
  UploadPlaceholder: ({ upload, retry, cancel, className }) => (
    <div className={cx('rte-upload', className)} data-status={upload.status}>
      <progress value={upload.progress} max={100} />
      {upload.status === 'error' ? (
        <Button onClick={retry}>Retry</Button>
      ) : (
        <Button onClick={cancel}>Cancel</Button>
      )}
    </div>
  ),
  TablePicker: ({ children, className }) => (
    <div className={cx('rte-table-picker', className)}>{children}</div>
  ),
  /*
   * Renders its children, which it did not. The table controls — insert a row, delete a
   * column, delete the table — are passed to this slot, and the default dropped them on
   * the floor and rendered an empty box, so a table in the document had a menu with
   * nothing in it and no way to remove it.
   */
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
  MergeTagChip: ({ tagKey, label, selected, className }) => (
    <span
      className={cx('rte-merge-tag', className)}
      data-merge-tag={tagKey}
      data-selected={selected}
    >
      {label}
    </span>
  ),
  SlashMenu: ({ items, activeIndex, onSelect, emptyMessage, className }) => (
    <div className={cx('rte-suggest', className)} role="listbox">
      {items.length === 0 ? <div className="rte-suggest__empty">{emptyMessage}</div> : null}
      {items.map((item, index) => (
        <button
          key={item.key}
          type="button"
          role="option"
          aria-selected={index === activeIndex}
          className="rte-menu__item"
          onClick={() => {
            onSelect(index);
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  ),
  /*
   * A grid of characters. This was an empty `<div>` — a real slot, a real popover and
   * nothing inside it — so the emoji button opened a blank box. The rows arrive in the
   * same shape the `:` trigger menu uses, which is what lets one override serve both.
   */
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
  MentionList: ({ className }) => <div className={cx('rte-mention-list', className)} />,
  FloatingToolbar: ({ children, className }) => (
    <div className={cx('rte-floating-toolbar', className)}>{children}</div>
  ),
  BubbleMenu: ({ children, className }) => (
    <div className={cx('rte-bubble-menu', className)}>{children}</div>
  ),
  FindReplacePanel,
  SourceView: SourceViewPanel,
  FullscreenPortal: ({ children, className }) => (
    <div className={cx('rte-fullscreen', className)}>{children}</div>
  ),
  RestoreDraftPrompt,
  ShortcutHelpDialog,
  // ── primitives ───────────────────────────────────────────────────────────
  Tooltip,
  Menu: ({ open, label, children, className }) =>
    open ? (
      <div className={cx('rte-menu', className)} role="menu" aria-label={label} tabIndex={-1}>
        {children}
      </div>
    ) : null,
  MenuItem: ({ selected, disabled, onSelect, children, className }) => (
    <button
      type="button"
      role="menuitem"
      className={cx('rte-menu__item', className)}
      data-active={selected}
      disabled={disabled}
      onClick={onSelect}
    >
      {children}
    </button>
  ),
  Popover: ({ open, anchor, onClose, label, placement, children, className }) => (
    <Popover
      open={open}
      anchor={anchor}
      onClose={onClose}
      label={label}
      {...(placement ? { placement } : {})}
      {...(className ? { className } : {})}
    >
      {children}
    </Popover>
  ),
  Dialog,
  Button: ({ variant, disabled, onClick, children, className }) => (
    <Button variant={variant} disabled={disabled} onClick={onClick} className={className}>
      {children}
    </Button>
  ),
  IconButton: ({ label, disabled, onClick, children, className }) => (
    <IconButton label={label} disabled={disabled} onClick={onClick} className={className}>
      {children}
    </IconButton>
  ),
  TextInput: ({ label, value, onChange, invalid, className }) => (
    <TextInput
      {...(label ? { label } : {})}
      value={value}
      onChange={onChange}
      {...(invalid !== undefined ? { invalid } : {})}
      {...(className ? { className } : {})}
    />
  ),
  Select: ({ label, value, options, onChange, className }) => (
    <Select
      {...(label ? { label } : {})}
      value={value}
      options={options}
      onChange={onChange}
      {...(className ? { className } : {})}
    />
  ),
  Checkbox: ({ label, checked, onChange, className }) => (
    <Checkbox label={label} checked={checked} onChange={onChange} {...(className ? { className } : {})} />
  ),
  Spinner: ({ label, className }) => (
    <Spinner {...(label ? { label } : {})} {...(className ? { className } : {})} />
  ),
};

/** Merges consumer slot overrides onto the defaults. */
export function resolveSlots(overrides: Partial<RteSlots> | undefined): RteSlots {
  return overrides ? { ...defaultSlots, ...overrides } : defaultSlots;
}
