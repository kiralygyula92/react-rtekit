import { useRef, useState } from 'react';
import { RichTextEditor, type EditorInstance, type EditorValue } from 'react-rtekit';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * Find and replace.
 *
 * Highlighting is an overlay, not markup: searching must not change what you would
 * save, and it must not put an entry on the undo stack.
 */

const SAMPLE =
  '<h2>Quarterly report</h2>' +
  '<p>The water sample was clear. Re-test the water in two weeks.</p>' +
  '<ul><li>Revenue: on target</li><li>Costs: above plan</li></ul>' +
  '<p>Water hardness is within range.</p>';

export default function FindReplaceExample() {
  const [value, setValue] = useState(SAMPLE);
  const editorRef = useRef<EditorInstance | null>(null);

  return (
    <div className="stack">
      <div className="button-row">
        <button
          type="button"
          className="button button--solid"
          onClick={() => {
            editorRef.current?.exec('openFindReplace');
          }}
        >
          Open find and replace
        </button>
        <span className="parity__status">
          Or press <kbd>Ctrl</kbd>+<kbd>F</kbd> with the caret in the editor.
        </span>
      </div>

      <RichTextEditor
        preset="full"
        label="Report"
        hideLabel
        value={value}
        editorRef={editorRef}
        onChange={(next: EditorValue) => {
          setValue(next as string);
        }}
      />

      <h2>Serialized</h2>
      <CodeBlock label="Find replace output" testId="find-replace-output">
        {value}
      </CodeBlock>
    </div>
  );
}
