import { describe, expect, it } from 'vitest';
import {
  documentToMarkdown,
  markdownToDocument,
  markdownToHtml,
} from '../../src/core/serialize/markdown.js';
import { documentToHtml } from '../../src/core/serialize/to-html.js';
import { htmlToDocument } from '../../src/core/serialize/from-html.js';
import type { EditorDocument } from '../../src/types/document.js';

/**
 * Markdown, in both directions.
 *
 * One of the four value formats, so it is a public contract rather than a convenience:
 * `valueFormat="markdown"` means `onChange` hands the application this, and whatever it
 * hands back has to come out the same. The round-trip cases below are the ones where a
 * naive implementation loses something — a nested list, a link inside emphasis, a merge
 * tag that looks like emphasis.
 */

const doc = (html: string): EditorDocument => htmlToDocument(html);
const round = (markdown: string): string => documentToMarkdown(markdownToDocument(markdown));

describe('documentToMarkdown', () => {
  it('writes headings at their level', () => {
    expect(documentToMarkdown(doc('<h1>One</h1><h3>Three</h3>'))).toBe('# One\n\n### Three');
  });

  it('writes the inline marks', () => {
    const markdown = documentToMarkdown(
      doc('<p><strong>bold</strong> <em>italic</em> <code>code</code></p>'),
    );
    expect(markdown).toBe('**bold** *italic* `code`');
  });

  it('writes links and images', () => {
    expect(documentToMarkdown(doc('<p><a href="https://example.com">site</a></p>'))).toBe(
      '[site](https://example.com)',
    );
    expect(documentToMarkdown(doc('<p><img src="/a.png" alt="A"></p>'))).toContain('![A](/a.png)');
  });

  it('writes a bulleted list with the configured bullet', () => {
    const source = doc('<ul><li>one</li><li>two</li></ul>');
    expect(documentToMarkdown(source)).toBe('- one\n- two');
    expect(documentToMarkdown(source, { bullet: '*' })).toBe('* one\n* two');
  });

  it('numbers an ordered list', () => {
    expect(documentToMarkdown(doc('<ol><li>one</li><li>two</li></ol>'))).toBe('1. one\n2. two');
  });

  it('indents a nested list under its parent item', () => {
    const markdown = documentToMarkdown(doc('<ul><li>outer<ul><li>inner</li></ul></li></ul>'));
    expect(markdown).toContain('- outer');
    expect(markdown).toMatch(/\n\s+- inner/);
  });

  it('writes a blockquote with its marker on every line', () => {
    expect(documentToMarkdown(doc('<blockquote><p>quoted</p></blockquote>'))).toBe('> quoted');
  });

  it('fences a code block and keeps its language', () => {
    const markdown = documentToMarkdown(doc('<pre><code class="language-ts">const a = 1;</code></pre>'));
    expect(markdown).toContain('```ts');
    expect(markdown).toContain('const a = 1;');
  });

  it('keeps a code block’s language through every hop', () => {
    // The language reached neither end for a long time: both serializers wrote it, and
    // the sanitizer stripped `language-*` on the way in and again on the way out, so a
    // `ts` block arrived unlabelled and lost its highlighting.
    const source = doc('<pre><code class="language-ts">const a = 1;</code></pre>');
    const fence = '```';

    expect(source.content[0]).toMatchObject({ type: 'codeBlock', language: 'ts' });
    expect(documentToHtml(source)).toContain('class="language-ts"');
    expect(documentToMarkdown(source)).toContain(`${fence}ts`);
    expect(
      markdownToDocument(`${fence}ts\nconst a = 1;\n${fence}`).content[0],
    ).toMatchObject({ language: 'ts' });
  });

  it('writes a thematic break', () => {
    expect(documentToMarkdown(doc('<p>a</p><hr><p>b</p>'))).toContain('---');
  });

  it('writes a merge tag in the configured syntax', () => {
    const source = doc('<p>Hi {first_name}</p>');
    expect(documentToMarkdown(source)).toContain('{{first_name}}');
    expect(documentToMarkdown(source, { mergeTagSyntax: '{key}' })).toContain('{first_name}');
  });
});

