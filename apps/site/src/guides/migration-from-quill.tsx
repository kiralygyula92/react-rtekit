import { Code, Section, SeeAlso } from './Guide';

/** Replacing a Quill wrapper: what maps to what, and the behaviours that change. */
export function MigrationFromQuill() {
  return (
    <>
      <p className="page__lead">
        Replacing a hand-rolled Quill wrapper: what maps to what, what your stored content
        does, and the twenty-six behaviours that deliberately change.
      </p>

      <Section id="shape" title="The wrapper you probably have">
        <p>
          The usual shape is a component that renders <code>react-quill</code> with the
          toolbar module switched off, builds its own toolbar in JSX, imports{' '}
          <code>quill.snow.css</code> globally and then fights it, reads{' '}
          <code>defaultValue</code> once into state, and takes a{' '}
          <code>setValue</code> prop from whichever form library the application happens to
          use. This library was written to replace one of those, so the mapping below is
          concrete rather than hypothetical.
        </p>
      </Section>

      <Section id="mapping" title="Concept mapping">
        <table className="data-table">
          <thead>
            <tr>
              <th>Before</th>
              <th>After</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>&lt;Editor name defaultValue setValue … /&gt;</code>
              </td>
              <td>
                <code>&lt;RteField control name /&gt;</code> or{' '}
                <code>&lt;RichTextEditor value onChange /&gt;</code>
              </td>
            </tr>
            <tr>
              <td>
                A <code>setValue</code> prop from the form library
              </td>
              <td>Gone — the core has no form dependency, and the adapter owns the wiring</td>
            </tr>
            <tr>
              <td>
                <code>defaultValue</code>, read once into state
              </td>
              <td>
                <code>value</code> for controlled, or <code>defaultValue</code> plus{' '}
                <code>editor.setContent()</code>
              </td>
            </tr>
            <tr>
              <td>A colour array constant</td>
              <td>
                <code>colors.palette</code>, defaulting to the same 21 swatches
              </td>
            </tr>
            <tr>
              <td>A character limit applied to the HTML string</td>
              <td>
                <code>maxLength</code>, counted in text or words
              </td>
            </tr>
            <tr>
              <td>
                <code>quill.snow.css</code> imported globally
              </td>
              <td>
                <code>react-rtekit/styles.css</code>, scoped and in a cascade layer
              </td>
            </tr>
            <tr>
              <td>Quill&rsquo;s own formats list</td>
              <td>A plugin list, or one of six presets</td>
            </tr>
            <tr>
              <td>No sanitization</td>
              <td>Sanitized at every boundary, in and out</td>
            </tr>
          </tbody>
        </table>
      </Section>

      <Section id="drop-in" title="The smallest change that works">
        <Code label="Before and after">{`// Before
<Editor
  name="body"
  defaultValue={body}
  setValue={setValue}
  error={!!errors.body}
/>

// After
<RteField
  control={control}
  name="body"
  preset="classic"
  label="Message"
  maxLength={2048}
  rules={{ required: 'A message is required' }}
/>`}</Code>

        <p>
          The <code>classic</code> preset exists for exactly this step. It reproduces the
          typical Quill-wrapper look: eight buttons in the same order, a 287px box, 21
          colour swatches, and <code>quill-compatible</code> output, so anything still
          reading the old format keeps working while you migrate.
        </p>
      </Section>

      <Section id="behaviour-changes" title="What deliberately changes">
        <p>
          Twenty-six behaviours are fixed rather than reproduced. The ones you will notice
          first:
        </p>
        <ul>
          <li>
            An empty editor now fails <code>required</code>. It used to pass, because{' '}
            <code>&lt;p&gt;&lt;br&gt;&lt;/p&gt;</code> is a truthy string — which is how
            empty messages get sent.
          </li>
          <li>The length limit counts text, so formatting no longer eats the budget.</li>
          <li>Colour &ldquo;Reset&rdquo; removes the colour instead of writing black.</li>
          <li>Focusing the field no longer shifts the content by a pixel.</li>
          <li>Everything pasted is sanitized and cleaned, including from Word.</li>
          <li>The toolbar is keyboard-navigable and labelled for screen readers.</li>
        </ul>
        <p>
          The parity example lists all twenty-six behind a &ldquo;show differences&rdquo;
          toggle, next to a reproduction of the editor they came from.
        </p>
      </Section>

      <Section id="data" title="Existing data">
        <p>
          Stored Quill HTML is read as it is: <code>ql-align-*</code> classes,{' '}
          <code>data-list</code> attributes, <code>{'{merge_tags}'}</code> and inline colours
          all come through. Nothing needs migrating before you switch — and because the{' '}
          <code>quill-compatible</code> output profile writes the same dialect back, nothing
          needs migrating if you switch away either.
        </p>
      </Section>

      <SeeAlso
        examples={['legacy-parity', 'html-interop', 'validation-rhf']}
        guides={['html-interop', 'forms']}
      />
    </>
  );
}
