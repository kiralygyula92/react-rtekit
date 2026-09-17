import type { ExampleMeta } from '../registry';

export const meta: ExampleMeta = {
  slug: 'command-overrides',
  title: 'Command overrides',
  description:
    'Forcing rel and target onto every inserted link, and remapping the colour command to a design system’s tokens — with a log of what each override changed.',
  tags: ['extending', 'customization'],
  features: ['commandOverrides', 'middleware'],
  related: ['handlers-middleware', 'plugin-authoring'],
  priority: 8,
};
