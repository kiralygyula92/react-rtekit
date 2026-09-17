import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Controller,
  type Control,
  type ControllerRenderProps,
  type FieldError,
  type FieldPath,
  type FieldValues,
  type RegisterOptions,
  type UseFormStateReturn,
} from 'react-hook-form';
import {
  RichTextEditor,
  isEmptyHtml,
  isEmptyDocument,
  type EditorInstance,
  type EditorValue,
  type RichTextEditorProps,
} from 'react-rtekit';

/**
 * `react-rtekit-rhf` — the react-hook-form adapter.
 *
 * The core library has no form-library dependency (fixes R13); everything that knows
 * about react-hook-form lives here. The reason this package exists at all is the
 * emptiness check: `required` has to run against `isEmpty()`, not string truthiness,
 * or `<p><br></p>` passes validation and an empty e-mail goes out (fixes R2).
 *
 * @module
 */

/** How `required` decides whether the field has a value. */
export type EmptyCheck = 'text' | 'string';

/** Props for {@link RteField}. */
export interface RteFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<RichTextEditorProps, 'value' | 'onChange' | 'onBlur' | 'error' | 'defaultValue'> {
  control: Control<TFieldValues>;
  name: TName;
  /** Validation rules, as react-hook-form takes them. */
  rules?: Omit<
    RegisterOptions<TFieldValues, TName>,
    'valueAsNumber' | 'valueAsDate' | 'setValueAs' | 'disabled'
  >;
  /**
   * `'text'` (the default) validates emptiness with `isEmpty()`, so `<p><br></p>` is
   * empty. `'string'` uses raw truthiness, which is what the old field did wrong.
   *
   * @default 'text'
   */
  emptyCheck?: EmptyCheck;
  /** Message shown when `rules.required` is `true` rather than a string. */
  requiredMessage?: string;
  /** Overrides the message react-hook-form produced. */
  helperText?: RichTextEditorProps['helperText'];
}

/** True when a value in any supported format holds nothing visible. */
function valueIsEmpty(value: unknown, check: EmptyCheck): boolean {
  if (check === 'string') return !value;
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return isEmptyHtml(value);
  if (typeof value === 'object' && 'type' in value && value.type === 'doc') {
    return isEmptyDocument(value as Parameters<typeof isEmptyDocument>[0]);
  }
  return false;
}

/** Turns `rules.required` into a validator that understands rich-text emptiness. */
function buildRules<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>(
  rules: RteFieldProps<TFieldValues, TName>['rules'],
  emptyCheck: EmptyCheck,
  requiredMessage: string,
): RteFieldProps<TFieldValues, TName>['rules'] {
  const required = rules?.required;
  if (!required) return rules;

  const message = typeof required === 'string' ? required : requiredMessage;
  const existing = rules?.validate;

  return {
    ...rules,
    // `required` is removed and re-expressed as a validator: react-hook-form's own
    // `required` is a truthiness check, and `'<p><br></p>'` is truthy (fixes R2).
    required: false,
    validate: {
      ...(typeof existing === 'function' ? { rteRequired0: existing } : existing),
      rteNotEmpty: (value: unknown) => (valueIsEmpty(value, emptyCheck) ? message : true),
    },
  };
}

/**
 * A `<RichTextEditor>` bound to a react-hook-form field.
 *
 * Wires `onChange` and `onBlur`, surfaces `fieldState.error`, focuses the editor when
 * the form focuses the field, and validates emptiness correctly.
 *
 * @example
 * ```tsx
 * <RteField
 *   control={control}
 *   name="message"
 *   preset="classic"
 *   label="Message"
 *   maxLength={2048}
 *   rules={{ required: 'Message is required' }}
 * />
 * ```
 */
export function RteField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  rules,
  emptyCheck = 'text',
  requiredMessage = 'This field is required',
  helperText,
  ...editorProps
}: RteFieldProps<TFieldValues, TName>) {
  const resolvedRules = useMemo(
    () => buildRules<TFieldValues, TName>(rules, emptyCheck, requiredMessage),
    [emptyCheck, requiredMessage, rules],
  );

  return (
    <Controller
      control={control}
      name={name}
      {...(resolvedRules ? { rules: resolvedRules } : {})}
      render={({ field, fieldState, formState }) => (
        <RteFieldInner
          field={field}
          error={fieldState.error}
          formState={formState}
          editorProps={editorProps}
          {...(helperText !== undefined ? { helperText } : {})}
        />
      )}
    />
  );
}

