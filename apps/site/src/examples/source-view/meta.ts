import type { ExampleMeta } from '../registry';

export const meta: ExampleMeta = {
  slug: 'source-view',
  title: "Source view",
  description:
    "Edit the HTML directly. What you apply goes through the sanitizer, so the source view is another way in rather than a way around.",
  tags: ["chrome","security"],
  features: ["sourceView","sanitization"],
  related: ["sanitization","html-interop"],
  priority: 8,
};
