import type { ExampleMeta } from '../registry';

export const meta: ExampleMeta = {
  slug: 'images',
  title: 'Images and uploads',
  description:
    'Insert by URL or upload with a mock service that reports progress and can fail, plus alt text, captions and resizing.',
  tags: ['media', 'uploads'],
  features: ['onUpload', 'imageOptions', 'resize'],
  related: ['tables', 'paste-cleanup'],
  priority: 19,
};
