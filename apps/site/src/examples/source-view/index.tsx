import { useRef, useState } from 'react';
import { RichTextEditor, type EditorInstance, type EditorValue } from 'react-rtekit';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * The HTML source view (05 §16).
 *
 * Try applying something hostile. The source view runs the same sanitizer as a paste
 * or a `value`, so it is not a way around the rules.
 */

export default function SourceViewExample() {
  const [value, setValue] = useState('<p>Switch to the source and edit the HTML.</p>');
  const editorRef = useRef<EditorInstance | null>(null);

  return (
    <div className="stack">
      <div className="button-row">
        <button
          type="button"
          className="button button--solid"
          onClick={() => {
            editorRef.current?.toggleSourceView();
          }}
        >
          Toggle source view
        </button>
        <span className="parity__status">
          Paste <code>&lt;img src=x onerror=alert(1)&gt;</code> and apply it.
        </span>
      </div>

      <RichTextEditor
        preset="full"
        label="Content"
        value={value}
        editorRef={editorRef}
        onChange={(next: EditorValue) => {
          setValue(next as string);
        }}
      />

      <h2>Stored value</h2>
      <CodeBlock label="Source view output" testId="source-view-output">
        {value}
      </CodeBlock>
    </div>
  );
}
