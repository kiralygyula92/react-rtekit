import { useState } from 'react';
import { RichTextEditor, type EditorValue, type UploadResult } from 'react-rtekit';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * Images and uploads (05 §7).
 *
 * The upload service is a mock that reports progress over two seconds and can be made
 * to fail, because the interesting states — in flight, failed, retried — are the ones
 * a real service only shows you in production.
 */

/** A 1×1 transparent PNG, so the demo needs no network. */
const PLACEHOLDER =
  'data:image/svg+xml;base64,' +
  btoa(
    '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180">' +
      '<rect width="320" height="180" fill="#E9EAEB"/>' +
      '<text x="160" y="96" text-anchor="middle" font-family="sans-serif" fill="#717680">Uploaded</text>' +
      '</svg>',
  );

export default function ImagesExample() {
  const [value, setValue] = useState('<p>Drop an image here, or use the toolbar.</p>');
  const [shouldFail, setShouldFail] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const upload = async (
    file: File,
    ctx: { signal: AbortSignal; onProgress: (progress: number) => void },
  ): Promise<UploadResult> => {
    setLog((entries) => [`${file.name} — started`, ...entries]);
    for (let progress = 20; progress <= 100; progress += 20) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      if (ctx.signal.aborted) throw new Error('cancelled');
      ctx.onProgress(progress);
    }
    if (shouldFail) {
      setLog((entries) => [`${file.name} — failed`, ...entries]);
      throw new Error('The upload service is unavailable');
    }
    setLog((entries) => [`${file.name} — done`, ...entries]);
    return { url: PLACEHOLDER, alt: file.name, width: 320, height: 180 };
  };

  return (
    <div className="stack">
      <label className="field-inline">
        <input
          type="checkbox"
          checked={shouldFail}
          onChange={(event) => {
            setShouldFail(event.target.checked);
          }}
        />
        Make the upload fail
      </label>

      <RichTextEditor
        preset="full"
        label="Content"
        value={value}
        onUpload={upload}
        uploadAccept="image/*"
        maxUploadSize={2 * 1024 * 1024}
        imageOptions={{ resizable: true, captions: true, maxWidth: 640 }}
        onUploadError={(error) => {
          setLog((entries) => [`error: ${String(error)}`, ...entries]);
        }}
        onChange={(next: EditorValue) => {
          setValue(next as string);
        }}
      />

      <p className="page__lead">
        Click an image to resize it, set its alt text or add a caption. Files over 2 MB and
        anything that is not an image are refused before the upload starts.
      </p>

      <h2>Upload log</h2>
      <ul className="example-related" data-testid="upload-log">
        {log.length === 0 ? <li>Nothing uploaded yet.</li> : null}
        {log.map((entry, index) => (
          // Log lines are positional history, so the index is the identity.
          <li key={index}>{entry}</li>
        ))}
      </ul>

      <h2>Serialized</h2>
      <CodeBlock label="Images output" testId="images-output">
            {value}
          </CodeBlock>
    </div>
  );
}
