import { useField, useFormikContext, Formik, Form } from 'formik';
import { RichTextEditor, isEmptyHtml, countText } from 'react-rtekit';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * Formik, with no adapter package (04 §8, fixes R13).
 *
 * The point of this page is what is *not* here: there is no `react-rtekit-formik`.
 * The editor is a controlled input with a value and an `onChange`, so binding it to a
 * form library is twenty lines, and the library never has to know which one you use.
 */

interface EmailForm {
  message: string;
}

const MAX_LENGTH = 280;

/** The binding. Everything Formik-specific about this page lives in here. */
function FormikRte({ name, label }: { name: string; label: string }) {
  const [field, meta, helpers] = useField<string>(name);
  const { isSubmitting } = useFormikContext<EmailForm>();
  const showError = meta.touched && meta.error !== undefined;

  return (
    <RichTextEditor
      label={label}
      value={field.value}
      disabled={isSubmitting}
      required
      maxLength={MAX_LENGTH}
      showCounter
      error={showError ? meta.error : false}
      placeholder="Try submitting this while it is empty…"
      onChange={(value) => {
        void helpers.setValue(value as string);
      }}
      onBlur={() => {
        void helpers.setTouched(true);
      }}
    />
  );
}

/**
 * The validation.
 *
 * `isEmptyHtml` rather than string truthiness is the whole fix for R2: an empty
 * editor is `<p><br></p>`, which every truthiness check in the world accepts.
 */
function validate(values: EmailForm): Partial<Record<keyof EmailForm, string>> {
  const errors: Partial<Record<keyof EmailForm, string>> = {};

  if (isEmptyHtml(values.message)) {
    errors.message = 'A message is required';
  } else if (countText(values.message, 'characters') > MAX_LENGTH) {
    errors.message = `Keep it under ${MAX_LENGTH} characters`;
  }

  return errors;
}

export default function ValidationFormikExample() {
  return (
    <Formik<EmailForm>
      initialValues={{ message: '<p><br></p>' }}
      validate={validate}
      onSubmit={(values, helpers) => {
        helpers.setStatus(values);
        helpers.setSubmitting(false);
      }}
    >
      {({ status, resetForm, errors, touched }) => (
        <Form className="stack">
          <FormikRte name="message" label="Message" />

          <div className="button-row">
            <button type="submit" className="button button--solid">
              Send
            </button>
            <button
              type="button"
              className="button"
              onClick={() => {
                resetForm();
              }}
            >
              Reset
            </button>
            <span className="parity__status" data-testid="formik-status">
              {touched.message && errors.message
                ? 'Blocked by validation'
                : status
                  ? 'Submitted — see the payload below'
                  : 'Not submitted yet'}
            </span>
          </div>

          {status ? (
            <>
              <h2>Submitted payload</h2>
              <CodeBlock label="Formik payload" testId="formik-payload">
                {JSON.stringify(status, null, 2)}
              </CodeBlock>
            </>
          ) : null}
        </Form>
      )}
    </Formik>
  );
}
