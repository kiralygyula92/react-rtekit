import { useMemo, useState } from 'react';
import {
  RichTextEditor,
  documentToHtml,
  htmlToDocument,
  isEmptyHtml,
  type EditorValue,
} from 'react-rtekit';
import { DEFAULT_EMAIL_BODY } from '../../fixtures';
import { FIXED_BUGS } from './fixed-bugs';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * A legacy "send report" form, reproduced 1:1.
 *
 * Same eight buttons in the same order, same 287px box, same 21 swatches, same
 * default merge-tag body. Everything that differs is a listed defect that is fixed
 * here rather than reproduced — the "show differences" toggle lists them all.
 */

/** The five merge tags the backend substitutes; they must survive editing. */
const MERGE_TAGS = [
  { key: 'first_name', label: 'First name', sample: 'Dana' },
  { key: 'due_date', label: 'Due date', sample: '14 October 2026' },
  { key: 'report_date', label: 'Report date', sample: '16 September 2026' },
  { key: 'company_name', label: 'Company name', sample: 'Northwind Ltd' },
  { key: 'company_address', label: 'Company address', sample: '14 Canal Street, Bristol' },
];

/** The original limit, now counted in text characters rather than markup (fixes R3). */
const MESSAGE_MAX_LENGTH = 2048;

export default function LegacyParityExample() {
  const [message, setMessage] = useState<string>(DEFAULT_EMAIL_BODY);
  const [to, setTo] = useState<string[]>(['dana@example.com']);
  const [cc, setCc] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [showDifferences, setShowDifferences] = useState(false);
  const [showOutput, setShowOutput] = useState(true);

  // The same document, serialized for storage and for an e-mail client.
  const outputs = useMemo(() => {
    const doc = htmlToDocument(message, {
      mergeTags: { knownKeys: MERGE_TAGS.map((tag) => tag.key) },
    });
    return {
      classic: documentToHtml(doc, { profile: 'quill-compatible' }),
      email: documentToHtml(doc, {
        profile: 'email',
        email: { fontFallback: 'Arial, Helvetica, sans-serif' },
        mergeTagPreview: Object.fromEntries(MERGE_TAGS.map((tag) => [tag.key, tag.sample])),
      }),
    };
  }, [message]);

  const empty = isEmptyHtml(message);

  return (
    <div className="parity">
      <form
        className="parity__form"
        onSubmit={(event) => {
          event.preventDefault();
          // The old form sent this even when the body was `<p><br></p>` (R2).
          if (empty) return;
          setSubmitted(new Date().toLocaleTimeString());
        }}
      >
        <h2 className="parity__title">Send report e-mail</h2>

        <ChipInput label="To" values={to} onChange={setTo} placeholder="name@example.com" />
        <ChipInput label="CC" values={cc} onChange={setCc} placeholder="Add a CC recipient" />

        <RichTextEditor
          preset="classic"
          label="Message"
          value={message}
          onChange={(value: EditorValue) => {
            setMessage(value as string);
          }}
          required
          maxLength={MESSAGE_MAX_LENGTH}
          maxLengthBehaviour="warn"
          showCounter
          placeholder="Write the message that goes out with the report…"
          mergeTags={{ tags: MERGE_TAGS, unknownTagBehaviour: 'warn' }}
          helperText="Merge tags are replaced by the backend when the e-mail is sent."
        />

        <div className="parity__actions">
          <button type="submit" className="button button--solid" disabled={empty}>
            Send
          </button>
          <span className="parity__status" data-testid="parity-status">
            {/* The length is the editor's own counter; this is only what Send will do. */}
            {submitted
              ? `Sent at ${submitted} to ${[...to, ...cc].join(', ')}`
              : empty
                ? 'The message is empty, so Send is disabled (R2)'
                : null}
          </span>
        </div>
      </form>

      <section className="parity__panel">
        <div className="parity__panel-head">
          <h2>Output HTML</h2>
          <button
            type="button"
            className="button"
            aria-expanded={showOutput}
            onClick={() => {
              setShowOutput((previous) => !previous);
            }}
          >
            {showOutput ? 'Hide' : 'Show'}
          </button>
        </div>
        {showOutput ? (
          <div className="parity__outputs">
            <figure>
              <figcaption>
                <code>quill-compatible</code> — what the old API stored
              </figcaption>
              <CodeBlock label="Parity output classic" testId="parity-output-classic">
                {outputs.classic}
              </CodeBlock>
            </figure>
            <figure>
              <figcaption>
                <code>email</code> — inline styles, merge tags previewed
              </figcaption>
              <CodeBlock label="Parity output email" testId="parity-output-email">
                {outputs.email}
              </CodeBlock>
            </figure>
          </div>
        ) : null}
      </section>

      <section className="parity__panel">
        <div className="parity__panel-head">
          <h2>Differences from the original</h2>
          <button
            type="button"
            className="button"
            aria-expanded={showDifferences}
            aria-controls="parity-differences"
            onClick={() => {
              setShowDifferences((previous) => !previous);
            }}
          >
            {showDifferences ? 'Hide differences' : 'Show differences'}
          </button>
        </div>
        <p className="parity__note">
          The visuals are identical to the original. Everything listed here is a bug from the old
          implementation that this page fixes rather than reproduces.
        </p>
        {showDifferences ? (
          <ol id="parity-differences" className="parity__bugs" data-testid="parity-differences">
            {FIXED_BUGS.map((bug) => (
              <li key={bug.id}>
                <strong>{bug.id}</strong> <span className="parity__bug-was">{bug.was}</span>
                <span className="parity__bug-now">{bug.now}</span>
              </li>
            ))}
          </ol>
        ) : null}
      </section>
    </div>
  );
}

/** Props for {@link ChipInput}. */
interface ChipInputProps {
  label: string;
  values: string[];
  placeholder: string;
  onChange: (values: string[]) => void;
}

/** The recipient chips the original form rendered around the editor. */
function ChipInput({ label, values, placeholder, onChange }: ChipInputProps) {
  const [draft, setDraft] = useState('');

  const commit = (): void => {
    const value = draft.trim().replace(/,$/, '');
    if (!value) return;
    onChange([...values, value]);
    setDraft('');
  };

  return (
    <div className="parity__field">
      <span className="parity__label" id={`chips-${label}`}>
        {label}
      </span>
      <div className="parity__chips">
        {values.map((value) => (
          <span key={value} className="parity__chip">
            {value}
            <button
              type="button"
              aria-label={`Remove ${value}`}
              onClick={() => {
                onChange(values.filter((entry) => entry !== value));
              }}
            >
              ×
            </button>
          </span>
        ))}
        <input
          className="parity__chip-input"
          aria-labelledby={`chips-${label}`}
          placeholder={placeholder}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
          }}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault();
              commit();
            }
          }}
        />
      </div>
    </div>
  );
}
