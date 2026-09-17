import { describe, expect, it } from 'vitest';
import type { EditorDocument } from '../../types/document.js';
import { documentToHtml } from '../../core/serialize/to-html.js';
import { KEY_ATTRIBUTE, renderTree } from './render.js';
import { DocumentTree, ROOT_KEY } from './tree.js';

/**
 * The renderer and the serializer must agree.
 *
 * `<RteContentView>` renders stored HTML and the editor renders the live model; the
 * library's promise is that they look the same. These tests are that promise, executable:
 * for each document, the DOM the editor builds must serialize to exactly what
 * `documentToHtml` writes. Drift in either direction fails here rather than showing up as
 * a styling difference somebody notices later.
 */

/** The rendered DOM as HTML, with the bookkeeping attribute taken back off. */
function renderToHtml(doc: EditorDocument): string {
  const tree = DocumentTree.fromDocument(doc);
  const container = document.createElement('div');
  renderTree(tree, container);
  for (const element of container.querySelectorAll(`[${KEY_ATTRIBUTE}]`)) {
    element.removeAttribute(KEY_ATTRIBUTE);
  }
  return container.innerHTML;
}

const doc = (...content: EditorDocument['content']): EditorDocument => ({
  type: 'doc',
  version: 1,
  content,
});

const CASES: [name: string, doc: EditorDocument][] = [
  ['a paragraph', doc({ type: 'paragraph', content: [{ type: 'text', text: 'hello' }] })],
  ['an empty paragraph', doc({ type: 'paragraph', content: [] })],
  [
    'every boolean mark',
    doc({
      type: 'paragraph',
      content: [
        { type: 'text', text: 'b', marks: [{ type: 'bold' }] },
        { type: 'text', text: 'i', marks: [{ type: 'italic' }] },
        { type: 'text', text: 'u', marks: [{ type: 'underline' }] },
        { type: 'text', text: 's', marks: [{ type: 'strike' }] },
        { type: 'text', text: 'c', marks: [{ type: 'code' }] },
        { type: 'text', text: 'sub', marks: [{ type: 'subscript' }] },
        { type: 'text', text: 'sup', marks: [{ type: 'superscript' }] },
      ],
    }),
  ],
  [
    'stacked marks',
    doc({
      type: 'paragraph',
      content: [{ type: 'text', text: 'both', marks: [{ type: 'bold' }, { type: 'italic' }] }],
    }),
  ],
  [
    'valued marks',
    doc({
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'coloured',
          marks: [
            { type: 'color', value: '#ff0000' },
            { type: 'fontSize', value: '18px' },
          ],
        },
      ],
    }),
  ],
  [
    'a valued mark under a boolean one',
    doc({
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'both',
          marks: [{ type: 'bold' }, { type: 'backgroundColor', value: 'yellow' }],
        },
      ],
    }),
  ],
  ['a heading', doc({ type: 'heading', level: 3, content: [{ type: 'text', text: 'title' }] })],
  [
    'an aligned, indented paragraph',
    doc({
      type: 'paragraph',
      align: 'center',
      indent: 2,
      content: [{ type: 'text', text: 'middle' }],
    }),
  ],
  [
    'a link',
    doc({
      type: 'paragraph',
      content: [
        {
          type: 'link',
          href: 'https://example.com',
          target: '_blank',
          content: [{ type: 'text', text: 'there' }],
        },
      ],
    }),
  ],
  [
    'a line break',
    doc({
      type: 'paragraph',
      content: [
        { type: 'text', text: 'one' },
        { type: 'lineBreak' },
        { type: 'text', text: 'two' },
      ],
    }),
  ],
  [
    'a bullet list',
    doc({
      type: 'list',
      listType: 'bullet',
      items: [
        { type: 'listItem', content: [{ type: 'text', text: 'one' }] },
        { type: 'listItem', content: [{ type: 'text', text: 'two' }] },
      ],
    }),
  ],
  [
    'an ordered list that does not start at one',
    doc({
      type: 'list',
      listType: 'ordered',
      start: 3,
      style: 'a',
      items: [{ type: 'listItem', content: [{ type: 'text', text: 'three' }] }],
    }),
  ],
  [
    'a check list',
    doc({
      type: 'list',
      listType: 'check',
      items: [
        { type: 'listItem', checked: true, content: [{ type: 'text', text: 'done' }] },
        { type: 'listItem', checked: false, content: [{ type: 'text', text: 'todo' }] },
      ],
    }),
  ],
  [
    'a nested list',
    doc({
      type: 'list',
      listType: 'bullet',
      items: [
        {
          type: 'listItem',
          content: [{ type: 'text', text: 'outer' }],
          children: [
            {
              type: 'list',
              listType: 'bullet',
              items: [{ type: 'listItem', content: [{ type: 'text', text: 'inner' }] }],
            },
          ],
        },
      ],
    }),
  ],
  [
    'a blockquote',
    doc({
      type: 'blockquote',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'quoted' }] }],
    }),
  ],
  ['a code block', doc({ type: 'codeBlock', language: 'ts', text: 'const a = 1;' })],
  ['a code block with no language', doc({ type: 'codeBlock', text: 'plain' })],
  ['a divider', doc({ type: 'horizontalRule' })],
  ['an image', doc({ type: 'image', src: 'https://example.com/a.png', alt: 'a', width: 40 })],
  ['a decorative image', doc({ type: 'image', src: 'https://example.com/a.png' })],
  [
    'an image with a caption',
    doc({ type: 'image', src: 'https://example.com/a.png', alt: 'a', caption: 'below' }),
  ],
  [
    'a table',
    doc({
      type: 'table',
      rows: [
        {
          type: 'tableRow',
          cells: [
            {
              type: 'tableCell',
              header: true,
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'h' }] }],
            },
            {
              type: 'tableCell',
              colSpan: 2,
              align: 'right',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'c' }] }],
            },
          ],
        },
      ],
    }),
  ],
  [
    'a mention',
    doc({
      type: 'paragraph',
      content: [{ type: 'mention', id: 'u_1', label: 'Dana' }],
    }),
  ],
  [
    'a merge tag',
    doc({
      type: 'paragraph',
      content: [{ type: 'mergeTag', key: 'first_name' }],
    }),
  ],
  ['an emoji', doc({ type: 'paragraph', content: [{ type: 'emoji', char: '\u{1F44D}' }] })],
  [
    'an empty text run, which renders to nothing',
    doc({
      type: 'paragraph',
      content: [
        { type: 'text', text: '' },
        { type: 'text', text: 'kept' },
      ],
    }),
  ],
];

