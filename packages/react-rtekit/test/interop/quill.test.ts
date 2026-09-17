import { describe, expect, it } from 'vitest';
import {
  documentToHtml,
  documentToMarkdown,
  documentToText,
  htmlToDocument,
  isEmptyDocument,
  isEmptyHtml,
  markdownToDocument,
  plainTextAlternative,
} from '../../src/core/index.js';
import { QUILL_FIXTURES, quillFixture } from '../fixtures/quill.js';

/**
 * The interop contract (03 §5.1, 09 §2, ADR-004).
 *
 * Every fixture is real markup the old editor produced. The assertion is not that the
 * bytes match, but that nothing an author can see is lost on the way in or out.
 */

/** Strips markup so two serializations can be compared on their visible text. */
function visibleText(html: string): string {
  return htmlToDocument(html)
    .content.map((block) => JSON.stringify(block))
    .join('');
}

describe('Quill fixture corpus round-trips', () => {
  it.each(QUILL_FIXTURES.map((fixture) => [fixture.id, fixture.html] as const))(
    '%s survives html -> document -> html',
    (_id, html) => {
      const doc = htmlToDocument(html);
      const out = documentToHtml(doc);
      // Re-parsing the output must produce the same document: that is what "lossless
      // for everything the schema supports" means.
      expect(visibleText(out)).toBe(visibleText(html));
    },
  );

  it.each(QUILL_FIXTURES.map((fixture) => [fixture.id, fixture.html] as const))(
    '%s survives html -> document -> quill-compatible html',
    (_id, html) => {
      const doc = htmlToDocument(html);
      const out = documentToHtml(doc, { profile: 'quill-compatible' });
      expect(visibleText(out)).toBe(visibleText(html));
    },
  );

  it.each(QUILL_FIXTURES.map((fixture) => [fixture.id, fixture.html] as const))(
    '%s keeps its text through the email profile',
    (_id, html) => {
      const doc = htmlToDocument(html);
      const out = documentToHtml(doc, { profile: 'email', sanitizeWith: 'email' });
      expect(documentToText(htmlToDocument(out))).toBe(documentToText(doc));
    },
  );
});

describe('alignment', () => {
  it('reads ql-align-* classes', () => {
    const doc = htmlToDocument(quillFixture('align-classes').html);
    // `left` is the default and is stored as no attribute at all.
    const aligns = doc.content.map((block) =>
      block.type === 'paragraph' ? (block.align ?? 'left') : 'n/a',
    );
    expect(aligns).toEqual([
      'left',
      'center',
      'right',
      'justify',
    ]);
  });

  it('reads inline text-align styles', () => {
    const doc = htmlToDocument(quillFixture('align-inline-style').html);
    expect(doc.content[0]).toMatchObject({ type: 'paragraph', align: 'center' });
    expect(doc.content[1]).toMatchObject({ type: 'paragraph', align: 'right' });
  });

  it('writes the dialect each profile calls for', () => {
    const doc = htmlToDocument('<p class="ql-align-center">x</p>');
    expect(documentToHtml(doc, { profile: 'standard' })).toContain('class="rte-align-center"');
    expect(documentToHtml(doc, { profile: 'quill-compatible' })).toContain('class="ql-align-center"');
    expect(documentToHtml(doc, { profile: 'email', sanitizeWith: 'email' })).toContain(
      'style="text-align: center"',
    );
  });

  it('serializes left as no attribute at all', () => {
    const doc = htmlToDocument('<p class="ql-align-left">x</p>');
    expect(documentToHtml(doc)).toBe('<p>x</p>');
  });
});

describe('lists', () => {
  it('consumes data-list rather than rendering it', () => {
    const doc = htmlToDocument(quillFixture('bullet-list').html);
    expect(doc.content[0]).toMatchObject({ type: 'list', listType: 'bullet' });
    expect(documentToHtml(doc)).toBe('<ul><li>one</li><li>two</li></ul>');
  });

  it('treats data-list="ordered" inside a ul as an ordered list', () => {
    const doc = htmlToDocument('<ul><li data-list="ordered">a</li></ul>');
    expect(doc.content[0]).toMatchObject({ type: 'list', listType: 'ordered' });
  });

  it('reads check lists', () => {
    const doc = htmlToDocument(quillFixture('check-list').html);
    expect(doc.content[0]).toMatchObject({
      type: 'list',
      listType: 'check',
      items: [
        { checked: false, content: [{ type: 'text', text: 'todo' }] },
        { checked: true, content: [{ type: 'text', text: 'done' }] },
      ],
    });
  });

  it('rebuilds nesting from ql-indent classes', () => {
    const doc = htmlToDocument(quillFixture('nested-bullets').html);
    const list = doc.content[0];
    expect(list).toMatchObject({ type: 'list', listType: 'bullet' });
    if (list?.type !== 'list') throw new Error('expected a list');
    expect(list.items).toHaveLength(2);
    expect(list.items[0]?.children?.[0]).toMatchObject({ type: 'list' });
    const level1 = list.items[0]?.children?.[0];
    expect(level1?.items[0]?.children?.[0]).toMatchObject({ type: 'list' });
  });

  it('flattens nesting again for the quill-compatible profile', () => {
    const doc = htmlToDocument(quillFixture('nested-bullets').html);
    const out = documentToHtml(doc, { profile: 'quill-compatible' });
    expect(out).toContain('data-list="bullet"');
    expect(out).toContain('ql-indent-1');
    expect(out).toContain('ql-indent-2');
    // Flat: exactly one <ul>.
    expect(out.match(/<ul/g)).toHaveLength(1);
  });

  it('gives e-mail lists explicit margins', () => {
    const doc = htmlToDocument('<ul><li>a</li></ul>');
    const out = documentToHtml(doc, { profile: 'email', sanitizeWith: 'email' });
    expect(out).toContain('margin: 0 0 0 1.5em');
  });
});

