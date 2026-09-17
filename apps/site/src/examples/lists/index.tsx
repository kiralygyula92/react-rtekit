import { useState } from 'react';
import { RichTextEditor, type EditorValue } from 'react-rtekit';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * Lists, nesting and the shortcuts that create them.
 *
 * Tab indents a list item and Shift+Tab outdents it; `- `, `1. ` and `[] ` at the
 * start of a line create the three kinds.
 */

const SAMPLE =
  '<ul><li>Revenue</li><li>Costs<ul><li>fixed</li><li>variable</li></ul></li></ul>' +
  '<ol><li>Collect the sample</li><li>Label it</li></ol>' +
  '<ul><li data-checked="true">Sampled</li><li data-checked="false">Reported</li></ul>';

export default function ListsExample() {
  const [value, setValue] = useState(SAMPLE);

  return (
    <div className="stack">
      <p className="page__lead">
        Type “- ”, “1. ” or “[] ” at the start of a line. Tab nests, Shift+Tab lifts back out.
      </p>

      <RichTextEditor
        preset="full"
        label="Lists"
        value={value}
        onChange={(next: EditorValue) => {
          setValue(next as string);
        }}
        enableMarkdownShortcuts
      />

      <h2>Serialized</h2>
      <CodeBlock label="Lists output" testId="lists-output">
        {value}
      </CodeBlock>
    </div>
  );
}
