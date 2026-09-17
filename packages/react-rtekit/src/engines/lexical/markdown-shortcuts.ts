import {
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  CHECK_LIST,
  CODE,
  HEADING,
  INLINE_CODE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  ORDERED_LIST,
  QUOTE,
  STRIKETHROUGH,
  UNORDERED_LIST,
  registerMarkdownShortcuts,
  type Transformer,
} from '@lexical/markdown';
import type { LexicalEditor } from 'lexical';
import type { Unregister } from '../../types/common.js';

/**
 * Markdown input rules (05 §5).
 *
 * Typing `# `, `- `, `> ` or `**bold**` produces the block or mark rather than the
 * characters. The set is filtered by the editor's enabled features, so a `classic`
 * editor — which has no headings — does not silently create one the schema would
 * then downgrade on the way out.
 *
 * @module
 */

/** Which feature each transformer needs, keyed by the transformer itself. */
const FEATURE_BY_TRANSFORMER = new Map<Transformer, string>([
  [HEADING, 'heading'],
  [QUOTE, 'blockquote'],
  [CODE, 'codeBlock'],
  [UNORDERED_LIST, 'list'],
  [ORDERED_LIST, 'list'],
  [CHECK_LIST, 'checkList'],
  [BOLD_ITALIC_STAR, 'bold'],
  [BOLD_ITALIC_UNDERSCORE, 'bold'],
  [BOLD_STAR, 'bold'],
  [BOLD_UNDERSCORE, 'bold'],
  [ITALIC_STAR, 'italic'],
  [ITALIC_UNDERSCORE, 'italic'],
  [STRIKETHROUGH, 'strike'],
  [INLINE_CODE, 'code'],
]);

/**
 * Registers the markdown input rules the enabled features allow.
 *
 * Returns a no-op unregister when the feature is off, so the caller never branches.
 */
export function registerMarkdownInputRules(
  editor: LexicalEditor,
  options: { enabled?: boolean; features?: ReadonlySet<string> } = {},
): Unregister {
  if (options.enabled === false) return () => undefined;

  const features = options.features;
  const transformers = [...FEATURE_BY_TRANSFORMER.entries()]
    .filter(([, feature]) => !features || features.has(feature))
    .map(([transformer]) => transformer);

  if (transformers.length === 0) return () => undefined;
  return registerMarkdownShortcuts(editor, transformers);
}
