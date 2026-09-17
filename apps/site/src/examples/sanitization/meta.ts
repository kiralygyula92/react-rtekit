import type { ExampleMeta } from '../registry';

export const meta: ExampleMeta = {
  slug: 'sanitization',
  title: 'Sanitization',
  description:
    'A malicious-HTML playground: pick an XSS payload, see exactly what each profile strips. Nothing is ever evaluated — the input is shown as text.',
  tags: ['security', 'sanitization'],
  features: ['sanitizeHtml', 'profiles'],
  related: ['paste-cleanup', 'html-interop'],
  priority: 30,
};
