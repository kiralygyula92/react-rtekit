import { useRef, useState } from 'react';
import {
  RichTextEditor,
  documentToHtml,
  htmlToDocument,
  type EditorInstance,
  type EditorValue,
} from 'react-rtekit';
import { DEFAULT_EMAIL_BODY } from '../../fixtures';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * Merge tags (fixes R23).
 *
 * A tag is one atomic node: select the whole message and bold it, and the tags come
 * through unchanged. Preview mode substitutes the samples without touching the stored
 * value, which is what the backend still receives.
 */

const TAGS = [
  { key: 'first_name', label: 'First name', group: 'Contact', sample: 'Dana' },
  { key: 'due_date', label: 'Due date', group: 'Dates', sample: '14 October 2026' },
  { key: 'report_date', label: 'Report date', group: 'Dates', sample: '16 September 2026' },
  { key: 'company_name', label: 'Company name', group: 'Organization', sample: 'Northwind Ltd' },
  {
    key: 'company_address',
    label: 'Company address',
    group: 'Organization',
    sample: '1 Marina Way',
  },
];

export default function MergeTagsExample() {
  const [value, setValue] = useState(DEFAULT_EMAIL_BODY);
  const [preview, setPreview] = useState(false);
  const editorRef = useRef<EditorInstance | null>(null);

  const previewed = documentToHtml(htmlToDocument(value), {
    mergeTagPreview: Object.fromEntries(TAGS.map((tag) => [tag.key, tag.sample])),
  });

  return (
    <div className="stack">
      <div className="button-row">
        <label className="field-inline">
          <input
            type="checkbox"
            checked={preview}
            onChange={(event) => {
              setPreview(event.target.checked);
            }}
          />
          Preview with sample values
        </label>
        {TAGS.slice(0, 3).map((tag) => (
          <button
            key={tag.key}
            type="button"
            className="button"
            onClick={() => {
              editorRef.current?.insertMergeTag(tag.key);
            }}
          >
            Insert {tag.label}
          </button>
        ))}
      </div>

      <RichTextEditor
        preset="email"
        label="Message"
        value={value}
        editorRef={editorRef}
        mergeTags={{ tags: TAGS, unknownTagBehaviour: 'warn' }}
        onChange={(next: EditorValue) => {
          setValue(next as string);
        }}
      />

      <p className="page__lead">Type the trigger to open the insert menu.</p>

      <h2>{preview ? 'With sample values' : 'Stored value'}</h2>
      <CodeBlock label="Merge tags output" testId="merge-tags-output">
        {preview ? previewed : value}
      </CodeBlock>
    </div>
  );
}
