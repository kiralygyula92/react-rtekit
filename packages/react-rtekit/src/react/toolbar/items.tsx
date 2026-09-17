import type { ReactNode } from 'react';
import type { ToolbarItemName, ToolbarItemSpec, ToolbarOption } from '../../types/toolbar.js';
import type { RteLocalization } from '../../types/localization.js';
import type { RteIcons } from '../../types/icons.js';
import type { HeadingLevel } from '../../types/document.js';
import { resolveMessage } from '../localization.js';

/**
 * The built-in toolbar items (04 §2.5).
 *
 * Each one is an ordinary {@link ToolbarItemSpec} — the same shape a plugin or a
 * consumer contributes — so nothing about the built-ins is privileged (06 §2).
 *
 * @module
 */

/** What the registry needs in order to build the items. */
export interface ToolbarItemFactoryOptions {
  /** The icon set the items draw from. */
  icons: RteIcons;
  /** Which levels the heading dropdown offers. */
  headingLevels: HeadingLevel[];
  /** What the font-family dropdown offers. */
  fontFamilies: { label: string; value: string }[];
  /** What the font-size dropdown offers. */
  fontSizes: { label: string; value: string }[];
}

/** A toggle bound to a command, with `aria-pressed` driven by the format state. */
function toggle(
  name: ToolbarItemName,
  icon: ReactNode,
  label: keyof RteLocalization['toolbar'],
  command: ToolbarItemSpec['command'],
  isActive: ToolbarItemSpec['isActive'],
  shortcut?: string,
): ToolbarItemSpec {
  return {
    name,
    kind: 'toggle',
    icon,
    label: (t) => resolveMessage(t.toolbar[label]),
    ...(shortcut ? { shortcut } : {}),
    ...(command ? { command } : {}),
    ...(isActive ? { isActive } : {}),
    group: 'format',
    showIn: ['toolbar', 'bubble', 'overflow'],
  };
}

/** A plain button bound to a command. */
function button(
  name: ToolbarItemName,
  icon: ReactNode,
  label: keyof RteLocalization['toolbar'],
  command: ToolbarItemSpec['command'],
  options: Partial<ToolbarItemSpec> = {},
): ToolbarItemSpec {
  return {
    name,
    kind: 'button',
    icon,
    label: (t) => resolveMessage(t.toolbar[label]),
    ...(command ? { command } : {}),
    group: 'insert',
    showIn: ['toolbar', 'overflow'],
    ...options,
  };
}

/**
 * Builds every built-in item.
 *
 * @example
 * ```ts
 * const items = createBuiltInItems({ icons, headingLevels: [1, 2, 3], … });
 * items.get('bold');
 * ```
 */
