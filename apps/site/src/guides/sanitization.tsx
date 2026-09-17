import { Callout, Code, Section, SeeAlso } from './Guide';

/** What the sanitizer removes, where it runs, and the rules no configuration can switch off. */
export function Sanitization() {
  return (
    <>
      <p className="page__lead">
        What the sanitizer removes, where it runs, and the rules no configuration can switch off.
      </p>

      <Section id="boundaries" title="Every boundary">
        <p>
          Content is sanitized on the way in and on the way out — the initial value, every paste,
          every drop, the source view, <code>insertContent</code>, and the HTML you read back.
          There is no path into the document that skips it.
        </p>

        <Code label="Where it runs">{`<RichTextEditor
  sanitize="standard"      // the input profile
  sanitizeOutput           // sanitize what getHTML() returns (default: true)
/>`}</Code>
      </Section>

      <Section id="profiles" title="The four profiles">
        <p>
          <strong>strict</strong> keeps marks and paragraphs.{' '}
          <strong>standard</strong> keeps everything the editor can edit.{' '}
          <strong>email</strong> allows the inline styles an e-mail needs.{' '}
          <strong>permissive</strong> has the widest allowlist — and still no scripts.
        </p>

        <Code label="Profiles">{`sanitizeHtml(html, { sanitize: 'strict' });
sanitizeHtml(html, { sanitize: 'email' });

// Or tune one:
<RichTextEditor sanitize={{ profile: 'standard', allowTags: ['abbr'], allowAttributes: { abbr: ['title'] } }} />`}</Code>
        <p>
          <strong>standard</strong> keeps <code>data:</code> URLs for the four raster image
          types — PNG, JPEG, GIF and WebP — which is what lets an author insert a picture from
          their own machine into an editor with no upload endpoint behind it. They are pixels;
          there is nothing in one to execute. <code>data:image/svg+xml</code> and{' '}
          <code>data:text/html</code> are documents that can carry script, and both stay blocked
          in every profile. <strong>strict</strong> and <strong>email</strong> take no data URL
          at all; pass <code>{'{ allowDataUrls: false }'}</code> to hold <strong>standard</strong>{' '}
          to the same line.
        </p>
      </Section>

      <Section id="hard-rules" title="The rules configuration cannot reach">
        <p>No profile and no configuration can allow any of these:</p>
        <ul>
          <li><code>&lt;script&gt;</code>, <code>&lt;iframe&gt;</code>, <code>&lt;object&gt;</code>, <code>&lt;embed&gt;</code>, <code>&lt;form&gt;</code></li>
          <li>Any <code>on*</code> attribute</li>
          <li><code>javascript:</code>, <code>vbscript:</code> and <code>data:text/html</code> URLs</li>
          <li><code>style</code> containing <code>expression()</code>, <code>url(javascript:)</code> or <code>@import</code></li>
          <li><code>srcdoc</code>, and <code>&lt;svg&gt;</code> outside the permissive profile</li>
        </ul>

        <Callout kind="warning">
          A <code>linkValidator</code> can <em>tighten</em> these rules and never loosen them. A
          validator that returns <code>null</code> for everything still cannot produce a{' '}
          <code>javascript:</code> link.
        </Callout>
      </Section>

      <Section id="reporting" title="Knowing what was removed">
        <Code label="Reporting">{`<RichTextEditor
  handlers={{
    onSanitizeViolation: ({ violation }, next) => {
      report('rte.sanitize', violation); // { tag, attribute, reason }
      next();
    },
  }}
  onContentWarning={(warnings) => console.warn(warnings)}
/>`}</Code>
      </Section>

      <SeeAlso examples={['sanitization', 'paste-cleanup', 'html-interop']} guides={['html-interop', 'uploads']} />
    </>
  );
}
