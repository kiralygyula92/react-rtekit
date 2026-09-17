import type { ExampleMeta } from '../registry';

export const meta: ExampleMeta = {
  slug: 'links',
  title: 'Links',
  description:
    'The link popover, autolinking as you type, click behaviour, and a validator that only accepts internal URLs.',
  tags: ['links'],
  features: ['link popover', 'autolink', 'linkValidator'],
  related: ['formatting', 'sanitization'],
  priority: 20,
};