describe('markdownToDocument', () => {
  it('reads headings, marks and links', () => {
    const document = markdownToDocument('# Title\n\nHi **Jane**, see [us](https://example.com).');
    const html = documentToHtml(document);

    expect(html).toContain('<h1>Title</h1>');
    expect(html).toContain('<strong>Jane</strong>');
    expect(html).toContain('<a href="https://example.com">us</a>');
  });

  it('reads _italic_ as well as *italic*, and writes one of them', () => {
    // Both are emphasis on the way in. On the way out there is one spelling, because a
    // round trip has to be stable rather than a faithful echo.
    expect(documentToHtml(markdownToDocument('_x_'))).toContain('<em>x</em>');
    expect(documentToHtml(markdownToDocument('*x*'))).toContain('<em>x</em>');
    expect(round('_x_')).toBe('*x*');
  });

  it('reads both bullet characters', () => {
    expect(documentToHtml(markdownToDocument('- one\n- two'))).toContain('<ul>');
    expect(documentToHtml(markdownToDocument('* one\n* two'))).toContain('<ul>');
  });

  it('reads an ordered list', () => {
    expect(documentToHtml(markdownToDocument('1. one\n2. two'))).toContain('<ol>');
  });

  it('reads a fenced code block with its language', () => {
    const html = documentToHtml(markdownToDocument('```ts\nconst a = 1;\n```'));
    expect(html).toContain('const a = 1;');
    expect(html).toMatch(/language-ts|<code/);
  });

  it('reads a blockquote', () => {
    expect(documentToHtml(markdownToDocument('> quoted'))).toContain('<blockquote>');
  });

  it('reads a thematic break', () => {
    expect(documentToHtml(markdownToDocument('a\n\n---\n\nb'))).toContain('<hr>');
  });

  it('does not shred a merge tag into emphasis', () => {
    // `_` emphasis has to require a word boundary, or `{{first_name}}` becomes
    // `{{first<em>name</em>}}` and the backend substitution silently stops matching.
    const html = documentToHtml(markdownToDocument('Hi {{first_name}}'));
    expect(html).not.toContain('<em>');
    expect(html).toContain('first_name');
  });

  it('leaves an unterminated fence as text rather than swallowing the rest', () => {
    const html = documentToHtml(markdownToDocument('before\n\n```\nnot closed'));
    expect(html).toContain('before');
    expect(html).toContain('not closed');
  });

  it('treats an empty string as one empty paragraph', () => {
    // Not an empty document: an editor always needs a block to put the caret in.
    const { content } = markdownToDocument('');
    expect(content).toHaveLength(1);
    expect(content[0]?.type).toBe('paragraph');
  });
});

describe('the round trip', () => {
  for (const source of [
    '# Title',
    'plain paragraph',
    '**bold** and *italic*',
    '- one\n- two',
    '1. one\n2. two',
    '> quoted',
    '[link](https://example.com)',
    '`inline code`',
    'Hi {{first_name}}',
  ]) {
    it(`survives ${JSON.stringify(source)}`, () => {
      expect(round(source)).toBe(source);
    });
  }

  it('survives a document that uses everything at once', () => {
    const source = [
      '# Report',
      '',
      'Hi **Jane**, the [summary](https://example.com) is ready.',
      '',
      '- one',
      '- two',
      '',
      '> a note',
    ].join('\n');

    expect(round(source)).toBe(source);
  });
});

describe('markdownToHtml', () => {
  it('goes straight from Markdown to sanitized HTML', () => {
    expect(markdownToHtml('# Title')).toBe('<h1>Title</h1>');
  });

  it('carries the options through to the serializer', () => {
    expect(markdownToHtml('- one', { bullet: '*' })).toContain('<ul>');
  });
});

describe('escaping', () => {
  it('leaves ordinary punctuation alone', () => {
    // Escaping every character that is ever special produced
    // `The well\-known result \(see below\) is ready\.`, which is correct Markdown and
    // unreadable prose — and it is what `valueFormat="markdown"` handed the application.
    const markdown = documentToMarkdown(
      doc('<p>The well-known result (see below) is ready. Cost: 1.5m!</p>'),
    );

    expect(markdown).toBe('The well-known result (see below) is ready. Cost: 1.5m!');
  });

  it('escapes what is syntax wherever it appears', () => {
    const markdown = documentToMarkdown(doc('<p>a [bracket] and *stars* and _under_</p>'));
    expect(markdown).toBe(String.raw`a \[bracket\] and \*stars\* and \_under\_`);
  });

  for (const [text, expected] of [
    ['- not a list', String.raw`\- not a list`],
    ['1. not a list either', String.raw`1\. not a list either`],
    ['2) nor this', String.raw`2\) nor this`],
    ['# not a heading', String.raw`\# not a heading`],
  ] as const) {
    it(`escapes a leading marker: ${JSON.stringify(text)}`, () => {
      const markdown = documentToMarkdown(doc(`<p>${text.replace('<', '&lt;')}</p>`));
      expect(markdown).toBe(expected);

      // And reading it back gives a paragraph, not the block the marker looks like.
      expect(markdownToDocument(markdown).content[0]?.type).toBe('paragraph');
      // Escaping is stable: writing what was read produces the same thing again.
      expect(round(markdown)).toBe(markdown);
    });
  }
});

describe('merge tags through Markdown', () => {
  it('reads back the delimiters it writes', () => {
    // The writer emitted `{{key}}` and the reader looked for `{key}`, so every
    // save-and-load cycle added a pair of braces: `{{name}}` became `{` + tag + `}`,
    // then `{{{name}}}`, and the backend stopped substituting it.
    const source = doc('<p>Hi {first_name}</p>');
    const markdown = documentToMarkdown(source);

    expect(markdown).toBe('Hi {{first_name}}');
    expect(round(markdown)).toBe(markdown);
    expect(markdownToDocument(markdown).content[0]).toMatchObject({
      content: [{ type: 'text' }, { type: 'mergeTag', key: 'first_name' }],
    });
  });

  it('follows a custom syntax in both directions', () => {
    const source = doc('<p>Hi {first_name}</p>');
    const options = { mergeTagSyntax: '[[key]]' };
    const markdown = documentToMarkdown(source, options);

    expect(markdown).toContain('[[first_name]]');
    expect(markdownToDocument(markdown, options).content[0]).toMatchObject({
      content: [{ type: 'text' }, { type: 'mergeTag', key: 'first_name' }],
    });
  });
});
