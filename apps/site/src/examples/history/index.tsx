import { useRef, useState } from 'react';
import { RichTextEditor, type EditorInstance, type EditorValue } from 'react-rtekit';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * History (fixes R25).
 *
 * Typing coalesces into one entry per burst; every command is its own. Loading server
 * content clears the stack, so the author cannot undo into somebody else's document.
 */

export default function HistoryExample() {
  const [value, setValue] = useState('<p>Type a few words, then undo.</p>');
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const editorRef = useRef<EditorInstance | null>(null);

  const sync = (): void => {
    setCanUndo(editorRef.current?.canUndo() ?? false);
    setCanRedo(editorRef.current?.canRedo() ?? false);
  };

  return (
    <div className="stack">
      <div className="button-row">
        <button
          type="button"
          className="button"
          onClick={() => {
            editorRef.current?.setContent('<p>Loaded from the server.</p>', { history: false });
            editorRef.current?.clearHistory();
            sync();
          }}
        >
          Load from the server, then clearHistory()
        </button>
        <span className="parity__status" data-testid="history-state">
          canUndo: {String(canUndo)} · canRedo: {String(canRedo)}
        </span>
      </div>

      <RichTextEditor
        preset="standard"
        label="Content"
        hideLabel
        value={value}
        editorRef={editorRef}
        onChange={(next: EditorValue) => {
          setValue(next as string);
          sync();
        }}
      />

      <h2>Serialized</h2>
      <CodeBlock label="History output" testId="history-output">
        {value}
      </CodeBlock>
    </div>
  );
}
