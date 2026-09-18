# react-rtekit-rhf

The [react-hook-form](https://react-hook-form.com) adapter for
[`react-rtekit`](https://www.npmjs.com/package/react-rtekit).

```bash
pnpm add react-rtekit react-rtekit-rhf
```

```tsx
import { useForm } from 'react-hook-form';
import { RteField } from 'react-rtekit-rhf';

function EmailForm() {
  const { control, handleSubmit } = useForm({ defaultValues: { message: '' } });

  return (
    <form onSubmit={handleSubmit(send)}>
      <RteField
        control={control}
        name="message"
        preset="classic"
        label="Message"
        maxLength={2048}
        showCounter
        rules={{ required: 'A message is required' }}
      />
      <button type="submit">Send</button>
    </form>
  );
}
```

## Why it is a separate package

`react-rtekit` has no form-library dependency, and that is deliberate: the previous
implementation this library replaces took a required `setValue` prop from
react-hook-form and could not be used anywhere else. Binding the editor to a form is
about twenty lines — the
[forms guide](https://react-rtekit.vercel.app/react-rtekit/forms/) shows the
same thing done with Formik — so the adapter is a convenience, not a dependency.

## What it does that a hand-rolled binding forgets

- **`required` means required.** An empty editor serializes to `<p><br></p>`, which is a
  truthy string, so a plain `required` rule accepts it and an empty message goes out.
  `RteField` validates against `isEmpty()` instead. Set `emptyCheck="string"` if you
  really want the old behaviour.
- **One write per change.** The value is set once, with `shouldValidate` and
  `shouldDirty`, rather than through both `setValue` and `onChange`.
- **The error is wired up.** `error`, `aria-invalid` and `aria-describedby` follow the
  field state without any of it being passed in by hand.

Every `<RichTextEditor>` prop is accepted and forwarded.

## License

MIT
