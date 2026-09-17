import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, type FieldValues } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import { RteField, isRteValueEmpty, type RteFieldProps } from '../src/index.js';

/**
 * The react-hook-form adapter.
 *
 * The bug this package exists to fix: `required` has to reject `<p><br></p>`, which
 * plain truthiness does not (R2). The old field also wrote its value twice, through
 * `setValue` *and* `onChange`, with `setValue` missing `shouldValidate` (R12).
 */

/** The shape the test form edits. */
interface TestValues extends FieldValues {
  message: string;
}

/** A minimal form around the field. */
function Form({
  onValid,
  defaultValue = '',
  rules,
  ...props
}: {
  onValid?: (values: TestValues) => void;
  defaultValue?: string;
  rules?: RteFieldProps<TestValues, 'message'>['rules'];
} & Partial<Omit<RteFieldProps<TestValues, 'message'>, 'control' | 'name' | 'rules'>>) {
  const { control, handleSubmit, reset } = useForm<TestValues>({
    defaultValues: { message: defaultValue },
    mode: 'onBlur',
  });

  return (
    <form
      onSubmit={(event) => {
        void handleSubmit((values) => onValid?.(values))(event);
      }}
    >
      <RteField
        control={control}
        name="message"
        preset="classic"
        label="Message"
        {...(rules ? { rules } : {})}
        {...props}
      />
      <button type="submit">Send</button>
      <button
        type="button"
        onClick={() => {
          reset({ message: '<p>reset value</p>' });
        }}
      >
        Reset form
      </button>
    </form>
  );
}

describe('required rejects an empty document (R2)', () => {
  it('blocks submit for the markup an empty editor produces', async () => {
    const user = userEvent.setup();
    const onValid = vi.fn();
    render(<Form defaultValue="<p><br></p>" rules={{ required: 'Message is required' }} onValid={onValid} />);
    await screen.findByRole('textbox');

    await user.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Message is required');
    });
    expect(onValid).not.toHaveBeenCalled();
  });

  it('blocks submit for whitespace-only content', async () => {
    const user = userEvent.setup();
    const onValid = vi.fn();
    render(<Form defaultValue="<p>   </p>" rules={{ required: 'Message is required' }} onValid={onValid} />);
    await screen.findByRole('textbox');

    await user.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(onValid).not.toHaveBeenCalled();
  });

  it('submits when there is real content', async () => {
    const user = userEvent.setup();
    const onValid = vi.fn();
    render(<Form defaultValue="<p>Hello</p>" rules={{ required: 'Message is required' }} onValid={onValid} />);
    await screen.findByRole('textbox');

    await user.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => {
      expect(onValid).toHaveBeenCalledTimes(1);
    });
    expect(onValid.mock.calls[0]![0]).toMatchObject({ message: '<p>Hello</p>' });
  });

  it('treats a non-breaking space as content, because the author typed it', async () => {
    const user = userEvent.setup();
    const onValid = vi.fn();
    render(<Form defaultValue="<p>&nbsp;</p>" rules={{ required: 'Required' }} onValid={onValid} />);
    await screen.findByRole('textbox');

    await user.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => {
      expect(onValid).toHaveBeenCalled();
    });
  });

  it('emptyCheck="string" reproduces the old, wrong behaviour on request', async () => {
    const user = userEvent.setup();
    const onValid = vi.fn();
    render(
      <Form
        defaultValue="<p><br></p>"
        emptyCheck="string"
        rules={{ required: 'Required' }}
        onValid={onValid}
      />,
    );
    await screen.findByRole('textbox');

    await user.click(screen.getByRole('button', { name: 'Send' }));
    // `'<p><br></p>'` is a truthy string, so the old check passes it.
    await waitFor(() => {
      expect(onValid).toHaveBeenCalled();
    });
  });
});

describe('other rules', () => {
  it('keeps a custom validate alongside the emptiness check', async () => {
    const user = userEvent.setup();
    const onValid = vi.fn();
    render(
      <Form
        defaultValue="<p>spam</p>"
        rules={{
          required: 'Required',
          validate: (value: string) => (value.includes('spam') ? 'No spam' : true),
        }}
        onValid={onValid}
      />,
    );
    await screen.findByRole('textbox');

    await user.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('No spam');
    });
    expect(onValid).not.toHaveBeenCalled();
  });

  it('uses the default message when required is just true', async () => {
    const user = userEvent.setup();
    render(<Form defaultValue="<p><br></p>" rules={{ required: true }} />);
    await screen.findByRole('textbox');

    await user.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('This field is required');
    });
  });
});

describe('form integration', () => {
  it('shows the field error through the editor chrome', async () => {
    const user = userEvent.setup();
    render(<Form defaultValue="<p><br></p>" rules={{ required: 'Message is required' }} />);
    const textbox = await screen.findByRole('textbox');

    await user.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => {
      expect(textbox).toHaveAttribute('aria-invalid', 'true');
    });
  });

  it('applies a form reset to the editor (R1)', async () => {
    const user = userEvent.setup();
    render(<Form defaultValue="<p>original</p>" />);
    const textbox = await screen.findByRole('textbox');
    await waitFor(() => {
      expect(textbox).toHaveTextContent('original');
    });

    await user.click(screen.getByRole('button', { name: 'Reset form' }));
    await waitFor(() => {
      expect(textbox).toHaveTextContent('reset value');
    });
  });

  it('forwards every editor prop', async () => {
    render(<Form defaultValue="<p>x</p>" maxLength={10} showCounter helperText="Be brief" />);
    await screen.findByRole('textbox');
    expect(await screen.findByText('1 / 10')).toBeInTheDocument();
    expect(screen.getByText('Be brief')).toBeInTheDocument();
  });
});

describe('isRteValueEmpty', () => {
  it('matches the editor’s own emptiness rule', () => {
    expect(isRteValueEmpty('', 'text')).toBe(true);
    expect(isRteValueEmpty('<p><br></p>', 'text')).toBe(true);
    expect(isRteValueEmpty('<p>  </p>', 'text')).toBe(true);
    expect(isRteValueEmpty('<p>&nbsp;</p>', 'text')).toBe(false);
    expect(isRteValueEmpty('<p>x</p>', 'text')).toBe(false);
    expect(isRteValueEmpty(null, 'text')).toBe(true);
    expect(isRteValueEmpty({ type: 'doc', version: 1, content: [] }, 'text')).toBe(true);
  });

  it('string mode is plain truthiness', () => {
    expect(isRteValueEmpty('<p><br></p>', 'string')).toBe(false);
    expect(isRteValueEmpty('', 'string')).toBe(true);
  });
});
