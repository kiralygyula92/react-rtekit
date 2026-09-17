import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RichTextEditor } from '../../src/index.js';
import type { EditorInstance } from '../../src/types/editor.js';

/**
 * The keyboard model.
 *
 * The bug these tests exist for: the engine has shortcuts of its own, and for a while
 * both it and our keymap handled `Mod+B` — so the format toggled twice and the
 * shortcut looked like it did nothing. The engine now stops as soon as a listener
 * calls `preventDefault()`, and these tests are what would notice if that changed.
 */

/** Renders and resolves once the engine has mounted. */
async function mount(
  props: Parameters<typeof RichTextEditor>[0] = {},
): Promise<{ editor: EditorInstance; content: HTMLElement }> {
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
  return { editor: instance!, content: screen.getByRole('textbox') };
}

/** Sends a shortcut to the editable surface, the way a browser would. */
function press(content: HTMLElement, key: string, modifiers: { shift?: boolean } = {}): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    key,
    code: `Key${key.toUpperCase()}`,
    ctrlKey: true,
    shiftKey: modifiers.shift ?? false,
    bubbles: true,
    cancelable: true,
  });
  content.dispatchEvent(event);
  return event;
}

describe('a shortcut applies exactly once', () => {
  it.each([
    ['b', 'bold', '<strong>shortcut</strong>'],
    ['i', 'italic', '<em>shortcut</em>'],
    ['u', 'underline', '<u>shortcut</u>'],
  ])('Mod+%s toggles %s once', async (key, _name, expected) => {
    const { editor, content } = await mount({ preset: 'standard', defaultValue: '<p>shortcut</p>' });
    editor.focus('end');
    editor.setSelection('all');

    press(content, key);
    await waitFor(() => {
      expect(editor.getHTML()).toContain(expected);
    });

    // And off again: a second press is a toggle, not a no-op.
    press(content, key);
    await waitFor(() => {
      expect(editor.getHTML()).toBe('<p>shortcut</p>');
    });
  });

  it('prevents the browser default for a shortcut it handles', async () => {
    const { editor, content } = await mount({ preset: 'standard', defaultValue: '<p>x</p>' });
    editor.setSelection('all');
    expect(press(content, 'b').defaultPrevented).toBe(true);
  });

  it('leaves a key it does not bind alone', async () => {
    const { editor, content } = await mount({ preset: 'standard', defaultValue: '<p>x</p>' });
    editor.setSelection('all');
    // Ctrl+J is not in any keymap, so the browser keeps it.
    expect(press(content, 'j').defaultPrevented).toBe(false);
  });
});

describe('keymap configuration', () => {
  it('runs a consumer binding', async () => {
    const { editor, content } = await mount({
      preset: 'standard',
      defaultValue: '<p>custom</p>',
      keymap: { 'Mod+Shift+L': 'toggleBulletList' },
    });
    editor.setSelection('all');

    const event = new KeyboardEvent('keydown', {
      key: 'L',
      code: 'KeyL',
      ctrlKey: true,
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    content.dispatchEvent(event);

    await waitFor(() => {
      expect(editor.getFormatState().list.type).toBe('bullet');
    });
  });

  it('disableShortcuts stops the engine handling it too', async () => {
    const { editor, content } = await mount({
      preset: 'standard',
      defaultValue: '<p>plain</p>',
      disableShortcuts: ['Mod+B'],
    });
    editor.setSelection('all');

    // Prevented, but by us doing nothing with it rather than by the engine
    // formatting with it: a disabled shortcut leaves the content alone.
    press(content, 'b');
    expect(editor.getHTML()).toBe('<p>plain</p>');
  });

  it('lets an onKeyDown handler veto a shortcut', async () => {
    // Not calling `next` is how middleware vetoes: the built-in never runs.
    const onKeyDown = vi.fn((ctx: { event: KeyboardEvent }, next: () => void): void => {
      if (ctx.event.key === 'b') return;
      next();
    });
    const { editor, content } = await mount({
      preset: 'standard',
      defaultValue: '<p>vetoed</p>',
      handlers: { onKeyDown },
    });
    editor.setSelection('all');

    press(content, 'b');
    expect(onKeyDown).toHaveBeenCalled();
    expect(editor.getHTML()).toBe('<p>vetoed</p>');
  });
});
