import { useCallback, useMemo, useRef, useState } from 'react';
import { RichTextEditor, type EditorInstance } from 'react-rtekit';
import { buildLargeDocument } from '../../fixtures';

/**
 * A 100 KB document, measured.
 *
 * Two costs are separated here because they behave differently. Keystroke handling is
 * bounded — the engine touches the block the caret is in — while serialization is
 * proportional to the document, which is why `meta.document` is a lazy getter and why
 * anything expensive belongs on `onChangeDebounced` rather than on `onChange`.
 */

/** How many keystrokes the latency meter averages over. */
const SAMPLE_SIZE = 20;

/** One measured operation. */
interface Timing {
  label: string;
  ms: number;
  note: string;
}

export default function LargeDocumentExample() {
  const initial = useMemo(() => buildLargeDocument(100_000), []);
  const editorRef = useRef<EditorInstance>(null);
  const latencies = useRef<number[]>([]);
  const keyDownAt = useRef(0);

  const [latency, setLatency] = useState<{ last: number; average: number; samples: number } | null>(
    null,
  );
  const [timings, setTimings] = useState<Timing[] | null>(null);
  const [debouncedAt, setDebouncedAt] = useState<string | null>(null);

  /** Starts the clock on the key, and stops it once React has committed. */
  const onKeyDown = useCallback(() => {
    keyDownAt.current = performance.now();
    requestAnimationFrame(() => {
      if (keyDownAt.current === 0) return;
      const elapsed = performance.now() - keyDownAt.current;
      keyDownAt.current = 0;
      latencies.current = [...latencies.current, elapsed].slice(-SAMPLE_SIZE);
      const total = latencies.current.reduce((sum, value) => sum + value, 0);
      setLatency({
        last: elapsed,
        average: total / latencies.current.length,
        samples: latencies.current.length,
      });
    });
  }, []);

  const measure = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const time = (label: string, note: string, run: () => unknown): Timing => {
      const started = performance.now();
      run();
      return { label, ms: performance.now() - started, note };
    };

    setTimings([
      time('getText()', 'What a counter needs. No markup is built.', () => editor.getText()),
      time('getJSON()', 'The portable document. What onChange builds lazily.', () => editor.getJSON()),
      time('getHTML()', 'Serialize, then sanitize the output.', () => editor.getHTML()),
      time('getHTML({ sanitize: false })', 'The same, without the output sanitizer.', () =>
        editor.getHTML({ sanitize: false }),
      ),
      time('getHTML({ profile: "email" })', 'Inlining styles costs a second pass.', () =>
        editor.getHTML({ profile: 'email' }),
      ),
      time('isEmpty()', 'Stops at the first content it finds.', () => editor.isEmpty()),
    ]);
  }, []);

  return (
    <div className="stack">
      <p className="page__lead">
        {Math.round(initial.length / 1024)} KB of HTML. Type into it and watch the meter;
        the number that matters is the average, not the first keystroke.
      </p>

      <RichTextEditor
        preset="standard"
        label="Large document"
        editorRef={editorRef}
        defaultValue={initial}
        maxHeight={360}
        // The meter reads the key through the handler middleware rather than a wrapper
        // element: that is the documented way in, and it sees keys the DOM would not
        // bubble the same way.
        handlers={{
          onKeyDown: (_ctx, next) => {
            onKeyDown();
            void next();
          },
        }}
        // The expensive work is deliberately not on onChange.
        onChangeDebounced={() => {
          setDebouncedAt(new Date().toLocaleTimeString());
        }}
        changeDebounceMs={300}
      />

      <dl className="headless__state" data-testid="large-latency">
        <dt>Last keystroke</dt>
        <dd>{latency ? `${latency.last.toFixed(1)} ms` : 'not measured'}</dd>
        <dt>Average</dt>
        <dd>
          {latency ? `${latency.average.toFixed(1)} ms over ${String(latency.samples)} keys` : '—'}
        </dd>
        <dt>Last debounced change</dt>
        <dd>{debouncedAt ?? 'none yet'}</dd>
      </dl>

      <div className="button-row">
        <button type="button" className="button" onClick={measure}>
          Measure serialization
        </button>
      </div>

      {timings ? (
        <table className="data-table" data-testid="large-timings">
          <thead>
            <tr>
              <th>Operation</th>
              <th>Time</th>
              <th>What it does</th>
            </tr>
          </thead>
          <tbody>
            {timings.map((timing) => (
              <tr key={timing.label}>
                <td>
                  <code>{timing.label}</code>
                </td>
                <td>{timing.ms.toFixed(1)} ms</td>
                <td>{timing.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

      <p className="callout">
        This is why <code>ChangeMeta.document</code> is a getter. A handler that reads
        only <code>meta.length</code> never pays for the document; one that reads{' '}
        <code>meta.document</code> pays the row above, on every keystroke, unless it is
        debounced.
      </p>
    </div>
  );
}
