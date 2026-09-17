import { Callout, Code, Section, SeeAlso } from './Guide';

/** Binding the editor to a form library, and the one validation rule that everybody gets wrong. */
export function Forms() {
  return (
    <>
      <p className="page__lead">
        Binding the editor to a form library, and the one validation rule that everybody gets wrong.
      </p>

      <Section id="rhf" title="react-hook-form">
        <p>
          <code>react-rtekit-rhf</code> is a separate package, so the core has no form
          dependency. <code>&lt;RteField&gt;</code> wires the value, the blur and the error, and
          validates emptiness correctly.
        </p>

        <Code label="RteField">{`import { RteField } from 'react-rtekit-rhf';

<RteField
  control={control}
  name="message"
  preset="classic"
  label="Message"
  maxLength={2048}
  rules={{ required: 'A message is required' }}
/>`}</Code>

        <Callout kind="warning">
          react-hook-form&rsquo;s own <code>required</code> is a truthiness check, and an empty
          editor serializes to a truthy string. <code>&lt;RteField&gt;</code> replaces{' '}
          <code>required</code> with a validator that asks the editor whether it is empty. That is
          the entire reason the adapter exists.
        </Callout>
      </Section>

      <Section id="headless" title="A form library we do not ship an adapter for">
        <p>
          The binding is small enough to write by hand. Formik, TanStack Form and a plain
          <code> useState</code> all look like this:
        </p>

        <Code label="Manual binding">{`import { isEmptyHtml } from 'react-rtekit';

<RichTextEditor
  value={field.value}
  onChange={(value) => field.onChange(value)}
  onBlur={field.onBlur}
  error={meta.touched && meta.error ? meta.error : false}
/>

// The validator, wherever your library wants it:
const validate = (value: string) =>
  isEmptyHtml(value) ? 'A message is required' : undefined;`}</Code>
      </Section>

      <Section id="validation" title="Built-in validation">
        <p>
          Without a form library, the editor validates itself and reports through the same
          chrome:
        </p>

        <Code label="Built-in validation">{`<RichTextEditor
  required
  maxLength={2048}
  validate={({ editor, isEmpty }) =>
    isEmpty ? 'Required' : editor.getText().includes('lorem') ? 'No placeholder text' : null
  }
/>

editor.validate(); // the message, or null`}</Code>
      </Section>

      <Section id="resets" title="Resets and server loads">
        <p>
          A form reset has to reach the editor. With <code>&lt;RteField&gt;</code> it does. With a
          controlled value it does. What does not work is reading a prop once into state — which
          is how an editor ends up showing the previous record after the form has moved on.
        </p>

        <Code label="Loading from the server">{`// Clear the undo stack after a programmatic load, so the author
// cannot undo into somebody else's content.
editor.setContent(fromServer, { source: 'api', history: false });
editor.clearHistory();`}</Code>
      </Section>

      <SeeAlso examples={['validation-rhf', 'controlled', 'counter-and-limits']} guides={['value-and-formats']} />
    </>
  );
}
