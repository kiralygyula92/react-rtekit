import { useState } from 'react';
import { RichTextEditor, type EditorValue } from 'react-rtekit';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * Links.
 *
 * The popover, autolinking, and a validator. Switch the validator on to see a policy
 * that only accepts internal URLs — the sanitizer's own rules apply either way, so a
 * `javascript:` URL is refused whatever the validator returns.
 */

const SAMPLE =
  '<p>Read the <a href="https://example.com/report">full report</a>, or mail ' +
  '<a href="mailto:support@example.com">support@example.com</a>.</p>' +
  '<p>Type a bare URL like example.com and watch it link itself.</p>';

export default function LinksExample() {
  const [value, setValue] = useState(SAMPLE);
  const [internalOnly, setInternalOnly] = useState(false);
  const [autoLink, setAutoLink] = useState(true);

  return (
    <div className="stack">
      <div className="button-row">
        <label className="field-inline">
          <input
            type="checkbox"
            checked={internalOnly}
            onChange={(event) => {
              setInternalOnly(event.target.checked);
            }}
          />
          Only accept <code>https://intra.example/</code> URLs
        </label>
        <label className="field-inline">
          <input
            type="checkbox"
            checked={autoLink}
            onChange={(event) => {
              setAutoLink(event.target.checked);
            }}
          />
          Autolink while typing
        </label>
      </div>

      <RichTextEditor
        key={`${String(internalOnly)}-${String(autoLink)}`}
        preset="standard"
        label="Content"
        value={value}
        autoLink={autoLink}
        toolbar={[['bold', 'italic'], ['link', 'unlink']]}
        {...(internalOnly
          ? {
              linkValidator: (url: string) =>
                url.startsWith('https://intra.example/') ? null : 'Internal links only',
            }
          : {})}
        onChange={(next: EditorValue) => {
          setValue(next as string);
        }}
      />

      <p className="page__lead">
        Select some text and press <kbd>Ctrl</kbd>+<kbd>K</kbd>, or click an existing link. A
        plain click opens the popover; <kbd>Ctrl</kbd>+click follows the link.
      </p>

      <h2>Serialized</h2>
      <CodeBlock label="Links output" testId="links-output">
            {value}
          </CodeBlock>
    </div>
  );
}
