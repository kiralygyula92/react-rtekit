import { useRef, useState } from 'react';
import { RichTextEditor, type EditorInstance, type EditorValue } from 'react-rtekit';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * Every mark and block, over mixed selections.
 *
 * The state panel is the point: it shows what the editor thinks is active at the
 * caret, which is the thing the old implementation got wrong in four different ways
 * (R6, R8).
 */

const SAMPLE =
  '<h2>Quarterly report</h2>' +
  '<p>The <strong>April</strong> results are <em>within range</em>, with <u>one</u> ' +
  '<s>exception</s> — costs at <code>0.9m</code>.</p>' +
  '<blockquote><p>Retest within two weeks.</p></blockquote>' +
  '<p>H<sub>2</sub>O · 25 m<sup>3</sup></p>';

export default function FormattingExample() {
  const [value, setValue] = useState(SAMPLE);
  const [state, setState] = useState<ReturnType<EditorInstance['getFormatState']> | null>(null);
  const editorRef = useRef<EditorInstance | null>(null);

  return (
    <div className="stack">
      <RichTextEditor
        preset="full"
        label="Content"
        value={value}
        editorRef={editorRef}
        onChange={(next: EditorValue) => {
          setValue(next as string);
          setState(editorRef.current?.getFormatState() ?? null);
        }}
        onSelectionChange={() => {
          setState(editorRef.current?.getFormatState() ?? null);
        }}
      />

      <h2>Format state at the caret</h2>
      <table className="data-table" data-testid="format-state">
        <tbody>
          <tr>
            <th>Marks</th>
            <td>
              {state
                ? Object.entries(state.marks)
                    .filter(([, on]) => on)
                    .map(([name]) => name)
                    .join(', ') || 'none'
                : '—'}
            </td>
          </tr>
          <tr>
            <th>Block</th>
            <td>
              {state ? `${state.block.type}${state.block.headingLevel ?? ''}` : '—'}
              {state?.block.align ? ` · ${state.block.align}` : ''}
              {state?.block.indent ? ` · indent ${state.block.indent}` : ''}
            </td>
          </tr>
          <tr>
            <th>List</th>
            <td>{state?.list.type ?? 'none'}</td>
          </tr>
          <tr>
            <th>Link</th>
            <td>{state?.link?.href ?? 'none'}</td>
          </tr>
        </tbody>
      </table>

      <h2>Serialized</h2>
      <CodeBlock label="Formatting html" testId="formatting-html">
        {value}
      </CodeBlock>
    </div>
  );
}
