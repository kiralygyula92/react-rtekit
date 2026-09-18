import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { EditorInstance } from '../../src/types/editor.js';
import {
  RichTextEditor,
  classicTheme,
  countDocument,
  documentToHtml,
  htmlToDocument,
  isEmptyHtml,
  sanitizeHtml,
} from '../../src/index.js';
import { quillFixture } from '../fixtures/quill.js';
import { XSS_PAYLOADS } from '../fixtures/xss.js';
import { officeFixture } from '../fixtures/office.js';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * One named regression test per behaviour this library fixes relative to a typical Quill
 * wrapper, `R1` to `R26`.
 *
 * These are the reason the library exists. Do not delete one: each records a way the
 * previous implementation was wrong, and the name is the contract.
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
      }}
    />,
  );
  await waitFor(() => {
    expect(instance).not.toBeNull();
  });
  return { editor: instance! };
}

/**
 * The declarations in a preset stylesheet.
 *
 * The classic preset's tokens live in CSS rather than in an inline style, so a test that
 * wants to pin one reads it from there. jsdom does not load the library's stylesheets, so
 * `getComputedStyle` cannot answer this.
 */
function presetPath(name: string): string {
  // Not `import.meta.url`: under jsdom that resolves against the document, so it is an
  // http: URL rather than a file one. The suite runs from the repo root or from the
  // package, so both are tried.
  const relative = `src/styles/presets/${name}.css`;
  for (const base of ['packages/react-rtekit/', '']) {
    const candidate = join(process.cwd(), base, relative);
    if (existsSync(candidate)) return candidate;
  }
  throw new Error(`preset stylesheet not found: ${relative}`);
}

function presetDeclarations(name: string): Map<string, string> {
  const css = readFileSync(presetPath(name), 'utf8');
  const found = new Map<string, string>();
  for (const [, token, value] of css.matchAll(/(--rte-[a-z0-9-]+):\s*([^;]+);/g)) {
    if (token !== undefined && value !== undefined) found.set(token, value.trim());
  }
  return found;
}

describe('R1: defaultValue was read once, so a reset never reached the editor', () => {
  it('a controlled value from the parent replaces the content', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState('<p>first report</p>');
      return (
        <>
          <RichTextEditor
            preset="classic"
            value={value}
            onChange={(next) => {
              setValue(next as string);
            }}
          />
          <button
            type="button"
            onClick={() => {
              setValue('<p>second report</p>');
            }}
          >
            Load other report
          </button>
        </>
      );
    }
    render(<Controlled />);
    const textbox = await screen.findByRole('textbox');
    await waitFor(() => {
      expect(textbox).toHaveTextContent('first report');
    });

    await user.click(screen.getByRole('button', { name: 'Load other report' }));
    await waitFor(() => {
      expect(textbox).toHaveTextContent('second report');
    });
  });

  it('setContent() replaces the content programmatically', async () => {
    const { editor } = await mount({ preset: 'classic', defaultValue: '<p>old</p>' });
    editor.setContent('<p>new</p>');
    expect(editor.getHTML()).toBe('<p>new</p>');
  });
});

describe('R2: an empty editor yielded <p><br></p>, so required passed', () => {
  it.each([
    ['', true],
    ['<p></p>', true],
    ['<p><br></p>', true],
    ['<p><br></p><p><br></p>', true],
    ['<p> </p>', true],
    ['<ul><li></li></ul>', true],
    ['<p>&nbsp;</p>', false],
    ['<p>x</p>', false],
  ])('isEmpty(%j) === %s', (html, expected) => {
    expect(isEmptyHtml(html)).toBe(expected);
  });

  it('the editor reports itself empty for the markup Quill produced', async () => {
    const { editor } = await mount({ preset: 'classic', defaultValue: '<p><br></p>' });
    expect(editor.isEmpty()).toBe(true);
    expect(editor.getHTML()).not.toBe('');
  });

  it('required rejects it', async () => {
    const { editor } = await mount({
      preset: 'classic',
      defaultValue: '<p><br></p>',
      required: true,
    });
    expect(editor.validate()).toBe('This field is required');
  });
});

