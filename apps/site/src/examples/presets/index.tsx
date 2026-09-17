import { useState } from 'react';
import { RichTextEditor, documentToHtml, htmlToDocument, type PresetName } from 'react-rtekit';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * The six presets, switched live (04 §2.3, 08 §3.2).
 *
 * A preset is a plugin bundle plus prop defaults — a toolbar, a theme, an HTML
 * profile and a set of limits. Switching one remounts the editor with the same
 * content, which is also the easiest way to see what each one keeps.
 */

/** What each preset is for, in the order 04 §2.3 lists them. */
const PRESETS: { name: PresetName; summary: string }[] = [
  { name: 'minimal', summary: 'Bold, italic, links. For a comment box that should stay small.' },
  { name: 'classic', summary: 'The Skimmer parity bundle: eight buttons, 287px, quill-compatible output.' },
  { name: 'standard', summary: 'The general-purpose bundle: marks, headings, lists, links, history.' },
  { name: 'email', summary: 'Everything an e-mail client renders, and nothing it does not.' },
  { name: 'comment', summary: 'Compact chrome, no block formatting, counter always visible.' },
  { name: 'full', summary: 'Every plugin the library ships, including tables and images.' },
];

const SAMPLE =
  '<h2>Quarterly summary</h2>' +
  '<p>The <strong>April</strong> results are <em>within range</em>, with one exception.</p>' +
  '<ul><li>Chlorine: normal</li><li>pH: <span style="color: #C81E1E">high</span></li></ul>' +
  '<p><a href="https://example.com/report">Full report</a></p>';

export default function PresetsExample() {
  const [preset, setPreset] = useState<PresetName>('classic');
  const [value, setValue] = useState<string>(SAMPLE);

  const current = PRESETS.find((entry) => entry.name === preset)!;

  return (
    <div className="stack">
      <div className="button-row" role="radiogroup" aria-label="Preset">
        {PRESETS.map((entry) => (
          <button
            key={entry.name}
            type="button"
            role="radio"
            aria-checked={entry.name === preset}
            className="chip"
            data-active={entry.name === preset}
            onClick={() => {
              setPreset(entry.name);
            }}
          >
            {entry.name}
          </button>
        ))}
      </div>

      <p className="page__lead" data-testid="preset-summary">
        {current.summary}
      </p>

      <RichTextEditor
        // Remounting is the point: a preset chooses plugins, and plugins are
        // resolved when the editor is created.
        key={preset}
        preset={preset}
        label="Message"
        defaultValue={value}
        onChange={(next) => {
          setValue(next as string);
        }}
      />

      <h2>Output for this preset</h2>
      <CodeBlock label="Preset output" testId="preset-output">
            {documentToHtml(htmlToDocument(value), { profile: preset === 'email' ? 'email' : 'standard' })}
          </CodeBlock>
    </div>
  );
}