describe('marks and colours', () => {
  it('reads coloured spans and normalizes the value', () => {
    const doc = htmlToDocument(quillFixture('colored-spans').html);
    const paragraph = doc.content[0];
    if (paragraph?.type !== 'paragraph') throw new Error('expected a paragraph');
    expect(paragraph.content[0]).toMatchObject({
      type: 'text',
      text: 'red',
      marks: [{ type: 'color', value: '#ff0000' }],
    });
  });

  it('maps ql-size classes through the size map', () => {
    const doc = htmlToDocument(quillFixture('size-classes').html);
    const paragraph = doc.content[0];
    if (paragraph?.type !== 'paragraph') throw new Error('expected a paragraph');
    expect(paragraph.content[0]).toMatchObject({
      marks: [{ type: 'fontSize', value: '1.5em' }],
    });
  });

  it('honours a custom size map', () => {
    const doc = htmlToDocument('<p><span class="ql-size-large">x</span></p>', {
      interop: { quill: { sizeMap: { large: '24px' } } },
    });
    const paragraph = doc.content[0];
    if (paragraph?.type !== 'paragraph') throw new Error('expected a paragraph');
    expect(paragraph.content[0]).toMatchObject({ marks: [{ type: 'fontSize', value: '24px' }] });
  });

  it('reads the three formats the old editor supported', () => {
    const doc = htmlToDocument(quillFixture('marks').html);
    const paragraph = doc.content[0];
    if (paragraph?.type !== 'paragraph') throw new Error('expected a paragraph');
    const marks = paragraph.content.flatMap((node) =>
      node.type === 'text' ? (node.marks ?? []).map((mark) => mark.type) : [],
    );
    expect(marks).toEqual(['bold', 'italic', 'underline']);
  });
});

describe('artefacts and indentation', () => {
  it('drops ql-cursor and ql-ui entirely', () => {
    const doc = htmlToDocument(quillFixture('editor-artefacts').html);
    expect(documentToHtml(doc)).toBe('<p>text</p>');
  });

  it('maps ql-indent-N onto indent levels', () => {
    const doc = htmlToDocument(quillFixture('indented-paragraph').html);
    expect(doc.content[0]).toMatchObject({ type: 'paragraph', indent: 1 });
    expect(doc.content[1]).toMatchObject({ type: 'paragraph', indent: 3 });
    expect(documentToHtml(doc, { profile: 'quill-compatible' })).toContain('ql-indent-3');
    expect(documentToHtml(doc)).toContain('data-indent="3"');
  });
});

describe('emptiness (R2)', () => {
  const cases: [string, boolean][] = [
    ['', true],
    ['<p></p>', true],
    ['<p><br></p>', true],
    ['<p><br></p><p><br></p>', true],
    ['<p> </p>', true],
    ['<p>   \n  </p>', true],
    ['<ul><li></li></ul>', true],
    ['<p>&nbsp;</p>', false],
    ['<p>x</p>', false],
    ['<p><img src="a.png"></p>', false],
    ['<hr>', false],
  ];

  it.each(cases)('isEmptyDocument(%j) === %s', (html, expected) => {
    expect(isEmptyDocument(htmlToDocument(html))).toBe(expected);
  });

  it.each(cases)('isEmptyHtml(%j) === %s', (html, expected) => {
    expect(isEmptyHtml(html)).toBe(expected);
  });
});