describe('R3: the 2048 limit counted markup, so formatted text was rejected', () => {
  it('a 2000-character message with heavy formatting passes a 2048 limit', () => {
    const words = Array.from(
      { length: 250 },
      (_, index) => `<strong><em><u>word${index}</u></em></strong>`,
    ).join(' ');
    const doc = htmlToDocument(`<p>${words}</p>`);
    expect(documentToHtml(doc).length).toBeGreaterThan(2048);
    expect(countDocument(doc)).toBeLessThan(2048);
  });

  it('the counter reports characters, not bytes', async () => {
    const { editor } = await mount({
      preset: 'classic',
      defaultValue: '<p><strong>12345</strong></p>',
      maxLength: 10,
      showCounter: true,
    });
    expect(editor.getLength()).toBe(5);
    expect(await screen.findByText('5 / 10')).toBeInTheDocument();
  });
});

describe('R4: the toolbar had a hard-coded id="toolbar"', () => {
  it('three editors on one page have three distinct id sets', async () => {
    render(
      <>
        <RichTextEditor preset="classic" label="One" />
        <RichTextEditor preset="classic" label="Two" />
        <RichTextEditor preset="classic" label="Three" />
      </>,
    );
    await waitFor(() => {
      expect(screen.getAllByRole('toolbar')).toHaveLength(3);
    });

    const ids = screen.getAllByRole('textbox').map((element) => element.id);
    expect(new Set(ids).size).toBe(3);
    expect(document.querySelectorAll('#toolbar')).toHaveLength(0);
  });
});

describe('R5: toolbar buttons stole focus, so commands hit a stale selection', () => {
  it('a button click keeps the selection and formats it', async () => {
    const user = userEvent.setup();
    const { editor } = await mount({ preset: 'classic', defaultValue: '<p>format me</p>' });
    editor.focus('end');
    editor.setSelection('all');

    await user.click(await screen.findByRole('button', { name: 'Italic' }));
    await waitFor(() => {
      expect(editor.getHTML()).toContain('<em>format me</em>');
    });
  });

  it('the colour picker keeps it too', async () => {
    const user = userEvent.setup();
    const { editor } = await mount({ preset: 'classic', defaultValue: '<p>tint me</p>' });
    editor.focus('end');
    editor.setSelection('all');

    await user.click(await screen.findByRole('button', { name: 'Text colour' }));
    const dialog = await screen.findByRole('dialog', { name: 'Text colour' });
    await user.click(within(dialog).getByRole('radio', { name: 'Colour #008000' }));

    await waitFor(() => {
      expect(editor.getHTML()).toContain('#008000');
    });
  });
});

describe('R6: align-left set "" while the tracker set null', () => {
  it('left is the default and is stored as no attribute at all', async () => {
    const { editor } = await mount({ preset: 'classic', defaultValue: '<p>x</p>' });
    editor.setSelection('all');

    editor.exec('setAlign', { align: 'center' });
    expect(editor.getFormatState().block.align).toBe('center');

    editor.exec('setAlign', { align: 'left' });
    expect(editor.getFormatState().block.align).toBe('left');
    expect(editor.getHTML()).toBe('<p>x</p>');
  });

  it('exactly one alignment toggle is pressed at a time', async () => {
    await mount({ preset: 'classic', defaultValue: '<p>x</p>' });
    const toolbar = await screen.findByRole('toolbar');
    await waitFor(() => {
      const pressed = within(toolbar)
        .getAllByRole('button')
        .filter(
          (button) =>
            button.getAttribute('aria-pressed') === 'true' &&
            (button.getAttribute('aria-label') ?? '').startsWith('Align'),
        );
      expect(pressed).toHaveLength(1);
    });
  });
});

