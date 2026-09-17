import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { RteField } from 'react-rtekit-rhf';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * react-hook-form validation (fixes R2 and R12).
 *
 * The bug this page exists for: an empty editor serializes to `<p><br></p>`, which is
 * a truthy string, so `required` passed and an empty e-mail went out. `RteField`
 * validates against `isEmpty()` instead. The "reproduce the old bug" toggle switches
 * back to string truthiness so you can see the difference.
 */

interface EmailForm {
  message: string;
}

/** What an empty editor produces. Submitting this is the regression. */
const EMPTY_MARKUP = '<p><br></p>';

export default function ValidationRhfExample() {
  const [emptyCheck, setEmptyCheck] = useState<'text' | 'string'>('text');
  const [submitted, setSubmitted] = useState<EmailForm | null>(null);

  const { control, handleSubmit, reset, formState } = useForm<EmailForm>({
    defaultValues: { message: EMPTY_MARKUP },
    mode: 'onBlur',
  });

  return (
    <div className="stack">
      <label className="field-inline">
        <input
          type="checkbox"
          checked={emptyCheck === 'string'}
          onChange={(event) => {
            setEmptyCheck(event.target.checked ? 'string' : 'text');
            setSubmitted(null);
          }}
        />
        Reproduce the old bug (<code>emptyCheck=&quot;string&quot;</code>)
      </label>

      <form
        onSubmit={(event) => {
          void handleSubmit((values) => {
            setSubmitted(values);
          })(event);
        }}
      >
        <RteField
          // Remounting on the toggle keeps the two modes honestly separate.
          key={emptyCheck}
          control={control}
          name="message"
          preset="classic"
          label="Message"
          emptyCheck={emptyCheck}
          maxLength={2048}
          showCounter
          placeholder="Try submitting this while it is empty…"
          rules={{
            required: 'A message is required',
            validate: (value: string) =>
              value.includes('lorem ipsum') ? 'Placeholder text is not allowed' : true,
          }}
        />

        <div className="button-row">
          <button type="submit" className="button button--solid">
            Send
          </button>
          <button
            type="button"
            className="button"
            onClick={() => {
              // A form reset reaches the editor, which the old field could not do (R1).
              reset({ message: EMPTY_MARKUP });
              setSubmitted(null);
            }}
          >
            Reset
          </button>
          <span className="parity__status" data-testid="rhf-status">
            {formState.isSubmitted && !formState.isValid
              ? 'Blocked by validation'
              : submitted
                ? 'Submitted — see the payload below'
                : 'Not submitted yet'}
          </span>
        </div>
      </form>

      {submitted ? (
        <>
          <h2>Submitted payload</h2>
          <CodeBlock label="Rhf payload" testId="rhf-payload">
            {JSON.stringify(submitted, null, 2)}
          </CodeBlock>
          {submitted.message === EMPTY_MARKUP ? (
            <p className="callout callout--danger">
              This is the bug: <code>{EMPTY_MARKUP}</code> is a truthy string, so react-hook-form’s
              own <code>required</code> accepted it and an empty e-mail would go out. Untick the
              toggle to validate against <code>isEmpty()</code> instead.
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
