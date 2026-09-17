import type { ExampleMeta } from '../registry';

export const meta: ExampleMeta = {
  slug: 'mentions',
  title: "Mentions",
  description:
    "An @ trigger backed by an async search, with loading and empty states, inserting an atomic mention node.",
  tags: ["mentions"],
  features: ["mentions","async search"],
  related: ["merge-tags","emoji-and-slash"],
  priority: 16,
};
