import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RichTextEditor } from '../../src/index.js';
import type { EditorInstance } from '../../src/types/editor.js';

/**
 * The pro chrome.
 *
 * Find and replace, the source view, fullscreen, drafts and the shortcut reference.
 * The theme through all of them: none may change the document behind the author's
 * back, and none may put anything in the document that the sanitizer has not seen.
 */

async function mount(props: Parameters<typeof RichTextEditor>[0] = {}): Promise<EditorInstance> {
  let instance: EditorInstance | null = null;
  render(
    <RichTextEditor
      preset="full"
      label="Message"
      defaultValue="<p>The water test result is water clear.</p>"
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

describe('find and replace', () => {
  it('opens from the command and counts the matches', async () => {
    const user = userEvent.setup();
    const editor = await mount();
    editor.exec('openFindReplace');

    const panel = await screen.findByRole('search', { name: 'Find and replace' });
    await user.type(within(panel).getByLabelText('Find'), 'water');

    await waitFor(() => {
      expect(within(panel).getByText('1 of 2')).toBeInTheDocument();
    });
  });

  it('replaces the current match only', async () => {
    const user = userEvent.setup();
    const editor = await mount();
    editor.exec('openFindReplace');

    const panel = await screen.findByRole('search', { name: 'Find and replace' });
    await user.type(within(panel).getByLabelText('Find'), 'water');
    await user.type(within(panel).getByLabelText('Replace'), 'pool');
    await user.click(within(panel).getByRole('button', { name: 'Replace' }));

    await waitFor(() => {
      expect(editor.getText()).toBe('The pool test result is water clear.');
    });
  });

  it('replaces every match', async () => {
    const user = userEvent.setup();
    const editor = await mount();
    editor.exec('openFindReplace');

    const panel = await screen.findByRole('search', { name: 'Find and replace' });
    await user.type(within(panel).getByLabelText('Find'), 'water');
    await user.type(within(panel).getByLabelText('Replace'), 'pool');
    await user.click(within(panel).getByRole('button', { name: 'Replace all' }));

    await waitFor(() => {
      expect(editor.getText()).toBe('The pool test result is pool clear.');
    });
  });

  it('reports no results for a query that matches nothing', async () => {
    const user = userEvent.setup();
    const editor = await mount();
    editor.exec('openFindReplace');

    const panel = await screen.findByRole('search', { name: 'Find and replace' });
    await user.type(within(panel).getByLabelText('Find'), 'absent');

    expect(await within(panel).findByText('No results')).toBeInTheDocument();
  });

  it('honours match case', async () => {
    const user = userEvent.setup();
    const editor = await mount({ defaultValue: '<p>Water water WATER</p>' });
    editor.exec('openFindReplace');

    const panel = await screen.findByRole('search', { name: 'Find and replace' });
    await user.type(within(panel).getByLabelText('Find'), 'water');
    await waitFor(() => {
      expect(within(panel).getByText('1 of 3')).toBeInTheDocument();
    });

    await user.click(within(panel).getByLabelText('Match case'));
    await waitFor(() => {
      expect(within(panel).getByText('1 of 1')).toBeInTheDocument();
    });
  });

  it('closes without changing anything', async () => {
    const user = userEvent.setup();
    const editor = await mount();
    const before = editor.getHTML();
    editor.exec('openFindReplace');

    const panel = await screen.findByRole('search', { name: 'Find and replace' });
    await user.type(within(panel).getByLabelText('Find'), 'water');
    await user.click(within(panel).getByRole('button', { name: 'Close' }));

    await waitFor(() => {
      expect(screen.queryByRole('search', { name: 'Find and replace' })).toBeNull();
    });
    expect(editor.getHTML()).toBe(before);
  });
});

describe('the source view', () => {
  it('shows the current HTML and applies an edit', async () => {
    const user = userEvent.setup();
    const editor = await mount({ defaultValue: '<p>Original</p>' });
    editor.toggleSourceView();

    const textarea = within(await screen.findByRole('group', { name: 'HTML source' })).getByRole('textbox');
    await user.clear(textarea);
    await user.type(textarea, '<p>Edited</p>');
    await user.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() => {
      expect(editor.getHTML()).toBe('<p>Edited</p>');
    });
  });

  it('sanitizes what is applied', async () => {
    const user = userEvent.setup();
    const editor = await mount({ defaultValue: '<p>Original</p>' });
    editor.toggleSourceView();

    const textarea = within(await screen.findByRole('group', { name: 'HTML source' })).getByRole('textbox');
    await user.clear(textarea);
    await user.type(textarea, '<p>Hi</p><img src=x onerror=alert(1)>');
    await user.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() => {
      expect(editor.getHTML()).toContain('Hi');
    });
    expect(editor.getHTML().toLowerCase()).not.toContain('onerror');
  });

  it('refuses markup that sanitizes away to nothing', async () => {
    const user = userEvent.setup();
    const editor = await mount({ defaultValue: '<p>Original</p>' });
    editor.toggleSourceView();

    const textarea = within(await screen.findByRole('group', { name: 'HTML source' })).getByRole('textbox');
    await user.clear(textarea);
    await user.type(textarea, '<script>alert(1)</script>');
    await user.click(screen.getByRole('button', { name: 'Apply' }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(editor.getHTML()).toBe('<p>Original</p>');
  });

  it('cancel leaves the content alone', async () => {
    const user = userEvent.setup();
    const editor = await mount({ defaultValue: '<p>Original</p>' });
    editor.toggleSourceView();

    const textarea = within(await screen.findByRole('group', { name: 'HTML source' })).getByRole('textbox');
    await user.clear(textarea);
    await user.type(textarea, '<p>Discarded</p>');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(editor.getHTML()).toBe('<p>Original</p>');
  });
});

describe('fullscreen', () => {
  it('marks the root and restores the page scroll on exit', async () => {
    const editor = await mount();
    const root = document.querySelector('.rte-root');

    editor.exec('toggleFullscreen');
    await waitFor(() => {
      expect(root).toHaveAttribute('data-fullscreen', 'true');
    });
    expect(document.body.style.overflow).toBe('hidden');

    editor.exec('toggleFullscreen');
    await waitFor(() => {
      expect(root).toHaveAttribute('data-fullscreen', 'false');
    });
    expect(document.body.style.overflow).not.toBe('hidden');
  });

  it('Escape leaves fullscreen', async () => {
    const user = userEvent.setup();
    const editor = await mount();
    editor.exec('toggleFullscreen');
    await waitFor(() => {
      expect(editor.isFullscreen()).toBe(true);
    });

    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(editor.isFullscreen()).toBe(false);
    });
  });
});

