import { useMemo, useState } from 'react';
import {
  RichTextEditor,
  documentToHtml,
  htmlToDocument,
  type HtmlProfile,
  type EditorValue,
} from 'react-rtekit';
import { ChoiceGroup } from '../../components/ChoiceGroup';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * The four HTML output profiles.
 *
 * Load legacy Quill markup, edit it, and see what each profile writes. The point of
 * `quill-compatible` is a phased rollout: what this editor saves stays readable by
 * the old one, so both can run against the same column (ADR-004).
 */

const PROFILES: { name: HtmlProfile; summary: string }[] = [
  { name: 'standard', summary: 'Semantic HTML with rte- classes. The default for new storage.' },
  {
    name: 'quill-compatible',
    summary: 'ql- classes and data-list attributes, so the old editor can still read it.',
  },
  { name: 'email', summary: 'Inline styles only, because e-mail clients drop stylesheets.' },
  { name: 'minimal', summary: 'Tags alone: no classes, no styles, nothing to theme.' },
];

/**
 * Markup in the shape the old editor produced: ql- classes, data-list attributes and
 * inline colours.
 *
 * Taken from the test corpus, with one change: the corpus keeps the original
 * `#FF0000`, which is 3.99:1 on white. A demo page should not ship text that fails
 * AA, and the interop behaviour is identical either way.
 */
const LEGACY_QUILL_HTML =
  '<p class="ql-align-center"><strong>Quarterly summary</strong></p>' +
  '<p>Hi {first_name},</p>' +
  '<p><span style="color: #C81E1E">Action needed:</span> your account needs attention.</p>' +
  '<ul><li data-list="bullet">Review the attached figures</li><li data-list="bullet">Reply by Friday</li></ul>' +
  '<p><br></p>' +
  '<p>Thank you,</p><p>{company_name}</p>';

export default function HtmlInteropExample() {
  const [value, setValue] = useState<string>(LEGACY_QUILL_HTML);
  const [profile, setProfile] = useState<HtmlProfile>('standard');

  const outputs = useMemo(() => {
    const doc = htmlToDocument(value);
    return Object.fromEntries(
      PROFILES.map((entry) => [entry.name, documentToHtml(doc, { profile: entry.name })]),
    ) as Record<HtmlProfile, string>;
  }, [value]);

  const current = PROFILES.find((entry) => entry.name === profile)!;

  return (
    <div className="stack">
      <p className="page__lead">
        The editor below starts with markup the old Quill-based editor produced. Edit it, then
        compare what each profile writes.
      </p>

      <RichTextEditor
        preset="standard"
        label="Content"
        value={value}
        onChange={(next: EditorValue) => {
          setValue(next as string);
        }}
      />

      <ChoiceGroup
        label="Output profile"
        hint="Which dialect of HTML the editor writes out. What it reads is unaffected."
        options={PROFILES.map((entry) => entry.name)}
        value={profile}
        onChange={setProfile}
      />

      <p className="page__lead" data-testid="interop-summary">
        {current.summary}
      </p>

      <CodeBlock label="Interop output" testId="interop-output">
        {outputs[profile]}
      </CodeBlock>

      <h2>Side by side</h2>
      <table className="data-table" data-testid="interop-table">
        <thead>
          <tr>
            <th>Profile</th>
            <th>Bytes</th>
            <th>Classes</th>
            <th>Inline styles</th>
          </tr>
        </thead>
        <tbody>
          {PROFILES.map((entry) => {
            const html = outputs[entry.name];
            return (
              <tr key={entry.name}>
                <td>
                  <code>{entry.name}</code>
                </td>
                <td>{html.length}</td>
                <td>{(html.match(/class="/g) ?? []).length}</td>
                <td>{(html.match(/style="/g) ?? []).length}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
