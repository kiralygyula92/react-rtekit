/**
 * `react-rtekit/view` — the read-only renderer.
 *
 * Renders sanitized stored content with the same content styles as the editor and
 * without loading an engine, which is what previews and list pages should use
 * (04 §6, 05 §17).
 *
 * @module
 */
export { RteContentView } from './RteContentView.js';
export { VERSION } from '../version.js';
export type { RteContentViewProps } from '../types/props.js';
