import type { ExampleMeta } from '../registry';

export const meta: ExampleMeta = {
  slug: 'large-document',
  title: 'Large document',
  description:
    'A 100 KB document with a typing-latency meter and a serialization cost breakdown, showing what a change handler actually pays for.',
  tags: ['performance', 'advanced'],
  features: ['onChangeDebounced', 'getHTML', 'getJSON'],
  related: ['basic', 'value-formats'],
  priority: 7,
};
