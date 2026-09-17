import type { ExampleMeta } from '../registry';

export const meta: ExampleMeta = {
  slug: 'basic',
  title: 'Basic',
  description:
    'The smallest possible editor, next to the same value rendered read-only. What the editor shows and what RteContentView shows are byte-identical.',
  tags: ['getting started', 'value'],
  features: ['useEditor', 'RteContentView', 'counter'],
  related: ['controlled', 'value-formats'],
  priority: 10,
};
