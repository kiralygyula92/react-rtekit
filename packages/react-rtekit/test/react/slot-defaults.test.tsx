import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { defaultSlots } from '../../src/react/slots/defaults.js';
import type { RteSlots } from '../../src/types/slots.js';

/**
 * Every default slot, rendered once.
 *
 * The slot table is public API: `slots.X` replaces a part, and the default is both the
 * fallback and the worked example of what that part is supposed to do. Nothing rendered
 * most of them in a unit test, because each is reached only through the feature that
 * owns it — and three shipped as `() => <div className="…" />`, a real element with no
 * content at all. The emoji button opened an empty card, the table controls were a blank
 * box, and a table, once inserted, could not be deleted.
 *
 * Two questions here, both of which those three would have failed: does the slot render
 * anything, and does it render the children it was handed. The second is the contract
 * `SlotBaseProps.children` states in as many words — "a replacement that drops it renders
 * an empty shell" — which is exactly what the defaults themselves were doing.
 */

/** A prop bag wide enough for any slot; each takes what it needs and ignores the rest. */
const props = {
  children: <span data-testid="slot-child">content</span>,
  editor: {} as never,
  focused: false,
  disabled: false,
  readOnly: false,
  empty: false,
  invalid: false,
  text: 'text',
  label: 'Label',
  htmlFor: 'field',
  id: 'field',
  required: false,
  hidden: false,
  open: true,
  anchor: null,
  placement: 'bottom' as const,
  selected: false,
  active: false,
  activeIndex: 0,
  index: 0,
  matches: 0,
  query: '',
  replacement: '',
  items: [{ key: 'a', label: 'A', data: 'a' }],
  options: [{ value: 'a', label: 'A' }],
  hiddenItems: [],
  value: 'a',
  checked: false,
  emptyMessage: 'Nothing',
  tagKey: 'first_name',
  selectionRect: null,
  html: '<p>x</p>',
  error: null,
  nearLimit: false,
  overLimit: false,
  matchCase: false,
  wholeWord: false,
  regex: false,
  upload: { id: 'u1', file: new File(['x'], 'a.png'), progress: 10, status: 'uploading' },
  palette: ['#000000'],
  recent: [],
  columns: 7,
  allowCustom: true,
  allowClear: true,
  draft: { savedAt: Date.now() },
  shortcuts: [],
  onSelect: vi.fn(),
  onChange: vi.fn(),
  onClose: vi.fn(),
  onApply: vi.fn(),
  onCancel: vi.fn(),
  onRemove: vi.fn(),
  onOpen: vi.fn(),
  onClear: vi.fn(),
  onActiveIndexChange: vi.fn(),
  onQueryChange: vi.fn(),
  onReplacementChange: vi.fn(),
  onNext: vi.fn(),
  onPrevious: vi.fn(),
  onReplace: vi.fn(),
  onReplaceAll: vi.fn(),
  onToggle: vi.fn(),
  onRestore: vi.fn(),
  onDiscard: vi.fn(),
  onRetry: vi.fn(),
  onCancelUpload: vi.fn(),
  retry: vi.fn(),
  cancel: vi.fn(),
  validate: () => null,
};

/**
 * The one slot that cannot be rendered on its own.
 *
 * `ShortcutHelpDialog` is a composite: it reaches for `slots.Dialog` to draw itself, so
 * it needs the slot table in context rather than just its props. That is a property of
 * that slot, not a defect, and `chrome.test.tsx` renders it inside a real editor.
 */
const NEEDS_EDITOR: (keyof RteSlots)[] = ['ShortcutHelpDialog'];

const names = (Object.keys(defaultSlots) as (keyof RteSlots)[]).filter(
  (name) => !NEEDS_EDITOR.includes(name),
);

/**
 * The slots that wrap something.
 *
 * Listed rather than derived: a slot that renders its own content from props — the
 * placeholder from `text`, the chip from `label`, a text input from `value` — is right
 * to ignore `children`, and only the containers are wrong to.
 */
const CONTAINERS: (keyof RteSlots)[] = [
  'Root',
  'Toolbar',
  'ToolbarGroup',
  'ContentWrapper',
  'Footer',
  'ImageDialog',
  'ImagePopover',
  'TablePicker',
  'TableToolbar',
  'FloatingToolbar',
  'BubbleMenu',
  'FullscreenPortal',
  'Menu',
  'MenuItem',
  'Button',
  'IconButton',
];

describe('the default slot table', () => {
  it('has an entry for every slot', () => {
    expect(names.length).toBeGreaterThan(40);
  });

  it.each(names)('%s renders', (name) => {
    const Slot = defaultSlots[name] as React.ComponentType<Record<string, unknown>>;
    const before = document.body.innerHTML.length;
    render(<Slot {...props} />);

    // Measured on the body rather than the container, because the popover and the
    // dialog render into a portal. Not a crash, and not nothing: a slot that renders
    // `null` for these props is a part of the editor that would never appear.
    expect(document.body.innerHTML.length).toBeGreaterThan(before);
  });

  it.each(CONTAINERS)('%s renders the children it is given', (name) => {
    const Slot = defaultSlots[name] as React.ComponentType<Record<string, unknown>>;
    render(<Slot {...props} />);

    expect(screen.getByTestId('slot-child')).toBeInTheDocument();
  });
});

describe('the slots that had no content at all', () => {
  /**
   * The three that shipped as an empty `<div>`. Kept as their own case because the
   * failure was not that they threw — they rendered perfectly, and rendered nothing.
   */
  it('the emoji picker draws a row per emoji', () => {
    const EmojiPicker = defaultSlots.EmojiPicker;
    const items = [
      { key: 'grinning', label: 'grinning', icon: '😀', data: '😀' },
      { key: 'joy', label: 'joy', icon: '😂', data: '😂' },
    ];
    render(
      <EmojiPicker
        items={items}
        query=""
        activeIndex={0}
        onSelect={vi.fn()}
        onActiveIndexChange={vi.fn()}
        emptyMessage="Nothing"
      />,
    );

    expect(screen.getByRole('option', { name: 'grinning' })).toBeInTheDocument();
    expect(screen.getByText('😂')).toBeInTheDocument();
  });

  it('the emoji picker says so when nothing matches', () => {
    const EmojiPicker = defaultSlots.EmojiPicker;
    render(
      <EmojiPicker
        items={[]}
        query="zzz"
        activeIndex={-1}
        onSelect={vi.fn()}
        onActiveIndexChange={vi.fn()}
        emptyMessage="No emoji found"
      />,
    );

    expect(screen.getByText('No emoji found')).toBeInTheDocument();
  });

  it('the table controls render the buttons passed to them', () => {
    const TableToolbar = defaultSlots.TableToolbar;
    render(
      <TableToolbar>
        <button type="button">Delete table</button>
      </TableToolbar>,
    );

    expect(screen.getByRole('button', { name: 'Delete table' })).toBeInTheDocument();
  });
});
