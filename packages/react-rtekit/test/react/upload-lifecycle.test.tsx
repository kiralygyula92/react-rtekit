import { act, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Rte, useEditor } from '../../src/index.js';
import type { EditorInstance } from '../../src/types/editor.js';
import type { UseEditorOptions } from '../../src/types/props.js';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function Harness(options: UseEditorOptions) {
  const editor = useEditor(options);
  return (
    <Rte.Root editor={editor}>
      <Rte.Content />
    </Rte.Root>
  );
}

function mount(options: UseEditorOptions) {
  let editor!: EditorInstance;
  const onReady = (value: EditorInstance) => {
    editor = value;
  };
  const view = render(<Harness {...options} onReady={onReady} />);
  return { ...view, editor, onReady };
}

const file = () => new File(['image'], 'photo.png', { type: 'image/png' });

describe('upload lifecycle', () => {
  it('aborts on unmount and ignores late progress, completion, and queued files', async () => {
    const result = deferred<{ url: string }>();
    let context!: Parameters<NonNullable<UseEditorOptions['onUpload']>>[1];
    const onUpload = vi.fn((_file, ctx) => {
      context = ctx;
      return result.promise;
    });
    const onUploadError = vi.fn();
    const view = mount({ onUpload, onUploadError });
    let uploading!: Promise<void>;
    act(() => {
      uploading = view.editor.uploadFiles([file(), file()]);
    });
    await act(async () => {
      await Promise.resolve();
    });
    view.unmount();
    const snapshot = view.editor.getSnapshot();
    expect(context.signal.aborted).toBe(true);
    await act(async () => {
      context.onProgress(70);
      result.resolve({ url: 'https://example.com/image.png' });
      await uploading;
    });
    expect(view.editor.getSnapshot()).toBe(snapshot);
    expect(onUpload).toHaveBeenCalledTimes(1);
    expect(onUploadError).not.toHaveBeenCalled();
  });

  it('waits for an asynchronous upload-start middleware decision', async () => {
    const decision = deferred<void>();
    const onUpload = vi.fn().mockResolvedValue({ url: 'https://example.com/image.png' });
    const view = mount({
      onUpload,
      handlers: {
        onUploadStart: async (_ctx, next) => {
          await decision.promise;
          await next();
        },
      },
    });
    let uploading!: Promise<void>;
    act(() => {
      uploading = view.editor.uploadFiles([file()]);
    });
    expect(onUpload).not.toHaveBeenCalled();
    await act(async () => {
      decision.resolve();
      await uploading;
    });
    expect(view.editor.getHTML()).toContain('https://example.com/image.png');
  });

  it('does not insert an old upload into a newly mounted engine', async () => {
    const result = deferred<{ url: string }>();
    const onUpload = () => result.promise;
    const onUploadError = vi.fn();
    const view = mount({ onUpload, onUploadError });
    let uploading!: Promise<void>;
    act(() => {
      uploading = view.editor.uploadFiles([file()]);
    });
    view.rerender(
      <Harness
        onUpload={onUpload}
        onUploadError={onUploadError}
        valueFormat="text"
        onReady={view.onReady}
      />,
    );
    await act(async () => {
      result.resolve({ url: 'https://example.com/stale.png' });
      await uploading;
    });
    expect(view.editor.getHTML()).not.toContain('<img');
    expect(onUploadError).not.toHaveBeenCalled();
  });
});
