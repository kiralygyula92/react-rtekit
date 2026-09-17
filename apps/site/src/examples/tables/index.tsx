import { useState } from 'react';
import { RichTextEditor, documentToHtml, htmlToDocument, type EditorValue } from 'react-rtekit';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * Tables.
 *
 * Insert with the picker, move between cells with Tab, and use the controls that
 * appear when the caret is inside one. The e-mail column shows why a table serializes
 * differently for mail: every rule has to be inline.
 */

const SAMPLE =
  '<table><tbody>' +
  '<tr><th>Reading</th><th>Value</th><th>Range</th></tr>' +
  '<tr><td>Revenue</td><td>1.8m</td><td>1.5-2.0m</td></tr>' +
  '<tr><td>Costs</td><td>0.9m</td><td>0.7-0.8m</td></tr>' +
  '</tbody></table>';

export default function TablesExample() {
  const [value, setValue] = useState(SAMPLE);

  return (
    <div className="stack">
      <p className="page__lead">
        Put the caret in a cell to get the row and column controls. Tab moves to the next cell; Tab
        in the last cell adds a row.
      </p>

      <RichTextEditor
        preset="full"
        label="Results"
        value={value}
        onChange={(next: EditorValue) => {
          setValue(next as string);
        }}
      />

      <div className="parity__outputs">
        <figure>
          <figcaption>Stored HTML</figcaption>
          <CodeBlock label="Tables output" testId="tables-output">
            {value}
          </CodeBlock>
        </figure>
        <figure>
          <figcaption>E-mail HTML</figcaption>
          <CodeBlock label="Tables email" testId="tables-email">
            {documentToHtml(htmlToDocument(value), { profile: 'email' })}
          </CodeBlock>
        </figure>
      </div>
    </div>
  );
}
