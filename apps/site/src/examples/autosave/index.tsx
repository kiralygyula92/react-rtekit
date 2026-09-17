import { useMemo, useRef, useState } from 'react';
import { RichTextEditor, type EditorInstance, type EditorValue } from 'react-rtekit';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * Autosave and drafts.
 *
 * The storage is an in-memory one, so the page does not leave anything behind. A real
 * deployment passes `localStorage` — or a server-backed `Storage` of its own.
 */

/** A `Storage` that lives for as long as the page does. */
function createMemoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => {
      data.clear();
    },
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => {
      data.delete(key);
    },
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
}

export default function AutosaveExample() {
  const storage = useMemo(() => createMemoryStorage(), []);
  const [value, setValue] = useState('<p>Type here, wait a second, then reload the example.</p>');
  const [saved, setSaved] = useState<string | null>(null);
  const editorRef = useRef<EditorInstance | null>(null);

  return (
    <div className="stack">
      <div className="button-row">
        <button
          type="button"
          className="button"
          onClick={() => {
            editorRef.current?.saveDraft();
            setSaved(storage.getItem('rte-draft:demo'));
          }}
        >
          Save now
        </button>
        <button
          type="button"
          className="button"
          onClick={() => {
            editorRef.current?.clearDraft();
            setSaved(null);
          }}
        >
          Clear the draft
        </button>
      </div>

      <RichTextEditor
        preset="standard"
        label="Message"
        hideLabel
        value={value}
        editorRef={editorRef}
        autosave={{ key: 'demo', storage, debounceMs: 500, ttlMs: 60_000 }}
        onChange={(next: EditorValue) => {
          setValue(next as string);
        }}
      />

      <h2>What is stored</h2>
      <CodeBlock label="Stored draft" testId="autosave-draft">
        {saved ?? '(nothing saved yet)'}
      </CodeBlock>
    </div>
  );
}