describe('the renderer writes the same DOM the serializer writes', () => {
  for (const [name, fixture] of CASES) {
    it(name, () => {
      expect(renderToHtml(fixture)).toBe(documentToHtml(fixture));
    });
  }
});

describe('the key index', () => {
  const fixture = doc(
    { type: 'paragraph', content: [{ type: 'text', text: 'hello', marks: [{ type: 'bold' }] }] },
    {
      type: 'list',
      listType: 'bullet',
      items: [{ type: 'listItem', content: [{ type: 'text', text: 'one' }] }],
    },
  );

  it('indexes every node that rendered', () => {
    const tree = DocumentTree.fromDocument(fixture);
    const container = document.createElement('div');
    const index = renderTree(tree, container);
    // Every key in the tree except the empty ones, plus the root.
    for (const key of [ROOT_KEY, ...tree.children(ROOT_KEY)]) {
      expect(index.byKey.has(key)).toBe(true);
    }
  });

  it('maps the container to the root', () => {
    const tree = DocumentTree.fromDocument(fixture);
    const container = document.createElement('div');
    const index = renderTree(tree, container);
    expect(index.byKey.get(ROOT_KEY)).toBe(container);
    expect(index.byNode.get(container)).toBe(ROOT_KEY);
  });

  it('maps every element of a mark stack back to the one text node', () => {
    const tree = DocumentTree.fromDocument(fixture);
    const container = document.createElement('div');
    const index = renderTree(tree, container);
    const strong = container.querySelector('strong')!;
    const text = strong.firstChild!;
    expect(index.byNode.get(strong)).toBe(index.byNode.get(text));
  });

  it('records the text node a run’s characters live in', () => {
    const tree = DocumentTree.fromDocument(fixture);
    const container = document.createElement('div');
    const index = renderTree(tree, container);
    const paragraph = tree.children(ROOT_KEY)[0]!;
    const run = tree.children(paragraph)[0]!;
    expect(index.textByKey.get(run)?.data).toBe('hello');
  });

  it('stamps the key attribute on every rendered element', () => {
    const tree = DocumentTree.fromDocument(fixture);
    const container = document.createElement('div');
    renderTree(tree, container);
    for (const element of container.querySelectorAll('p, ul, li, strong')) {
      expect(element.getAttribute(KEY_ATTRIBUTE)).toBeTruthy();
    }
  });

  it('a re-render replaces rather than appends', () => {
    const tree = DocumentTree.fromDocument(fixture);
    const container = document.createElement('div');
    renderTree(tree, container);
    const first = container.innerHTML;
    renderTree(tree, container);
    expect(container.innerHTML).toBe(first);
  });
});