export function createBuiltInItems(
  options: ToolbarItemFactoryOptions,
): ReadonlyMap<string, ToolbarItemSpec> {
  const { icons, headingLevels, fontFamilies, fontSizes } = options;
  // Keyed by the built-in names while it is built, so a typo is caught here; handed
  // back keyed by string, because a plugin's item is looked up in the same table.
  const items = new Map<ToolbarItemName, ToolbarItemSpec>();
  const add = (spec: ToolbarItemSpec): void => {
    items.set(spec.name as ToolbarItemName, spec);
  };

  // ── history ──────────────────────────────────────────────────────────────
  add({
    ...button('undo', icons.undo, 'undo', 'undo'),
    shortcut: 'Mod+Z',
    group: 'history',
    isDisabled: ({ format }) => !format.canUndo,
  });
  add({
    ...button('redo', icons.redo, 'redo', 'redo'),
    shortcut: 'Mod+Shift+Z',
    group: 'history',
    isDisabled: ({ format }) => !format.canRedo,
  });

  // ── marks ────────────────────────────────────────────────────────────────
  add(toggle('bold', icons.bold, 'bold', 'toggleBold', ({ format }) => format.marks.bold, 'Mod+B'));
  add(
    toggle('italic', icons.italic, 'italic', 'toggleItalic', ({ format }) => format.marks.italic, 'Mod+I'),
  );
  add(
    toggle(
      'underline',
      icons.underline,
      'underline',
      'toggleUnderline',
      ({ format }) => format.marks.underline,
      'Mod+U',
    ),
  );
  add(
    toggle('strike', icons.strike, 'strike', 'toggleStrike', ({ format }) => format.marks.strike, 'Mod+Shift+X'),
  );
  add(toggle('code', icons.code, 'code', 'toggleCode', ({ format }) => format.marks.code, 'Mod+E'));
  add(
    toggle(
      'subscript',
      icons.subscript,
      'subscript',
      'toggleSubscript',
      ({ format }) => format.marks.subscript,
    ),
  );
  add(
    toggle(
      'superscript',
      icons.superscript,
      'superscript',
      'toggleSuperscript',
      ({ format }) => format.marks.superscript,
    ),
  );

  // ── colour ───────────────────────────────────────────────────────────────
  add({
    name: 'color',
    kind: 'colorPicker',
    // The glyph is tinted with the active colour, exactly as the old editor did
    // (01 §5); `--rte-current-color` is set by the button and read by the preset CSS.
    icon: icons.color,
    label: (t) => resolveMessage(t.toolbar.color),
    command: 'setColor',
    group: 'format',
    showIn: ['toolbar', 'overflow'],
    value: ({ format }) => format.marks.color,
  });
  add({
    name: 'backgroundColor',
    kind: 'colorPicker',
    icon: icons.backgroundColor,
    label: (t) => resolveMessage(t.toolbar.backgroundColor),
    command: 'setBackgroundColor',
    group: 'format',
    showIn: ['toolbar', 'overflow'],
    value: ({ format }) => format.marks.backgroundColor,
  });
  add({
    ...button('clearFormatting', icons.clearFormatting, 'clearFormatting', 'clearFormatting'),
    shortcut: 'Mod+\\',
    group: 'format',
  });

  // ── block type ───────────────────────────────────────────────────────────
  const headingOptions = (): ToolbarOption[] => [
    { value: 'paragraph', label: 'Paragraph' },
    ...headingLevels.map((level) => ({
      value: `heading-${level}`,
      label: `Heading ${level}`,
    })),
  ];
  add({
    name: 'heading',
    kind: 'dropdown',
    icon: icons.heading,
    label: (t) => resolveMessage(t.toolbar.heading),
    group: 'block',
    showIn: ['toolbar', 'overflow'],
    options: headingOptions,
    value: ({ format }) =>
      format.block.type === 'heading' ? `heading-${format.block.headingLevel ?? 1}` : 'paragraph',
    onSelect: (value, { editor }) => {
      const level = value.startsWith('heading-')
        ? (Number(value.slice('heading-'.length)) as HeadingLevel)
        : undefined;
      editor.exec('setBlockType', level ? { type: 'heading', level } : { type: 'paragraph' });
    },
  });
  add({
    name: 'blockType',
    kind: 'dropdown',
    icon: icons.blockType,
    label: (t) => resolveMessage(t.toolbar.blockType),
    group: 'block',
    showIn: ['toolbar', 'overflow'],
    options: (ctx) => [
      ...headingOptions(),
      { value: 'blockquote', label: resolveMessage(ctx.t.toolbar.blockquote) },
      { value: 'codeBlock', label: resolveMessage(ctx.t.toolbar.codeBlock) },
    ],
    value: ({ format }) => {
      if (format.block.type === 'heading') return `heading-${format.block.headingLevel ?? 1}`;
      if (format.block.type === 'blockquote') return 'blockquote';
      if (format.block.type === 'codeBlock') return 'codeBlock';
      return 'paragraph';
    },
    onSelect: (value, { editor }) => {
      if (value === 'blockquote' || value === 'codeBlock') {
        editor.exec('setBlockType', { type: value });
        return;
      }
      const level = value.startsWith('heading-')
        ? (Number(value.slice('heading-'.length)) as HeadingLevel)
        : undefined;
      editor.exec('setBlockType', level ? { type: 'heading', level } : { type: 'paragraph' });
    },
  });
  add(
    toggle(
      'blockquote',
      icons.blockquote,
      'blockquote',
      undefined,
      ({ format }) => format.block.type === 'blockquote',
    ),
  );
  items.get('blockquote')!.onClick = ({ editor, format }) => {
    editor.exec('setBlockType', {
      type: format.block.type === 'blockquote' ? 'paragraph' : 'blockquote',
    });
  };
  add(
    toggle(
      'codeBlock',
      icons.codeBlock,
      'codeBlock',
      undefined,
      ({ format }) => format.block.type === 'codeBlock',
    ),
  );
  items.get('codeBlock')!.onClick = ({ editor, format }) => {
    editor.exec('setBlockType', {
      type: format.block.type === 'codeBlock' ? 'paragraph' : 'codeBlock',
    });
  };

  // ── alignment ────────────────────────────────────────────────────────────
  for (const align of ['left', 'center', 'right', 'justify'] as const) {
    const name = `align${align[0]!.toUpperCase()}${align.slice(1)}` as ToolbarItemName;
    const labelKey = name as 'alignLeft' | 'alignCenter' | 'alignRight' | 'alignJustify';
    add({
      name,
      kind: 'toggle',
      icon: icons[labelKey],
      label: (t) => resolveMessage(t.toolbar[labelKey]),
      shortcut: `Mod+Shift+${align === 'left' ? 'L' : align === 'center' ? 'E' : align === 'right' ? 'R' : 'J'}`,
      command: 'setAlign',
      payload: { align },
      // One canonical value, so "left" highlights exactly when alignment is the
      // default and never disagrees with the tracker (fixes R6).
      isActive: ({ format }) => format.block.align === align,
      group: 'align',
      showIn: ['toolbar', 'overflow'],
    });
  }
  add({
    name: 'align',
    kind: 'dropdown',
    icon: icons.align,
    label: (t) => resolveMessage(t.toolbar.align),
    group: 'align',
    showIn: ['toolbar', 'overflow'],
    options: (ctx) => [
      { value: 'left', label: resolveMessage(ctx.t.toolbar.alignLeft) },
      { value: 'center', label: resolveMessage(ctx.t.toolbar.alignCenter) },
      { value: 'right', label: resolveMessage(ctx.t.toolbar.alignRight) },
      { value: 'justify', label: resolveMessage(ctx.t.toolbar.alignJustify) },
    ],
    value: ({ format }) => format.block.align,
    onSelect: (value, { editor }) => {
      editor.exec('setAlign', { align: value as 'left' | 'center' | 'right' | 'justify' });
    },
  });
  add({ ...button('indent', icons.indent, 'indent', 'indent'), group: 'align' });
  add({ ...button('outdent', icons.outdent, 'outdent', 'outdent'), group: 'align' });

  // ── lists ────────────────────────────────────────────────────────────────
  add(
    toggle(
      'bulletList',
      icons.bulletList,
      'bulletList',
      'toggleBulletList',
      ({ format }) => format.list.type === 'bullet',
      'Mod+Shift+8',
    ),
  );
  add(
    toggle(
      'orderedList',
      icons.orderedList,
      'orderedList',
      'toggleOrderedList',
      ({ format }) => format.list.type === 'ordered',
      'Mod+Shift+7',
    ),
  );
  add(
    toggle(
      'checkList',
      icons.checkList,
      'checkList',
      'toggleCheckList',
      ({ format }) => format.list.type === 'check',
      'Mod+Shift+9',
    ),
  );

  // ── insert ───────────────────────────────────────────────────────────────
  add({
    ...button('link', icons.link, 'link', 'openLinkEditor'),
    kind: 'toggle',
    shortcut: 'Mod+K',
    isActive: ({ format }) => format.link !== null,
  });
  add({
    ...button('unlink', icons.unlink, 'unlink', 'removeLink'),
    isDisabled: ({ format }) => format.link === null,
  });
  add(button('image', icons.image, 'image', 'openImageDialog'));
  add(button('table', icons.table, 'table', 'insertTable'));
  add(button('horizontalRule', icons.horizontalRule, 'horizontalRule', 'insertHorizontalRule'));
  add(button('emoji', icons.emoji, 'emoji', 'insertEmoji'));
  add(button('mergeTag', icons.mergeTag, 'mergeTag', 'openMergeTagMenu'));
  add(button('mention', icons.mention, 'mention', 'insertMention'));

  // ── fonts ────────────────────────────────────────────────────────────────
  add({
    name: 'fontFamily',
    kind: 'dropdown',
    icon: icons.fontFamily,
    label: (t) => resolveMessage(t.toolbar.fontFamily),
    group: 'format',
    showIn: ['toolbar', 'overflow'],
    options: () => fontFamilies.map((font) => ({ value: font.value, label: font.label })),
    value: ({ format }) => format.marks.fontFamily,
    onSelect: (value, { editor }) => {
      editor.exec('setFontFamily', { value: value === '' ? null : value });
    },
  });
  add({
    name: 'fontSize',
    kind: 'dropdown',
    icon: icons.fontSize,
    label: (t) => resolveMessage(t.toolbar.fontSize),
    group: 'format',
    showIn: ['toolbar', 'overflow'],
    options: () => fontSizes.map((size) => ({ value: size.value, label: size.label })),
    value: ({ format }) => format.marks.fontSize,
    onSelect: (value, { editor }) => {
      editor.exec('setFontSize', { value: value === '' ? null : value });
    },
  });

  // ── tools ────────────────────────────────────────────────────────────────
  add({ ...button('findReplace', icons.findReplace, 'findReplace', 'openFindReplace'), group: 'tools' });
  add({ ...button('sourceView', icons.sourceView, 'sourceView', 'toggleSourceView'), group: 'tools' });
  add({ ...button('fullscreen', icons.fullscreen, 'fullscreen', 'toggleFullscreen'), group: 'tools' });
  add({ ...button('print', icons.print, 'print', 'print'), group: 'tools' });

  return items;
}
