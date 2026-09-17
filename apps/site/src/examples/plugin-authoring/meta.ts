import type { ExampleMeta } from '../registry';

export const meta: ExampleMeta = {
  slug: 'plugin-authoring',
  title: 'Writing a plugin',
  description:
    'A highlight plugin, built live: a mark, a command, a keymap, a toolbar item, sanitizer rules and localization — with its own source alongside.',
  tags: ['extending'],
  features: ['definePlugin', 'marks', 'commands', 'keymap', 'sanitize'],
  related: ['command-overrides', 'slots-custom'],
  priority: 9,
};
