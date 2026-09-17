import { Fragment, memo, useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import type { ToolbarItemContext, ToolbarItemSpec } from '../../types/toolbar.js';
import type { CommandId } from '../../types/commands.js';
import type { RteHandlers, ToolbarCommandContext } from '../../types/handlers.js';
import { useEditorContext, useLocalization, useRteConfig, useRteSlots } from '../context.js';
import { useEditorState, useFormatState } from '../hooks.js';
import { resolveMessage } from '../localization.js';
import { Popover } from '../ui/Popover.js';
import { Menu } from '../ui/Menu.js';
import { runHandler } from '../useEditor.js';
import { useToolbarOverflow } from './useToolbarOverflow.js';

/**
 * The toolbar (05 §14).
 *
 * A real `role="toolbar"` with roving tabindex: one tab stop, arrows move between
 * controls, Home/End jump, and Escape returns focus to the editor. Buttons prevent
 * `mousedown` so clicking one never moves focus out and the command always applies to
 * the text that was selected (fixes R5, R16).
 *
 * @module
 */

/** Props for {@link Toolbar}. */
export interface ToolbarProps {
  /** Resolved item groups; separators are the group boundaries. */
  groups: ToolbarItemSpec[][];
  /** The toolbar’s accessible name. @default the catalogue's */
  ariaLabel?: string;
  /** What happens to items that do not fit at this width. @default 'menu' */
  overflow?: 'wrap' | 'menu' | 'scroll';
  /** Keep the toolbar visible while a long document scrolls. */
  sticky?: boolean | { offset?: number };
  /** Show labels beside the icons. */
  showLabels?: boolean;
  /** Control height, which density scales further. */
  size?: 'sm' | 'md';
  /** Interaction middleware, so activations can be wrapped. */
  handlers?: Partial<RteHandlers>;
  /** Appended to the toolbar’s own class name. */
  className?: string;
  /** Rendered at the start of the toolbar row. */
  startAdornment?: ReactNode;
  /** Rendered at the end of the toolbar row, opposite the items. */
  endAdornment?: ReactNode;
}

/** Renders the toolbar. */
export const Toolbar = /* @__PURE__ */ memo(function Toolbar({
  groups,
  ariaLabel,
  overflow = 'menu',
  sticky = false,
  showLabels = false,
  size = 'md',
  handlers,
  className,
  startAdornment,
  endAdornment,
}: ToolbarProps) {
  const editor = useEditorContext();
  const t = useLocalization();
  const { slots } = useRteSlots();
  const config = useRteConfig();
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const format = useFormatState();
  const editable = useEditorState((snapshot) => snapshot.editable);

  const ctx: ToolbarItemContext = useMemo(() => ({ editor, format, t }), [editor, format, t]);

  /** Runs an item, through the `onToolbarCommand` middleware (06 §4). */
  const activate = useCallback(
    (item: ToolbarItemSpec) => {
      const fallback = (resolved: ToolbarCommandContext): void => {
        if (item.onClick) {
          item.onClick({ editor, format, t });
          return;
        }
        if (resolved.command) {
          editor.exec(resolved.command, resolved.payload);
        }
      };
      runHandler<ToolbarCommandContext>(
        handlers?.onToolbarCommand,
        {
          editor,
          command: (item.command ?? '') as CommandId,
          payload: item.payload,
          item,
        },
        fallback,
      );
    },
    [editor, format, handlers?.onToolbarCommand, t],
  );

  /** Roving tabindex: the toolbar is one tab stop and arrows move inside it. */
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    const controls = [
      ...(toolbarRef.current?.querySelectorAll<HTMLElement>('[data-toolbar-control]') ?? []),
    ].filter((element) => !element.hasAttribute('disabled'));
    if (controls.length === 0) return;
    const index = controls.indexOf(event.target as HTMLElement);

    // The scroll container is its own tab stop, and an arrow key from it moves into
    // the row — the way a listbox hands focus to its first option.
    if (event.target === toolbarRef.current) {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      event.preventDefault();
      (event.key === 'ArrowRight' ? controls[0] : controls[controls.length - 1])?.focus();
      return;
    }

    // A popover opened from the toolbar renders into a portal, and React still bubbles
    // its events up this tree. Arrow keys inside the colour picker or a dropdown belong
    // to that widget, not to the toolbar's roving focus.
    if (index < 0) return;

    const focusAt = (next: number): void => {
      event.preventDefault();
      controls[(next + controls.length) % controls.length]?.focus();
    };

    switch (event.key) {
      case 'ArrowRight':
        focusAt(index + 1);
        break;
      case 'ArrowLeft':
        focusAt(index - 1);
        break;
      case 'Home':
        focusAt(0);
        break;
      case 'End':
        focusAt(controls.length - 1);
        break;
      case 'Escape':
        // Focus goes back where the author was working.
        event.preventDefault();
        editor.focus('restore');
        break;
      default:
        break;
    }
  };

  // Only the `menu` behaviour hides anything; `wrap` and `scroll` leave the
  // browser to it (05 §14).
  const { visible, hidden, containerRef } = useToolbarOverflow(groups, overflow === 'menu');
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [overflowAnchor, setOverflowAnchor] = useState<HTMLButtonElement | null>(null);

  /** The first enabled control is the single tab stop. */
  const [rovingName, setRovingName] = useState<string | null>(null);
  const flatItems = useMemo(() => groups.flat(), [groups]);
  // In `scroll` mode the container holds the tab stop, so the items must not also
  // hold one — a toolbar is one stop either way (05 §14).
  const containerIsTabStop = overflow === 'scroll';
  const tabStop = containerIsTabStop
    ? null
    : rovingName && flatItems.some((item) => item.name === rovingName)
      ? rovingName
      : (flatItems[0]?.name ?? null);

  const stickyOffset = typeof sticky === 'object' ? (sticky.offset ?? 0) : 0;

  return (
    <div
      ref={(element) => {
        toolbarRef.current = element;
        containerRef(element);
      }}
      className={['rte-toolbar', className].filter(Boolean).join(' ')}
      role="toolbar"
      aria-label={ariaLabel ?? resolveMessage(t.toolbar.label)}
      aria-controls={`${editor.id}-content-editable`}
      aria-orientation="horizontal"
      data-overflow={overflow}
      data-size={size}
      tabIndex={containerIsTabStop ? 0 : undefined}
      {...(sticky ? { 'data-sticky': 'true' } : {})}
      style={sticky ? ({ '--rte-toolbar-sticky-offset': `${stickyOffset}px` } as React.CSSProperties) : undefined}
      onKeyDown={onKeyDown}
      onFocus={(event) => {
        const name = (event.target as HTMLElement).dataset.item;
        if (name) setRovingName(name);
      }}
    >
      {startAdornment ? <div className="rte-toolbar__adornment">{startAdornment}</div> : null}

      {visible.map((group, groupIndex) => (
        // Groups are positional; their contents are what identifies them.
        <Fragment key={`group-${groupIndex}`}>
          {/* A group boundary *is* the separator: the classic toolbar's two dividers
              are the two gaps in its three groups (01 §5). */}
          {groupIndex > 0 ? <slots.ToolbarSeparator /> : null}
          <div className="rte-toolbar__group" role="group">
            {group.map((item) => (
              <ToolbarItem
                key={item.name}
                item={item}
                config={config}
                ctx={ctx}
                editable={editable}
                isTabStop={item.name === tabStop}
                onActivate={activate}
                showLabel={showLabels}
                slots={slots}
              />
            ))}
          </div>
        </Fragment>
      ))}

      {hidden.length > 0 ? (
        <>
          <slots.ToolbarButton
            ref={setOverflowAnchor}
            command={undefined}
            active={overflowOpen}
            disabled={false}
            label={resolveMessage(t.toolbar.more)}
            aria-label={resolveMessage(t.toolbar.more)}
            aria-haspopup="menu"
            aria-expanded={overflowOpen}
            icon={null}
            showLabel={false}
            tabIndex={-1}
            type="button"
            data-toolbar-control
            data-item="overflow"
            onMouseDown={(event) => {
              event.preventDefault();
            }}
            onClick={() => {
              setOverflowOpen((previous) => !previous);
            }}
          />
          <Popover
            open={overflowOpen}
            anchor={overflowAnchor}
            onClose={() => {
              setOverflowOpen(false);
            }}
            label={resolveMessage(t.toolbar.more)}
            noPadding
          >
            <div className="rte-toolbar__overflow" role="group" aria-label={resolveMessage(t.toolbar.more)}>
              {hidden.map((group, groupIndex) => (
                <div key={`overflow-group-${groupIndex}`} className="rte-toolbar__group" role="group">
                  {group.map((item) => (
                    <ToolbarItem
                      key={item.name}
                      item={item}
                      config={config}
                      ctx={ctx}
                      editable={editable}
                      isTabStop={false}
                      onActivate={(activated) => {
                        activate(activated);
                        setOverflowOpen(false);
                      }}
                      showLabel
                      slots={slots}
                    />
                  ))}
                </div>
              ))}
            </div>
          </Popover>
        </>
      ) : null}

      {endAdornment ? <div className="rte-toolbar__adornment">{endAdornment}</div> : null}
    </div>
  );
});

