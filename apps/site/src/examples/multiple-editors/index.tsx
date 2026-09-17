import { useState } from 'react';
import { RichTextEditor, type ChangeMeta, type EditorValue } from 'react-rtekit';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * Three editors on one page (regression demo for R4 and R10).
 *
 * The old component gave its toolbar a hard-coded `id="toolbar"`, so two editors on
 * one page produced duplicate ids and ambiguous label targets. Here every id comes
 * from `useId`, and each editor keeps its own toolbar state, colour recents, history
 * and focus ring. Focusing one shifts nothing in the others — or in itself (R10).
 */

/** The three fields, each with its own preset, so the isolation is visible. */
const FIELDS = [
  {
    id: 'subject',
    label: 'Subject line',
    preset: 'minimal' as const,
    value: '<p>Your April report</p>',
  },
  {
    id: 'body',
    label: 'Message body',
    preset: 'classic' as const,
    value: '<p>Hi Dana,</p><p>Your results are ready.</p>',
  },
  {
    id: 'footer',
    label: 'Footer',
    preset: 'comment' as const,
    value: '<p>Northwind Ltd · Tampa FL</p>',
  },
];

export default function MultipleEditorsExample() {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(FIELDS.map((field) => [field.id, field.value])),
  );
  const [lastChanged, setLastChanged] = useState<string>('none');

  return (
    <div className="stack">
      <p className="page__lead">
        Format text in one editor and watch the other two: their toolbars stay inactive, their
        colour recents stay separate, and undo only undoes the editor you are in.
      </p>

      <div className="editor-grid">
        {FIELDS.map((field) => (
          <section key={field.id} className="editor-grid__cell">
            <RichTextEditor
              preset={field.preset}
              label={field.label}
              value={values[field.id]}
              minHeight={140}
              placeholder={`Edit the ${field.label.toLowerCase()}…`}
              onChange={(next: EditorValue, meta: ChangeMeta) => {
                setValues((previous) => ({ ...previous, [field.id]: next as string }));
                setLastChanged(`${field.label} (${meta.source})`);
              }}
            />
          </section>
        ))}
      </div>

      <p data-testid="multiple-last-changed">
        Last changed: <strong>{lastChanged}</strong>
      </p>

      <h2>Values</h2>
      <CodeBlock label="Multiple values" testId="multiple-values">
        {JSON.stringify(values, null, 2)}
      </CodeBlock>
    </div>
  );
}
