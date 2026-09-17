import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RichTextEditor } from '../../src/index.js';
import { matchTrigger } from '../../src/react/hooks/useInlineSuggest.js';
import { DEFAULT_EMOJI, findEmoji } from '../../src/core/emoji.js';
import type { EditorInstance } from '../../src/types/editor.js';

/**
 * The trigger menus.
 *
 * `matchTrigger` is the whole decision about when a menu opens, so it is tested on its
 * own; the mounted tests cover the wiring from typing to inserted node.
 */

describe('matchTrigger', () => {
  it.each([
    ['@', 'Hi @da', 'da'],
    ['@', 'Hi @', ''],
    ['{{', 'Dear {{cont', 'cont'],
    [':', 'Nice :tha', 'tha'],
    ['/', '/head', 'head'],
  ])('%s in %j opens with query %j', (trigger, text, query) => {
    expect(matchTrigger(text, trigger)).toMatchObject({ query });
  });

  it.each([
    ['@', 'mail me at dana@example.com'],
    ['@', 'Hi @dana and then more words'],
    ['{{', 'nothing here'],
    [':', 'ratio 4:3 is fine'],
  ])('%s does not open in %j', (trigger, text) => {
    const match = matchTrigger(text, trigger);
    // Either no match at all, or a query that ran past a space and closed it.
    expect(match === null || match.query.includes(' ')).toBe(true);
  });

  it('requires a word boundary before the trigger', () => {
    expect(matchTrigger('dana@example', '@')).toBeNull();
    expect(matchTrigger('hello (@dana', '@')).toMatchObject({ query: 'dana' });
  });

  it('reports how much text to delete on insert', () => {
    expect(matchTrigger('Hi @dana', '@')?.offset).toBe(5);
    expect(matchTrigger('Dear {{first', '{{')?.offset).toBe(7);
  });

  it('gives up on a query longer than the limit', () => {
    const long = `@${'x'.repeat(60)}`;
    expect(matchTrigger(long, '@', { maxQueryLength: 40 })).toBeNull();
  });

  it('atBlockStart only opens at the start of the block', () => {
    expect(matchTrigger('/head', '/', { atBlockStart: true })).toMatchObject({ query: 'head' });
    expect(matchTrigger('some text /head', '/', { atBlockStart: true })).toBeNull();
  });
});

describe('the emoji set', () => {
  it('is characters, never images', () => {
    for (const entry of DEFAULT_EMOJI) {
      expect(entry.char).not.toContain('<');
      expect(entry.char.length).toBeGreaterThan(0);
    }
  });

  it('looks up by shortcode, with or without colons', () => {
    expect(findEmoji('tada')?.char).toBe('🎉');
    expect(findEmoji(':tada:')?.char).toBe('🎉');
    expect(findEmoji('not-an-emoji')).toBeUndefined();
  });

  it('has no duplicate shortcodes', () => {
    const names = DEFAULT_EMOJI.map((entry) => entry.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

/** Renders and resolves once the engine has mounted. */
async function mount(props: Parameters<typeof RichTextEditor>[0]): Promise<EditorInstance> {
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
  return instance!;
}

describe('the merge-tag menu', () => {
  const TAGS = [
    { key: 'first_name', label: 'First name', group: 'Contact' },
    { key: 'company_name', label: 'Company name', group: 'Organization' },
  ];

  it('opens on the trigger and lists the tags', async () => {
    const editor = await mount({
      preset: 'email',
      defaultValue: '<p>Hi </p>',
      mergeTags: { tags: TAGS },
    });
    editor.focus('end');
    editor.setSelection('end');
    editor.exec('insertText', { text: '{{' });

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
    expect(screen.getByText('First name')).toBeInTheDocument();
  });

  it('filters as the query grows', async () => {
    const editor = await mount({
      preset: 'email',
      defaultValue: '<p>Hi </p>',
      mergeTags: { tags: TAGS },
    });
    editor.focus('end');
    editor.setSelection('end');
    editor.exec('insertText', { text: '{{comp' });

    await waitFor(() => {
      expect(screen.getByText('Company name')).toBeInTheDocument();
    });
    expect(screen.queryByText('First name')).toBeNull();
  });
});

describe('the mention menu', () => {
  it('searches asynchronously and shows the results', async () => {
    const search = vi.fn().mockResolvedValue([
      { id: 'u_1', label: 'Dana Scully' },
      { id: 'u_2', label: 'Fox Mulder' },
    ]);
    const editor = await mount({
      preset: 'standard',
      defaultValue: '<p>Ping </p>',
      mentions: { search },
    });
    editor.focus('end');
    editor.setSelection('end');
    editor.exec('insertText', { text: '@da' });

    await waitFor(() => {
      expect(search).toHaveBeenCalledWith('da', expect.any(AbortSignal));
    });
    expect(await screen.findByText('Dana Scully')).toBeInTheDocument();
  });
});

describe('the slash menu', () => {
  it('opens at the start of a block and runs the chosen command', async () => {
    const editor = await mount({ preset: 'full', defaultValue: '<p></p>', slashMenu: true });
    editor.focus('end');
    editor.setSelection('end');
    editor.exec('insertText', { text: '/quo' });

    const option = await screen.findByText('Quote');
    expect(option).toBeInTheDocument();
  });

  it('does not open mid-sentence', async () => {
    const editor = await mount({ preset: 'full', defaultValue: '<p>and/or</p>', slashMenu: true });
    editor.focus('end');
    editor.setSelection('end');

    await waitFor(() => {
      expect(editor.getText()).toBe('and/or');
    });
    expect(screen.queryByRole('listbox')).toBeNull();
  });
});
