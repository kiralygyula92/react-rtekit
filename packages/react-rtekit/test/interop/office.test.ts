import { describe, expect, it } from 'vitest';
import {
  cleanOfficeMarkup,
  detectOfficeSource,
  detectPasteSource,
  documentToHtml,
  htmlToDocument,
  parseHtml,
  serializeHtmlNodes,
} from '../../src/core/index.js';
import { FORBIDDEN_AFTER_CLEANUP, OFFICE_FIXTURES, officeFixture } from '../fixtures/office.js';

/**
 * Office paste cleanup.
 *
 * The bar: no `mso-*`, no `<o:p>`, no Office class names, no empty spans, and the
 * structure the author actually meant — especially lists, which Word does not write as
 * lists at all.
 */

/** Runs only the cleanup, so the assertions are about interop and not sanitization. */
function clean(html: string): string {
  return serializeHtmlNodes(cleanOfficeMarkup(parseHtml(html, 'builtin')));
}

describe('source detection', () => {
  it.each(OFFICE_FIXTURES.map((fixture) => [fixture.id, fixture.source, fixture.html] as const))(
    'identifies %s as %s',
    (_id, source, html) => {
      expect(detectOfficeSource(html)).toBe(source);
      expect(detectPasteSource(html, '')).toBe(source);
    },
  );

  it('identifies plain text and Quill', () => {
    expect(detectPasteSource('', 'hello')).toBe('plain');
    expect(detectPasteSource('<p class="ql-align-center">x</p>', 'x')).toBe('quill');
    expect(detectPasteSource('<p>x</p>', 'x')).toBe('unknown');
  });
});

describe('cleanup removes Office noise', () => {
  it.each(OFFICE_FIXTURES.map((fixture) => [fixture.id, fixture.html] as const))(
    '%s leaves nothing Office-specific behind',
    (_id, html) => {
      const output = clean(html);
      for (const forbidden of FORBIDDEN_AFTER_CLEANUP) {
        expect(output, `still contains ${forbidden}`).not.toContain(forbidden);
      }
    },
  );

  it.each(OFFICE_FIXTURES.map((fixture) => [fixture.id, fixture.html] as const))(
    '%s survives the full input pipeline',
    (_id, html) => {
      const output = documentToHtml(htmlToDocument(html));
      for (const forbidden of FORBIDDEN_AFTER_CLEANUP) {
        expect(output, `still contains ${forbidden}`).not.toContain(forbidden);
      }
    },
  );
});

describe('Word', () => {
  it('keeps the text and the bold run', () => {
    const doc = htmlToDocument(officeFixture('word-paragraphs').html);
    const html = documentToHtml(doc);
    expect(html).toContain('First paragraph');
    expect(html).toContain('<strong>Bold text</strong>');
    expect(html).toContain('and normal.');
  });

  it('turns list paragraphs into a real list', () => {
    const doc = htmlToDocument(officeFixture('word-list').html);
    const list = doc.content.find((block) => block.type === 'list');
    expect(list).toBeDefined();
    if (list?.type !== 'list') throw new Error('expected a list');
    expect(list.items.map((item) => item.content.map((node) => ('text' in node ? node.text : '')).join(''))).toEqual([
      'First item',
      'Second item',
    ]);
    // The third paragraph was at level 2, so it nests.
    expect(list.items[1]?.children?.[0]).toMatchObject({ type: 'list' });
  });

  it('drops the bullet glyph Word writes into the item text', () => {
    const html = documentToHtml(htmlToDocument(officeFixture('word-list').html));
    expect(html).not.toContain('·');
    expect(html).not.toContain('•');
  });

  it('removes conditional comments and empty spans', () => {
    const output = clean(officeFixture('word-conditional-comments').html);
    expect(output).toContain('Text after empty spans');
    expect(output).not.toContain('<!--');
    expect(output).not.toContain('<xml');
  });
});

describe('Google Docs', () => {
  it('unwraps the docs-internal-guid wrapper and keeps both paragraphs', () => {
    const doc = htmlToDocument(officeFixture('gdocs-paragraphs').html);
    const paragraphs = doc.content.filter((block) => block.type === 'paragraph');
    expect(paragraphs).toHaveLength(2);
    expect(documentToHtml(doc)).toContain('Plain sentence.');
  });

  it('keeps colour and weight but drops the font stack and fixed sizes', () => {
    const html = documentToHtml(htmlToDocument(officeFixture('gdocs-paragraphs').html));
    expect(html).toContain('#ff0000');
    expect(html).toContain('<strong>');
    expect(html).not.toContain('Arial');
    expect(html).not.toContain('11pt');
  });

  it('reads its lists', () => {
    const doc = htmlToDocument(officeFixture('gdocs-list').html);
    const list = doc.content.find((block) => block.type === 'list');
    if (list?.type !== 'list') throw new Error('expected a list');
    expect(list.listType).toBe('bullet');
    expect(list.items).toHaveLength(2);
  });

  it('unwraps the Google redirect so the real URL survives', () => {
    const html = documentToHtml(htmlToDocument(officeFixture('gdocs-link').html));
    expect(html).toContain('href="https://example.com"');
    expect(html).not.toContain('google.com/url');
  });
});

describe('Excel', () => {
  it('keeps the table and its cells', () => {
    const doc = htmlToDocument(officeFixture('excel-table').html);
    const table = doc.content.find((block) => block.type === 'table');
    if (table?.type !== 'table') throw new Error('expected a table');
    expect(table.rows).toHaveLength(2);
    expect(table.rows[0]?.cells).toHaveLength(2);
    expect(documentToHtml(doc)).toContain('Revenue');
    expect(documentToHtml(doc)).toContain('1.5');
  });
});

describe('cleanup options', () => {
  it('can keep the font family', () => {
    const output = serializeHtmlNodes(
      cleanOfficeMarkup(parseHtml(officeFixture('gdocs-paragraphs').html, 'builtin'), {
        keepFontFamily: true,
      }),
    );
    expect(output).toContain('Arial');
  });

  it('can drop colours', () => {
    const output = serializeHtmlNodes(
      cleanOfficeMarkup(parseHtml(officeFixture('gdocs-paragraphs').html, 'builtin'), {
        keepColors: false,
      }),
    );
    expect(output).not.toContain('#ff0000');
  });

  it('can leave Word lists as paragraphs', () => {
    const doc = htmlToDocument(officeFixture('word-list').html, {
      interop: { office: { convertWordLists: false } },
    });
    expect(doc.content.some((block) => block.type === 'list')).toBe(false);
  });

  it('can be disabled entirely through interop.input', () => {
    const doc = htmlToDocument(officeFixture('word-paragraphs').html, {
      interop: { input: ['standard'] },
    });
    // Without the cleanup the text still arrives; only the noise removal is skipped.
    expect(documentToHtml(doc)).toContain('First paragraph');
  });
});
