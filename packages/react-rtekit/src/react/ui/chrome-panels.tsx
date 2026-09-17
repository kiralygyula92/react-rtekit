import type { RestoreDraftPromptSlotProps } from '../../types/slots.js';
import { useLocalization, useRteSlots } from '../context.js';
import { resolveMessage } from '../localization.js';
import { Button } from './primitives.js';

/**
 * Default panels for the chrome that arrives with milestone 4.
 *
 * Every string comes from `localization`, including the ones that read like
 * boilerplate — "Restore", "Discard", "Close". Those are exactly the strings the old
 * implementation hard-coded (fixes R17).
 *
 * @module
 */

/** How long ago the draft was written, in words. */
function savedAgo(savedAt: number): string {
  const seconds = Math.max(0, Math.round((Date.now() - savedAt) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  return `${Math.round(minutes / 60)}h`;
}

/** "Restore draft?" (03 §7). */
export function RestoreDraftPrompt({ savedAt, restore, discard }: RestoreDraftPromptSlotProps) {
  const t = useLocalization();

  return (
    <div className="rte-draft-prompt" role="status">
      <div className="rte-draft-prompt__text">
        <strong>{resolveMessage(t.draft.restoreTitle)}</strong>
        <span>{resolveMessage(t.draft.restoreBody, { time: savedAgo(savedAt) })}</span>
      </div>
      <div className="rte-draft-prompt__actions">
        <Button variant="solid" onClick={restore}>
          {resolveMessage(t.draft.restore)}
        </Button>
        <Button onClick={discard}>{resolveMessage(t.draft.discard)}</Button>
      </div>
    </div>
  );
}

/** Props for {@link ShortcutHelpDialog}. */
export interface ShortcutHelpDialogProps {
  shortcuts: { keys: string; label: string }[];
  onClose: () => void;
}

/** The shortcut reference (05 §13). */
export function ShortcutHelpDialog({ shortcuts, onClose }: ShortcutHelpDialogProps) {
  const t = useLocalization();
  const { slots } = useRteSlots();
  const Dialog = slots.Dialog;

  return (
    <Dialog open onClose={onClose} title={resolveMessage(t.shortcuts.title)}>
      <div className="rte-shortcuts">
        <dl className="rte-shortcuts__list">
          {shortcuts.map((shortcut) => (
            <div key={`${shortcut.keys}-${shortcut.label}`} className="rte-shortcuts__row">
              <dt>
                <kbd>{shortcut.keys}</kbd>
              </dt>
              <dd>{shortcut.label}</dd>
            </div>
          ))}
        </dl>
        <div className="rte-shortcuts__actions">
          <Button onClick={onClose}>{resolveMessage(t.shortcuts.close)}</Button>
        </div>
      </div>
    </Dialog>
  );
}
