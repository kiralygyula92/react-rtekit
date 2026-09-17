import type { ExampleMeta } from '../registry';

export const meta: ExampleMeta = {
  slug: 'history',
  title: 'History',
  description:
    'Undo grouping while typing, one entry per command, and clearHistory after a programmatic load.',
  tags: ['history'],
  features: ['undo', 'redo', 'clearHistory'],
  related: ['formatting', 'controlled'],
  priority: 12,
};
