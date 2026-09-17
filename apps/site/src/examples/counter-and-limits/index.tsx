import { useState } from 'react';
import { RichTextEditor, type EditorValue } from 'react-rtekit';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * Counting and limits (fixes R3).
 *
 * The limit counts text, not markup: formatting a message must never make it "too
 * long". Switch between blocking and warning to feel the difference.
 */

const SAMPLE = '<p>Formatting this text does not change how much of the limit it uses.</p>';

export default function CounterAndLimitsExample() {
  const [value, setValue] = useState(SAMPLE);
  const [limit, setLimit] = useState(80);
  const [behaviour, setBehaviour] = useState<'block' | 'warn'>('block');
  const [unit, setUnit] = useState<'characters' | 'words'>('characters');

  return (
    <div className="stack">
      <p className="page__lead">Bold the whole message: the counter does not move.</p>

      <div className="button-row">
        <label className="field-inline">
          Limit
          <select
            value={limit}
            onChange={(event) => {
              setLimit(Number(event.target.value));
            }}
          >
            <option value={80}>80</option>
            <option value={2048}>2048</option>
          </select>
        </label>
        <label className="field-inline">
          Behaviour
          <select
            value={behaviour}
            onChange={(event) => {
              setBehaviour(event.target.value as 'block' | 'warn');
            }}
          >
            <option value="block">block — refuse the keystroke</option>
            <option value="warn">warn — allow it, show it is over</option>
          </select>
        </label>
        <label className="field-inline">
          Unit
          <select
            value={unit}
            onChange={(event) => {
              setUnit(event.target.value as 'characters' | 'words');
            }}
          >
            <option value="characters">characters</option>
            <option value="words">words</option>
          </select>
        </label>
      </div>

      <RichTextEditor
        preset="standard"
        label="Message"
        value={value}
        onChange={(next: EditorValue) => {
          setValue(next as string);
        }}
        maxLength={limit}
        maxLengthBehaviour={behaviour}
        countUnit={unit}
        showCounter
      />

      <h2>Serialized</h2>
      <CodeBlock label="Counter and limits output" testId="counter-and-limits-output">
            {value}
          </CodeBlock>
    </div>
  );
}
