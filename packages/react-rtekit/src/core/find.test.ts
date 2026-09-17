import { describe, expect, it } from 'vitest';
import { htmlToDocument } from './serialize/from-html.js';
import { documentToHtml } from './serialize/to-html.js';
import { buildFindPattern, blockText, findMatches, replaceMatches } from './find.js';

/**
 * Find and replace.
 *
 * The interesting cases are the ones the DOM gets wrong: a match that straddles a
 * formatting boundary, a regex the author has not finished typing, and a replacement
 * that must not cut a merge tag in half.
 */

const doc = (html: string) => htmlToDocument(html);

describe('buildFindPattern', () => {
  it('escapes a literal query', () => {
    const pattern = buildFindPattern('a.b');
    expect(pattern?.test('a.b')).toBe(true);
    expect(buildFindPattern('a.b')?.test('axb')).toBe(false);
  });

  it('honours matchCase', () => {
    expect(buildFindPattern('Water')?.flags).toContain('i');
    expect(buildFindPattern('Water', { matchCase: true })?.flags).not.toContain('i');
  });

  it('wraps a whole-word query in boundaries', () => {
    const pattern = buildFindPattern('test', { wholeWord: true });
    expect(pattern?.test('a test here')).toBe(true);
    pattern!.lastIndex = 0;
    expect(pattern?.test('attestation')).toBe(false);
  });

  it('returns null for a query that does not compile', () => {
    // Half-typed patterns happen on every keystroke of a regex search.
    expect(buildFindPattern('(unclosed', { regex: true })).toBeNull();
    expect(buildFindPattern('')).toBeNull();
  });
});

describe('blockText', () => {
  it('reads a paragraph across formatting boundaries', () => {
    const block = doc('<p><strong>wa</strong>ter test</p>').content[0]!;
    expect(blockText(block)).toBe('water test');
  });

  it('renders a merge tag as its stored form', () => {
    const block = doc('<p>Hi {first_name}</p>').content[0]!;
    expect(blockText(block)).toBe('Hi {first_name}');
  });

  it('joins list items with newlines', () => {
    const block = doc('<ul><li>one</li><li>two</li></ul>').content[0]!;
    expect(blockText(block)).toBe('one\ntwo');
  });
});

describe('findMatches', () => {
  it('finds a match that spans two formatting runs', () => {
    const matches = findMatches(doc('<p><strong>wa</strong>ter</p>'), 'water');
    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({ block: 0, start: 0, end: 5 });
  });

  it('counts every occurrence, in reading order', () => {
    const matches = findMatches(doc('<p>test one</p><p>test two</p><p>no match</p>'), 'test');
    expect(matches.map((match) => match.block)).toEqual([0, 1]);
  });

  it('is case-insensitive by default', () => {
    expect(findMatches(doc('<p>Water WATER water</p>'), 'water')).toHaveLength(3);
    expect(findMatches(doc('<p>Water WATER water</p>'), 'water', { matchCase: true })).toHaveLength(1);
  });

  it('supports a regular expression when asked', () => {
    const matches = findMatches(doc('<p>pH 7.4 and 7.8</p>'), String.raw`\d\.\d`, { regex: true });
    expect(matches.map((match) => match.text)).toEqual(['7.4', '7.8']);
  });

  it('does not loop on a zero-length match', () => {
    expect(findMatches(doc('<p>abc</p>'), 'x*', { regex: true })).toEqual([]);
  });

  it('searches inside list items and code blocks', () => {
    expect(findMatches(doc('<ul><li>needle</li></ul>'), 'needle')).toHaveLength(1);
    expect(findMatches(doc('<pre><code>needle</code></pre>'), 'needle')).toHaveLength(1);
  });
});

describe('replaceMatches', () => {
  it('replaces one match by index', () => {
    const { document, replaced } = replaceMatches(
      doc('<p>test and test</p>'),
      'test',
      'done',
      {},
      0,
    );
    expect(replaced).toBe(1);
    expect(documentToHtml(document)).toBe('<p>done and test</p>');
  });

  it('replaces every match', () => {
    const { document, replaced } = replaceMatches(doc('<p>a a a</p>'), 'a', 'b', {}, 'all');
    expect(replaced).toBe(3);
    expect(documentToHtml(document)).toBe('<p>b b b</p>');
  });

  it('keeps the formatting of the run the match starts in', () => {
    const { document } = replaceMatches(doc('<p><strong>wa</strong>ter</p>'), 'water', 'ice', {}, 'all');
    expect(documentToHtml(document)).toBe('<p><strong>ice</strong></p>');
  });

  it('leaves surrounding text alone', () => {
    const { document } = replaceMatches(doc('<p>before test after</p>'), 'test', 'X', {}, 'all');
    expect(documentToHtml(document)).toBe('<p>before X after</p>');
  });

  it('never cuts a merge tag in half', () => {
    // The same word inside the tag and outside it: only the one outside is text.
    const source = doc('<p>first {first_name}</p>');
    const { document, replaced } = replaceMatches(source, 'first', 'last', {}, 'all');

    // One replacement, not two: the match inside the tag is found and then skipped,
    // and the count has to report what was done rather than what was found.
    expect(replaced).toBe(1);
    // The tag is one atom, so its key survives the replacement whole.
    expect(documentToHtml(document)).toContain('{first_name}');
    expect(documentToHtml(document)).toContain('last ');
  });

  it('replaces inside a list item', () => {
    const { document } = replaceMatches(doc('<ul><li>one</li><li>two</li></ul>'), 'two', '2', {}, 'all');
    expect(documentToHtml(document)).toContain('<li>2</li>');
    expect(documentToHtml(document)).toContain('<li>one</li>');
  });

  it('replaces inside a code block without touching its language', () => {
    const source = doc('<pre data-language="ts"><code>const x = 1;</code></pre>');
    const { document } = replaceMatches(source, 'x', 'y', {}, 'all');
    expect(documentToHtml(document)).toContain('const y = 1;');
  });

  it('returns the original document when nothing matches', () => {
    const source = doc('<p>nothing here</p>');
    const result = replaceMatches(source, 'absent', 'x');
    expect(result.replaced).toBe(0);
    expect(result.document).toBe(source);
  });

  it('does not mutate the input', () => {
    const source = doc('<p>test</p>');
    const before = JSON.stringify(source);
    replaceMatches(source, 'test', 'done', {}, 'all');
    expect(JSON.stringify(source)).toBe(before);
  });
});
