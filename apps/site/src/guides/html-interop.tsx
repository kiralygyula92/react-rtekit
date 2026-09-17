import { Code, Section, SeeAlso } from './Guide';

/** Reading markup another editor wrote, and writing markup something else has to read. */
export function HtmlInterop() {
  return (
    <>
      <p className="page__lead">
        Reading markup another editor wrote, and writing markup something else has to read.
      </p>

      <Section id="input" title="What it reads">
        <p>
          Legacy Quill markup, Word and Google Docs pastes, Excel tables and ordinary HTML all
          come in through one pipeline: parse, recognize the dialect, clean it, sanitize it,
          downgrade anything the active schema does not support, normalize.
        </p>

        <Code label="Input dialects">{`<RichTextEditor
  interop={{
    input: ['quill', 'office', 'standard'],
    office: { keepListNumbering: true },
  }}
/>`}</Code>

        <p>
          Downgrading matters: a heading pasted into an editor with headings turned off becomes a
          bold paragraph rather than markup that the serializer would silently drop later.
        </p>
      </Section>

      <Section id="output" title="What it writes">
        <p>Four output profiles, chosen with <code>htmlProfile</code>:</p>
        <ul>
          <li><strong>standard</strong> — semantic HTML with <code>rte-</code> classes.</li>
          <li><strong>quill-compatible</strong> — <code>ql-</code> classes and <code>data-list</code> attributes, so an old editor can still read what this one saved.</li>
          <li><strong>email</strong> — inline styles only, because e-mail clients drop stylesheets.</li>
          <li><strong>minimal</strong> — tags alone.</li>
        </ul>

        <Code label="Output profiles">{`<RichTextEditor htmlProfile="quill-compatible" />

// Or per call:
editor.getHTML({ profile: 'email', email: { wrapInTable: true, containerWidth: 600 } });`}</Code>
      </Section>

      <Section id="rollout" title="A phased rollout">
        <p>
          <code>quill-compatible</code> exists for one situation: half your users are on the new
          editor and half are still on the old one, against the same column. Write that profile
          until the old editor is gone, then switch to <code>standard</code> and backfill.
        </p>
      </Section>

      <SeeAlso examples={['html-interop', 'paste-cleanup', 'email-output']} guides={['sanitization', 'migration-from-quill']} />
    </>
  );
}
