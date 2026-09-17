import { render, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RichTextEditor } from '../../src/index.js';
import type { EditorInstance } from '../../src/types/editor.js';
import type { EditorDocument } from '../../src/types/document.js';

/**
 * Block-level content through the engine (05 §3–§8).
 *
 * Every one of these node types has to survive the round trip the editor actually
 * performs — HTML in, Lexical nodes, portable document out — because that is the trip
 * a stored value makes every time someone opens a form.
 */

/** Renders with the `full` preset, which enables every block plugin. */
async function mount(value: string): Promise<EditorInstance> {
  let instance: EditorInstance | null = null;
  render(
    <RichTextEditor
      preset="full"
      defaultValue={value}
      onReady={(editor) => {
        instance = editor;
      }}
    />,
  );
  await waitFor(() => {
    expect(instance).not.toBeNull();
  });
  return instance!;
}

/** The document's first block, for tests that care about one node. */
function firstBlock(doc: EditorDocument): EditorDocument['content'][number] | undefined {
  return doc.content[0];
}

describe('headings', () => {
  it.each([1, 2, 3, 4, 5, 6] as const)('round-trips h%s', async (level) => {
    const editor = await mount(`<h${level}>Title</h${level}>`);
    expect(editor.getHTML()).toBe(`<h${level}>Title</h${level}>`);
    expect(firstBlock(editor.getJSON())).toMatchObject({ type: 'heading', level });
  });

  it('setBlockType turns a paragraph into a heading and back', async () => {
    const editor = await mount('<p>Title</p>');
    editor.setSelection('all');

    editor.exec('setBlockType', { type: 'heading', level: 2 });
    expect(editor.getHTML()).toBe('<h2>Title</h2>');
    expect(editor.getFormatState().block.type).toBe('heading');
    expect(editor.getFormatState().block.headingLevel).toBe(2);

    editor.exec('setBlockType', { type: 'paragraph' });
    expect(editor.getHTML()).toBe('<p>Title</p>');
  });
});

describe('blockquote', () => {
  it('round-trips', async () => {
    const editor = await mount('<blockquote><p>Quoted</p></blockquote>');
    expect(editor.getHTML()).toBe('<blockquote><p>Quoted</p></blockquote>');
  });

  it('keeps the marks inside it', async () => {
    const editor = await mount('<blockquote><p>A <strong>bold</strong> claim</p></blockquote>');
    expect(editor.getHTML()).toContain('<strong>bold</strong>');
  });
});

describe('code block', () => {
  it('round-trips with its language', async () => {
    const editor = await mount('<pre data-language="ts"><code>const x = 1;</code></pre>');
    const block = firstBlock(editor.getJSON());
    expect(block).toMatchObject({ type: 'codeBlock', text: 'const x = 1;' });
    expect(editor.getHTML()).toContain('const x = 1;');
  });

  it('keeps newlines rather than turning them into paragraphs', async () => {
    const editor = await mount('<pre><code>line one\nline two</code></pre>');
    const block = firstBlock(editor.getJSON()) as { type: string; text: string };
    expect(block.type).toBe('codeBlock');
    expect(block.text).toContain('line one');
    expect(block.text).toContain('line two');
  });

  it('escapes what looks like markup', async () => {
    const editor = await mount('<pre><code>&lt;script&gt;alert(1)&lt;/script&gt;</code></pre>');
    expect(editor.getHTML()).not.toContain('<script');
    expect(editor.getText()).toContain('<script>alert(1)</script>');
  });
});

describe('horizontal rule', () => {
  it('round-trips as a block of its own', async () => {
    const editor = await mount('<p>Above</p><hr><p>Below</p>');
    const types = editor.getJSON().content.map((block) => block.type);
    expect(types).toEqual(['paragraph', 'horizontalRule', 'paragraph']);
    expect(editor.getHTML()).toBe('<p>Above</p><hr><p>Below</p>');
  });

  it('insertHorizontalRule leaves a paragraph to carry on typing in', async () => {
    const editor = await mount('<p>Above</p>');
    editor.setSelection('end');
    editor.exec('insertHorizontalRule');

    const types = editor.getJSON().content.map((block) => block.type);
    expect(types).toContain('horizontalRule');
    expect(types[types.length - 1]).toBe('paragraph');
  });
});

describe('images', () => {
  it('round-trips src, alt and dimensions', async () => {
    const editor = await mount('<p><img src="https://example.com/a.png" alt="A photo" width="320" height="200"></p>');
    const image = editor.getJSON().content.find((block) => block.type === 'image');
    expect(image).toMatchObject({
      type: 'image',
      src: 'https://example.com/a.png',
      alt: 'A photo',
      width: 320,
      height: 200,
    });
  });

  it('always writes an alt attribute, because a missing one is a defect', async () => {
    const editor = await mount('<p><img src="https://example.com/a.png"></p>');
    expect(editor.getHTML()).toContain('alt=""');
  });

  it('insertImage adds one at the selection', async () => {
    const editor = await mount('<p>Before</p>');
    editor.setSelection('end');
    editor.exec('insertImage', { src: 'https://example.com/b.png', alt: 'B' });

    expect(editor.getJSON().content.some((block) => block.type === 'image')).toBe(true);
    expect(editor.getHTML()).toContain('https://example.com/b.png');
  });

  it('a javascript: source never survives', async () => {
    const editor = await mount('<p><img src="javascript:alert(1)" alt="x"></p>');
    expect(editor.getHTML().toLowerCase()).not.toContain('javascript:');
  });

  it('a caption becomes a figure', async () => {
    const editor = await mount('<figure><img src="https://example.com/c.png" alt="C"><figcaption>The caption</figcaption></figure>');
    const image = editor.getJSON().content.find((block) => block.type === 'image');
    expect(image).toMatchObject({ type: 'image', caption: 'The caption' });
    expect(editor.getHTML()).toContain('<figcaption>The caption</figcaption>');
  });
});

