import { useMemo, useState } from 'react';
import { RteContentView } from 'react-rtekit/view';
import { sanitizeHtml, type SanitizeProfileName } from 'react-rtekit';
import { XSS_PAYLOADS } from '../../fixtures';
import { ChoiceGroup } from '../../components/ChoiceGroup';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * What each sanitization profile strips.
 *
 * Read-only by construction: the payloads are rendered as *text*, and the only thing
 * this page ever puts in the DOM as markup is the sanitizer's output. A demo that
 * proves an XSS defence by running the XSS would be a strange demo.
 */

const PROFILES: { name: SanitizeProfileName; summary: string }[] = [
  { name: 'strict', summary: 'Marks and paragraphs only. No links, no images, no styles.' },
  { name: 'standard', summary: 'The default: everything the editor can edit, nothing it cannot.' },
  { name: 'email', summary: 'Inline styles allowed, because e-mail clients have no stylesheet.' },
  {
    name: 'permissive',
    summary: 'Widest allowlist — and still no scripts, no event handlers, no javascript: URLs.',
  },
];

/** Things that must never appear in output, whatever the profile. */
const FORBIDDEN = ['<script', 'onerror', 'onload', 'javascript:', '<iframe', '<object', 'srcdoc'];

export default function SanitizationExample() {
  const [profile, setProfile] = useState<SanitizeProfileName>('standard');
  const [input, setInput] = useState(XSS_PAYLOADS[0]!.html);

  const output = useMemo(() => sanitizeHtml(input, { sanitize: profile }), [input, profile]);
  const violations = useMemo(
    () => FORBIDDEN.filter((needle) => output.toLowerCase().includes(needle)),
    [output],
  );

  return (
    <div className="stack">
      <p className="page__lead">
        Pick a payload or paste your own. Nothing here is ever evaluated: the input is shown as
        text, and only the sanitized result is rendered as HTML.
      </p>

      <ChoiceGroup
        label="Profile"
        hint="How much of the incoming markup survives. Every profile blocks scripts and event handlers."
        options={PROFILES.map((entry) => entry.name)}
        value={profile}
        onChange={setProfile}
      />
      <p className="page__lead" data-testid="profile-summary">
        {PROFILES.find((entry) => entry.name === profile)!.summary}
      </p>

      <label className="stack">
        <span className="parity__label">Payload</span>
        <select
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
          }}
        >
          {XSS_PAYLOADS.map((payload) => (
            <option key={payload.id} value={payload.html}>
              {payload.id} — {payload.vector}
            </option>
          ))}
        </select>
      </label>

      <label className="stack">
        <span className="parity__label">Or paste your own</span>
        <textarea
          rows={4}
          value={input}
          spellCheck={false}
          onChange={(event) => {
            setInput(event.target.value);
          }}
          data-testid="sanitize-input"
        />
      </label>

      <div className="parity__outputs">
        <figure>
          <figcaption>Input, as text</figcaption>
          <CodeBlock label="Code">{input}</CodeBlock>
        </figure>
        <figure>
          <figcaption>
            Output of <code>sanitizeHtml(input, &quot;{profile}&quot;)</code>
          </figcaption>
          <CodeBlock label="Sanitize output" testId="sanitize-output">
            {output || '(everything was removed)'}
          </CodeBlock>
        </figure>
      </div>

      <p
        className={violations.length === 0 ? 'callout' : 'callout callout--danger'}
        data-testid="sanitize-verdict"
      >
        {violations.length === 0
          ? 'No script, event handler or dangerous URL survived.'
          : `Something got through: ${violations.join(', ')}`}
      </p>

      <h2>The sanitized result, rendered</h2>
      <div className="example-basic__preview">
        <RteContentView value={output} sanitize={profile} />
      </div>
    </div>
  );
}
