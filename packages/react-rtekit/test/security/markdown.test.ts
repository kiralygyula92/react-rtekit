import { describe, expect, it } from 'vitest';
import { markdownToDocument, markdownToHtml } from '../../src/core/serialize/markdown.js';
import { documentToHtml } from '../../src/core/serialize/to-html.js';

/**
 * `markdownToHtml` is a public export whose output is HTML, so it has to be safe to
 * render on its own — not only when `markdownToDocument` happens to sanitize it again.
 */
describe('markdownToHtml output is safe to render', () => {
  it.each([
    ['[x](javascript:alert(1))'],
    ['[x](JAVASCRIPT:alert(1))'],
    ['[x](vbscript:msgbox(1))'],
    ['[x](data:text/html,hello)'],
    ['![x](javascript:alert(1))'],
    ['![x](data:image/svg+xml,hello)'],
  ])('refuses a script-capable destination: %s', (markdown) => {
    const html = markdownToHtml(markdown);
    expect(html).not.toMatch(/(href|src)=/);
    expect(html).toContain('x');
  });

  it('cannot break out of an image attribute through the alt text', () => {
    const html = markdownToHtml('![a" onerror="alert(1)](https://example.com/i.png)');
    expect(html).toBe(
      '<p><img src="https://example.com/i.png" alt="a&quot; onerror=&quot;alert(1)"></p>',
    );
  });

  it('cannot break out of an image attribute through the URL', () => {
    const html = markdownToHtml('![x](x"onerror="alert(1))');
    expect(html).not.toMatch(/"\s*onerror=/);
  });

  it('keeps an ordinary image and a raster data URL', () => {
    expect(markdownToHtml('![logo](https://example.com/logo.png "Logo")')).toBe(
      '<p><img src="https://example.com/logo.png" alt="logo" title="Logo"></p>',
    );
    expect(markdownToHtml('![dot](data:image/png;base64,iVBORw0KGgo=)')).toContain(
      'src="data:image/png;base64,iVBORw0KGgo="',
    );
  });
});

/*
 * Unclosed delimiters used to make every opener scan to the end of the text, which is
 * quadratic: 200 kB of any of these took tens of seconds, and `markdownToDocument` runs
 * the same code on a controlled `value`. The bound is generous — the linear version
 * takes a few milliseconds — so it fails on the algorithm, not on a slow CI machine.
 */
describe('markdownToHtml runs in linear time on adversarial input', () => {
  it.each([
    ['unclosed **', '**a '.repeat(50_000)],
    ['unclosed __', ' __a'.repeat(50_000)],
    ['unclosed ~~', '~~a '.repeat(50_000)],
    ['unmatched [', `${'['.repeat(100_000)}${']('.repeat(50_000)}`],
    ['unmatched ![', `${'!['.repeat(50_000)}${']('.repeat(50_000)}`],
  ])('%s', (_name, input) => {
    const started = performance.now();
    markdownToHtml(input);
    expect(performance.now() - started).toBeLessThan(1_000);
  });
});

describe('Markdown link destinations', () => {
  it('escapes an ampersand once, so a query string survives', () => {
    const markdown = '[q](https://example.com/search?a=1&b=2)';
    const expected = '<a href="https://example.com/search?a=1&amp;b=2">q</a>';
    expect(markdownToHtml(markdown)).toContain(expected);
    expect(documentToHtml(markdownToDocument(markdown))).toContain(expected);
  });

  it('keeps balanced parentheses inside the URL', () => {
    expect(markdownToHtml('[Foo](https://en.wikipedia.org/wiki/Foo_(bar))')).toBe(
      '<p><a href="https://en.wikipedia.org/wiki/Foo_(bar)">Foo</a></p>',
    );
  });

  it('closes strong emphasis at the nearest opener, as CommonMark does', () => {
    expect(markdownToHtml('**a **b**')).toBe('<p>**a <strong>b</strong></p>');
    expect(markdownToHtml('**x *y* z**')).toBe('<p><strong>x <em>y</em> z</strong></p>');
  });

  it('still ends the link at an unbalanced closing parenthesis', () => {
    expect(markdownToHtml('([x](https://example.com))')).toBe(
      '<p>(<a href="https://example.com">x</a>)</p>',
    );
  });
});
