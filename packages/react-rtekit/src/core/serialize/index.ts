/**
 * Serialization: HTML, Markdown, plain text and JSON (03 §1).
 *
 * @module
 */
export {
  htmlToDocument,
  isEmptyHtml,
  type HtmlToDocumentOptions,
  type MergeTagParseOptions,
} from './from-html.js';
export { documentToHtml, type DocumentToHtmlOptions } from './to-html.js';
export {
  documentToMarkdown,
  markdownToDocument,
  markdownToHtml,
  type MarkdownOptions,
} from './markdown.js';
export { documentToPlainText, plainTextAlternative, textToDocument } from './text.js';
