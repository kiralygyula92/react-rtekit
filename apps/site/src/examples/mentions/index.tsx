import { useState } from 'react';
import { RichTextEditor, type EditorValue, type MentionCandidate } from 'react-rtekit';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * Mentions (05 §10).
 *
 * The search is asynchronous and deliberately slow, so the loading and empty states
 * are visible rather than theoretical. A mention is an atomic node carrying an id,
 * which is what a backend needs; the label is only what the author sees.
 */

const PEOPLE: MentionCandidate[] = [
  { id: 'u_1', label: 'Dana Scully', description: 'Field agent' },
  { id: 'u_2', label: 'Fox Mulder', description: 'Field agent' },
  { id: 'u_3', label: 'Walter Skinner', description: 'Assistant director' },
  { id: 'u_4', label: 'Monica Reyes', description: 'Field agent' },
];

export default function MentionsExample() {
  const [value, setValue] = useState('<p>Type the trigger to mention someone.</p>');

  const search = async (query: string, signal: AbortSignal): Promise<MentionCandidate[]> => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    if (signal.aborted) return [];
    const needle = query.toLowerCase();
    return PEOPLE.filter((person) => person.label.toLowerCase().includes(needle));
  };

  return (
    <div className="stack">
      <RichTextEditor
        preset="standard"
        label="Note"
        value={value}
        mentions={{ search }}
        onChange={(next: EditorValue) => {
          setValue(next as string);
        }}
      />

      <h2>Serialized</h2>
      <CodeBlock label="Mentions output" testId="mentions-output">
            {value}
          </CodeBlock>
    </div>
  );
}
