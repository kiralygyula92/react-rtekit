import { useCallback, useMemo, useState } from 'react';
import { RichTextEditor, countText, type RteHandlers } from 'react-rtekit';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * Handler middleware (06 §4).
 *
 * Every interaction the editor has goes through a handler you can wrap. Call `next()`
 * to let it happen, pass an override to change it, or do neither to cancel — the same
 * three options at every point, which is what makes the surface learnable.
 */

const SAMPLE =
  '<p>Paste something formatted, click a toolbar button, or follow this ' +
  '<a href="https://example.com/external">external link</a>.</p>';

/** The budget the "veto a change" handler enforces. */
const HARD_LIMIT = 400;

export default function HandlersMiddlewareExample() {
  const [html, setHtml] = useState(SAMPLE);
  const [plainTextOnly, setPlainTextOnly] = useState(true);
  const [confirmLinks, setConfirmLinks] = useState(true);
  const [log, setLog] = useState<string[]>([]);

  const note = useCallback((message: string) => {
    setLog((entries) =>
      [`${new Date().toLocaleTimeString()} — ${message}`, ...entries].slice(0, 14),
    );
  }, []);

  const handlers: Partial<RteHandlers> = useMemo(
    () => ({
      // Analytics, then the default. The commonest override there is.
      onToolbarCommand: (ctx, next) => {
        note(`toolbar: ${ctx.command}`);
        void next();
      },

      // A paste policy, decided per paste rather than per editor.
      onPaste: (ctx, next) => {
        note(`paste from ${ctx.source} (${ctx.html.length} bytes of HTML)`);
        void next(plainTextOnly ? { mode: 'text' } : {});
      },

      // Cancelling: not calling next() is the whole mechanism.
      onLinkOpen: (ctx, next) => {
        if (!confirmLinks) {
          void next();
          return;
        }
        if (window.confirm(`Open ${ctx.href}?`)) {
          note(`link opened: ${ctx.href}`);
          void next();
        } else {
          note(`link blocked: ${ctx.href}`);
        }
      },

      // A veto. The editor keeps the content it had.
      onBeforeChange: (ctx, next) => {
        if (ctx.meta.length > HARD_LIMIT) {
          note(`change vetoed at ${ctx.meta.length} characters`);
          return;
        }
        void next();
      },

      onSanitizeViolation: (ctx, next) => {
        note(`sanitizer removed <${ctx.violation.tag}> (${ctx.violation.reason})`);
        void next();
      },
    }),
    [confirmLinks, note, plainTextOnly],
  );

  return (
    <div className="stack">
      <div className="button-row">
        <label className="field-inline">
          <input
            type="checkbox"
            checked={plainTextOnly}
            onChange={(event) => {
              setPlainTextOnly(event.target.checked);
            }}
          />
          Plain-text paste only
        </label>
        <label className="field-inline">
          <input
            type="checkbox"
            checked={confirmLinks}
            onChange={(event) => {
              setConfirmLinks(event.target.checked);
            }}
          />
          Confirm before following a link
        </label>
      </div>

      <RichTextEditor
        preset="standard"
        label="Message"
        value={html}
        handlers={handlers}
        helperText={`Changes past ${HARD_LIMIT} characters are refused by onBeforeChange.`}
        onChange={(value) => {
          setHtml(value as string);
        }}
      />

      <p className="example-basic__state" data-testid="middleware-length">
        {countText(html, 'characters')} / {HARD_LIMIT} characters
      </p>

      <h2>Handler log</h2>
      <ul className="event-log" data-testid="middleware-log">
        {log.length === 0 ? <li>Nothing yet — interact with the editor above.</li> : null}
        {log.map((entry) => (
          <li key={entry}>{entry}</li>
        ))}
      </ul>

      <h2>Output</h2>
      <CodeBlock label="Middleware output" testId="middleware-output">
        {html}
      </CodeBlock>
    </div>
  );
}
