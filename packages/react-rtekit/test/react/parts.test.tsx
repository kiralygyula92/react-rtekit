import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Rte, presets, useEditor } from '../../src/index.js';
import type { EditorInstance } from '../../src/types/editor.js';

/**
 * The composable parts.
 *
 * The contract this file exists to hold: a field assembled from parts behaves like
 * `<RichTextEditor>`. The toolbar is a real toolbar, the label is bound to the content
 * element, the counter counts text, and the feature popovers have somewhere to mount.
 * Each of those is a place where a second implementation could silently drift from the
 * first.
 */

/** A card layout built from the parts, with the pieces a test wants to reach. */
function Card({
  onReady,
  ...options
}: Parameters<typeof useEditor>[0] & { onReady?: (editor: EditorInstance) => void }) {
  const editor = useEditor({
    plugins: presets.standard.plugins,
    ...options,
    ...(onReady ? { onReady } : {}),
  });

  return (
    <Rte.Root editor={editor} maxLength={options.maxLength}>
      <Rte.Label required>Message</Rte.Label>
      <Rte.Toolbar items={[['bold', 'italic'], ['bulletList'], ['link']]} />
      <Rte.Content placeholder="Write something…" />
      <Rte.Footer>
        <Rte.Counter max={options.maxLength} />
        <Rte.ErrorText />
      </Rte.Footer>
      <Rte.Portals features={['link']} />
    </Rte.Root>
  );
}

/** Renders the card and resolves once the engine has mounted. */
async function mountCard(
  options: Parameters<typeof useEditor>[0] = {},
): Promise<EditorInstance> {
  let instance: EditorInstance | null = null;
  render(
    <Card
      {...options}
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

describe('a field assembled from parts', () => {
  it('renders a real toolbar with the items it was given', async () => {
    await mountCard();

    const toolbar = await screen.findByRole('toolbar');
    expect(toolbar).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /bold/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /italic/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /bullet/i })).toBeInTheDocument();
    // Only what was asked for: the standard preset has more than four.
    expect(screen.queryByRole('button', { name: /underline/i })).not.toBeInTheDocument();
  });

  it('applies a command to the selection when a toolbar button is clicked (R5)', async () => {
    const editor = await mountCard({ defaultValue: '<p>Body text</p>' });
    const user = userEvent.setup();

    editor.setSelection('all');
    await user.click(screen.getByRole('button', { name: /bold/i }));

    await waitFor(() => {
      expect(editor.getHTML()).toContain('<strong>');
    });
  });

  it('binds the label to the content element', async () => {
    await mountCard();

    const textbox = await screen.findByRole('textbox');
    const label = screen.getByText('Message');
    // The label points at the editable element, so clicking it focuses the editor.
    expect(label.closest('label')).toHaveAttribute('for', textbox.id);
  });

  it('counts text rather than markup (R3)', async () => {
    await mountCard({ maxLength: 50, defaultValue: '<p><strong>Six</strong> words here</p>' });

    // "Six words here" is 14 characters; the markup around it is not counted.
    await waitFor(() => {
      expect(screen.getByText(/14\s*\/\s*50/)).toBeInTheDocument();
    });
  });

  it('gives the link popover somewhere to mount', async () => {
    const user = userEvent.setup();
    const editor = await mountCard({ defaultValue: '<p>our site</p>' });
    editor.focus('end');
    editor.setSelection('all');

    await user.click(screen.getByRole('button', { name: 'Link' }));

    // Without <Rte.Portals> this popover has nowhere to render, and the feature looks
    // broken rather than absent.
    expect(await screen.findByRole('dialog', { name: 'Link' })).toBeInTheDocument();
  });

  it('carries the colour palette that the picker needs', async () => {
    let instance: EditorInstance | null = null;
    render(
      <PaletteCard
        onReady={(editor) => {
          instance = editor;
        }}
      />,
    );
    await waitFor(() => {
      expect(instance).not.toBeNull();
    });

    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: /text colou?r/i }));

    // The configured palette, not the built-in default. Swatches are radios: the old
    // implementation's unfocusable <Box onClick> is what R15 was about.
    expect(await screen.findByRole('radio', { name: /#123456/i })).toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: /#e60000/i })).not.toBeInTheDocument();
  });
});

/** A card whose root configures the colour palette. */
function PaletteCard({ onReady }: { onReady: (editor: EditorInstance) => void }) {
  const editor = useEditor({ plugins: presets.full.plugins, defaultValue: '<p>Body</p>', onReady });
  return (
    <Rte.Root editor={editor} colors={{ palette: ['#123456', '#654321'], allowCustom: false }}>
      <Rte.Toolbar items={[['color']]} />
      <Rte.Content aria-label="Message" />
    </Rte.Root>
  );
}
