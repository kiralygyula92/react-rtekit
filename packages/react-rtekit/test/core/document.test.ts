import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { EditorDocument } from '../../src/types/document.js';
import {
  collectMergeTags,
  countDocument,
  countText,
  createEmptyDocument,
  documentToHtml,
  documentToMarkdown,
  documentToText,
  htmlToDocument,
  isEditorDocument,
  isEmptyDocument,
  markdownToDocument,
  normalizeDocument,
  textToDocument,
  validateMergeTagKeys,
} from '../../src/core/index.js';

/**
 * The document model.
 *
 * The counting rules here are what fix R3: a 2 000-character message is 2 000
 * characters however much markup it carries.
 */

describe('counting (R3)', () => {
  it('counts characters, not markup', () => {
    const plain = 'a'.repeat(2000);
    const formatted = `<p><strong><em><u><span style="color:#FF0000">${plain}</span></u></em></strong></p>`;
    expect(formatted.length).toBeGreaterThan(2048);
    expect(countDocument(htmlToDocument(formatted))).toBe(2000);
  });

  it('a heavily formatted 2000-character message passes a 2048 limit', () => {
    const words = Array.from({ length: 200 }, (_, i) => `<strong>word${i}</strong>`).join(' ');
    const doc = htmlToDocument(`<p>${words}</p>`);
    expect(countDocument(doc)).toBeLessThanOrEqual(2048);
  });

  it('counts block boundaries as one newline each', () => {
    const doc = htmlToDocument('<p>ab</p><p>cd</p>');
    expect(documentToText(doc)).toBe('ab\ncd');
    expect(countDocument(doc)).toBe(5);
  });

  it('matches getText().length exactly', () => {
    const doc = htmlToDocument('<p>Hello <strong>world</strong></p><ul><li>one</li></ul>');
    expect(countDocument(doc)).toBe(countText(documentToText(doc)));
  });

  it('counts words', () => {
    expect(countText('one two  three\nfour', 'words')).toBe(4);
    expect(countText('   ', 'words')).toBe(0);
    expect(countDocument(htmlToDocument('<p>one two</p><p>three</p>'), 'words')).toBe(3);
  });

  it('counts an emoji as a single character', () => {
    expect(countText('a\u{1F600}b')).toBe(3);
  });

  it('counts a merge tag per the configured mode', () => {
    const doc = htmlToDocument('<p>{company_name}</p>', {
      mergeTags: { labels: { company_name: 'Company name' } },
    });
    expect(countDocument(doc, 'characters', 'label')).toBe('Company name'.length);
    expect(countDocument(doc, 'characters', 'key')).toBe('company_name'.length);
    expect(countDocument(doc, 'characters', 'zero')).toBe(0);
  });
});

describe('emptiness truth table (R2)', () => {
  it('an empty document is empty', () => {
    expect(isEmptyDocument(createEmptyDocument())).toBe(true);
  });

  it('a single empty list item is empty', () => {
    expect(isEmptyDocument(htmlToDocument('<ul><li></li></ul>'))).toBe(true);
  });

  it('a lone line break is empty', () => {
    expect(isEmptyDocument(htmlToDocument('<p><br></p>'))).toBe(true);
  });

  it('a non-breaking space is content', () => {
    expect(isEmptyDocument(htmlToDocument('<p>&nbsp;</p>'))).toBe(false);
  });

  it('an atomic node with no text is content', () => {
    expect(isEmptyDocument(htmlToDocument('<p><img src="a.png" alt=""></p>'))).toBe(false);
    expect(isEmptyDocument(htmlToDocument('<hr>'))).toBe(false);
    expect(isEmptyDocument(htmlToDocument('<p>{company_name}</p>'))).toBe(false);
  });
});

describe('merge-tag helpers', () => {
  const doc = htmlToDocument('<p>{a} and {b} and {a}</p>');

  it('collects keys in document order, de-duplicated', () => {
    expect(collectMergeTags(doc)).toEqual(['a', 'b']);
  });

  it('reports keys outside the allowed list', () => {
    expect(validateMergeTagKeys(doc, ['a'])).toEqual(['b']);
    expect(validateMergeTagKeys(doc, ['a', 'b'])).toEqual([]);
  });
});

