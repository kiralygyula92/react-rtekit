import { Code, Section, SeeAlso } from './Guide';

/** Rendering on the server, hydrating without a flash, and the parts that never need a browser. */
export function Ssr() {
  return (
    <>
      <p className="page__lead">
        Rendering on the server, hydrating without a flash, and the parts that never need a browser.
      </p>

      <Section id="view" title="Rendering stored content">
        <p>
          <code>&lt;RteContentView&gt;</code> has no engine and no browser dependency. It is the right
          way to render stored content on a server — a list page, an e-mail preview, a printable
          report — and it applies the same prose styles the editor does.
        </p>

        <Code label="RteContentView">{`import { RteContentView } from 'react-rtekit/view';
import 'react-rtekit/content.css';

export default function Page({ html }) {
  return <RteContentView value={html} sanitize="standard" />;
}`}</Code>
      </Section>

      <Section id="editor" title="The editor itself">
        <p>
          The editor needs a DOM. In Next.js the App Router marks the entry points
          <code>&apos;use client&apos;</code> for you; in the Pages Router, import it dynamically.
        </p>

        <Code label="Next.js">{`const RichTextEditor = dynamic(
  () => import('react-rtekit').then((m) => m.RichTextEditor),
  { ssr: false, loading: () => <RteContentView value={initialHtml} /> },
);`}</Code>

        <p>
          Rendering the read-only view as the loading state is what avoids a blank box: the
          content is already there, and the editor takes over when it arrives.
        </p>
      </Section>

      <Section id="core" title="The core on a server">
        <p>
          <code>react-rtekit/core</code> is pure: sanitize, parse and serialize in a Node handler, a
          worker or a build step, with no DOM anywhere.
        </p>

        <Code label="On the server">{`import { sanitizeHtml, htmlToDocument, documentToHtml } from 'react-rtekit/core';

// Never trust what arrives, even from your own editor.
const stored = sanitizeHtml(request.body.html, { sanitize: 'standard' });
const forEmail = documentToHtml(htmlToDocument(stored), { profile: 'email' });`}</Code>
      </Section>

      <SeeAlso examples={['readonly-and-disabled', 'email-output']} guides={['performance', 'sanitization']} />
    </>
  );
}
