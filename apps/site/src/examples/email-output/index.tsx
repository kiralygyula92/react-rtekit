import { useMemo, useState } from 'react';
import {
  RichTextEditor,
  documentToHtml,
  htmlToDocument,
  plainTextAlternative,
  type EditorValue,
} from 'react-rtekit';
import { DEFAULT_EMAIL_BODY } from '../../fixtures';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * The e-mail profile and the multipart alternative.
 *
 * What an e-mail needs that a web page does not: inline styles, absolute URLs, a
 * table wrapper for the old clients, and a `text/plain` part for the ones that refuse
 * HTML altogether.
 */

const MERGE_TAGS = [
  { key: 'first_name', label: 'First name', sample: 'Dana' },
  { key: 'due_date', label: 'Due date', sample: '14 October 2026' },
  { key: 'report_date', label: 'Report date', sample: '16 September 2026' },
  { key: 'company_name', label: 'Company name', sample: 'Northwind Ltd' },
  { key: 'company_address', label: 'Company address', sample: '14 Canal Street, Bristol' },
];

export default function EmailOutputExample() {
  const [value, setValue] = useState<string>(DEFAULT_EMAIL_BODY);
  const [wrapInTable, setWrapInTable] = useState(true);
  const [preview, setPreview] = useState(true);
  const [width, setWidth] = useState(600);

  const { html, text } = useMemo(() => {
    const doc = htmlToDocument(value, {
      mergeTags: { knownKeys: MERGE_TAGS.map((tag) => tag.key) },
    });
    return {
      html: documentToHtml(doc, {
        profile: 'email',
        email: {
          wrapInTable,
          containerWidth: width,
          fontFallback: 'Arial, Helvetica, sans-serif',
          forceAbsoluteUrls: 'https://app.example.com',
        },
        ...(preview
          ? { mergeTagPreview: Object.fromEntries(MERGE_TAGS.map((tag) => [tag.key, tag.sample])) }
          : {}),
      }),
      // The `text/plain` part of a multipart message: links become "text (url)" and
      // block structure becomes blank lines.
      text: plainTextAlternative(doc),
    };
  }, [preview, value, width, wrapInTable]);

  return (
    <div className="stack">
      <RichTextEditor
        preset="email"
        label="Message"
        hideLabel
        value={value}
        onChange={(next: EditorValue) => {
          setValue(next as string);
        }}
        mergeTags={{ tags: MERGE_TAGS }}
      />

      <div className="button-row">
        <label className="field-inline">
          <input
            type="checkbox"
            checked={wrapInTable}
            onChange={(event) => {
              setWrapInTable(event.target.checked);
            }}
          />
          Wrap in a centring table
        </label>
        <label className="field-inline">
          <input
            type="checkbox"
            checked={preview}
            onChange={(event) => {
              setPreview(event.target.checked);
            }}
          />
          Substitute merge tags
        </label>
        <label className="field-inline">
          Width
          <select
            value={width}
            onChange={(event) => {
              setWidth(Number(event.target.value));
            }}
          >
            <option value={480}>480</option>
            <option value={600}>600</option>
            <option value={720}>720</option>
          </select>
        </label>
      </div>

      <h2>Client preview</h2>
      <div className="email-preview" data-testid="email-preview">
        {/* Rendered in an isolated document, the way a client would: the styles this
            profile writes are inline, so nothing here depends on the site's CSS. */}
        <iframe title="E-mail preview" srcDoc={html} className="email-preview__frame" />
      </div>

      <h2>
        <code>text/html</code> part
      </h2>
      <CodeBlock label="Email html" testId="email-html">
        {html}
      </CodeBlock>

      <h2>
        <code>text/plain</code> alternative
      </h2>
      <CodeBlock label="Email text" testId="email-text">
        {text}
      </CodeBlock>
    </div>
  );
}
