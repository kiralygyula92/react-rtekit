import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RichTextEditor } from '../../src/index.js';
import type { EditorInstance } from '../../src/types/editor.js';

/**
 * Links (05 §6).
 *
 * The popover, its validation and what a click on a link does. The sanitizer's own
 * rules are tested separately; what matters here is that nothing in this layer can
 * get around them.
 */

async function mount(
  props: Parameters<typeof RichTextEditor>[0] = {},
): Promise<EditorInstance> {
  let instance: EditorInstance | null = null;
  render(
    <RichTextEditor
      preset="standard"
      label="Message"
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

describe('the link popover', () => {
  it('opens from the toolbar and applies a link to the selection', async () => {
    const user = userEvent.setup();
    const editor = await mount({ defaultValue: '<p>our site</p>' });
    editor.focus('end');
    editor.setSelection('all');

    await user.click(screen.getByRole('button', { name: 'Link' }));
    const dialog = await screen.findByRole('dialog', { name: 'Link' });

    await user.type(within(dialog).getByLabelText('URL'), 'example.com');
    await user.click(within(dialog).getByRole('button', { name: 'Apply' }));

    await waitFor(() => {
      expect(editor.getHTML()).toContain('href="https://example.com"');
    });
  });

  it('adds a bare host its protocol', async () => {
    const user = userEvent.setup();
    const editor = await mount({ defaultValue: '<p>site</p>', defaultProtocol: 'http' });
    editor.setSelection('all');

    await user.click(screen.getByRole('button', { name: 'Link' }));
    const dialog = await screen.findByRole('dialog', { name: 'Link' });
    await user.type(within(dialog).getByLabelText('URL'), 'example.com');
    await user.click(within(dialog).getByRole('button', { name: 'Apply' }));

    await waitFor(() => {
      expect(editor.getHTML()).toContain('href="http://example.com"');
    });
  });

  it('refuses a javascript: URL whatever the consumer says', async () => {
    const user = userEvent.setup();
    const editor = await mount({
      defaultValue: '<p>site</p>',
      // A validator that accepts everything still cannot open this hole (03 §4.3).
      linkValidator: () => null,
    });
    editor.setSelection('all');

    await user.click(screen.getByRole('button', { name: 'Link' }));
    const dialog = await screen.findByRole('dialog', { name: 'Link' });
    await user.type(within(dialog).getByLabelText('URL'), 'javascript:alert(1)');
    await user.click(within(dialog).getByRole('button', { name: 'Apply' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Enter a valid URL');
    expect(editor.getHTML().toLowerCase()).not.toContain('javascript:');
  });

  it('shows the consumer validator’s message and does not apply', async () => {
    const user = userEvent.setup();
    const editor = await mount({
      defaultValue: '<p>site</p>',
      linkValidator: (url) => (url.startsWith('https://intra.example/') ? null : 'Internal links only'),
    });
    editor.setSelection('all');

    await user.click(screen.getByRole('button', { name: 'Link' }));
    const dialog = await screen.findByRole('dialog', { name: 'Link' });
    await user.type(within(dialog).getByLabelText('URL'), 'https://example.com');
    await user.click(within(dialog).getByRole('button', { name: 'Apply' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Internal links only');
    expect(editor.getHTML()).not.toContain('<a');
  });

  it('adds rel="noopener noreferrer" with the new-tab box', async () => {
    const user = userEvent.setup();
    const editor = await mount({ defaultValue: '<p>site</p>' });
    editor.setSelection('all');

    await user.click(screen.getByRole('button', { name: 'Link' }));
    const dialog = await screen.findByRole('dialog', { name: 'Link' });
    await user.type(within(dialog).getByLabelText('URL'), 'https://example.com');
    await user.click(within(dialog).getByLabelText('Open in new tab'));
    await user.click(within(dialog).getByRole('button', { name: 'Apply' }));

    await waitFor(() => {
      const html = editor.getHTML();
      expect(html).toContain('target="_blank"');
      expect(html).toContain('rel="noopener noreferrer"');
    });
  });

  it('removes a link and keeps its text', async () => {
    const user = userEvent.setup();
    const editor = await mount({ defaultValue: '<p><a href="https://example.com">our site</a></p>' });
    editor.setSelection('all');

    await user.click(screen.getByRole('button', { name: 'Link' }));
    const dialog = await screen.findByRole('dialog', { name: 'Link' });
    await user.click(within(dialog).getByRole('button', { name: 'Remove' }));

    await waitFor(() => {
      expect(editor.getHTML()).toBe('<p>our site</p>');
    });
  });

  it('closes on Escape without changing anything', async () => {
    const user = userEvent.setup();
    const editor = await mount({ defaultValue: '<p>site</p>' });
    editor.setSelection('all');

    await user.click(screen.getByRole('button', { name: 'Link' }));
    const dialog = await screen.findByRole('dialog', { name: 'Link' });
    await user.type(within(dialog).getByLabelText('URL'), 'https://example.com');
    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Link' })).toBeNull();
    });
    expect(editor.getHTML()).toBe('<p>site</p>');
  });

  it('is reachable through the openLinkEditor command', async () => {
    const editor = await mount({ defaultValue: '<p>site</p>' });
    editor.setSelection('all');
    editor.exec('openLinkEditor');

    expect(await screen.findByRole('dialog', { name: 'Link' })).toBeInTheDocument();
  });
});

describe('clicking a link', () => {
  it('opens the popover rather than navigating', async () => {
    const user = userEvent.setup();
    await mount({ defaultValue: '<p><a href="https://example.com">our site</a></p>' });

    const link = await screen.findByRole('link', { name: 'our site' });
    await user.click(link);

    expect(await screen.findByRole('dialog', { name: 'Link' })).toBeInTheDocument();
  });

  it('Ctrl+click opens it in a new tab', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    const user = userEvent.setup();
    await mount({ defaultValue: '<p><a href="https://example.com">our site</a></p>' });

    const link = await screen.findByRole('link', { name: 'our site' });
    await user.keyboard('{Control>}');
    await user.click(link);
    await user.keyboard('{/Control}');

    expect(open).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer');
    open.mockRestore();
  });
});

describe('the link toolbar items', () => {
  it('unlink is disabled unless the caret is in a link', async () => {
    const editor = await mount({ defaultValue: '<p>plain</p>', toolbar: [['link', 'unlink']] });
    editor.setSelection('all');

    const unlink = await screen.findByRole('button', { name: 'Remove link' });
    await waitFor(() => {
      expect(unlink).toBeDisabled();
    });
  });

  it('unlink is enabled inside one', async () => {
    const editor = await mount({
      defaultValue: '<p><a href="https://example.com">our site</a></p>',
      toolbar: [['link', 'unlink']],
    });
    editor.focus('end');
    editor.setSelection('all');

    const unlink = await screen.findByRole('button', { name: 'Remove link' });
    await waitFor(() => {
      expect(unlink).toBeEnabled();
    });
  });
});
