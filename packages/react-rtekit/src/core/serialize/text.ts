import type { EditorDocument } from '../../types/document.js';
import { documentToText, type TextOptions } from '../document.js';
import { createDocument } from '../document.js';

/**
 * Plain text (03 §1, §5.3).
 *
 * @module
 */

/**
 * The visible text of a document.
 *
 * @example
 * ```ts
 * documentToPlainText(doc);                  // 'Hi Jane\nSecond line'
 * ```
 */
export function documentToPlainText(doc: EditorDocument, options: TextOptions = {}): string {
  return documentToText(doc, options);
}

/**
 * The `text/plain` alternative for a multipart e-mail (03 §5.3).
 *
 * Links become `text (url)` and list items get markers, so the message still reads
 * correctly in a client that refuses HTML.
 *
 * @example
 * ```ts
 * plainTextAlternative(doc);
 * // 'Hi Jane\n\n- Add 2 lbs of shock\n- Re-test in 24h\n\nSee our site (https://example.com)'
 * ```
 */
export function plainTextAlternative(
  doc: EditorDocument,
  options: { mergeTagSyntax?: { open: string; close: string } } = {},
): string {
  return documentToText(doc, {
    listMarkers: true,
    linkUrls: true,
    blockSeparator: '\n',
    // Merge tags keep their delimiters: the backend substitutes the same tokens in
    // both parts of a multipart message.
    mergeTagSyntax: options.mergeTagSyntax ?? { open: '{', close: '}' },
  })
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Turns plain text into a document.
 *
 * Double newlines become paragraphs and single newlines become line breaks, which is
 * what a plain-text paste should produce (03 §3).
 *
 * @example
 * ```ts
 * textToDocument('one\ntwo\n\nthree');
 * // two paragraphs, the first holding a line break
 * ```
 */
export function textToDocument(text: string): EditorDocument {
  const paragraphs = text.replace(/\r\n?/g, '\n').split(/\n{2,}/);
  return createDocument(
    paragraphs.map((paragraph) => {
      const lines = paragraph.split('\n');
      const content = lines.flatMap((line, index) =>
        index === 0
          ? line === ''
            ? []
            : [{ type: 'text' as const, text: line }]
          : [{ type: 'lineBreak' as const }, ...(line === '' ? [] : [{ type: 'text' as const, text: line }])],
      );
      return { type: 'paragraph' as const, content };
    }),
  );
}
