import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RichTextEditor } from '../../src/index.js';
import type { EditorInstance } from '../../src/types/editor.js';

/**
 * Command overrides and handler middleware.
 *
 * Both are the same shape — `(ctx, next) => …` — and both have the same contract:
 * calling `next` runs what would have happened, not calling it cancels, and passing
 * an override changes what happens. Every handler is reachable.
 */

async function mount(props: Parameters<typeof RichTextEditor>[0] = {}): Promise<EditorInstance> {
  let instance: EditorInstance | null = null;
  render(
    <RichTextEditor
      preset="full"
      label="Message"
      defaultValue="<p>Body text</p>"
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

describe('command overrides', () => {
  it('can rewrite a payload on its way to the built-in', async () => {
    const editor = await mount({
      commandOverrides: {
        insertLink: (ctx, next) =>
          next({ ...ctx.payload, target: '_blank', rel: 'noopener noreferrer' }),
      },
    });
    editor.setSelection('all');
    editor.insertLink({ href: 'https://example.com' });

    await waitFor(() => {
      expect(editor.getHTML()).toContain('target="_blank"');
    });
    expect(editor.getHTML()).toContain('rel="noopener noreferrer"');
  });

  it('can replace the behaviour entirely', async () => {
    const tokens: Record<string, string> = { brand: '#7C3AED' };
    const editor = await mount({
      commandOverrides: {
        setColor: ({ payload, editor: instance }) => {
          instance.engine.exec('setColor', { color: tokens[payload.color ?? ''] ?? null });
          return true;
        },
      },
    });
    editor.setSelection('all');
    editor.exec('setColor', { color: 'brand' });

    await waitFor(() => {
      expect(editor.getHTML()).toContain('#7c3aed');
    });
  });

  it('cancels when it does not call next', async () => {
    const editor = await mount({
      commandOverrides: {
        toggleBold: () => true,
      },
    });
    editor.setSelection('all');
    editor.exec('toggleBold');

    expect(editor.getHTML()).toBe('<p>Body text</p>');
  });

  it('receives the editor in its context', async () => {
    const seen = vi.fn();
    const editor = await mount({
      commandOverrides: {
        toggleItalic: (ctx, next) => {
          seen(typeof ctx.editor.getHTML);
          next();
          return true;
        },
      },
    });
    editor.setSelection('all');
    editor.exec('toggleItalic');

    expect(seen).toHaveBeenCalledWith('function');
  });
});

describe('handler middleware', () => {
  it('onToolbarCommand sees every activation and can veto', async () => {
    const user = userEvent.setup();
    const onToolbarCommand = vi.fn((ctx: { command: string }, next: () => void) => {
      if (ctx.command === 'toggleBold') return;
      next();
    });
    const editor = await mount({ handlers: { onToolbarCommand } });
    editor.setSelection('all');

    await user.click(screen.getByRole('button', { name: 'Bold' }));
    expect(onToolbarCommand).toHaveBeenCalled();
    expect(editor.getHTML()).toBe('<p>Body text</p>');
  });

  it('onFocus and onBlur wrap the state update', async () => {
    const onFocus = vi.fn((_ctx: unknown, next: () => void) => {
      next();
    });
    const onBlur = vi.fn((_ctx: unknown, next: () => void) => {
      next();
    });
    const editor = await mount({ handlers: { onFocus, onBlur } });

    editor.focus('end');
    await waitFor(() => {
      expect(onFocus).toHaveBeenCalled();
    });

    editor.blur();
    await waitFor(() => {
      expect(onBlur).toHaveBeenCalled();
    });
  });

  it('onSelectionChange can veto the state update', async () => {
    const editor = await mount({
      handlers: {
        onSelectionChange: () => {
          // Never calls `next`, so the store never learns about the selection.
        },
      },
    });
    editor.focus('end');
    editor.setSelection('all');

    await waitFor(() => {
      expect(editor.getSnapshot().selection).toBeNull();
    });
  });

  it('onSanitizeViolation reports what the sanitizer removed', async () => {
    const onSanitizeViolation = vi.fn((_ctx: unknown, next: () => void) => {
      next();
    });
    const editor = await mount({ handlers: { onSanitizeViolation } });

    editor.setContent('<p>Hi<script>alert(1)</script></p>');

    await waitFor(() => {
      expect(onSanitizeViolation).toHaveBeenCalled();
    });
    const context = onSanitizeViolation.mock.calls[0]![0] as { violation: { tag: string } };
    expect(context.violation.tag).toBe('script');
  });

  it('onUploadStart can refuse a file before it is sent', async () => {
    const onUpload = vi.fn();
    const editor = await mount({
      onUpload,
      handlers: {
        onUploadStart: () => {
          // A quota, a filename policy, a scan that has not come back: all reasons
          // to stop before the bytes leave.
        },
      },
    });

    await editor.uploadFiles([new File(['x'], 'a.png', { type: 'image/png' })]);
    expect(onUpload).not.toHaveBeenCalled();
  });

  it('onUploadError sees the failure', async () => {
    const onUploadError = vi.fn((_ctx: unknown, next: () => void) => {
      next();
    });
    const editor = await mount({
      onUpload: vi.fn().mockRejectedValue(new Error('nope')),
      handlers: { onUploadError },
    });

    await editor.uploadFiles([new File(['x'], 'a.png', { type: 'image/png' })]);
    await waitFor(() => {
      expect(onUploadError).toHaveBeenCalled();
    });
  });

  it('onFullscreenChange and onSourceViewToggle wrap their toggles', async () => {
    const onFullscreenChange = vi.fn((_ctx: unknown, next: () => void) => {
      next();
    });
    const onSourceViewToggle = vi.fn(() => {
      // Vetoed: the source view never opens.
    });
    const editor = await mount({ handlers: { onFullscreenChange, onSourceViewToggle } });

    editor.setFullscreen(true);
    expect(onFullscreenChange).toHaveBeenCalled();
    expect(editor.isFullscreen()).toBe(true);

    editor.toggleSourceView();
    expect(onSourceViewToggle).toHaveBeenCalled();
    expect(editor.isSourceView()).toBe(false);
  });

  it('onLinkOpen can confirm before a link is followed', async () => {
    const user = userEvent.setup();
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    const onLinkOpen = vi.fn(() => {
      // Refused: nothing opens.
    });
    await mount({
      defaultValue: '<p><a href="https://example.com">site</a></p>',
      handlers: { onLinkOpen },
    });

    const link = await screen.findByRole('link', { name: 'site' });
    await user.keyboard('{Control>}');
    await user.click(link);
    await user.keyboard('{/Control}');

    expect(onLinkOpen).toHaveBeenCalled();
    expect(open).not.toHaveBeenCalled();
    open.mockRestore();
  });

  it('onLinkClick sees the href and the attributes', async () => {
    const user = userEvent.setup();
    const onLinkClick = vi.fn((_ctx: unknown, next: () => void) => {
      next();
    });
    await mount({
      defaultValue: '<p><a href="https://example.com" title="Our site">site</a></p>',
      handlers: { onLinkClick },
    });

    await user.click(await screen.findByRole('link', { name: 'site' }));

    const context = onLinkClick.mock.calls[0]![0] as { href: string; attrs: Record<string, string> };
    expect(context.href).toBe('https://example.com');
    expect(context.attrs.title).toBe('Our site');
  });

  it('onDraftSave and onDraftRestore wrap the autosave', async () => {
    const user = userEvent.setup();
    const onDraftSave = vi.fn((_ctx: unknown, next: () => void) => {
      next();
    });
    const onDraftRestore = vi.fn((_ctx: unknown, next: () => void) => {
      next();
    });
    const data = new Map<string, string>([
      ['rte-draft:m5', JSON.stringify({ value: '<p>Draft</p>', savedAt: Date.now() })],
    ]);
    const storage = {
      get length() {
        return data.size;
      },
      clear: () => {
        data.clear();
      },
      getItem: (key: string) => data.get(key) ?? null,
      key: (index: number) => [...data.keys()][index] ?? null,
      removeItem: (key: string) => {
        data.delete(key);
      },
      setItem: (key: string, value: string) => {
        data.set(key, value);
      },
    } satisfies Storage;

    const editor = await mount({
      autosave: { key: 'm5', storage, serialize: 'html' },
      handlers: { onDraftSave, onDraftRestore },
    });

    editor.saveDraft();
    expect(onDraftSave).toHaveBeenCalled();

    await user.click(await screen.findByRole('button', { name: 'Restore' }));
    expect(onDraftRestore).toHaveBeenCalled();
    await waitFor(() => {
      expect(editor.getText()).toContain('Draft');
    });
  });

  it('onMaxLengthExceeded fires when input is blocked', async () => {
    const onMaxLengthExceeded = vi.fn((_ctx: unknown, next: () => void) => {
      next();
    });
    const editor = await mount({
      defaultValue: '<p>12345</p>',
      maxLength: 5,
      maxLengthBehaviour: 'block',
      handlers: { onMaxLengthExceeded },
    });
    editor.focus('end');

    editor.engine.contentElement.dispatchEvent(
      new InputEvent('beforeinput', { inputType: 'insertText', data: 'x', bubbles: true, cancelable: true }),
    );

    expect(onMaxLengthExceeded).toHaveBeenCalled();
  });
});
