import { useState } from 'react';
import { Rte, useEditor, type ChangeMeta, type EditorValue } from 'react-rtekit';
import { RteContentView } from 'react-rtekit/view';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * The smallest possible editor, plus the read-only view of the same value.
 *
 * Proves the two render identically: that is what makes `<RteContentView>` the right
 * way to show stored content outside a form.
 */
export default function BasicExample() {
  const [html, setHtml] = useState('<p>Type something, and watch the preview follow.</p>');
  const [meta, setMeta] = useState<ChangeMeta | null>(null);

  const editor = useEditor({
    defaultValue: html,
    onChange: (value: EditorValue, changeMeta: ChangeMeta) => {
      setHtml(value as string);
      setMeta(changeMeta);
    },
  });

  return (
    <div className="example-basic">
      <Rte.Root editor={editor} dataTheme="classic">
        <Rte.Content aria-label="Message" placeholder="Write your message…" />
        <Rte.Footer>
          <span className="example-basic__state">
            {meta ? `${meta.length} characters · ${meta.wordCount} words · source: ${meta.source}` : 'No changes yet'}
          </span>
          <Rte.Counter />
        </Rte.Footer>
      </Rte.Root>

      <h2>Serialized value</h2>
      <CodeBlock label="Basic html" testId="basic-html">
            {html}
          </CodeBlock>

      <h2>The same value in RteContentView</h2>
      <div data-testid="basic-view" className="example-basic__preview">
        <RteContentView value={html} />
      </div>
    </div>
  );
}
