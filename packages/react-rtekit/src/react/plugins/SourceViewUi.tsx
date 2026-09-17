import { useCallback, useId, useState } from 'react';
import type { SourceViewSlotProps } from '../../types/slots.js';
import { sanitizeHtml } from '../../core/sanitize/sanitize.js';
import { isEmptyHtml } from '../../core/serialize/from-html.js';
import { useEditorContext, useLocalization, useRteSlots } from '../context.js';
import { useEditorState } from '../hooks.js';
import { resolveMessage } from '../localization.js';
import { Button } from '../ui/primitives.js';

/**
 * The HTML source view.
 *
 * Editing the source is editing the document, so what comes back out of the textarea
 * goes through the same sanitizer as a paste or a `value` — the source view is not a
 * way around the rules, it is another way in.
 *
 * @module
 */

export function SourceViewUi() {
  const editor = useEditorContext();
  const t = useLocalization();
  const { slots } = useRteSlots();
  const sourceView = useEditorState((snapshot) => snapshot.sourceView);
  const [error, setError] = useState<string | null>(null);

  // Read at render time rather than stored: the panel is mounted only while the
  // source view is open, and a remount is exactly when the HTML should be re-read.
  const draft = sourceView ? editor.getHTML({ pretty: true }) : '';

  const apply = useCallback(
    (html: string) => {
      // Nothing left after sanitizing means the input was markup we refuse, not
      // content — telling the author that is better than silently emptying the field.
      const sanitized = sanitizeHtml(html);
      if (!isEmptyHtml(html) && isEmptyHtml(sanitized)) {
        setError(resolveMessage(t.sourceView.invalid));
        return;
      }
      editor.setContent(sanitized, { source: 'api' });
      editor.toggleSourceView();
      editor.focus('end');
    },
    [editor, t.sourceView.invalid],
  );

  if (!sourceView) return null;

  const SourceView = slots.SourceView;
  return (
    <SourceView
      html={draft}
      error={error}
      onApply={apply}
      onCancel={() => {
        editor.toggleSourceView();
        editor.focus('restore');
      }}
    />
  );
}

/** The default source view: a plain textarea, replaceable by a code editor. */
export function SourceViewPanel({ html, error, onApply, onCancel }: SourceViewSlotProps) {
  const t = useLocalization();
  const [value, setValue] = useState(html);
  const id = useId();

  return (
    <div className="rte-source-view" role="group" aria-label={resolveMessage(t.sourceView.title)}>
      <div className="rte-field">
        {/* `htmlFor` rather than a wrapping label: a wrapper labels whatever the
            accessibility tree decides is the control, which is not always the one
            meant when the markup has a span in it. */}
        <label className="rte-field-label" htmlFor={id}>
          {resolveMessage(t.sourceView.title)}
        </label>
        <textarea
          id={id}
          className="rte-source-view__textarea"
          value={value}
          spellCheck={false}
          rows={12}
          aria-invalid={error !== null}
          onChange={(event) => {
            setValue(event.target.value);
          }}
        />
      </div>

      {error !== null ? (
        <p className="rte-source-view__error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="rte-source-view__actions">
        <Button
          variant="solid"
          onClick={() => {
            onApply(value);
          }}
        >
          {resolveMessage(t.sourceView.apply)}
        </Button>
        <Button onClick={onCancel}>{resolveMessage(t.sourceView.cancel)}</Button>
      </div>
    </div>
  );
}
