import { Callout, Code, Section, SeeAlso } from './Guide';

/** Handing files to your own service, and the constraints that run before anything leaves the browser. */
export function Uploads() {
  return (
    <>
      <p className="page__lead">
        Handing files to your own service, and the constraints that run before anything leaves the browser.
      </p>

      <Section id="handler" title="The upload handler">
        <Code label="onUpload">{`<RichTextEditor
  onUpload={async (file, { signal, onProgress }) => {
    const body = new FormData();
    body.append('file', file);
    const response = await fetch('/api/uploads', { method: 'POST', body, signal });
    if (!response.ok) throw new Error('Upload failed');
    const { url, width, height } = await response.json();
    return { url, alt: file.name, width, height };
  }}
  uploadAccept="image/*"
  maxUploadSize={5 * 1024 * 1024}
  onUploadError={(error, file) => toast(String(error))}
/>`}</Code>

        <p>
          The same handler covers the toolbar dialog, drag-and-drop and paste — there is one
          path in, so there is one thing to secure.
        </p>
      </Section>

      <Section id="constraints" title="Constraints">
        <p>
          <code>uploadAccept</code> and <code>maxUploadSize</code> are enforced <em>before</em> the upload
          starts. A 30 MB file should never leave the browser to be rejected by a server.
        </p>

        <Callout kind="warning">
          Data-URL images are off by default (<code>allowDataUrlImages</code>). They bloat stored
          content, they bypass your CDN, and pasting one is the usual way a 4 MB screenshot ends
          up inside a database row.
        </Callout>
      </Section>

      <Section id="security" title="Security notes">
        <ul>
          <li>Validate the content type on the server; a browser&rsquo;s <code>file.type</code> is a hint, not a fact.</li>
          <li>Serve uploads from a separate origin, so a malicious SVG cannot reach your cookies.</li>
          <li>The sanitizer refuses <code>javascript:</code> sources whatever your handler returns.</li>
        </ul>
      </Section>

      <SeeAlso examples={['images', 'sanitization']} guides={['sanitization']} />
    </>
  );
}
