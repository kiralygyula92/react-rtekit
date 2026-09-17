import { act, render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RichTextEditor } from '../../src/index.js';
import type { EditorValue } from '../../src/types/common.js';
import type { ChangeMeta, EditorInstance } from '../../src/types/editor.js';

/**
 * IME composition.
 *
 * A Japanese or Korean input method puts intermediate states into the document while
 * the user is still choosing characters: typing "nihon" shows "にほn" before it becomes
 * "日本". Those states are not what the user meant to type, and a form that validates
 * or autosaves against them is validating against noise — so no change event may fire
 * between `compositionstart` and `compositionend`.
 *
 * jsdom has no input method, so composition is driven through the DOM events a real
 * one dispatches. That is exactly the contract the engine implements: Lexical exposes
 * no composition command, so the boundaries come from the element's own events.
 */

interface Mounted {
  editor: EditorInstance;
  content: HTMLElement;
  onChange: ReturnType<typeof vi.fn>;
}

async function mount(props: Parameters<typeof RichTextEditor>[0] = {}): Promise<Mounted> {
  const onChange = vi.fn();
  let instance: EditorInstance | null = null;

  render(
    <RichTextEditor
      preset="standard"
      label="Message"
      defaultValue="<p></p>"
      onChange={onChange as (value: EditorValue, meta: ChangeMeta) => void}
      {...props}
      onReady={(editor) => {
        instance = editor;
      }}
    />,
  );

  await waitFor(() => {
    expect(instance).not.toBeNull();
  });

  const editor = instance!;
  onChange.mockClear();
  return { editor, content: editor.engine.contentElement, onChange };
}

/** One composition, as a browser dispatches it: start, updates, end. */
function compose(content: HTMLElement, steps: string[], final: string): void {
  act(() => {
    content.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
  });

  for (const step of steps) {
    act(() => {
      content.dispatchEvent(new CompositionEvent('compositionupdate', { bubbles: true, data: step }));
    });
  }

  act(() => {
    content.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: final }));
  });
}

describe('IME composition', () => {
  it('fires no change event while a Japanese composition is in progress', async () => {
    const { content, onChange, editor } = await mount();

    act(() => {
      content.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    });

    // The intermediate states an IME writes into the document while composing.
    for (const step of ['n', 'に', 'にほ', 'にほn', 'にほん']) {
      act(() => {
        editor.setContent(`<p>${step}</p>`, { source: 'user' });
      });
    }

    // Sanity: the document really did change, so the silence is the guard and not an
    // API that quietly did nothing.
    expect(editor.getText()).toBe('にほん');

    expect(onChange).not.toHaveBeenCalled();
  });

  it('fires exactly one change when the composition commits', async () => {
    const { content, onChange } = await mount();

    compose(content, ['に', 'にほん'], '日本');

    await waitFor(() => {
      expect(onChange).toHaveBeenCalled();
    });
    // One event for the whole composition, not one per intermediate state.
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('reports the committed text as a user change', async () => {
    const { content, onChange } = await mount();

    compose(content, ['ㅎ', '하', '한'], '한국');

    await waitFor(() => {
      expect(onChange).toHaveBeenCalled();
    });
    const [, meta] = onChange.mock.calls[0] as [EditorValue, ChangeMeta];
    expect(meta.source).toBe('user');
  });

  it('resumes ordinary change events after the composition ends', async () => {
    const { content, onChange, editor } = await mount();

    compose(content, ['に'], '日');
    await waitFor(() => {
      expect(onChange).toHaveBeenCalled();
    });
    onChange.mockClear();

    act(() => {
      editor.setContent('<p>after</p>', { source: 'user' });
    });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalled();
    });
  });

  it('does not autosave a draft mid-composition', async () => {
    const storage = {
      store: new Map<string, string>(),
      getItem: (key: string) => storage.store.get(key) ?? null,
      setItem: (key: string, value: string) => storage.store.set(key, value),
      removeItem: (key: string) => storage.store.delete(key),
      clear: () => {
        storage.store.clear();
      },
      key: () => null,
      length: 0,
    } as unknown as Storage;

    const { content, editor } = await mount({
      autosave: { key: 'ime', storage, debounceMs: 0, restorePrompt: false },
    });

    act(() => {
      content.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    });
    act(() => {
      editor.setContent('<p>にほn</p>', { source: 'user' });
    });

    // The half-composed reading must not reach storage: a draft restored from it would
    // show the user something they never typed.
    expect(storage.getItem('rte-draft:ime')).toBeNull();
  });

  it('emits composition boundaries to consumers', async () => {
    const { content, editor } = await mount();
    const events: string[] = [];

    editor.engine.on('compositionStart', () => events.push('start'));
    editor.engine.on('compositionEnd', () => events.push('end'));

    compose(content, ['に'], '日');

    expect(events).toEqual(['start', 'end']);
  });
});
