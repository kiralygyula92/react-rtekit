import { useState } from 'react';
import { RichTextEditor, type EditorValue } from 'react-rtekit';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * Markdown input rules and the Markdown value format.
 *
 * The rules rewrite as you type; the value format decides what `onChange` hands back.
 */

const SAMPLE = '<h2>Heading</h2><p>Type <code>## </code> at the start of a line.</p>';

export default function MarkdownExample() {
  const [value, setValue] = useState(SAMPLE);

  return (
    <div className="stack">
      <p className="page__lead">
        Type <code># </code>, <code>## </code>, <code>&gt; </code> or <code>- </code> at the start
        of a line, or wrap a word in asterisks or backticks.
      </p>

      <RichTextEditor
        preset="standard"
        label="Notes"
        hideLabel
        value={value}
        onChange={(next: EditorValue) => {
          setValue(next as string);
        }}
        enableMarkdownShortcuts
      />

      <h2>Serialized</h2>
      <CodeBlock label="Markdown output" testId="markdown-output">
        {value}
      </CodeBlock>
    </div>
  );
}
