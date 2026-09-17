import { useRef } from 'react';
import { RichTextEditor, type EditorInstance } from 'react-rtekit';

/**
 * Fullscreen (05 §16).
 *
 * The root is promoted in place rather than moved into a portal: moving it would
 * unmount the engine's content element and take the selection and undo stack with it.
 */

export default function FullscreenExample() {
  const editorRef = useRef<EditorInstance | null>(null);

  return (
    <div className="stack">
      <div className="button-row">
        <button
          type="button"
          className="button button--solid"
          onClick={() => {
            editorRef.current?.setFullscreen(true);
          }}
        >
          Enter fullscreen
        </button>
        <span className="parity__status">Escape comes back. The page behind stops scrolling.</span>
      </div>

      <RichTextEditor
        preset="full"
        label="Content"
        editorRef={editorRef}
        defaultValue="<p>Type something, go fullscreen, and watch the caret stay where it was.</p>"
      />
    </div>
  );
}
