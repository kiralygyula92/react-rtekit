import { render, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RichTextEditor } from '../../src/index.js';
import type { EditorInstance } from '../../src/types/editor.js';
import type { EditorDocument } from '../../src/types/document.js';

/**
 * A document is a content boundary like HTML is.
 *
 * `valueFormat="json"` reads one from storage and `value` accepts one directly, and the
 * engine's tree trusts what it holds — so a document has to be sanitized on the way in,
 * by the same profile as HTML, or a stored `html` node or `javascript:` link runs in the
 * editor.
 */
const hostile = {
  type: 'doc',
  version: 1,
  content: [
    { type: 'html', html: '<img src="x" onerror="alert(1)"><b>kept?</b>' },
    {
      type: 'paragraph',
      content: [
        { type: 'link', href: 'javascript:alert(1)', content: [{ type: 'text', text: 'click' }] },
        { type: 'text', text: ' and ' },
        {
          type: 'text',
          text: 'tinted',
          marks: [{ type: 'color', value: 'red;background:url(https://evil.example/leak)' }],
        },
      ],
    },
    { type: 'image', src: 'javascript:alert(1)', alt: 'pic' },
  ],
} as unknown as EditorDocument;

async function mount(props: Parameters<typeof RichTextEditor>[0]): Promise<EditorInstance> {
  let instance: EditorInstance | null = null;
  render(
    <RichTextEditor
      {...props}
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

function content(): HTMLElement {
  const element = document.querySelector<HTMLElement>('.rte-content');
  if (!element) throw new Error('no content element');
  return element;
}

function expectClean(element: HTMLElement): void {
  expect(element.querySelector('[onerror], [onclick], [onload]')).toBeNull();
  for (const link of element.querySelectorAll('a')) {
    expect(link.getAttribute('href') ?? '').not.toMatch(/^\s*javascript:/i);
  }
  for (const image of element.querySelectorAll('img')) {
    expect(image.getAttribute('src') ?? '').not.toMatch(/^\s*javascript:/i);
  }
  expect(element.innerHTML).not.toContain('evil.example');
}

describe('documents are sanitized on the way into the editor', () => {
  it('as the initial value, in the json format', async () => {
    await mount({ valueFormat: 'json', defaultValue: JSON.stringify(hostile) });
    expectClean(content());
    expect(content().textContent).toContain('click');
  });

  it('as a controlled value object', async () => {
    await mount({ valueFormat: 'json', value: hostile });
    expectClean(content());
  });

  it('through setContent and insertContent', async () => {
    const editor = await mount({ defaultValue: '<p>start</p>' });
    editor.setContent(hostile);
    expectClean(content());
    editor.insertContent(hostile);
    expectClean(content());
  });

  it('reports what it removed, as it does for HTML', async () => {
    const violations: string[] = [];
    await mount({
      valueFormat: 'json',
      defaultValue: JSON.stringify(hostile),
      handlers: {
        onSanitizeViolation: ({ violation }, next) => {
          violations.push(violation.reason);
          void next();
        },
      },
    });
    expect(violations.length).toBeGreaterThan(0);
  });

  it('leaves an ordinary document exactly as it was', async () => {
    const plain = {
      type: 'doc',
      version: 1,
      content: [
        { type: 'heading', level: 2, content: [{ type: 'text', text: 'Title' }] },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Bold', marks: [{ type: 'bold' }] },
            { type: 'text', text: ' and ' },
            {
              type: 'link',
              href: 'https://example.com/?a=1&b=2',
              content: [{ type: 'text', text: 'a link' }],
            },
          ],
        },
      ],
    } as unknown as EditorDocument;
    const editor = await mount({ valueFormat: 'json', value: plain, enableHeadings: true });
    expect(editor.getJSON()).toEqual(plain);
  });
});