describe('merge tags (R23)', () => {
  const body = quillFixture('default-email-body').html;

  it('parses {key} text into atomic tag nodes', () => {
    const doc = htmlToDocument(body);
    const first = doc.content[0];
    if (first?.type !== 'paragraph') throw new Error('expected a paragraph');
    expect(first.content).toEqual([
      { type: 'text', text: 'Hi ' },
      { type: 'mergeTag', key: 'contact_first_name' },
      { type: 'text', text: ', ' },
    ]);
  });

  it('serializes back to exactly {key}, so the backend is unaffected', () => {
    const out = documentToHtml(htmlToDocument(body));
    expect(out).toContain('{contact_first_name}');
    expect(out).toContain('{org_address}');
  });

  it('substitutes sample values in preview mode without changing the document', () => {
    const doc = htmlToDocument(body);
    const preview = documentToHtml(doc, { mergeTagPreview: { contact_first_name: 'Jane' } });
    expect(preview).toContain('Hi Jane');
    expect(preview).not.toContain('{contact_first_name}');
    // The document itself is untouched.
    expect(documentToHtml(doc)).toContain('{contact_first_name}');
  });

  it('survives a markdown round-trip', () => {
    const doc = htmlToDocument(body);
    const markdown = documentToMarkdown(doc);
    expect(markdown).toContain('{{contact_first_name}}');
    const back = markdownToDocument(markdown, {
      mergeTags: { syntax: { open: '{{', close: '}}' } },
    });
    const first = back.content[0];
    if (first?.type !== 'paragraph') throw new Error('expected a paragraph');
    expect(first.content.some((node) => node.type === 'mergeTag' && node.key === 'contact_first_name')).toBe(
      true,
    );
  });

  it('reports unknown keys', () => {
    const warnings: string[] = [];
    htmlToDocument('<p>{org_name} and {typo_key}</p>', {
      mergeTags: { knownKeys: ['org_name'] },
      onWarning: (warning) => warnings.push(warning.message),
    });
    expect(warnings).toContain('Unknown merge tag "typo_key"');
  });

  it('can be turned off, leaving the braces as text', () => {
    const doc = htmlToDocument('<p>{org_name}</p>', { mergeTags: { parseOnInput: false } });
    const first = doc.content[0];
    if (first?.type !== 'paragraph') throw new Error('expected a paragraph');
    expect(first.content).toEqual([{ type: 'text', text: '{org_name}' }]);
  });
});

describe('e-mail output (03 §5.3)', () => {
  const html = quillFixture('full-message').html;

  it('emits no class and no id', () => {
    const out = documentToHtml(htmlToDocument(html), { profile: 'email', sanitizeWith: 'email' });
    expect(out).not.toMatch(/\sclass=/);
    expect(out).not.toMatch(/\sid=/);
  });

  it('emits only allowlisted CSS properties', () => {
    const out = documentToHtml(htmlToDocument(html), { profile: 'email', sanitizeWith: 'email' });
    const properties = [...out.matchAll(/style="([^"]*)"/g)]
      .flatMap((match) => match[1]!.split(';'))
      .map((declaration) => declaration.split(':')[0]?.trim())
      .filter((property): property is string => !!property);
    for (const property of properties) {
      expect(
        [
          'color',
          'background-color',
          'font-family',
          'font-size',
          'font-weight',
          'font-style',
          'text-decoration',
          'text-align',
          'padding',
          'padding-left',
          'margin',
          'border',
          'border-left',
          'border-collapse',
          'width',
          'max-width',
          'height',
          'vertical-align',
          'line-height',
          'list-style-type',
        ],
        `unexpected property ${property}`,
      ).toContain(property);
    }
  });

  it('can wrap the body in a centring table', () => {
    const out = documentToHtml(htmlToDocument('<p>hi</p>'), {
      profile: 'email',
      sanitizeWith: 'email',
      email: { wrapInTable: true, containerWidth: 640, fontFallback: 'Georgia, serif' },
    });
    expect(out).toContain('width: 640px');
    expect(out).toContain('Georgia, serif');
  });

  it('absolutizes relative URLs when asked', () => {
    const out = documentToHtml(htmlToDocument('<p><a href="/reports/1">report</a></p>'), {
      profile: 'email',
      sanitizeWith: 'email',
      email: { forceAbsoluteUrls: 'https://app.example.com/' },
    });
    expect(out).toContain('https://app.example.com/reports/1');
  });

  it('produces a readable text/plain alternative', () => {
    const doc = htmlToDocument(html);
    const text = plainTextAlternative(doc);
    expect(text).toContain('- Add 2 lbs of shock');
    expect(text).toContain('{org_name}');
    expect(text).not.toContain('<');
  });

  it('renders links as text (url) in the plain-text alternative', () => {
    const doc = htmlToDocument('<p>See <a href="https://example.com">our site</a>.</p>');
    expect(plainTextAlternative(doc)).toBe('See our site (https://example.com).');
  });
});

describe('minimal profile', () => {
  it('drops wrapper spans that carry nothing', () => {
    const doc = htmlToDocument('<p><span>plain</span> text</p>');
    expect(documentToHtml(doc, { profile: 'minimal' })).toBe('<p>plain text</p>');
  });

  it('merges adjacent runs with identical marks', () => {
    const doc = htmlToDocument('<p><strong>a</strong><strong>b</strong></p>');
    expect(documentToHtml(doc, { profile: 'minimal' })).toBe('<p><strong>ab</strong></p>');
  });
});
