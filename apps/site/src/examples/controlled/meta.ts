import type { ExampleMeta } from '../registry';

export const meta: ExampleMeta = {
  slug: 'controlled',
  title: 'Controlled value',
  description:
    'A fully controlled editor with external “load” buttons. Typing never jumps the caret, and a programmatic load reports source: "api" so the parent can tell its own writes apart from the author’s.',
  tags: ['value', 'state'],
  features: ['controlled value', 'change source', 'setContent'],
  related: ['basic', 'legacy-parity'],
  priority: 20,
};
