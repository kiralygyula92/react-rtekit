import { useEffect, useMemo, useState } from 'react';
import type { CommandId } from '../../types/commands.js';
import { buildKeymap, formatShortcut } from '../../core/utils/keymap.js';
import { useEditorContext, useLocalization, useRteSlots } from '../context.js';
import { resolveMessage } from '../localization.js';

/**
 * The keyboard shortcut reference (05 §13, fixes R25).
 *
 * Built from the keymap that is actually in force, not from a written list: an editor
 * whose consumer rebound `Mod+K` should say so, and a help dialog that can disagree
 * with the editor is worse than none.
 *
 * @module
 */

/** Props for {@link ShortcutHelp}. */
export interface ShortcutHelpProps {
  /** The resolved bindings: shortcut → command. */
  keymap: Record<string, CommandId>;
  /** Shortcuts the consumer turned off; listing one would be a lie (05 §13). */
  disabled?: string[];
}

/** Command ids that read as their toolbar label, for the rows that have one. */
const LABELS: Partial<Record<CommandId, keyof ReturnType<typeof useLocalization>['toolbar']>> = {
  toggleBold: 'bold',
  toggleItalic: 'italic',
  toggleUnderline: 'underline',
  toggleStrike: 'strike',
  toggleCode: 'code',
  toggleBulletList: 'bulletList',
  toggleOrderedList: 'orderedList',
  toggleCheckList: 'checkList',
  openLinkEditor: 'link',
  undo: 'undo',
  redo: 'redo',
  clearFormatting: 'clearFormatting',
  openFindReplace: 'findReplace',
  toggleSourceView: 'sourceView',
  toggleFullscreen: 'fullscreen',
  print: 'print',
  indent: 'indent',
  outdent: 'outdent',
  setAlign: 'align',
  setBlockType: 'blockType',
  insertTable: 'table',
  insertImage: 'image',
  insertHorizontalRule: 'horizontalRule',
  insertMergeTag: 'mergeTag',
  insertEmoji: 'emoji',
  pastePlainText: 'more',
};

export function ShortcutHelp({ keymap, disabled }: ShortcutHelpProps) {
  const editor = useEditorContext();
  const t = useLocalization();
  const { slots } = useRteSlots();
  const [open, setOpen] = useState(false);

  useEffect(
    () =>
      editor.registerCommand('openShortcutHelp', (_ctx, next) => {
        setOpen(true);
        next();
        return true;
      }),
    [editor],
  );

  const shortcuts = useMemo(
    () =>
      // `buildKeymap` applies `disableShortcuts`, which is the same filter the
      // keyboard listener uses — so the dialog and the editor cannot disagree.
      buildKeymap(keymap, disabled ?? [])
        .map((entry) => [entry.source, entry.handler] as const)
        .map(([keys, command]) => {
          const label = LABELS[command];
          return {
            // The glyphs are platform-specific: ⌘ on a Mac, Ctrl everywhere else.
            keys: formatShortcut(keys),
            label: label ? resolveMessage(t.toolbar[label]) : command,
          };
        })
        .sort((a, b) => a.label.localeCompare(b.label)),
    [disabled, keymap, t.toolbar],
  );

  if (!open) return null;

  const Dialog = slots.ShortcutHelpDialog;
  return (
    <Dialog
      shortcuts={shortcuts}
      onClose={() => {
        setOpen(false);
        editor.focus('restore');
      }}
    />
  );
}
