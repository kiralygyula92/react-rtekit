import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RichTextEditor } from '../../src/index.js';
import type { EditorInstance } from '../../src/types/editor.js';

/**
 * Image and table chrome (05 §7, §8).
 *
 * The nodes are covered by `blocks.test.tsx`; this is the part an author touches —
 * the dialogs, the constraints and the controls.
 */

async function mount(props: Parameters<typeof RichTextEditor>[0] = {}): Promise<EditorInstance> {
  let instance: EditorInstance | null = null;
  render(
    <RichTextEditor
      preset="full"
      label="Message"
      defaultValue="<p>Body</p>"
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

describe('the image dialog', () => {
  it('inserts an image from a URL', async () => {
    const user = userEvent.setup();
    const editor = await mount();
    editor.setSelection('end');
    editor.exec('openImageDialog');

    const dialog = await screen.findByRole('dialog', { name: 'Image' });
    await user.type(within(dialog).getByLabelText('Image URL'), 'https://example.com/a.png');
    await user.type(within(dialog).getByLabelText('Alt text'), 'A photo');
    await user.click(within(dialog).getByRole('button', { name: 'Insert' }));

    await waitFor(() => {
      expect(editor.getHTML()).toContain('src="https://example.com/a.png"');
    });
    expect(editor.getHTML()).toContain('alt="A photo"');
  });

  it('refuses a javascript: URL', async () => {
    const user = userEvent.setup();
    const editor = await mount();
    editor.setSelection('end');
    editor.exec('openImageDialog');

    const dialog = await screen.findByRole('dialog', { name: 'Image' });
    await user.type(within(dialog).getByLabelText('Image URL'), 'javascript:alert(1)');
    await user.click(within(dialog).getByRole('button', { name: 'Insert' }));

    expect(await within(dialog).findByRole('alert')).toBeInTheDocument();
    expect(editor.getHTML().toLowerCase()).not.toContain('javascript:');
  });

  it('offers the file picker only when there is an upload handler', async () => {
    const editor = await mount();
    editor.exec('openImageDialog');
    const dialog = await screen.findByRole('dialog', { name: 'Image' });
    expect(within(dialog).queryByRole('button', { name: 'Upload' })).toBeNull();
  });
});

describe('uploads', () => {
  it('inserts the uploaded image when the handler resolves', async () => {
    const onUpload = vi.fn().mockResolvedValue({ url: 'https://cdn.example/b.png', alt: 'B' });
    const editor = await mount({ onUpload });

    await editor.uploadFiles([new File(['x'], 'b.png', { type: 'image/png' })]);

    await waitFor(() => {
      expect(editor.getHTML()).toContain('https://cdn.example/b.png');
    });
  });

  it('reports a failure without inserting anything', async () => {
    const onUpload = vi.fn().mockRejectedValue(new Error('network'));
    const onUploadError = vi.fn();
    const editor = await mount({ onUpload, onUploadError });

    await editor.uploadFiles([new File(['x'], 'c.png', { type: 'image/png' })]);

    await waitFor(() => {
      expect(onUploadError).toHaveBeenCalled();
    });
    expect(editor.getHTML()).not.toContain('<img');
  });

  it('tracks progress in the editor state', async () => {
    const onUpload = vi.fn((_file: File, ctx: { onProgress: (value: number) => void }) => {
      ctx.onProgress(50);
      return Promise.resolve({ url: 'https://cdn.example/d.png' });
    });
    const editor = await mount({ onUpload });

    const done = editor.uploadFiles([new File(['x'], 'd.png', { type: 'image/png' })]);
    await done;

    expect(editor.getSnapshot().uploads.at(-1)).toMatchObject({ status: 'done', progress: 100 });
  });
});

describe('the table picker', () => {
  it('opens when insertTable is run without a size', async () => {
    const editor = await mount();
    editor.setSelection('end');
    editor.exec('insertTable');

    expect(await screen.findByRole('grid')).toBeInTheDocument();
  });

  it('inserts the size that was picked', async () => {
    const user = userEvent.setup();
    const editor = await mount();
    editor.setSelection('end');
    editor.exec('insertTable');

    const grid = await screen.findByRole('grid');
    await user.click(within(grid).getByRole('gridcell', { name: String.raw`2 × 3` }));

    await waitFor(() => {
      const table = editor.getJSON().content.find((block) => block.type === 'table') as
        | { rows: { cells: unknown[] }[] }
        | undefined;
      expect(table?.rows).toHaveLength(2);
      expect(table?.rows[0]!.cells).toHaveLength(3);
    });
  });

  it('inserts directly when a size is given', async () => {
    const editor = await mount();
    editor.setSelection('end');
    editor.exec('insertTable', { rows: 2, cols: 2 });

    expect(screen.queryByRole('grid')).toBeNull();
    await waitFor(() => {
      expect(editor.getJSON().content.some((block) => block.type === 'table')).toBe(true);
    });
  });
});

describe('table commands', () => {
  const TABLE = '<table><tbody><tr><td>A</td><td>B</td></tr><tr><td>C</td><td>D</td></tr></tbody></table>';

  /** The table in the document, for assertions about its shape. */
  function tableOf(editor: EditorInstance): { rows: { cells: unknown[] }[] } {
    return editor.getJSON().content.find((block) => block.type === 'table') as never;
  }

  it('adds and deletes rows', async () => {
    const editor = await mount({ defaultValue: TABLE });
    editor.setSelection('start');
    expect(tableOf(editor).rows).toHaveLength(2);

    editor.exec('addRowAfter');
    expect(tableOf(editor).rows).toHaveLength(3);

    editor.exec('deleteRow');
    expect(tableOf(editor).rows).toHaveLength(2);
  });

  it('adds and deletes columns', async () => {
    const editor = await mount({ defaultValue: TABLE });
    editor.setSelection('start');
    expect(tableOf(editor).rows[0]!.cells).toHaveLength(2);

    editor.exec('addColumnAfter');
    expect(tableOf(editor).rows[0]!.cells).toHaveLength(3);

    editor.exec('deleteColumn');
    expect(tableOf(editor).rows[0]!.cells).toHaveLength(2);
  });

  it('toggles the header row', async () => {
    const editor = await mount({ defaultValue: TABLE });
    editor.setSelection('start');

    editor.exec('toggleHeaderRow');
    await waitFor(() => {
      expect(editor.getHTML()).toContain('<th>');
    });

    editor.exec('toggleHeaderRow');
    await waitFor(() => {
      expect(editor.getHTML()).not.toContain('<th>');
    });
  });

  it('deletes the whole table', async () => {
    const editor = await mount({ defaultValue: TABLE });
    editor.setSelection('start');

    editor.exec('deleteTable');
    await waitFor(() => {
      expect(editor.getJSON().content.some((block) => block.type === 'table')).toBe(false);
    });
  });

  it('does nothing outside a table', async () => {
    const editor = await mount({ defaultValue: '<p>Plain</p>' });
    editor.setSelection('all');

    expect(editor.exec('addRowAfter')).toBe(false);
    expect(editor.getHTML()).toBe('<p>Plain</p>');
  });
});
