import type { ExampleMeta } from '../registry';

export const meta: ExampleMeta = {
  slug: 'validation-rhf',
  title: 'Validation with react-hook-form',
  description:
    'RteField with required and maxLength, proving that <p><br></p> no longer passes validation — the bug that let an empty e-mail go out.',
  tags: ['forms', 'validation'],
  features: ['react-hook-form', 'required', 'maxLength'],
  related: ['parity-skimmer-email', 'counter-and-limits'],
  priority: 14,
};