describe('normalization', () => {
  it('merges adjacent runs carrying the same marks', () => {
    const doc: EditorDocument = {
      type: 'doc',
      version: 1,
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'a', marks: [{ type: 'bold' }] },
            { type: 'text', text: 'b', marks: [{ type: 'bold' }] },
          ],
        },
      ],
    };
    const normalized = normalizeDocument(doc);
    expect(normalized.content[0]).toMatchObject({
      content: [{ type: 'text', text: 'ab', marks: [{ type: 'bold' }] }],
    });
  });

  it('keeps a trailing paragraph after a table so the caret can escape', () => {
    const doc = normalizeDocument(htmlToDocument('<table><tr><td>x</td></tr></table>'));
    expect(doc.content[doc.content.length - 1]).toMatchObject({ type: 'paragraph' });
  });

  it('can collapse runs of empty paragraphs', () => {
    const doc = htmlToDocument('<p>a</p><p><br></p><p><br></p><p>b</p>');
    expect(normalizeDocument(doc, { collapseEmptyBlocks: true }).content).toHaveLength(3);
    expect(normalizeDocument(doc, { collapseEmptyBlocks: false }).content).toHaveLength(4);
  });
});

describe('plain text', () => {
  it('turns blank lines into paragraphs and single newlines into breaks', () => {
    const doc = textToDocument('one\ntwo\n\nthree');
    expect(doc.content).toHaveLength(2);
    expect(doc.content[0]).toMatchObject({
      content: [{ type: 'text', text: 'one' }, { type: 'lineBreak' }, { type: 'text', text: 'two' }],
    });
    expect(documentToText(doc)).toBe('one\ntwo\nthree');
  });
});

describe('type guard', () => {
  it('accepts a document and rejects everything else', () => {
    expect(isEditorDocument(createEmptyDocument())).toBe(true);
    expect(isEditorDocument({ type: 'doc' })).toBe(false);
    expect(isEditorDocument(null)).toBe(false);
    expect(isEditorDocument('<p>x</p>')).toBe(false);
  });
});

describe('round-trip properties', () => {
  /** Text that exercises HTML escaping: `<`, `>` and `&` are deliberately included. */
  const htmlText = fc
    .stringMatching(/^[\w .,!?'"&<>@#-]{1,40}$/)
    .filter((value) => value.trim().length > 0);

  /**
   * Text for the Markdown property.
   *
   * No `<`, `>` or `&`: those are stripped before the document is built, which can
   * empty a line, and Markdown has no way to express an empty paragraph — a real and
   * documented limit of the format rather than a bug worth generating.
   */
  const markdownText = fc
    .stringMatching(/^[\w .,!?'@#-]{1,40}$/)
    .filter((value) => value.trim().length > 0);

  it('document -> html -> document is stable', () => {
    fc.assert(
      fc.property(fc.array(htmlText, { minLength: 1, maxLength: 6 }), (lines) => {
        const source: EditorDocument = {
          type: 'doc',
          version: 1,
          content: lines.map((line) => ({
            type: 'paragraph' as const,
            content: [{ type: 'text' as const, text: line }],
          })),
        };
        const once = htmlToDocument(documentToHtml(source), { mergeTags: { parseOnInput: false } });
        const twice = htmlToDocument(documentToHtml(once), { mergeTags: { parseOnInput: false } });
        return JSON.stringify(once) === JSON.stringify(twice);
      }),
      { numRuns: 200 },
    );
  });

  it('html -> document -> html is idempotent', () => {
    fc.assert(
      fc.property(fc.array(htmlText, { minLength: 1, maxLength: 5 }), (lines) => {
        const html = lines.map((line) => `<p>${line.replace(/[<>&]/g, '')}</p>`).join('');
        const once = documentToHtml(htmlToDocument(html));
        const twice = documentToHtml(htmlToDocument(once));
        return once === twice;
      }),
      { numRuns: 200 },
    );
  });

  it('document -> markdown -> document preserves supported nodes', () => {
    fc.assert(
      fc.property(fc.array(markdownText, { minLength: 1, maxLength: 4 }), (lines) => {
        const source = htmlToDocument(
          lines.map((line) => `<p>${line}</p>`).join(''),
          { mergeTags: { parseOnInput: false } },
        );
        const back = markdownToDocument(documentToMarkdown(source), {
          mergeTags: { parseOnInput: false },
        });
        return documentToText(back).trim() === documentToText(source).trim();
      }),
      { numRuns: 500 },
    );
  });
});
