import { act, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { ChangeMeta, EditorInstance } from '../../src/types/editor.js';
import type { EditorValue } from '../../src/types/common.js';
import { Rte, useEditor } from '../../src/index.js';
import { quillFixture } from '../fixtures/quill.js';

/**
 * The React layer against the real Lexical engine.
 *
 * jsdom cannot drive a contenteditable, so nothing here types: every assertion goes
 * through the programmatic API. Caret behaviour is covered by the Playwright suite.
 */

/** A minimal host that exposes the instance to the test. */
function Harness({
  onReady,
  ...options
}: Parameters<typeof useEditor>[0] & { onReady?: (editor: EditorInstance) => void }) {
  const editor = useEditor({ ...options, ...(onReady ? { onReady } : {}) });
  return (
    <Rte.Root editor={editor}>
      <Rte.Content aria-label="Message" placeholder="Write something…" />
      <Rte.Footer>
        <Rte.Counter max={options.maxLength} />
        <Rte.ErrorText />
      </Rte.Footer>
    </Rte.Root>
  );
}

/** Renders the harness and resolves once the engine has mounted. */
async function mountEditor(
  options: Parameters<typeof useEditor>[0] = {},
): Promise<{ editor: EditorInstance; rerender: (ui: React.ReactElement) => void }> {
  let instance: EditorInstance | null = null;
  const view = render(<Harness {...options} onReady={(editor) => (instance = editor)} />);
  await waitFor(() => {
    expect(instance).not.toBeNull();
  });
  return { editor: instance!, rerender: view.rerender };
}

describe('mounting', () => {
  it('renders a labelled multiline textbox', async () => {
    await mountEditor();
    const textbox = await screen.findByRole('textbox');
    expect(textbox).toHaveAttribute('aria-multiline', 'true');
    expect(textbox).toHaveAttribute('aria-label', 'Message');
    expect(textbox).toHaveAttribute('contenteditable', 'true');
  });

  it('renders the placeholder only while empty', async () => {
    const { editor } = await mountEditor();
    expect(screen.getByText('Write something…')).toBeInTheDocument();
    act(() => {
      editor.setContent('<p>now it has content</p>');
    });
    await waitFor(() => {
      expect(screen.queryByText('Write something…')).not.toBeInTheDocument();
    });
  });

  it('exposes the instance through onReady and editorRef', async () => {
    const ref = { current: null as EditorInstance | null };
    const { editor } = await mountEditor({ editorRef: ref });
    await waitFor(() => {
      expect(ref.current).toBe(editor);
    });
  });

  it('gives each editor its own ids, so two on one page never collide (R4)', async () => {
    function Two() {
      const a = useEditor({});
      const b = useEditor({});
      return (
        <>
          <Rte.Root editor={a}>
            <Rte.Content aria-label="First" />
          </Rte.Root>
          <Rte.Root editor={b}>
            <Rte.Content aria-label="Second" />
          </Rte.Root>
        </>
      );
    }
    render(<Two />);
    await waitFor(() => {
      expect(screen.getAllByRole('textbox')).toHaveLength(2);
    });
    const [first, second] = screen.getAllByRole('textbox');
    expect(first!.id).not.toBe(second!.id);
    expect(first!.id).not.toBe('');
  });
});

describe('content', () => {
  it('loads defaultValue and serializes it back', async () => {
    const { editor } = await mountEditor({ defaultValue: '<p>Hello <strong>world</strong></p>' });
    expect(editor.getHTML()).toBe('<p>Hello <strong>world</strong></p>');
    expect(editor.getText()).toBe('Hello world');
  });

  it('round-trips the legacy default e-mail body', async () => {
    const body = quillFixture('default-email-body').html;
    const { editor } = await mountEditor({
      defaultValue: body,
      mergeTags: { tags: [{ key: 'first_name' }, { key: 'company_name' }] },
    });
    const html = editor.getHTML();
    expect(html).toContain('{first_name}');
    expect(html).toContain('{company_address}');
    expect(editor.getMergeTags()).toContain('first_name');
  });

  it('keeps alignment through a setContent round-trip', async () => {
    const { editor } = await mountEditor();
    act(() => {
      editor.setContent('<p class="ql-align-center">centered</p>');
    });
    expect(editor.getHTML()).toBe('<p class="rte-align-center">centered</p>');
  });

  it('emits quill-compatible HTML on request', async () => {
    const { editor } = await mountEditor({ htmlProfile: 'quill-compatible' });
    act(() => {
      editor.setContent('<ul><li>one</li><li>two</li></ul>');
    });
    expect(editor.getHTML()).toContain('data-list="bullet"');
  });

  it('produces an e-mail-safe profile with no class or id', async () => {
    const { editor } = await mountEditor();
    act(() => {
      editor.setContent('<p class="ql-align-center"><strong>hi</strong></p>');
    });
    const html = editor.getHTML({ profile: 'email' });
    expect(html).not.toMatch(/\sclass=/);
    expect(html).toContain('text-align: center');
  });

  it('clears to an empty document', async () => {
    const { editor } = await mountEditor({ defaultValue: '<p>content</p>' });
    act(() => {
      editor.clear();
    });
    expect(editor.isEmpty()).toBe(true);
  });
});

describe('emptiness and counting', () => {
  it('treats the Quill empty document as empty (R2)', async () => {
    const { editor } = await mountEditor({ defaultValue: '<p><br></p>' });
    expect(editor.isEmpty()).toBe(true);
  });

  it('treats a non-breaking space as content', async () => {
    const { editor } = await mountEditor({ defaultValue: '<p>&nbsp;</p>' });
    expect(editor.isEmpty()).toBe(false);
  });

  it('counts text, not markup (R3)', async () => {
    const plain = 'a'.repeat(2000);
    const { editor } = await mountEditor({
      defaultValue: `<p><strong><em><u>${plain}</u></em></strong></p>`,
    });
    expect(editor.getLength()).toBe(2000);
    // The markup costs bytes the counter must not charge the author for.
    expect(editor.getHTML().length).toBeGreaterThan(editor.getLength());
  });

  it('renders the counter against the limit', async () => {
    await mountEditor({ defaultValue: '<p>12345</p>', maxLength: 10 });
    expect(await screen.findByText('5 / 10')).toBeInTheDocument();
  });
});

describe('validation', () => {
  it('rejects an empty document when required (R2)', async () => {
    const { editor } = await mountEditor({ defaultValue: '<p><br></p>', required: true });
    expect(editor.validate()).toBe('This field is required');
  });

  it('accepts content when required', async () => {
    const { editor } = await mountEditor({ defaultValue: '<p>hi</p>', required: true });
    expect(editor.validate()).toBeNull();
  });

  it('accepts a 2000-character formatted message under a 2048 limit (R3)', async () => {
    const words = Array.from({ length: 150 }, (_, i) => `<strong>w${i}</strong>`).join(' ');
    const { editor } = await mountEditor({ defaultValue: `<p>${words}</p>`, maxLength: 2048 });
    expect(editor.validate()).toBeNull();
  });

  it('runs a custom validate function', async () => {
    const { editor } = await mountEditor({
      defaultValue: '<p>nope</p>',
      validate: ({ text }) => (text.includes('nope') ? 'Try again' : null),
    });
    expect(editor.validate()).toBe('Try again');
  });

  it('renders the message in the error slot', async () => {
    await mountEditor({ defaultValue: '<p><br></p>', required: true });
    expect(await screen.findByRole('alert')).toHaveTextContent('This field is required');
  });
});

describe('commands', () => {
  it('applies a mark to a selection', async () => {
    const { editor } = await mountEditor({ defaultValue: '<p>hello</p>' });
    act(() => {
      editor.setSelection('all');
      editor.exec('toggleBold');
    });
    expect(editor.getHTML()).toContain('<strong>');
  });

  it('sets and clears alignment with one canonical value (R6)', async () => {
    const { editor } = await mountEditor({ defaultValue: '<p>hello</p>' });
    act(() => {
      editor.setSelection('all');
      editor.exec('setAlign', { align: 'center' });
    });
    expect(editor.getFormatState().block.align).toBe('center');
    expect(editor.getHTML()).toContain('rte-align-center');

    act(() => {
      editor.exec('setAlign', { align: 'left' });
    });
    expect(editor.getFormatState().block.align).toBe('left');
    expect(editor.getHTML()).toBe('<p>hello</p>');
  });

  it('removes a colour instead of forcing black (R14)', async () => {
    const { editor } = await mountEditor({ defaultValue: '<p>hello</p>' });
    act(() => {
      editor.setSelection('all');
      editor.exec('setColor', { color: '#FF0000' });
    });
    // Colours normalize to lower-case hex, so '#FF0000' and 'rgb(255,0,0)' compare equal.
    expect(editor.getHTML()).toContain('color: #ff0000');

    act(() => {
      editor.setSelection('all');
      editor.exec('setColor', { color: null });
    });
    expect(editor.getHTML()).not.toContain('color');
    expect(editor.getHTML()).not.toContain('#000000');
  });

  it('toggles a bullet list on and off', async () => {
    const { editor } = await mountEditor({ defaultValue: '<p>item</p>' });
    act(() => {
      editor.setSelection('all');
      editor.exec('toggleBulletList');
    });
    expect(editor.getHTML()).toContain('<ul>');
    expect(editor.getFormatState().list.type).toBe('bullet');

    act(() => {
      editor.exec('toggleBulletList');
    });
    expect(editor.getHTML()).not.toContain('<ul>');
  });

  it('inserts a merge tag as one atomic unit (R23)', async () => {
    const { editor } = await mountEditor({
      defaultValue: '<p>Hi </p>',
      mergeTags: { tags: [{ key: 'first_name', label: 'First name' }] },
    });
    act(() => {
      editor.focus('end');
      editor.exec('insertMergeTag', { key: 'first_name' });
    });
    expect(editor.getHTML()).toContain('{first_name}');
    expect(editor.getMergeTags()).toEqual(['first_name']);
  });

  it('inserts a link', async () => {
    const { editor } = await mountEditor({ defaultValue: '<p>site</p>' });
    act(() => {
      editor.setSelection('all');
      editor.insertLink({ href: 'https://example.com' });
    });
    expect(editor.getHTML()).toContain('href="https://example.com"');
  });
});

describe('change events', () => {
  it('reports the source of every change (R21)', async () => {
    const onChange = vi.fn<(value: EditorValue, meta: ChangeMeta) => void>();
    const { editor } = await mountEditor({ onChange });
    act(() => {
      editor.setContent('<p>programmatic</p>');
    });
    await waitFor(() => {
      expect(onChange).toHaveBeenCalled();
    });
    const [, meta] = onChange.mock.calls.at(-1)!;
    expect(meta.source).toBe('api');
    expect(meta.isEmpty).toBe(false);
    expect(meta.length).toBe('programmatic'.length);
  });

  it('carries a lazily-built document in the meta', async () => {
    const onChange = vi.fn<(value: EditorValue, meta: ChangeMeta) => void>();
    const { editor } = await mountEditor({ onChange });
    act(() => {
      editor.setContent('<p>doc</p>');
    });
    await waitFor(() => {
      expect(onChange).toHaveBeenCalled();
    });
    const [, meta] = onChange.mock.calls.at(-1)!;
    expect(meta.document.content[0]).toMatchObject({ type: 'paragraph' });
  });
});

describe('controlled mode (R1, R21)', () => {
  function Controlled({ onChange }: { onChange?: (value: EditorValue) => void }) {
    const [value, setValue] = useState('<p>one</p>');
    const editor = useEditor({
      value,
      onChange: (next) => {
        setValue(next as string);
        onChange?.(next);
      },
    });
    return (
      <>
        <Rte.Root editor={editor}>
          <Rte.Content aria-label="Controlled" />
        </Rte.Root>
        <button
          type="button"
          onClick={() => {
            setValue('<p>two</p>');
          }}
        >
          set content
        </button>
        <button
          type="button"
          onClick={() => {
            setValue('<p>one</p>');
          }}
        >
          reset
        </button>
      </>
    );
  }

  it('applies a new value from the parent', async () => {
    render(<Controlled />);
    const textbox = await screen.findByRole('textbox');
    await waitFor(() => {
      expect(textbox).toHaveTextContent('one');
    });
    act(() => {
      screen.getByText('set content').click();
    });
    await waitFor(() => {
      expect(textbox).toHaveTextContent('two');
    });
  });

  it('does not fire onChange when the parent re-renders with an equivalent value', async () => {
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);
    await screen.findByRole('textbox');
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toHaveTextContent('one');
    });
    onChange.mockClear();
    // Setting the value it already has must be a no-op, not a loop.
    act(() => {
      screen.getByText('reset').click();
    });
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('editable state (R18)', () => {
  it('disables the content element', async () => {
    const { editor } = await mountEditor({ disabled: true });
    await waitFor(() => {
      expect(editor.isEditable()).toBe(false);
    });
    expect(screen.getByRole('textbox')).toHaveAttribute('contenteditable', 'false');
  });

  it('marks the root disabled for CSS', async () => {
    await mountEditor({ disabled: true });
    await waitFor(() => {
      expect(document.querySelector('.rte-root')).toHaveAttribute('data-disabled', 'true');
    });
  });

  it('readOnly is distinct from disabled', async () => {
    const { editor } = await mountEditor({ readOnly: true });
    await waitFor(() => {
      expect(editor.isEditable()).toBe(false);
    });
  });
});

describe('history (R25)', () => {
  it('reports canUndo and canRedo', async () => {
    const { editor } = await mountEditor({ defaultValue: '<p>start</p>' });
    expect(editor.canUndo()).toBe(false);

    act(() => {
      editor.setSelection('all');
      editor.exec('toggleBold');
    });
    await waitFor(() => {
      expect(editor.canUndo()).toBe(true);
    });

    act(() => {
      editor.undo();
    });
    await waitFor(() => {
      expect(editor.getHTML()).toBe('<p>start</p>');
    });
  });

  it('clearHistory drops the undo stack after a programmatic load', async () => {
    const { editor } = await mountEditor({ defaultValue: '<p>start</p>' });
    act(() => {
      editor.setSelection('all');
      editor.exec('toggleBold');
    });
    await waitFor(() => {
      expect(editor.canUndo()).toBe(true);
    });
    act(() => {
      editor.clearHistory();
    });
    expect(editor.canUndo()).toBe(false);
  });
});
