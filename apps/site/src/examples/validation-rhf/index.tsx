import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { RichTextEditor, isEmptyHtml } from '@kingtech/react-rtekit';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * react-hook-form, with no adapter package (fixes R2 and R12).
 *
 * The bug this page exists for: an empty editor serializes to `<p><br></p>`, which is
 * a truthy string, so react-hook-form's own `required` passed and an empty e-mail went
 * out. The binding below validates with `isEmptyHtml` instead. The "reproduce the old
 * bug" toggle switches back to `required` so you can see the difference.
 */

interface EmailForm {
  message: string;
}

/** What an empty editor produces. Submitting this is the regression. */
const EMPTY_MARKUP = '<p><br></p>';

const REQUIRED_MESSAGE = 'A message is required';

function noPlaceholder(value: string) {
  return value.includes('lorem ipsum') ? 'Placeholder text is not allowed' : true;
}

export default function ValidationRhfExample() {
  const [oldCheck, setOldCheck] = useState(false);
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
          checked={oldCheck}
          onChange={(event) => {
            setOldCheck(event.target.checked);
            setSubmitted(null);
          }}
        />
        Reproduce the old bug (react-hook-form’s own <code>required</code>)
      </label>

      <form
        onSubmit={(event) => {
          void handleSubmit((values) => {
            setSubmitted(values);
          })(event);
        }}
      >
        <Controller
          // Remounting on the toggle keeps the two rule sets honestly separate.
          key={oldCheck ? 'required' : 'isEmptyHtml'}
          control={control}
          name="message"
          rules={
            oldCheck
              ? // A truthiness check, and `<p><br></p>` is truthy: the bug.
                { required: REQUIRED_MESSAGE, validate: noPlaceholder }
              : {
                  validate: {
                    notEmpty: (value) => (isEmptyHtml(value) ? REQUIRED_MESSAGE : true),
                    noPlaceholder,
                  },
                }
          }
          render={({ field, fieldState }) => (
            <RichTextEditor
              preset="classic"
              label="Message"
              // Controlled by the form, so a reset reaches the editor (R1).
              value={field.value}
              onChange={(value) => {
                // One write, through one path: the old field also called `setValue` (R12).
                field.onChange(value);
              }}
              onBlur={field.onBlur}
              // react-hook-form focuses the first invalid field on a failed submit.
              editorRef={(editor) => {
                field.ref(
                  editor
                    ? {
                        focus: () => {
                          editor.focus('end');
                        },
                      }
                    : null,
                );
              }}
              error={fieldState.error?.message ?? false}
              maxLength={2048}
              showCounter
              placeholder="Try submitting this while it is empty…"
            />
          )}
        />

        <div className="button-row">
          <button type="submit" className="button button--solid">
            Send
          </button>
          <button
            type="button"
            className="button"
            onClick={() => {
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
              toggle to validate with <code>isEmptyHtml()</code> instead.
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
