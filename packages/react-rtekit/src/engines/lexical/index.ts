/**
 * `react-rtekit/engines/lexical` — the default engine adapter (ADR-002).
 *
 * The only module in the library that imports Lexical. Everything above it talks to
 * {@link EngineHandle}, so a second adapter is a contained piece of work rather than a
 * rewrite.
 *
 * @module
 */
export { lexicalEngine } from './engine.js';
export { lexicalTheme } from './theme.js';
export {
  MergeTagNode,
  $createMergeTagNode,
  $isMergeTagNode,
  MERGE_TAG_NODE_TYPE,
  type SerializedMergeTagNode,
} from './nodes/merge-tag.js';
export type { EditorEngine, EngineHandle, EngineMountOptions } from '../../types/engine.js';
