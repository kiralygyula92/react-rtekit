import type { ExampleMeta } from '../registry';

export const meta: ExampleMeta = {
  slug: 'paste-cleanup',
  title: 'Paste clean-up',
  description:
    'Word, Google Docs, Excel and Quill markup, before and after the paste pipeline, with a check for anything that survived it.',
  tags: ['paste', 'interop'],
  features: ['paste pipeline', 'office cleanup'],
  related: ['sanitization', 'html-interop'],
  priority: 28,
};
