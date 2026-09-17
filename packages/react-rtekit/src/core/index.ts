/**
 * `react-rtekit/core` — the headless core.
 *
 * No React, no engine, no DOM assumptions beyond an optional `DOMParser`: safe to
 * import from a server, a worker or a test. Everything the editor does to
 * content — parse, sanitize, downgrade, normalize, serialize — is reachable from here
 * without mounting anything.
 *
 * @module
 */
export { VERSION } from '../version.js';

// ── HTML layer ──────────────────────────────────────────────────────────────
export {
  parseHtml,
  parseHtmlFragment,
  parseHtmlWithDom,
  hasDomParser,
  serializeHtmlNodes,
  textContent,
  walkElements,
  findElement,
  isElement,
  isText,
  element,
  text,
  decodeEntities,
  decodeEntitiesDeep,
  escapeText,
  escapeAttribute,
  type HtmlNode,
  type HtmlElement,
  type HtmlText,
  type HtmlComment,
  type HtmlParserChoice,
  type SerializeHtmlOptions,
} from './html/index.js';

// ── sanitization ────────────────────────────────────────────────────────────
export {
  sanitizeHtml,
  sanitizeNodes,
  describeProfile,
  getProfile,
  resolveSanitizeConfig,
  mergeSanitizeConfig,
  sanitizeStyle,
  parseStyle,
  serializeStyle,
  readStyleProperty,
  checkUrl,
  getProtocol,
  normalizeUrl,
  isExternalUrl,
  HARD_BLOCKED_TAGS,
  HARD_BLOCKED_PROTOCOLS,
  DEFAULT_PROTOCOLS,
  EMAIL_SAFE_PROPERTIES,
  STANDARD_SAFE_PROPERTIES,
  type SanitizeOptions,
  type CssDeclaration,
  type UrlPolicy,
  type UrlVerdict,
} from './sanitize/index.js';

// ── schema ──────────────────────────────────────────────────────────────────
export {
  BLOCK_SCHEMA,
  MARK_SCHEMA,
  ATOMIC_INLINE,
  ATOMIC_BLOCK,
  ALWAYS_ENABLED,
  MAX_INDENT,
  createFeatureSet,
  isBlockEnabled,
  isMarkEnabled,
  type FeatureId,
  type BlockSchemaEntry,
  type MarkSchemaEntry,
} from './schema.js';

// ── document model ──────────────────────────────────────────────────────────
export {
  createDocument,
  createEmptyDocument,
  isEditorDocument,
  isEmptyDocument,
  documentToText,
  countText,
  countDocument,
  collectMergeTags,
  validateMergeTagKeys,
  walkBlocks,
  walkInline,
  findMark,
  marksEqual,
  sortMarks,
  normalizeDocument,
  type TextOptions,
  type NormalizeOptions,
  type MergeTagLengthMode,
} from './document.js';

// ── serialization ───────────────────────────────────────────────────────────
export {
  htmlToDocument,
  isEmptyHtml,
  documentToHtml,
  documentToMarkdown,
  markdownToDocument,
  markdownToHtml,
  documentToPlainText,
  plainTextAlternative,
  textToDocument,
  type HtmlToDocumentOptions,
  type DocumentToHtmlOptions,
  type MarkdownOptions,
  type MergeTagParseOptions,
} from './serialize/index.js';

// ── interop ─────────────────────────────────────────────────────────────────
export {
  parseQuillMarkup,
  looksLikeQuill,
  DEFAULT_SIZE_MAP,
  cleanOfficeMarkup,
  detectOfficeSource,
  detectPasteSource,
  type PasteSource,
} from './interop/index.js';

// ── utils ───────────────────────────────────────────────────────────────────
export { createId, scopedId } from './utils/id.js';
export { normalizeColor, contrastRatio, meetsContrastAA } from './utils/color.js';

export type * from '../types/index.js';
