import { act, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  Rte,
  RichTextEditor,
  RteDefaultsProvider,
  RteLocaleProvider,
  RteThemeProvider,
  darkTheme,
  useCharacterCount,
  useCommand,
  useEditor,
  useIsFocused,
  useUpload,
} from '../../src/index.js';
import type { EditorInstance } from '../../src/types/editor.js';
import { getRuntime } from '../../src/react/runtime.js';

/**
 * The app-wide providers and the small public hooks.
 *
 * The providers are how a team configures every editor in an application at once, so
 * what is checked is the precedence they document: props over the nearest provider, an
 * inner provider over an outer one, and anything a provider leaves out falling back to
 * the library's own default.
 */

describe('RteLocaleProvider', () => {
  it('overrides the keys it names and keeps English for the rest', async () => {
    render(
      <RteLocaleProvider localization={{ toolbar: { bold: 'Fett' } }}>
        <RichTextEditor preset="standard" label="Message" />
      </RteLocaleProvider>,
    );
    expect(await screen.findByRole('button', { name: 'Fett' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Italic' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Bold' })).toBeNull();
  });
});

describe('RteDefaultsProvider', () => {
  it('gives every editor below its defaults, and a prop still wins', async () => {
    render(
      <RteDefaultsProvider value={{ placeholder: 'From the provider' }}>
        <RichTextEditor preset="standard" label="First" />
        <RichTextEditor preset="standard" label="Second" placeholder="From the prop" />
      </RteDefaultsProvider>,
    );
    expect(await screen.findByText('From the provider')).toBeInTheDocument();
    expect(await screen.findByText('From the prop')).toBeInTheDocument();
  });

  it('merges nested providers, the inner one winning', async () => {
    render(
      <RteDefaultsProvider value={{ placeholder: 'Outer', readOnly: true }}>
        <RteDefaultsProvider value={{ placeholder: 'Inner' }}>
          <RichTextEditor preset="standard" label="Message" />
        </RteDefaultsProvider>
      </RteDefaultsProvider>,
    );
    expect(await screen.findByText('Inner')).toBeInTheDocument();
    expect(screen.queryByText('Outer')).toBeNull();
    // Inherited from the outer provider: read-only has no toolbar.
    await waitFor(() => {
      expect(screen.queryByRole('toolbar')).toBeNull();
    });
  });
});

describe('RteThemeProvider', () => {
  it('sets the colour scheme of the editors below', async () => {
    render(
      <RteThemeProvider theme={darkTheme} colorScheme="dark">
        <RichTextEditor preset="standard" label="Message" />
      </RteThemeProvider>,
    );
    await waitFor(() => {
      expect(document.querySelector('.rte-root')).toHaveAttribute('data-color-scheme', 'dark');
    });
  });

  it('defaults to light, and leaves the attribute off for "auto"', async () => {
    const { unmount } = render(
      <RteThemeProvider theme={darkTheme}>
        <RichTextEditor preset="standard" label="Message" />
      </RteThemeProvider>,
    );
    await waitFor(() => {
      expect(document.querySelector('.rte-root')).toHaveAttribute('data-color-scheme', 'light');
    });
    unmount();

    render(
      <RteThemeProvider theme={darkTheme} colorScheme="auto">
        <RichTextEditor preset="standard" label="Message" />
      </RteThemeProvider>,
    );
    await waitFor(() => {
      expect(document.querySelector('.rte-root')).not.toBeNull();
    });
    expect(document.querySelector('.rte-root')).not.toHaveAttribute('data-color-scheme');
  });
});

/** A headless editor with one hook's output rendered beside it. */
function HookHarness({
  children,
  defaultValue,
  onEditor,
}: {
  children: React.ReactNode;
  defaultValue?: string;
  onEditor?: (editor: EditorInstance) => void;
}) {
  const editor = useEditor({ defaultValue: defaultValue ?? '<p></p>' });
  onEditor?.(editor);
  return (
    <Rte.Root editor={editor}>
      <Rte.Content />
      {children}
    </Rte.Root>
  );
}

function BoldButton() {
  const bold = useCommand('toggleBold');
  return (
    <button type="button" aria-pressed={bold.isActive} disabled={!bold.canExec} onClick={bold.exec}>
      Bold
    </button>
  );
}

function Counts() {
  const characters = useCharacterCount();
  const words = useCharacterCount('words');
  return <output aria-label="Counts">{`${characters} characters, ${words} words`}</output>;
}

function Focus() {
  return <output aria-label="Focus">{useIsFocused() ? 'focused' : 'blurred'}</output>;
}

function Uploads() {
  const { upload, uploads } = useUpload();
  return (
    <output aria-label="Uploads" data-can-upload={typeof upload === 'function'}>
      {uploads.length}
    </output>
  );
}

describe('the public hooks', () => {
  it('useCommand reports state and runs the command', async () => {
    let editor!: EditorInstance;
    render(
      <HookHarness
        defaultValue="<p>Hello</p>"
        onEditor={(value) => {
          editor = value;
        }}
      >
        <BoldButton />
      </HookHarness>,
    );
    const button = await screen.findByRole('button', { name: 'Bold' });
    expect(button).toBeEnabled();
    expect(button).toHaveAttribute('aria-pressed', 'false');

    act(() => {
      editor.setSelection('all');
    });
    act(() => {
      button.click();
    });
    await waitFor(() => {
      expect(editor.getHTML()).toBe('<p><strong>Hello</strong></p>');
    });
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('useCharacterCount counts text, in characters or words', async () => {
    render(
      <HookHarness defaultValue="<p>Two <strong>words</strong></p>">
        <Counts />
      </HookHarness>,
    );
    expect(await screen.findByRole('status', { name: 'Counts' })).toHaveTextContent(
      '9 characters, 2 words',
    );
  });

  it('useIsFocused follows the editor', async () => {
    let editor!: EditorInstance;
    render(
      <HookHarness
        onEditor={(value) => {
          editor = value;
        }}
      >
        <Focus />
      </HookHarness>,
    );
    const output = await screen.findByRole('status', { name: 'Focus' });
    expect(output).toHaveTextContent('blurred');
    act(() => {
      getRuntime(editor).store.update({ focused: true });
    });
    expect(output).toHaveTextContent('focused');
  });

  it('useUpload starts with nothing in flight', async () => {
    render(
      <HookHarness>
        <Uploads />
      </HookHarness>,
    );
    const output = await screen.findByRole('status', { name: 'Uploads' });
    expect(output).toHaveTextContent('0');
    expect(output).toHaveAttribute('data-can-upload', 'true');
  });
});
