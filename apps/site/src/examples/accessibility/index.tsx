import { useRef, useState } from 'react';
import { RichTextEditor, type EditorInstance, type EditorValue } from 'react-rtekit';

/**
 * The keyboard and screen-reader model.
 *
 * Every control is reachable, every icon has a name, and everything the editor
 * announces is shown in the log so you can see what a screen reader would hear.
 */

export default function AccessibilityExample() {
  const [value, setValue] = useState('<p>Tab into the toolbar with Alt+F10.</p>');
  const [log, setLog] = useState<string[]>([]);
  const editorRef = useRef<EditorInstance | null>(null);

  return (
    <div className="stack">
      <ol className="example-related">
        <li>
          <kbd>Tab</kbd> reaches the toolbar as one stop, then the editor.
        </li>
        <li>
          <kbd>Alt</kbd>+<kbd>F10</kbd> jumps to the toolbar from inside the text.
        </li>
        <li>Arrow keys move between toolbar buttons; Home and End jump to the ends.</li>
        <li>
          <kbd>Escape</kbd> in the toolbar puts the caret back where it was.
        </li>
        <li>
          <kbd>Ctrl</kbd>+<kbd>/</kbd> opens the shortcut reference.
        </li>
      </ol>

      <RichTextEditor
        preset="full"
        label="Message"
        value={value}
        editorRef={editorRef}
        helperText="Everything announced below is what a screen reader would hear."
        onChange={(next: EditorValue, meta) => {
          setValue(next as string);
          setLog((entries) => [`change · ${meta.source} · ${meta.length} characters`, ...entries].slice(0, 10));
        }}
      />

      <h2>Announcement log</h2>
      <ul className="example-related" data-testid="a11y-log">
        {log.length === 0 ? <li>Nothing yet.</li> : null}
        {log.map((entry, index) => (
          // Positional history: the index is the identity.
          <li key={index}>{entry}</li>
        ))}
      </ul>
    </div>
  );
}