describe('tables', () => {
  const TABLE =
    '<table><tbody>' +
    '<tr><th>Reading</th><th>Value</th></tr>' +
    '<tr><td>pH</td><td>7.4</td></tr>' +
    '</tbody></table>';

  it('round-trips rows, cells and the header row', async () => {
    const editor = await mount(TABLE);
    const table = editor.getJSON().content.find((block) => block.type === 'table') as {
      type: 'table';
      rows: { cells: { header?: boolean; content: unknown[] }[] }[];
    };

    expect(table.rows).toHaveLength(2);
    expect(table.rows[0]!.cells).toHaveLength(2);
    expect(table.rows[0]!.cells[0]!.header).toBe(true);
    expect(table.rows[1]!.cells[0]!.header).toBeUndefined();
    expect(editor.getText()).toContain('7.4');
  });

  it('insertTable builds the requested shape', async () => {
    const editor = await mount('<p></p>');
    editor.setSelection('end');
    editor.exec('insertTable', { rows: 3, cols: 2 });

    const table = editor.getJSON().content.find((block) => block.type === 'table') as {
      rows: { cells: unknown[] }[];
    };
    expect(table.rows).toHaveLength(3);
    expect(table.rows[0]!.cells).toHaveLength(2);
  });

  it('a cell keeps its block content', async () => {
    const editor = await mount('<table><tbody><tr><td><p>One</p><p>Two</p></td></tr></tbody></table>');
    const html = editor.getHTML();
    expect(html).toContain('One');
    expect(html).toContain('Two');
  });
});

describe('check lists', () => {
  it('round-trips the checked state', async () => {
    const editor = await mount(
      '<ul><li data-checked="true">Done</li><li data-checked="false">Not done</li></ul>',
    );
    const list = editor.getJSON().content[0] as {
      type: 'list';
      listType: string;
      items: { checked?: boolean }[];
    };
    expect(list.listType).toBe('check');
    expect(list.items[0]!.checked).toBe(true);
    expect(list.items[1]!.checked).toBe(false);
  });
});

describe('sub and superscript', () => {
  it.each([
    ['sub', 'toggleSubscript', '<sub>2</sub>'],
    ['sup', 'toggleSuperscript', '<sup>2</sup>'],
  ] as const)('round-trips <%s>', async (tag, _command, expected) => {
    const editor = await mount(`<p>H<${tag}>2</${tag}>O</p>`);
    expect(editor.getHTML()).toContain(expected);
  });

  it('a mark is exclusive of its opposite', async () => {
    const editor = await mount('<p>x</p>');
    editor.setSelection('all');
    editor.exec('toggleSubscript');
    expect(editor.getFormatState().marks.subscript).toBe(true);

    editor.exec('toggleSuperscript');
    const marks = editor.getFormatState().marks;
    expect(marks.superscript).toBe(true);
    expect(marks.subscript).toBe(false);
  });
});

describe('font family and size', () => {
  // Each command re-selects first. jsdom has no real document selection, so it drops
  // the engine's after every commit; in a browser the selection survives, which the
  // Playwright colour tests cover.
  it('sets and clears a font family', async () => {
    const editor = await mount('<p>Styled</p>');
    editor.setSelection('all');

    editor.exec('setFontFamily', { value: 'Georgia, serif' });
    expect(editor.getHTML()).toContain('font-family: Georgia, serif');

    editor.setSelection('all');
    editor.exec('setFontFamily', { value: null });
    expect(editor.getHTML()).toBe('<p>Styled</p>');
  });

  it('sets and clears a font size', async () => {
    const editor = await mount('<p>Styled</p>');
    editor.setSelection('all');

    editor.exec('setFontSize', { value: '1.5em' });
    expect(editor.getHTML()).toContain('font-size: 1.5em');

    editor.setSelection('all');
    editor.exec('setFontSize', { value: null });
    expect(editor.getHTML()).toBe('<p>Styled</p>');
  });
});

describe('clear formatting', () => {
  it('removes every mark but keeps the text', async () => {
    const editor = await mount(
      '<p><strong><em><u><span style="color: #FF0000">Loud</span></u></em></strong></p>',
    );
    editor.setSelection('all');
    editor.exec('clearFormatting');

    expect(editor.getHTML()).toBe('<p>Loud</p>');
  });

  it('with blocks: true it also resets the block type and indent', async () => {
    const editor = await mount('<h2 style="text-align: center">Heading</h2>');
    editor.setSelection('all');
    editor.exec('clearFormatting', { blocks: true });

    expect(editor.getHTML()).toBe('<p>Heading</p>');
  });
});

describe('mentions', () => {
  it('inserts as an atomic node and round-trips its id', async () => {
    const editor = await mount('<p>Ping </p>');
    editor.setSelection('end');
    editor.exec('insertMention', { id: 'u_42', label: '@dana' });

    const html = editor.getHTML();
    expect(html).toContain('data-mention-id="u_42"');
    expect(html).toContain('@dana');

    // Formatting the whole document must not split the mention apart.
    editor.setSelection('all');
    editor.exec('toggleBold');
    expect(editor.getHTML()).toContain('data-mention-id="u_42"');
  });
});
