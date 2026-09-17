import type { BlockNodeName, MarkName } from '../types/document.js';

/**
 * The node and mark catalogue (03 §2).
 *
 * The schema is what turns feature flags into content rules: when the heading plugin
 * is off, `heading` is not in the active schema, and a pasted `<h2>` is downgraded to
 * a paragraph rather than silently kept as markup the editor cannot edit.
 *
 * @module
 */

/** A feature id, as used by `enableX` props and by `RtePlugin.provides`. */
export type FeatureId =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strike'
  | 'code'
  | 'subscript'
  | 'superscript'
  | 'color'
  | 'backgroundColor'
  | 'fontFamily'
  | 'fontSize'
  | 'paragraph'
  | 'heading'
  | 'blockquote'
  | 'codeBlock'
  | 'horizontalRule'
  | 'list'
  | 'checkList'
  | 'align'
  | 'indent'
  | 'link'
  | 'image'
  | 'table'
  | 'mergeTag'
  | 'mention'
  | 'emoji'
  | 'lineBreak'
  | 'rawHtml';

/** What a block type needs in order to exist. */
export interface BlockSchemaEntry {
  /** Feature that must be enabled for this block to survive input. */
  feature: FeatureId;
  /** What it degrades to when the feature is off. `null` drops it entirely. */
  downgradeTo: BlockNodeName | null;
  /** Whether the block may carry `align`. */
  alignable: boolean;
  /** Whether the block may carry `indent`. */
  indentable: boolean;
}

/** The block catalogue. */
export const BLOCK_SCHEMA: Record<BlockNodeName, BlockSchemaEntry> = {
  paragraph: { feature: 'paragraph', downgradeTo: 'paragraph', alignable: true, indentable: true },
  heading: { feature: 'heading', downgradeTo: 'paragraph', alignable: true, indentable: true },
  list: { feature: 'list', downgradeTo: 'paragraph', alignable: false, indentable: true },
  blockquote: { feature: 'blockquote', downgradeTo: 'paragraph', alignable: true, indentable: true },
  codeBlock: { feature: 'codeBlock', downgradeTo: 'paragraph', alignable: false, indentable: false },
  horizontalRule: { feature: 'horizontalRule', downgradeTo: null, alignable: false, indentable: false },
  image: { feature: 'image', downgradeTo: null, alignable: true, indentable: false },
  table: { feature: 'table', downgradeTo: 'paragraph', alignable: false, indentable: false },
  html: { feature: 'rawHtml', downgradeTo: null, alignable: false, indentable: false },
};

/** What a mark needs in order to exist. */
export interface MarkSchemaEntry {
  /** The feature that has to be enabled for this mark to exist. */
  feature: FeatureId;
  /** Marks that cannot coexist with this one. */
  excludes?: MarkName[];
  /** True when the mark carries a value rather than just being present. */
  valued: boolean;
}

/** The mark catalogue. */
export const MARK_SCHEMA: Record<MarkName, MarkSchemaEntry> = {
  bold: { feature: 'bold', valued: false },
  italic: { feature: 'italic', valued: false },
  underline: { feature: 'underline', valued: false },
  strike: { feature: 'strike', valued: false },
  code: { feature: 'code', valued: false },
  subscript: { feature: 'subscript', excludes: ['superscript'], valued: false },
  superscript: { feature: 'superscript', excludes: ['subscript'], valued: false },
  color: { feature: 'color', valued: true },
  backgroundColor: { feature: 'backgroundColor', valued: true },
  fontFamily: { feature: 'fontFamily', valued: true },
  fontSize: { feature: 'fontSize', valued: true },
};

/** Inline node types that are atomic: selected, copied and deleted as one unit. */
export const ATOMIC_INLINE = new Set(['mergeTag', 'mention', 'emoji']);

/** Block types that are atomic. */
export const ATOMIC_BLOCK = new Set(['horizontalRule', 'image']);

/** The feature set every preset includes; content can never be downgraded past these. */
export const ALWAYS_ENABLED: FeatureId[] = ['paragraph', 'lineBreak'];

/**
 * The maximum indent level, matching Quill's `ql-indent-1..8` range so imported
 * content maps exactly (03 §5.1).
 */
export const MAX_INDENT = 8;

/**
 * Builds the active feature set from a list of enabled feature ids.
 *
 * @example
 * ```ts
 * const features = createFeatureSet(['bold', 'italic']);
 * features.has('paragraph'); // true — always enabled
 * features.has('heading');   // false
 * ```
 */
export function createFeatureSet(enabled: Iterable<string>): ReadonlySet<string> {
  return new Set<string>([...ALWAYS_ENABLED, ...enabled]);
}

/** True when a block type may appear with this feature set. */
export function isBlockEnabled(type: BlockNodeName, features: ReadonlySet<string>): boolean {
  return features.has(BLOCK_SCHEMA[type].feature);
}

/** True when a mark may appear with this feature set. */
export function isMarkEnabled(type: MarkName, features: ReadonlySet<string>): boolean {
  return features.has(MARK_SCHEMA[type].feature);
}
