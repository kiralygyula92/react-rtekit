import { detectOfficeSource } from './office.js';
import { looksLikeQuill } from './quill.js';

/**
 * HTML interop (03 §5, ADR-004).
 *
 * @module
 */
export {
  parseQuillMarkup,
  looksLikeQuill,
  DEFAULT_SIZE_MAP,
} from './quill.js';
export { cleanOfficeMarkup, detectOfficeSource } from './office.js';

/** Where a clipboard payload came from. */
export type PasteSource = 'word' | 'gdocs' | 'excel' | 'quill' | 'rtekit' | 'plain' | 'unknown';

/**
 * Identifies the origin of a clipboard payload (03 §3).
 *
 * Detection drives which cleanup runs, and it is also surfaced to `handlers.onPaste`
 * so a consumer can apply a different policy to an office paste than to plain text.
 *
 * @example
 * ```ts
 * detectPasteSource('<p class=MsoNormal>x</p>', 'x'); // 'word'
 * detectPasteSource('', 'just text');                 // 'plain'
 * ```
 */
export function detectPasteSource(html: string, text: string): PasteSource {
  if (html.trim() === '') return text.trim() === '' ? 'unknown' : 'plain';
  if (/data-rtekit\b/.test(html)) return 'rtekit';
  const office = detectOfficeSource(html);
  if (office) return office;
  if (looksLikeQuill(html)) return 'quill';
  return 'unknown';
}
