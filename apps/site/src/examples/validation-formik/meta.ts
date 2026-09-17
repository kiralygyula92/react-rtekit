import type { ExampleMeta } from '../registry';

export const meta: ExampleMeta = {
  slug: 'validation-formik',
  title: 'Validation with Formik',
  description:
    'The same required and maxLength rules as the react-hook-form example, wired to Formik — proving the core has no form-library dependency.',
  tags: ['forms', 'validation'],
  features: ['formik', 'required', 'maxLength', 'isEmpty'],
  related: ['validation-rhf', 'counter-and-limits'],
  priority: 13,
};
