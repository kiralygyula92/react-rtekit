/**
 * The example registry's single registration point (08 §3).
 *
 * Each example lives in `src/examples/<slug>/`, exporting a default component and a
 * `meta` object; the raw source is imported with Vite's `?raw` suffix so the Code tab
 * always shows exactly what runs.
 */
import './register';

export { examples, listExamples, registerExample } from './registry';
export type { ExampleEntry, ExampleMeta } from './registry';
