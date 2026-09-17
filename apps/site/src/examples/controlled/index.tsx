import { useRef, useState } from 'react';
import {
  RichTextEditor,
  type ChangeMeta,
  type EditorInstance,
  type EditorValue,
} from 'react-rtekit';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * Controlled usage (04 §2.2, fixes R1 and R21).
 *
 * The parent owns the value. Loading a different report replaces the content, which
 * the old editor could not do at all, and every change says where it came from, so a
 * controlled parent can never mistake its own write for the author's typing.
 */

/** Two stored reports, as a form would load them. */
const REPORTS: Record<string, string> = {
  'Report A': '<p>Hi Dana, your <strong>April</strong> water test looks good.</p>',
  'Report B': '<p>Hi Dana, your <em>May</em> results need a follow-up call.</p>',
};

export default function ControlledExample() {
  const [value, setValue] = useState<string>(REPORTS['Report A']!);
  const [log, setLog] = useState<ChangeMeta[]>([]);
  const editorRef = useRef<EditorInstance | null>(null);

  return (
    <div className="stack">
      <div className="button-row">
        {Object.keys(REPORTS).map((name) => (
          <button
            key={name}
            type="button"
            className="button"
            onClick={() => {
              // A plain state update: the editor follows a controlled value (fixes R1).
              setValue(REPORTS[name]!);
            }}
          >
            Load {name}
          </button>
        ))}
        <button
          type="button"
          className="button"
          onClick={() => {
            // The imperative route, for code that has no render pass to piggyback on.
            editorRef.current?.setContent('<p>Cleared and ready.</p>');
          }}
        >
          setContent() imperatively
        </button>
        <button
          type="button"
          className="button"
          onClick={() => {
            setValue('');
          }}
        >
          Clear
        </button>
      </div>

      <RichTextEditor
        preset="standard"
        label="Message"
        value={value}
        editorRef={editorRef}
        placeholder="Type here — the caret stays where you put it."
        onChange={(next: EditorValue, meta: ChangeMeta) => {
          setValue(next as string);
          setLog((entries) => [meta, ...entries].slice(0, 8));
        }}
      />

      <h2>Value held by the parent</h2>
      <CodeBlock label="Controlled value" testId="controlled-value">
            {value || '(empty)'}
          </CodeBlock>

      <h2>Change log</h2>
      <table className="data-table" data-testid="controlled-log">
        <thead>
          <tr>
            <th>source</th>
            <th>length</th>
            <th>words</th>
            <th>empty</th>
          </tr>
        </thead>
        <tbody>
          {log.length === 0 ? (
            <tr>
              <td colSpan={4}>No changes yet.</td>
            </tr>
          ) : (
            log.map((meta, index) => (
              // Entries are positional history; two identical changes are still two rows.
              <tr key={index}>
                <td>
                  <code>{meta.source}</code>
                </td>
                <td>{meta.length}</td>
                <td>{meta.wordCount}</td>
                <td>{String(meta.isEmpty)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
