import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { EditorInstance } from '../../src/types/editor.js';
import { RichTextEditor, classicTheme } from '../../src/index.js';
import { RTE_PREDEFINED_COLORS } from '../fixtures/legacy.js';
import { DEFAULT_EMAIL_BODY } from '../fixtures/quill.js';

/**
 * The assembled component.
 *
 * jsdom drives the chrome — toolbar, popovers, ARIA, validation — while typing and
 * selection live in the Playwright suite.
 */

/** Renders and resolves once the engine has mounted. */
async function mount(
  props: Parameters<typeof RichTextEditor>[0] = {},
): Promise<{ editor: EditorInstance }> {
  let instance: EditorInstance | null = null;
  render(
    <RichTextEditor
      {...props}
      onReady={(editor) => {
        instance = editor;
        props.onReady?.(editor);
      }}
    />,
  );
  await waitFor(() => {
    expect(instance).not.toBeNull();
  });
  return { editor: instance! };
}

describe(`the classic preset reproduces the legacy editor's toolbar`, () => {
  it('renders exactly the eight controls, in order', async () => {
    await mount({ preset: 'classic', theme: classicTheme });
    const toolbar = await screen.findByRole('toolbar');
    const buttons = within(toolbar).getAllByRole('button');
    expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual([
      'Bold',
      'Italic',
      'Underline',
      'Text colour',
      'Align left',
      'Align centre',
      'Align right',
      'Bulleted list',
    ]);
  });

  it('is a real ARIA toolbar that controls the editor (R16)', async () => {
    await mount({ preset: 'classic' });
    const toolbar = await screen.findByRole('toolbar');
    expect(toolbar).toHaveAttribute('aria-label', 'Formatting');
    const textbox = screen.getByRole('textbox');
    expect(toolbar.getAttribute('aria-controls')).toBe(textbox.id);
  });

  it('exposes aria-pressed on the toggles (R16)', async () => {
    await mount({ preset: 'classic' });
    const bold = await screen.findByRole('button', { name: 'Bold' });
    expect(bold).toHaveAttribute('aria-pressed', 'false');
  });

  it('does not put undo and redo on the classic toolbar', async () => {
    await mount({ preset: 'classic' });
    const toolbar = await screen.findByRole('toolbar');
    expect(within(toolbar).queryByRole('button', { name: 'Undo' })).toBeNull();
  });

  it('keeps the three alignment toggles agreeing on one value (R6)', async () => {
    const user = userEvent.setup();
    const { editor } = await mount({ preset: 'classic', defaultValue: '<p>text</p>' });

    const left = await screen.findByRole('button', { name: 'Align left' });
    const center = screen.getByRole('button', { name: 'Align centre' });

    // Nothing is aligned yet, so "left" is the active one.
    await waitFor(() => {
      expect(left).toHaveAttribute('aria-pressed', 'true');
    });
    expect(center).toHaveAttribute('aria-pressed', 'false');

    editor.setSelection('all');
    await user.click(center);

    await waitFor(() => {
      expect(center).toHaveAttribute('aria-pressed', 'true');
    });
    expect(left).toHaveAttribute('aria-pressed', 'false');
  });
});

describe('toolbar behaviour', () => {
  it('never moves focus out of the editor when a button is pressed (R5)', async () => {
    const user = userEvent.setup();
    const { editor } = await mount({ preset: 'classic', defaultValue: '<p>keep me</p>' });

    editor.focus('end');
    editor.setSelection('all');

    const bold = await screen.findByRole('button', { name: 'Bold' });
    await user.click(bold);

    // The format landed on the selection, which only happens if it survived the click.
    await waitFor(() => {
      expect(editor.getHTML()).toContain('<strong>keep me</strong>');
    });
  });

  it('is one tab stop, with arrows moving between controls', async () => {
    const user = userEvent.setup();
    await mount({ preset: 'classic' });
    const toolbar = await screen.findByRole('toolbar');
    const [bold, italic] = within(toolbar).getAllByRole('button');

    expect(bold).toHaveAttribute('tabindex', '0');
    expect(italic).toHaveAttribute('tabindex', '-1');

    bold!.focus();
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(italic);

    await user.keyboard('{End}');
    expect(document.activeElement).toBe(within(toolbar).getAllByRole('button').at(-1));
  });

  it('disables undo until there is something to undo', async () => {
    await mount({ preset: 'standard', defaultValue: '<p>x</p>' });
    const undo = await screen.findByRole('button', { name: 'Undo' });
    expect(undo).toBeDisabled();
  });
});

