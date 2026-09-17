import type { ExampleMeta } from '../registry';

export const meta: ExampleMeta = {
  slug: 'handlers-middleware',
  title: 'Handler middleware',
  description:
    'Analytics on every toolbar command, a plain-text-only paste policy, a confirmation before following an external link, and a change the editor refuses.',
  tags: ['extending', 'customization'],
  features: ['handlers', 'middleware', 'onPaste', 'onLinkOpen'],
  related: ['command-overrides', 'paste-cleanup'],
  priority: 8,
};