/** Props for one rendered toolbar control. */
interface ToolbarItemProps {
  item: ToolbarItemSpec;
  config: ReturnType<typeof useRteConfig>;
  ctx: ToolbarItemContext;
  editable: boolean;
  isTabStop: boolean;
  showLabel: boolean;
  onActivate: (item: ToolbarItemSpec) => void;
  slots: ReturnType<typeof useRteSlots>['slots'];
}

/** One control: a toggle, a button, a dropdown or a colour picker. */
function ToolbarItem({
  item,
  config,
  ctx,
  editable,
  isTabStop,
  showLabel,
  onActivate,
  slots,
}: ToolbarItemProps) {
  const [open, setOpen] = useState(false);
  // State rather than a ref: the popover needs the element during render to position
  // itself, and reading a ref there is not something React guarantees.
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);

  if (item.name === '|' || item.kind === 'separator') {
    return <span className="rte-toolbar__separator" role="separator" aria-orientation="vertical" />;
  }

  if (item.render) return <>{item.render(ctx)}</>;

  const label = typeof item.label === 'function' ? item.label(ctx.t) : item.label;
  const text = typeof label === 'string' ? label : item.name;
  const icon = typeof item.icon === 'function' ? item.icon(ctx) : item.icon;
  const disabled = !editable || (item.isDisabled?.(ctx) ?? false);
  const active = item.isActive?.(ctx) ?? false;

  const shared = {
    command: item.command,
    active,
    disabled,
    label: text,
    ...(item.shortcut ? { shortcut: item.shortcut } : {}),
    icon,
    showLabel,
    tabIndex: isTabStop ? 0 : -1,
    type: 'button' as const,
    'aria-label': text,
  };

  // ── dropdown ─────────────────────────────────────────────────────────────
  if (item.kind === 'dropdown') {
    const options = (typeof item.options === 'function' ? item.options(ctx) : (item.options ?? [])).map(
      (option) => ({
        value: option.value,
        label: typeof option.label === 'function' ? option.label(ctx.t) : option.label,
        text: typeof option.label === 'string' ? option.label : option.value,
      }),
    );
    const value = item.value?.(ctx) ?? null;
    const Dropdown = slots.ToolbarDropdown;

    return (
      <>
        <Dropdown
          {...shared}
          ref={setAnchor}
          value={value}
          options={options}
          open={open}
          onOpenChange={setOpen}
          onSelect={(next: string) => {
            item.onSelect?.(next, ctx);
            setOpen(false);
          }}
          onMouseDown={(event) => {
            event.preventDefault();
          }}
          onClick={() => {
            setOpen((previous) => !previous);
          }}
          aria-expanded={open}
          aria-haspopup="menu"
          data-toolbar-control
          data-item={item.name}
        />
        <Popover
          open={open}
          anchor={anchor}
          onClose={() => {
            setOpen(false);
          }}
          label={text}
          noPadding
        >
          <Menu
            options={options}
            value={value}
            label={text}
            onSelect={(next) => {
              item.onSelect?.(next, ctx);
              setOpen(false);
            }}
          />
        </Popover>
      </>
    );
  }

  // ── colour picker ────────────────────────────────────────────────────────
  if (item.kind === 'colorPicker') {
    const current = item.value?.(ctx) ?? null;
    const Toggle = slots.ToolbarButton;
    const ColorPickerSlot = slots.ColorPicker;

    return (
      <>
        <Toggle
          {...shared}
          ref={setAnchor}
          // Read by the classic preset to tint the glyph with the active colour,
          // exactly as the old editor did (01 §5).
          style={current ? ({ '--rte-current-color': current } as React.CSSProperties) : undefined}
          onMouseDown={(event) => {
            event.preventDefault();
          }}
          onClick={() => {
            setOpen((previous) => !previous);
          }}
          aria-haspopup="dialog"
          aria-expanded={open}
          data-toolbar-control
          data-item={item.name}
        />
        <Popover
          open={open}
          anchor={anchor}
          onClose={() => {
            setOpen(false);
          }}
          label={text}
        >
          <ColorPickerSlot
            value={current}
            palette={config.colors.palette}
            recent={config.colors.recent}
            columns={config.colors.columns}
            allowCustom={config.colors.allowCustom}
            allowClear={config.colors.allowClear}
            onSelect={(color: string) => {
              ctx.editor.exec(item.command as 'setColor', { color });
              config.colors.remember(color);
              setOpen(false);
            }}
            onClear={() => {
              // `null` removes the format rather than writing black (fixes R14).
              ctx.editor.exec(item.command as 'setColor', { color: null });
              setOpen(false);
            }}
            onClose={() => {
              setOpen(false);
            }}
          />
        </Popover>
      </>
    );
  }

  // ── button and toggle ────────────────────────────────────────────────────
  const Control = item.kind === 'toggle' ? slots.ToolbarToggle : slots.ToolbarButton;
  return (
    <Control
      {...shared}
      {...(item.kind === 'toggle' ? { 'aria-pressed': active } : {})}
      onMouseDown={(event) => {
        // The single most important line in the toolbar: without it the editor loses
        // focus and the command runs against a stale selection (fixes R5).
        event.preventDefault();
      }}
      onClick={() => {
        onActivate(item);
      }}
      data-toolbar-control
      data-item={item.name}
    />
  );
}