describe('R7: commands needed setTimeout(() => quill.update(), 10)', () => {
  it('a command is observable on the next line, with no waiting', async () => {
    const { editor } = await mount({ preset: 'classic', defaultValue: '<p>sync</p>' });
    editor.setSelection('all');
    editor.exec('toggleBulletList');
    // No await, no timer.
    // The classic preset serializes with the quill-compatible profile, so a list item
    // carries its `data-list` attribute.
    expect(editor.getHTML()).toContain('<li');
    expect(editor.getFormatState().list.type).toBe('bullet');
  });
});

describe('R8: format state went stale after blur', () => {
  it('collapses to the defaults when the selection goes away', async () => {
    const { editor } = await mount({ preset: 'classic', defaultValue: '<p>text</p>' });
    editor.setSelection('all');
    editor.exec('toggleBold');
    await waitFor(() => {
      expect(editor.getFormatState().marks.bold).toBe(true);
    });

    editor.blur();
    await waitFor(() => {
      expect(editor.getFormatState().marks.bold).toBe(false);
    });
  });
});

describe('R9: the editor stayed visually focused after focus moved away', () => {
  it('data-focused follows the engine, not a guessed relatedTarget', async () => {
    const { editor } = await mount({ preset: 'classic' });
    const root = document.querySelector('.rte-root');

    editor.focus('end');
    await waitFor(() => {
      expect(root).toHaveAttribute('data-focused', 'true');
    });

    editor.blur();
    await waitFor(() => {
      expect(root).toHaveAttribute('data-focused', 'false');
    });
  });
});

describe('R10: focus swapped a 1px border for 2px and shifted the content', () => {
  it('the classic theme focuses with an inset ring, not a wider border', async () => {
    expect(classicTheme.editor.focusRing).toContain('inset');
    expect(classicTheme.editor.borderWidth).toBe('1px');

    // And the element selects the preset whose stylesheet carries them.
    await mount({ preset: 'classic' });
    const root = document.querySelector<HTMLElement>('.rte-root');
    expect(root).toHaveAttribute('data-theme', 'classic');
    const classic = presetDeclarations('classic');
    expect(classic.get('--rte-focus-ring')).toContain('inset');
    expect(classic.get('--rte-border-width')).toBe('1px');
    // Nothing in the theme makes the border change on focus.
    expect(classicTheme.toCssVars()['--rte-border-width']).toBe('1px');
  });
});

describe('R11: quill.snow.css was imported globally, then fought', () => {
  it('the library ships its own scoped stylesheet in a cascade layer', async () => {
    await mount({ preset: 'classic' });
    // Nothing in the rendered tree carries a third-party editor class.
    expect(document.querySelectorAll('[class*="ql-"]')).toHaveLength(0);
    expect(document.querySelectorAll('.rte-content').length).toBeGreaterThan(0);
  });
});

describe('R12: the value was written twice, through setValue and onChange', () => {
  it('one change produces exactly one onChange call', async () => {
    const onChange = vi.fn();
    const { editor } = await mount({ preset: 'classic', onChange });
    onChange.mockClear();

    editor.setContent('<p>once</p>');
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledTimes(1);
    });
  });
});

describe('R13: the component required react-hook-form’s setValue', () => {
  it('the core takes no form-library props at all', async () => {
    // Rendering with nothing but a value and a callback is the whole contract.
    const { editor } = await mount({ preset: 'classic', defaultValue: '<p>standalone</p>' });
    expect(editor.getHTML()).toBe('<p>standalone</p>');
  });
});

describe('R14: colour Reset wrote #000000 instead of removing the format', () => {
  it('clearing removes the declaration', async () => {
    const { editor } = await mount({
      preset: 'classic',
      defaultValue: '<p><span style="color: #FF0000">red</span></p>',
    });
    editor.setSelection('all');
    editor.exec('setColor', { color: null });

    expect(editor.getHTML()).toBe('<p>red</p>');
  });
});

