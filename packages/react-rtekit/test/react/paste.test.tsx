import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RichTextEditor } from '../../src/index.js';
import type { EditorInstance } from '../../src/types/editor.js';
import { officeFixture } from '../fixtures/office.js';
import { quillFixture } from '../fixtures/quill.js';
import { XSS_PAYLOADS } from '../fixtures/xss.js';

/**
 * The paste pipeline (fixes R19 and R20).
 *
 * The bug this exists for: an engine will happily import the clipboard's HTML with
 * its own DOM importer, which never sees our sanitizer. Every paste has to come back
 * through `insertHTML`, so the same rules apply to pasted content as to a `value`.
 */

async function mount(props: Parameters<typeof RichTextEditor>[0] = {}): Promise<EditorInstance> {
  let instance: EditorInstance | null = null;
  render(
    <RichTextEditor
      preset="standard"
      defaultValue="<p></p>"
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

/** A clipboard event carrying the given payloads, as a browser would deliver it. */
function pasteEvent(payload: { html?: string; text?: string; files?: File[] }): ClipboardEvent {
  const data = {
    getData: (type: string) =>
      type === 'text/html' ? (payload.html ?? '') : (payload.text ?? ''),
    files: payload.files ?? [],
    types: ['text/html', 'text/plain'],
  };
  const event = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent;
  Object.defineProperty(event, 'clipboardData', { value: data });
  return event;
}

/** Dispatches a paste onto the editable surface. */
function paste(editor: EditorInstance, payload: Parameters<typeof pasteEvent>[0]): void {
  editor.focus('end');
  editor.setSelection('end');
  editor.engine.contentElement.dispatchEvent(pasteEvent(payload));
}

describe('pasted HTML goes through the sanitizer', () => {
  it.each(XSS_PAYLOADS.slice(0, 10).map((entry) => [entry.id, entry.html] as const))(
    'neutralizes %s',
    async (_id, html) => {
      const editor = await mount();
      paste(editor, { html });

      await waitFor(() => {
        const output = editor.getHTML().toLowerCase();
        expect(output).not.toContain('<script');
        expect(output).not.toContain('onerror');
        expect(output).not.toContain('javascript:');
      });
    },
  );

  it('keeps the words while dropping the attack', async () => {
    const editor = await mount();
    paste(editor, { html: '<p>Hello<script>alert(1)</script> world</p>' });

    await waitFor(() => {
      expect(editor.getText()).toContain('Hello');
    });
    expect(editor.getHTML()).not.toContain('script');
  });
});

describe('office and legacy sources are cleaned (R20)', () => {
  it('a Word paste loses its mso markup', async () => {
    const editor = await mount();
    paste(editor, { html: officeFixture('word-paragraphs').html });

    await waitFor(() => {
      expect(editor.getText()).toContain('First paragraph');
    });
    const html = editor.getHTML();
    expect(html).not.toContain('mso-');
    expect(html).not.toContain('MsoNormal');
  });

  it('a Google Docs paste keeps its structure', async () => {
    const editor = await mount();
    paste(editor, { html: officeFixture('gdocs-paragraphs').html });

    await waitFor(() => {
      expect(editor.getHTML()).toContain('<p>');
    });
    expect(editor.getHTML()).not.toContain('docs-internal-guid');
  });

  it('legacy Quill markup keeps its alignment', async () => {
    const editor = await mount();
    paste(editor, { html: quillFixture('align-classes').html });

    await waitFor(() => {
      expect(editor.getHTML()).toContain('center');
    });
  });
});

describe('paste modes', () => {
  it('text drops every tag', async () => {
    const editor = await mount({ pasteMode: 'text' });
    paste(editor, { html: '<p><strong>bold</strong> text</p>', text: 'bold text' });

    await waitFor(() => {
      expect(editor.getText()).toContain('bold text');
    });
    expect(editor.getHTML()).not.toContain('<strong>');
  });

  it('clean keeps the structure and drops the styling', async () => {
    const editor = await mount({ pasteMode: 'clean' });
    paste(editor, {
      html: '<ul><li style="color: #FF0000"><strong>One</strong></li><li>Two</li></ul>',
    });

    await waitFor(() => {
      expect(editor.getHTML()).toContain('<li>');
    });
    const html = editor.getHTML();
    expect(html).toContain('<strong>One</strong>');
    expect(html).not.toContain('#FF0000');
    expect(html).not.toContain('color:');
  });

  it('rich keeps what the profile allows', async () => {
    const editor = await mount({ pasteMode: 'rich' });
    paste(editor, { html: '<p style="text-align: center"><strong>Kept</strong></p>' });

    await waitFor(() => {
      expect(editor.getHTML()).toContain('<strong>Kept</strong>');
    });
  });
});

describe('the onPaste middleware', () => {
  it('sees the payload and its detected source', async () => {
    const onPaste = vi.fn((_ctx: unknown, next: () => void) => {
      next();
    });
    const editor = await mount({ handlers: { onPaste } });
    paste(editor, { html: officeFixture('word-paragraphs').html });

    await waitFor(() => {
      expect(onPaste).toHaveBeenCalled();
    });
    expect(onPaste.mock.calls[0]![0]).toMatchObject({ source: 'word' });
  });

  it('can veto the paste entirely', async () => {
    const editor = await mount({
      handlers: {
        onPaste: () => {
          // Not calling `next` is the documented veto.
        },
      },
    });
    paste(editor, { html: '<p>rejected</p>' });

    await waitFor(() => {
      expect(editor.isEmpty()).toBe(true);
    });
  });

  it('can rewrite the payload before it lands', async () => {
    const editor = await mount({
      handlers: {
        onPaste: (_ctx, next) => {
          void next({ html: '<p>replaced</p>' });
        },
      },
    });
    paste(editor, { html: '<p>original</p>' });

    await waitFor(() => {
      expect(editor.getText()).toContain('replaced');
    });
    expect(editor.getText()).not.toContain('original');
  });
});

describe('pasted files', () => {
  it('go to the upload handler rather than into the document', async () => {
    const onUpload = vi.fn().mockResolvedValue({ url: 'https://cdn.example/a.png', alt: 'A' });
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    const editor = await mount({ preset: 'full', onUpload });

    paste(editor, { files: [file], html: '' });

    await waitFor(() => {
      expect(onUpload).toHaveBeenCalledWith(file, expect.anything());
    });
    await waitFor(() => {
      expect(editor.getHTML()).toContain('https://cdn.example/a.png');
    });
  });

  it('a file over maxUploadSize never starts an upload', async () => {
    const onUpload = vi.fn();
    const onUploadError = vi.fn();
    const big = new File([new Uint8Array(2048)], 'big.png', { type: 'image/png' });
    const editor = await mount({ preset: 'full', onUpload, onUploadError, maxUploadSize: 1024 });

    paste(editor, { files: [big], html: '' });

    await waitFor(() => {
      expect(onUploadError).toHaveBeenCalled();
    });
    expect(onUpload).not.toHaveBeenCalled();
  });

  it('a file outside uploadAccept never starts an upload', async () => {
    const onUpload = vi.fn();
    const onUploadError = vi.fn();
    const pdf = new File(['x'], 'report.pdf', { type: 'application/pdf' });
    const editor = await mount({ preset: 'full', onUpload, onUploadError, uploadAccept: 'image/*' });

    paste(editor, { files: [pdf], html: '' });

    await waitFor(() => {
      expect(onUploadError).toHaveBeenCalled();
    });
    expect(onUpload).not.toHaveBeenCalled();
  });
});
