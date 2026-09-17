import { useState } from 'react';
import {
  RichTextEditor,
  documentToHtml,
  documentToMarkdown,
  documentToText,
  htmlToDocument,
  type EditorValue,
} from 'react-rtekit';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * The four value formats.
 *
 * The same document, serialized four ways. `valueFormat` decides which one
 * `onChange` hands back; the others are always a function call away.
 */

const SAMPLE =
  '<h2>Summary</h2><p>The <strong>April</strong> results are <em>within range</em>.</p>' +
  '<ul><li>Revenue: on target</li><li>Costs: above plan</li></ul>' +
  '<p><a href="https://example.com/report">Full report</a></p>';

export default function ValueFormatsExample() {
  const [value, setValue] = useState(SAMPLE);
  const doc = htmlToDocument(value);

  return (
    <div className="stack">
      <RichTextEditor
        preset="standard"
        label="Content"
        value={value}
        onChange={(next: EditorValue) => {
          setValue(next as string);
        }}
      />

      <div className="parity__outputs">
        <figure>
          <figcaption>html</figcaption>
          <CodeBlock label="Format html" testId="format-html">
            {documentToHtml(doc)}
          </CodeBlock>
        </figure>
        <figure>
          <figcaption>json</figcaption>
          <CodeBlock label="Format json" testId="format-json">
            {JSON.stringify(doc, null, 2)}
          </CodeBlock>
        </figure>
        <figure>
          <figcaption>markdown</figcaption>
          <CodeBlock label="Format markdown" testId="format-markdown">
            {documentToMarkdown(doc)}
          </CodeBlock>
        </figure>
        <figure>
          <figcaption>text</figcaption>
          <CodeBlock label="Format text" testId="format-text">
            {documentToText(doc)}
          </CodeBlock>
        </figure>
      </div>
    </div>
  );
}