describe('R15: swatches were divs — no focus, no keyboard, no names', () => {
  it('every swatch is a named radio', async () => {
    const user = userEvent.setup();
    await mount({ preset: 'classic' });
    await user.click(await screen.findByRole('button', { name: 'Text colour' }));

    const dialog = await screen.findByRole('dialog', { name: 'Text colour' });
    const swatches = within(dialog).getAllByRole('radio');
    expect(swatches).toHaveLength(21);
    for (const swatch of swatches) {
      expect(swatch.tagName).toBe('BUTTON');
      expect(swatch).toHaveAccessibleName(/^Colour #/);
    }
  });
});

describe('R16: no ARIA toolbar, no aria-pressed, no accessible name, no describedby', () => {
  it('has all four', async () => {
    await mount({
      preset: 'classic',
      label: 'Message',
      helperText: 'Sent to the customer',
      error: 'Something is wrong',
    });

    const toolbar = await screen.findByRole('toolbar');
    expect(toolbar).toHaveAccessibleName('Formatting');
    expect(within(toolbar).getByRole('button', { name: 'Bold' })).toHaveAttribute('aria-pressed');

    const textbox = screen.getByRole('textbox');
    expect(textbox).toHaveAccessibleName('Message');
    const describedBy = textbox.getAttribute('aria-describedby') ?? '';
    expect(describedBy.split(' ').filter(Boolean).length).toBeGreaterThanOrEqual(2);
  });
});

describe('R17: aria-labels and picker strings were hard-coded English', () => {
  it('every one of them comes from localization', async () => {
    const user = userEvent.setup();
    await mount({
      preset: 'classic',
      localization: {
        toolbar: { bold: 'Fett', color: 'Textfarbe' },
        color: { title: 'Textfarbe', apply: 'Anwenden', reset: 'Zurücksetzen' },
      },
    });

    expect(await screen.findByRole('button', { name: 'Fett' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Textfarbe' }));
    const dialog = await screen.findByRole('dialog', { name: 'Textfarbe' });
    expect(within(dialog).getByRole('button', { name: 'Zurücksetzen' })).toBeInTheDocument();
  });
});

describe('R18: disabled mapped to Quill readOnly, with no visual difference', () => {
  it('disabled is not focusable and is marked disabled', async () => {
    const { editor } = await mount({ preset: 'classic', disabled: true });
    await waitFor(() => {
      expect(editor.isEditable()).toBe(false);
    });
    const root = document.querySelector('.rte-root');
    expect(root).toHaveAttribute('data-disabled', 'true');
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-disabled', 'true');
  });

  it('readOnly keeps the content selectable and is marked separately', async () => {
    const { editor } = await mount({ preset: 'classic', readOnly: true });
    await waitFor(() => {
      expect(editor.isEditable()).toBe(false);
    });
    const root = document.querySelector('.rte-root');
    expect(root).toHaveAttribute('data-readonly', 'true');
    expect(root).toHaveAttribute('data-disabled', 'false');
  });
});

describe('R19: nothing was sanitized, and the result was e-mailed', () => {
  it.each(XSS_PAYLOADS.slice(0, 12).map((payload) => [payload.id, payload.html] as const))(
    'the initial value is sanitized: %s',
    async (_id, html) => {
      const { editor } = await mount({ preset: 'standard', defaultValue: html });
      const output = editor.getHTML().toLowerCase();
      expect(output).not.toContain('<script');
      expect(output).not.toContain('onerror');
      expect(output).not.toContain('javascript:');
    },
  );

  it('the output is sanitized on the way out too', () => {
    expect(sanitizeHtml('<img src=x onerror=alert(1)>')).toBe('<img src="x">');
  });
});

describe('R20: Word and Google Docs pastes injected arbitrary markup', () => {
  it('a Word paste arrives clean', async () => {
    const { editor } = await mount({
      preset: 'standard',
      defaultValue: officeFixture('word-paragraphs').html,
    });
    const html = editor.getHTML();
    expect(html).not.toContain('mso-');
    expect(html).not.toContain('MsoNormal');
    expect(html).toContain('First paragraph');
  });

  it('a Google Docs paste keeps its structure and loses its noise', async () => {
    const { editor } = await mount({
      preset: 'standard',
      defaultValue: officeFixture('gdocs-paragraphs').html,
    });
    const html = editor.getHTML();
    expect(html).not.toContain('docs-internal-guid');
    expect(html.match(/<p>/g)).toHaveLength(2);
  });
});

describe('R21: onChange had no source, so controlled usage could loop', () => {
  it('reports the source of every change', async () => {
    const onChange = vi.fn();
    const { editor } = await mount({ preset: 'classic', onChange });
    onChange.mockClear();

    editor.setContent('<p>from the api</p>');
    await waitFor(() => {
      expect(onChange).toHaveBeenCalled();
    });
    expect(onChange.mock.calls.at(-1)![1]).toMatchObject({ source: 'api' });
  });

  it('a parent re-render with an equivalent value fires nothing', async () => {
    const onChange = vi.fn();
    function Controlled() {
      const [value, setValue] = useState('<p>stable</p>');
      const [, force] = useState(0);
      return (
        <>
          <RichTextEditor
            preset="classic"
            value={value}
            onChange={(next, meta) => {
              setValue(next as string);
              onChange(next, meta);
            }}
          />
          <button
            type="button"
            onClick={() => {
              force((n) => n + 1);
              setValue('<p>stable</p>');
            }}
          >
            Re-render
          </button>
        </>
      );
    }
    const user = userEvent.setup();
    render(<Controlled />);
    await screen.findByRole('textbox');
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toHaveTextContent('stable');
    });
    onChange.mockClear();

    await user.click(screen.getByRole('button', { name: 'Re-render' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('R22: 287px was a magic number repeated three times', () => {
  it('the height is a token the theme owns', async () => {
    // No theme prop: the classic preset is a visual reproduction, so it carries its
    // own tokens and the 287px lives in exactly one place.
    await mount({ preset: 'classic' });
    const root = document.querySelector<HTMLElement>('.rte-root');
    expect(root).toHaveAttribute('data-theme', 'classic');

    const classic = presetDeclarations('classic');
    expect(classic.get('--rte-min-height')).toBe('287px');
    expect(classic.get('--rte-content-padding')).toBe('12px');
    expect(classic.get('--rte-radius')).toBe('4px');

    // "Exactly one place" is the whole of R22, so it is worth asserting literally.
    const css = readFileSync(presetPath('classic'), 'utf8');
    expect(css.match(/287px/g)).toHaveLength(1);
  });

  it('minHeight overrides it', async () => {
    await mount({ preset: 'classic', minHeight: 120 });
    const root = document.querySelector<HTMLElement>('.rte-root');
    expect(root?.style.getPropertyValue('--rte-min-height')).toBe('120px');
  });
});

describe('R23: merge tags were raw text, so formatting could split them', () => {
  it('a tag is one atomic node and serializes back to {key}', async () => {
    const { editor } = await mount({
      preset: 'classic',
      defaultValue: quillFixture('default-email-body').html,
      mergeTags: { tags: [{ key: 'first_name', label: 'First name' }] },
    });

    expect(editor.getMergeTags()).toContain('first_name');

    // Formatting the whole document must not break the tag apart.
    editor.setSelection('all');
    editor.exec('toggleBold');
    expect(editor.getHTML()).toContain('{first_name}');
    expect(editor.getMergeTags()).toContain('first_name');
  });
});

describe('R24: there was no placeholder, so an empty field looked broken', () => {
  it('renders one while empty and removes it once there is content', async () => {
    const { editor } = await mount({ preset: 'standard', placeholder: 'Write your message…' });
    expect(await screen.findByText('Write your message…')).toBeInTheDocument();

    editor.setContent('<p>now it has content</p>');
    await waitFor(() => {
      expect(screen.queryByText('Write your message…')).toBeNull();
    });
  });
});

describe('R25: there was no undo affordance and no shortcut discoverability', () => {
  it('the standard toolbar has history buttons that disable correctly', async () => {
    const { editor } = await mount({ preset: 'standard', defaultValue: '<p>x</p>' });
    const undo = await screen.findByRole('button', { name: 'Undo' });
    expect(undo).toBeDisabled();

    editor.setSelection('all');
    editor.exec('toggleBold');
    await waitFor(() => {
      expect(undo).toBeEnabled();
    });
  });

  it('every control advertises its shortcut in the tooltip', async () => {
    await mount({ preset: 'standard' });
    const bold = await screen.findByRole('button', { name: 'Bold' });
    expect(bold.getAttribute('title')).toContain('Mod+B');
  });
});

describe('R26: the component re-created its handlers on every keystroke', () => {
  it('a content change does not re-render every toolbar button', async () => {
    const { editor } = await mount({ preset: 'classic', defaultValue: '<p>a</p>' });
    const toolbar = await screen.findByRole('toolbar');
    const before = within(toolbar).getAllByRole('button');

    editor.setContent('<p>ab</p>');
    await waitFor(() => {
      expect(editor.getText()).toBe('ab');
    });

    // The same DOM nodes: React reconciled rather than remounting the toolbar.
    const after = within(toolbar).getAllByRole('button');
    expect(after).toHaveLength(before.length);
    after.forEach((button, index) => {
      expect(button).toBe(before[index]);
    });
  });
});

/**
 * Regressions this library introduced and fixed, rather than inherited.
 *
 * The same rule applies: the name is the contract. Both of these were found by the
 * milestone 6 hardening pass, and both were the kind of bug that looks like nothing in
 * a unit test and destroys the field in a browser.
 */
describe('the editor survives its own server-rendered preview', () => {
  it('keeps the content element when a controlled value changes', async () => {
    // The content host carries the server's static preview as `dangerouslySetInnerHTML`
    // so the field is not a blank box before hydration. Feeding that from the
    // live `value` made React replace the host's children on every keystroke — and by
    // then those children were the engine's contenteditable element, so the editor
    // vanished mid-sentence.
    function Controlled() {
      const [value, setValue] = useState('<p>one</p>');
      return (
        <>
          <RichTextEditor
            label="Message"
            value={value}
            onChange={(next) => {
              setValue(next as string);
            }}
          />
          <button
            type="button"
            onClick={() => {
              setValue('<p>two</p>');
            }}
          >
            Change
          </button>
        </>
      );
    }

    const user = userEvent.setup();
    render(<Controlled />);

    const before = await screen.findByRole('textbox', { name: 'Message' });
    await user.click(screen.getByRole('button', { name: 'Change' }));

    await waitFor(() => {
      expect(before).toHaveTextContent('two');
    });
    // The same element, still editable: React reconciled around it rather than
    // replacing it.
    expect(screen.getByRole('textbox', { name: 'Message' })).toBe(before);
    expect(before).toHaveAttribute('contenteditable', 'true');
  });
});

describe('deleting a selection removes atomic nodes with it', () => {
  it('clears merge tags when the whole document is selected and deleted', async () => {
    const { editor } = await mount({
      preset: 'classic',
      defaultValue: '<p>Hi <span data-merge-tag="first_name">First name</span>, welcome.</p>',
      mergeTags: { tags: [{ key: 'first_name', label: 'First name' }] },
    });

    expect(editor.getMergeTags()).toEqual(['first_name']);

    editor.focus('end');
    editor.setSelection('all');

    // Through the key, not through an API that removes text by definition: the fix is
    // on the delete-key path, and a test that calls `removeText` directly would pass
    // with or without it.
    editor.engine.contentElement.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Delete', bubbles: true, cancelable: true }),
    );

    // Safari leaves a `contenteditable="false"` node inside a range it deletes, which
    // meant "select all, delete, write a new message" sent `{first_name}` to a
    // recipient whose name had never been substituted in.
    await waitFor(() => {
      expect(editor.getMergeTags()).toEqual([]);
    });
    expect(editor.isEmpty()).toBe(true);
  });
});