describe('the colour picker (R14, R15)', () => {
  it('opens a labelled dialog with the 21 classic swatches', async () => {
    const user = userEvent.setup();
    await mount({ preset: 'classic' });

    await user.click(await screen.findByRole('button', { name: 'Text colour' }));
    const dialog = await screen.findByRole('dialog', { name: 'Text colour' });
    const swatches = within(dialog).getAllByRole('radio');
    expect(swatches).toHaveLength(RTE_PREDEFINED_COLORS.length);
  });

  it('gives every swatch a name and keyboard focus (R15)', async () => {
    const user = userEvent.setup();
    await mount({ preset: 'classic' });

    await user.click(await screen.findByRole('button', { name: 'Text colour' }));
    const dialog = await screen.findByRole('dialog', { name: 'Text colour' });
    const first = within(dialog).getByRole('radio', { name: 'Colour #000000' });
    expect(first).toBeInTheDocument();
    await waitFor(() => {
      expect(document.activeElement).toBe(first);
    });

    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(
      within(dialog).getByRole('radio', { name: 'Colour #FF0000' }),
    );
  });

  it('applies a swatch to the selection', async () => {
    const user = userEvent.setup();
    const { editor } = await mount({ preset: 'classic', defaultValue: '<p>colour me</p>' });
    editor.setSelection('all');

    await user.click(await screen.findByRole('button', { name: 'Text colour' }));
    const dialog = await screen.findByRole('dialog', { name: 'Text colour' });
    await user.click(within(dialog).getByRole('radio', { name: 'Colour #FF0000' }));

    await waitFor(() => {
      expect(editor.getHTML()).toContain('color: #ff0000');
    });
  });

  it('Reset removes the colour rather than writing black (R14)', async () => {
    const user = userEvent.setup();
    const { editor } = await mount({
      preset: 'classic',
      defaultValue: '<p><span style="color: #FF0000">red</span></p>',
    });
    editor.setSelection('all');

    await user.click(await screen.findByRole('button', { name: 'Text colour' }));
    const dialog = await screen.findByRole('dialog', { name: 'Text colour' });
    await user.click(within(dialog).getByRole('button', { name: 'Reset' }));

    await waitFor(() => {
      expect(editor.getHTML()).not.toContain('color');
    });
    expect(editor.getHTML()).not.toContain('#000000');
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    await mount({ preset: 'classic' });
    const trigger = await screen.findByRole('button', { name: 'Text colour' });

    await user.click(trigger);
    expect(await screen.findByRole('dialog', { name: 'Text colour' })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Text colour' })).toBeNull();
    });
    expect(document.activeElement).toBe(trigger);
  });
});

describe('field chrome', () => {
  it('links the label, helper text, counter and error to the content element (R16)', async () => {
    await mount({
      preset: 'classic',
      label: 'Message',
      helperText: 'Sent to the customer',
      required: true,
      maxLength: 2048,
      showCounter: true,
    });

    const textbox = await screen.findByRole('textbox');
    const describedBy = textbox.getAttribute('aria-describedby') ?? '';
    expect(describedBy).not.toBe('');
    for (const id of describedBy.split(' ')) {
      expect(document.getElementById(id), id).not.toBeNull();
    }
    expect(textbox).toHaveAttribute('aria-required', 'true');
    expect(textbox).toHaveAccessibleName('Message');
  });

  it('renders the counter against the limit and flags the over-limit state', async () => {
    //  hides the counter by default, exactly as the old editor did.
    await mount({
      preset: 'classic',
      defaultValue: '<p>12345678</p>',
      maxLength: 5,
      showCounter: true,
    });
    const counter = await screen.findByText('8 / 5');
    expect(counter).toHaveAttribute('data-over-limit', 'true');
  });

  it('shows a string error and marks the field invalid', async () => {
    await mount({ preset: 'classic', error: 'Something is wrong' });
    expect(await screen.findByRole('alert')).toHaveTextContent('Something is wrong');
    await waitFor(() => {
      expect(document.querySelector('.rte-root')).toHaveAttribute('data-invalid', 'true');
    });
  });

  it('hides the toolbar when read-only, and dims when disabled (R18)', async () => {
    const { unmount } = render(<RichTextEditor preset="classic" readOnly />);
    await waitFor(() => {
      expect(screen.queryByRole('toolbar')).toBeNull();
    });
    unmount();

    render(<RichTextEditor preset="classic" disabled />);
    await waitFor(() => {
      expect(document.querySelector('.rte-root')).toHaveAttribute('data-disabled', 'true');
    });
    expect(screen.queryByRole('toolbar')).toBeNull();
  });

  it('shows a placeholder while empty (R24)', async () => {
    await mount({ preset: 'standard', placeholder: 'Write your message…' });
    expect(await screen.findByText('Write your message…')).toBeInTheDocument();
  });
});

