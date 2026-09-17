import type { ExampleMeta } from '../registry';

export const meta: ExampleMeta = {
  slug: 'autosave',
  title: 'Autosave and drafts',
  description:
    'A draft written on a debounce, a restore prompt on the way back, a TTL, and clearing on submit.',
  tags: ['chrome', 'forms'],
  features: ['autosave', 'drafts'],
  related: ['validation-rhf', 'history'],
  priority: 6,
};
