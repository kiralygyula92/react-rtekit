import { Code, Section, SeeAlso } from './Guide';

/** Replacing the Quill-based CustomRte: what maps to what, and the twenty-six behaviours that change. */
export function MigrationSkimmer() {
  return (
    <>
      <p className="page__lead">
        Replacing the Quill-based CustomRte: what maps to what, and the twenty-six behaviours that change.
      </p>

      <Section id="mapping" title="Concept mapping">
        <table className="data-table">
          <thead>
            <tr><th>Before</th><th>After</th></tr>
          </thead>
          <tbody>
            <tr><td><code>&lt;CustomRte name defaultValue setValue … /&gt;</code></td><td><code>&lt;RteField control name /&gt;</code> or <code>&lt;RichTextEditor value onChange /&gt;</code></td></tr>
            <tr><td><code>setValue</code> prop</td><td>Gone — the adapter owns form wiring</td></tr>
            <tr><td><code>defaultValue</code>, read once</td><td><code>value</code>, or <code>defaultValue</code> plus <code>setContent()</code></td></tr>
            <tr><td><code>RTE_PREDEFINED_COLORS</code></td><td><code>colors.palette</code>, defaulting to the same 21</td></tr>
            <tr><td><code>MESSAGE_MAX_LENGTH</code> on the HTML</td><td><code>maxLength</code> on the text</td></tr>
            <tr><td><code>quill.snow.css</code></td><td><code>react-rtekit/styles.css</code> in a cascade layer</td></tr>
            <tr><td>No sanitization</td><td>Sanitized at every boundary</td></tr>
          </tbody>
        </table>
      </Section>

      <Section id="drop-in" title="The smallest change that works">
        <Code label="Before and after">{`// Before
<CustomRte name="memoBodyContent" defaultValue={body} setValue={setValue} error={!!errors.memoBodyContent} />

// After
<RteField
  control={control}
  name="memoBodyContent"
  preset="classic"
  label="Message"
  maxLength={2048}
  rules={{ required: 'A message is required' }}
/>`}</Code>

        <p>
          The <code>classic</code> preset reproduces the old editor exactly: the same eight buttons in
          the same order, the same 287px box, the same 21 swatches, and
          <code>quill-compatible</code> output so the old editor can still read what this one saves.
        </p>
      </Section>

      <Section id="behaviour-changes" title="What deliberately changes">
        <p>
          Twenty-six behaviours are fixed rather than reproduced. The ones you will notice first:
        </p>
        <ul>
          <li>An empty editor now fails <code>required</code> (it used to pass, and empty e-mails went out).</li>
          <li>The length limit counts text, so formatting no longer eats the budget.</li>
          <li>Colour &ldquo;Reset&rdquo; removes the colour instead of writing black.</li>
          <li>Focus no longer shifts the content by a pixel.</li>
          <li>Everything pasted is sanitized and cleaned.</li>
          <li>The toolbar is keyboard-navigable and screen-reader-labelled.</li>
        </ul>
        <p>
          The parity example lists all twenty-six behind a &ldquo;show differences&rdquo; toggle.
        </p>
      </Section>

      <Section id="data" title="Existing data">
        <p>
          Stored Quill HTML is read as-is: <code>ql-align-*</code> classes, <code>data-list</code> attributes,
          <code>{'{merge_tags}'}</code> and inline colours all come through. Nothing needs migrating before
          you switch, and nothing needs migrating back if you switch away.
        </p>
      </Section>

      <SeeAlso examples={['parity-skimmer-email', 'html-interop', 'validation-rhf']} guides={['html-interop', 'forms']} />
    </>
  );
}
