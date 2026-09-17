import { Code, Section, SeeAlso } from './Guide';

/** Large documents, subscription granularity, bundle size and what to measure. */
export function Performance() {
  return (
    <>
      <p className="page__lead">
        Large documents, subscription granularity, bundle size and what to measure.
      </p>

      <Section id="subscriptions" title="Subscriptions">
        <p>
          State is a single immutable snapshot and components subscribe with a selector, so a
          toolbar button re-renders when its own state changes and not when you type.
        </p>

        <Code label="Subscribing narrowly">{`// Re-renders only when this one value changes.
const canUndo = useEditorState((snapshot) => snapshot.format.canUndo);

// Not this, which re-renders on every keystroke:
const { format } = useEditorState((snapshot) => snapshot);`}</Code>
      </Section>

      <Section id="large" title="Large documents">
        <ul>
          <li>Serialization is on demand: <code>meta.document</code> is a lazy getter, so a change handler that only reads <code>meta.length</code> never builds a document.</li>
          <li>Use <code>onChangeDebounced</code> for anything expensive — a network save, a preview render.</li>
          <li><code>maxHeight</code> with <code>autoGrow</code> keeps a long document from making the page scroll oddly.</li>
        </ul>

        <Code label="Debounced work">{`<RichTextEditor
  onChange={setValue}                    // cheap: keep the value
  onChangeDebounced={saveDraft}          // expensive: 300ms after the typing stops
  changeDebounceMs={300}
/>`}</Code>
      </Section>

      <Section id="bundle" title="Bundle size">
        <p>
          Import what you use. <code>react-rtekit/core</code> is the headless half with no React and no
          engine — parsing, sanitizing and serializing — which is all a server needs.
          <code>react-rtekit/view</code> renders stored content without loading an editor at all.
        </p>

        <Code label="Server-side">{`import { sanitizeHtml, htmlToDocument, documentToHtml } from 'react-rtekit/core';`}</Code>
      </Section>

      <SeeAlso examples={['basic', 'readonly-and-disabled']} guides={['ssr', 'value-and-formats']} />
    </>
  );
}