describe('drafts', () => {
  /** An isolated storage, so one test never sees another's draft. */
  function makeStorage(seed?: Record<string, string>): Storage {
    const data = new Map(Object.entries(seed ?? {}));
    return {
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
    };
  }

  it('saves a draft on demand', async () => {
    const storage = makeStorage();
    const editor = await mount({ autosave: { key: 'test', storage, debounceMs: 10_000 } });

    editor.saveDraft();
    expect(storage.getItem('rte-draft:test')).toContain('water');
  });

  it('offers to restore one and does nothing until asked', async () => {
    const draft = JSON.stringify({ value: '<p>Draft content</p>', savedAt: Date.now() });
    const storage = makeStorage({ 'rte-draft:test': draft });
    const editor = await mount({
      autosave: { key: 'test', storage, serialize: 'html' },
    });

    // The prompt is offered, and the content is untouched until it is answered.
    expect(await screen.findByRole('button', { name: 'Restore' })).toBeInTheDocument();
    expect(editor.getText()).not.toContain('Draft content');

    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Restore' }));
    await waitFor(() => {
      expect(editor.getText()).toContain('Draft content');
    });
  });

  it('discards one on request, and never asks again', async () => {
    const user = userEvent.setup();
    const draft = JSON.stringify({ value: '<p>Draft content</p>', savedAt: Date.now() });
    const storage = makeStorage({ 'rte-draft:test': draft });
    await mount({ autosave: { key: 'test', storage, serialize: 'html' } });

    await user.click(await screen.findByRole('button', { name: 'Discard' }));
    expect(storage.getItem('rte-draft:test')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Restore' })).toBeNull();
  });

  it('drops a draft older than its ttl', async () => {
    const draft = JSON.stringify({ value: '<p>Old</p>', savedAt: Date.now() - 60_000 });
    const storage = makeStorage({ 'rte-draft:test': draft });
    await mount({ autosave: { key: 'test', storage, ttlMs: 1000 } });

    await waitFor(() => {
      expect(storage.getItem('rte-draft:test')).toBeNull();
    });
    expect(screen.queryByRole('button', { name: 'Restore' })).toBeNull();
  });

  it('restores without asking when the prompt is off', async () => {
    const draft = JSON.stringify({ value: '<p>Silent restore</p>', savedAt: Date.now() });
    const storage = makeStorage({ 'rte-draft:test': draft });
    const editor = await mount({
      autosave: { key: 'test', storage, serialize: 'html', restorePrompt: false },
    });

    await waitFor(() => {
      expect(editor.getText()).toContain('Silent restore');
    });
  });

  it('onRestore can veto the whole thing', async () => {
    const onRestore = vi.fn(() => false as const);
    const draft = JSON.stringify({ value: '<p>Vetoed</p>', savedAt: Date.now() });
    const storage = makeStorage({ 'rte-draft:test': draft });
    const editor = await mount({ autosave: { key: 'test', storage, onRestore } });

    await waitFor(() => {
      expect(onRestore).toHaveBeenCalled();
    });
    expect(editor.getText()).not.toContain('Vetoed');
    expect(storage.getItem('rte-draft:test')).toBeNull();
  });

  it('clearDraft removes it', async () => {
    const storage = makeStorage({ 'rte-draft:test': '{"value":"<p>x</p>","savedAt":1}' });
    const editor = await mount({ autosave: { key: 'test', storage, restorePrompt: false } });

    editor.clearDraft();
    expect(storage.getItem('rte-draft:test')).toBeNull();
  });
});

describe('the shortcut reference', () => {
  it('lists the bindings that are actually in force', async () => {
    const editor = await mount();
    editor.exec('openShortcutHelp');

    const dialog = await screen.findByRole('dialog', { name: 'Keyboard shortcuts' });
    expect(within(dialog).getByText('Bold')).toBeInTheDocument();
    expect(within(dialog).getByText('Undo')).toBeInTheDocument();
  });

  it('shows a consumer binding alongside the built-in one', async () => {
    // `keymap` adds bindings rather than replacing them, so both ways of
    // reaching bold are listed — which is exactly what the author needs to know.
    const editor = await mount({ keymap: { 'Mod+Shift+B': 'toggleBold' } });
    editor.exec('openShortcutHelp');

    const dialog = await screen.findByRole('dialog', { name: 'Keyboard shortcuts' });
    const rows = within(dialog).getAllByText('Bold');
    expect(rows).toHaveLength(2);
    expect(dialog.textContent).toContain('Shift');
  });

  it('leaves out a shortcut that was disabled', async () => {
    const editor = await mount({ disableShortcuts: ['Mod+B'] });
    editor.exec('openShortcutHelp');

    const dialog = await screen.findByRole('dialog', { name: 'Keyboard shortcuts' });
    expect(within(dialog).queryByText('Bold')).toBeNull();
  });
});

describe('the toolbar that follows the selection', () => {
  it('appears for a range selection and not for a caret', async () => {
    const editor = await mount({
      preset: 'standard',
      defaultValue: '<p>select these words</p>',
      floatingToolbar: true,
    });

    // One toolbar to begin with: the docked one.
    expect(screen.getAllByRole('toolbar')).toHaveLength(1);

    editor.focus('end');
    editor.setSelection('all');

    await waitFor(() => {
      expect(screen.getAllByRole('toolbar')).toHaveLength(2);
    });
  });

  it('shows its own item list when one is given', async () => {
    const editor = await mount({
      preset: 'standard',
      defaultValue: '<p>select these words</p>',
      floatingToolbar: true,
      bubbleMenuItems: [{ name: 'bold', label: 'Bold', command: 'toggleBold', kind: 'toggle' }],
    });

    editor.focus('end');
    editor.setSelection('all');

    await waitFor(() => {
      expect(screen.getAllByRole('toolbar')).toHaveLength(2);
    });

    const floating = screen.getAllByRole('toolbar')[1]!;
    // Just the one control, rather than everything the docked toolbar carries.
    expect(within(floating).getAllByRole('button')).toHaveLength(1);
  });

  it('stays hidden when the feature is off', async () => {
    const editor = await mount({ preset: 'standard', defaultValue: '<p>words</p>' });

    editor.focus('end');
    editor.setSelection('all');

    await waitFor(() => {
      expect(editor.getSelection()?.isCollapsed).toBe(false);
    });
    expect(screen.getAllByRole('toolbar')).toHaveLength(1);
  });
});
