import { useMemo, useState } from 'react';
import { documentToHtml, documentToText, htmlToDocument, type PasteMode } from 'react-rtekit';
import { OFFICE_FIXTURES, QUILL_FIXTURES } from '../../fixtures';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * What the paste pipeline does to markup from other editors (03 §3, fixes R20).
 *
 * The fixtures are the same corpus the library's own tests run against, so what this
 * page shows is exactly what the test suite asserts.
 */

/** Every fixture, labelled by where it came from. */
const SOURCES = [
  ...OFFICE_FIXTURES.map((fixture) => ({
    id: fixture.id,
    label: `${fixture.source}: ${fixture.id}`,
    html: fixture.html,
  })),
  ...QUILL_FIXTURES.slice(0, 8).map((fixture) => ({
    id: `quill-${fixture.id}`,
    label: `quill: ${fixture.id}`,
    html: fixture.html,
  })),
];

/** Markers that should never survive a clean-up. */
const NOISE = ['mso-', 'MsoNormal', 'docs-internal-guid', 'class="ql-', 'o:p', 'xmlns:'];

export default function PasteCleanupExample() {
  const [sourceId, setSourceId] = useState(SOURCES[0]!.id);
  const [mode, setMode] = useState<PasteMode>('rich');

  const source = SOURCES.find((entry) => entry.id === sourceId)!;

  const cleaned = useMemo(() => {
    const html = mode === 'clean' ? source.html.replace(/\s(?:style|class)="[^"]*"/gi, '') : source.html;
    const doc = htmlToDocument(html);
    return mode === 'text' ? documentToText(doc) : documentToHtml(doc);
  }, [mode, source.html]);

  const remaining = useMemo(
    () => NOISE.filter((needle) => cleaned.toLowerCase().includes(needle.toLowerCase())),
    [cleaned],
  );

  return (
    <div className="stack">
      <p className="page__lead">
        The before/after of a real paste. Everything on the left is what the source editor put on
        the clipboard; everything on the right is what lands in the document.
      </p>

      <div className="button-row">
        <label className="field-inline">
          Source
          <select
            value={sourceId}
            onChange={(event) => {
              setSourceId(event.target.value);
            }}
          >
            {SOURCES.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field-inline">
          Mode
          <select
            value={mode}
            onChange={(event) => {
              setMode(event.target.value as PasteMode);
            }}
          >
            <option value="rich">rich — keep what the schema allows</option>
            <option value="clean">clean — keep structure, drop styling</option>
            <option value="text">text — plain text only</option>
          </select>
        </label>
      </div>

      <div className="parity__outputs">
        <figure>
          <figcaption>On the clipboard</figcaption>
          <CodeBlock label="Paste before" testId="paste-before">
            {source.html}
          </CodeBlock>
        </figure>
        <figure>
          <figcaption>In the document</figcaption>
          <CodeBlock label="Paste after" testId="paste-after">
            {cleaned}
          </CodeBlock>
        </figure>
      </div>

      <p
        className={remaining.length === 0 ? 'callout' : 'callout callout--danger'}
        data-testid="paste-verdict"
      >
        {remaining.length === 0
          ? 'No editor-specific noise survived the clean-up.'
          : `Still present: ${remaining.join(', ')}`}
      </p>
    </div>
  );
}
