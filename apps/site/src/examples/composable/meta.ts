import type { ExampleMeta } from '../registry';

export const meta: ExampleMeta = {
  slug: 'composable',
  title: 'Composable parts',
  description:
    'The editor assembled into a card layout of your own: toolbar in the header, content in the body, counter and send button in the footer.',
  tags: ['customization'],
  features: ['Rte.Root', 'Rte.Toolbar', 'Rte.Content', 'Rte.Portals'],
  related: ['headless', 'slots-custom'],
  priority: 8,
};