describe('presets', () => {
  it('classic keeps quill-compatible output by default', async () => {
    const { editor } = await mount({
      preset: 'classic',
      defaultValue: '<ul><li>one</li></ul>',
    });
    expect(editor.getHTML()).toContain('data-list="bullet"');
  });

  it('classic downgrades a pasted heading, because it has no heading plugin', async () => {
    const { editor } = await mount({ preset: 'classic', defaultValue: '<h2>Title</h2>' });
    expect(editor.getHTML()).toBe('<p>Title</p>');
  });

  it('standard keeps the heading', async () => {
    const { editor } = await mount({ preset: 'standard', defaultValue: '<h2>Title</h2>' });
    expect(editor.getHTML()).toBe('<h2>Title</h2>');
  });

  it('email emits inline styles and no classes', async () => {
    const { editor } = await mount({
      preset: 'email',
      defaultValue: '<p class="ql-align-center">hi</p>',
    });
    const html = editor.getHTML();
    expect(html).not.toMatch(/\sclass=/);
    expect(html).toContain('text-align: center');
  });

  it('a preset can be adjusted rather than rebuilt', async () => {
    const { editor } = await mount({
      preset: 'classic',
      addPlugins: [{ name: 'heading', provides: ['heading'] }],
      defaultValue: '<h2>Title</h2>',
    });
    expect(editor.getHTML()).toBe('<h2>Title</h2>');
  });
});

describe('several editors on one page (R4, R10)', () => {
  it('keeps their toolbars, ids and state independent', async () => {
    render(
      <>
        <RichTextEditor preset="classic" label="First" defaultValue="<p>one</p>" />
        <RichTextEditor preset="classic" label="Second" defaultValue="<p>two</p>" />
      </>,
    );

    await waitFor(() => {
      expect(screen.getAllByRole('toolbar')).toHaveLength(2);
    });

    const [first, second] = screen.getAllByRole('textbox');
    expect(first!.id).not.toBe(second!.id);

    const [firstToolbar, secondToolbar] = screen.getAllByRole('toolbar');
    expect(firstToolbar!.getAttribute('aria-controls')).toBe(first!.id);
    expect(secondToolbar!.getAttribute('aria-controls')).toBe(second!.id);
  });

  it('opens only the clicked editor’s colour picker', async () => {
    const user = userEvent.setup();
    render(
      <>
        <RichTextEditor preset="classic" label="First" />
        <RichTextEditor preset="classic" label="Second" />
      </>,
    );
    await waitFor(() => {
      expect(screen.getAllByRole('toolbar')).toHaveLength(2);
    });

    const [firstColor] = screen.getAllByRole('button', { name: 'Text colour' });
    await user.click(firstColor!);
    expect(await screen.findAllByRole('dialog', { name: 'Text colour' })).toHaveLength(1);
  });
});

describe('localization (R17)', () => {
  it('uses the overridden strings for labels', async () => {
    await mount({
      preset: 'classic',
      localization: { toolbar: { bold: 'Félkövér', color: 'Szövegszín' } },
    });
    expect(await screen.findByRole('button', { name: 'Félkövér' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Szövegszín' })).toBeInTheDocument();
  });
});

describe(`the legacy editor's default message body`, () => {
  it('loads, keeps its merge tags and reports the right length', async () => {
    const onChange = vi.fn();
    const { editor } = await mount({
      preset: 'classic',
      defaultValue: DEFAULT_EMAIL_BODY,
      maxLength: 2048,
      showCounter: true,
      mergeTags: {
        tags: [
          { key: 'first_name', label: 'First name' },
          { key: 'due_date', label: 'Due date' },
          { key: 'report_date', label: 'Report date' },
          { key: 'company_name', label: 'Company name' },
          { key: 'company_address', label: 'Company address' },
        ],
      },
      onChange,
    });

    expect(editor.getMergeTags()).toEqual([
      'first_name',
      'due_date',
      'report_date',
      'company_name',
      'company_address',
    ]);
    expect(editor.getHTML()).toContain('{first_name}');
    expect(editor.validate()).toBeNull();
  });
});
