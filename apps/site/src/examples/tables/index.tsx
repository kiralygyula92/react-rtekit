import { useState } from 'react';
import { RichTextEditor, documentToHtml, htmlToDocument, type EditorValue } from 'react-rtekit';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * Tables (05 §8).
 *
 * Insert with the picker, move between cells with Tab, and use the controls that
 * appear when the caret is inside one. The e-mail column shows why a table serializes
 * differently for mail: every rule has to be inline.
 */

const SAMPLE =
  '<table><tbody>' +
  '<tr><th>Reading</th><th>Value</th><th>Range</th></tr>' +
  '<tr><td>Chlorine</td><td>1.8 ppm</td><td>1-3 ppm</td></tr>' +
  '<tr><td>pH</td><td>7.8</td><td>7.2-7.6</td></tr>' +
  '</tbody></table>';

export default function TablesExample() {
  const [value, setValue] = useState(SAMPLE);

  return (
    <div className="stack">
      <p className="page__lead">
        Put the caret in a cell to get the row and column controls. Tab moves to the next cell;
        Tab in the last cell adds a row.
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