/** Props for the inner component, so hooks can be used inside `render`. */
interface RteFieldInnerProps<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>> {
  field: ControllerRenderProps<TFieldValues, TName>;
  error: FieldError | undefined;
  formState: UseFormStateReturn<TFieldValues>;
  editorProps: Omit<RichTextEditorProps, 'value' | 'onChange' | 'onBlur' | 'error' | 'defaultValue'>;
  helperText?: RichTextEditorProps['helperText'];
}

/** The bound editor. Split out so it can hold the imperative handle. */
function RteFieldInner<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>({
  field,
  error,
  formState,
  editorProps,
  helperText,
}: RteFieldInnerProps<TFieldValues, TName>) {
  const editorRef = useRef<EditorInstance | null>(null);
  // The instance exists before the engine mounts; writing to it earlier would throw.
  const readyRef = useRef(false);

  // react-hook-form focuses the first invalid field on a failed submit; `field.ref`
  // is how it finds something to focus.
  const setFieldRef = useCallback(
    (instance: EditorInstance | null) => {
      editorRef.current = instance;
      field.ref({
        focus: () => {
          instance?.focus('end');
        },
      });
    },
    [field],
  );

  const onChange = useCallback(
    (value: EditorValue) => {
      // One write, through one path: the old field called `setValue` *and* `onChange`,
      // and `setValue` without `shouldValidate`, so validation lagged (fixes R12).
      field.onChange(value);
    },
    [field],
  );

  const onBlur = useCallback(() => {
    field.onBlur();
  }, [field]);

  // A form reset must reach the editor, which owns its own content (fixes R1).
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !readyRef.current) return;
    const current = editor.getHTML();
    const incoming = field.value as EditorValue | undefined;
    if (typeof incoming === 'string' && incoming !== current) {
      editor.setContent(incoming, { source: 'api', keepSelection: true });
    }
  }, [field.value, formState.submitCount]);

  return (
    <RichTextEditor
      {...editorProps}
      value={field.value ?? ''}
      onChange={onChange}
      onBlur={onBlur}
      disabled={editorProps.disabled ?? field.disabled ?? false}
      editorRef={setFieldRef}
      onReady={() => {
        readyRef.current = true;
      }}
      error={error?.message ?? (error !== undefined)}
      {...(helperText !== undefined ? { helperText } : {})}
    />
  );
}

/** What {@link useRteField} returns. */
export interface UseRteFieldResult {
  /** Props to spread onto a `<RichTextEditor>`. */
  editorProps: Pick<RichTextEditorProps, 'value' | 'onChange' | 'onBlur' | 'error' | 'editorRef'>;
  /** The current validation message, or `undefined`. */
  error: string | undefined;
  /** True when the field holds nothing visible. */
  isEmpty: boolean;
}

/**
 * The headless version of {@link RteField}.
 *
 * Use it when the editor needs a custom layout but the same form wiring.
 *
 * @example
 * ```tsx
 * const { editorProps, error } = useRteField({ control, name: 'message' });
 * return <MyCard><RichTextEditor {...editorProps} /><MyError>{error}</MyError></MyCard>;
 * ```
 */
export function useRteField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(options: {
  control: Control<TFieldValues>;
  name: TName;
  emptyCheck?: EmptyCheck;
  field: ControllerRenderProps<TFieldValues, TName>;
  error?: FieldError | undefined;
}): UseRteFieldResult {
  const { field, error, emptyCheck = 'text' } = options;
  const editorRef = useRef<EditorInstance | null>(null);

  const editorProps = useMemo(
    () => ({
      value: field.value ?? '',
      onChange: (value: EditorValue) => {
        field.onChange(value);
      },
      onBlur: () => {
        field.onBlur();
      },
      error: error?.message ?? (error !== undefined),
      editorRef: (instance: EditorInstance | null) => {
        editorRef.current = instance;
      },
    }),
    [error, field],
  );

  return {
    editorProps,
    ...(error?.message !== undefined ? { error: error.message } : { error: undefined }),
    isEmpty: valueIsEmpty(field.value, emptyCheck),
  };
}

/** Exposed so consumers can reuse the same emptiness rule in their own validators. */
export { valueIsEmpty as isRteValueEmpty };

/** The package version. */
export const VERSION = '0.0.0';
