import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RichTextEditor, de, en, es, hu, pseudo, pseudoize } from '../../src/index.js';
import type { RteLocalization } from '../../src/types/localization.js';

/**
 * Localization (fixes R17).
 *
 * Two things are checked here. Every shipped catalogue is *complete* — a partial one
 * falls back to English silently, which reads as a bug rather than as a gap — and
 * nothing in the UI is hard-coded, which the pseudo-locale proves by making any
 * untranslated string stand out.
 */

const CATALOGUES: [string, RteLocalization][] = [
  ['hu', hu],
  ['de', de],
  ['es', es],
];

/** Every dotted key in a catalogue. */
function keysOf(value: unknown, prefix = ''): string[] {
  if (value === null || typeof value !== 'object') return prefix ? [prefix] : [];
  return Object.entries(value).flatMap(([key, child]) =>
    keysOf(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe('the shipped catalogues', () => {
  it.each(CATALOGUES)('%s has every key English has', (_name, catalogue) => {
    // `custom` is a consumer extension point and is empty in all of them.
    const expected = keysOf(en).filter((key) => !key.startsWith('custom'));
    const actual = keysOf(catalogue).filter((key) => !key.startsWith('custom'));
    expect(actual.sort()).toEqual(expected.sort());
  });

  it.each(CATALOGUES)('%s translates rather than copying English', (_name, catalogue) => {
    // A handful legitimately match — "Emoji", "Code", "URL" — but most must differ,
    // and a catalogue that is 90% English is one somebody forgot to finish.
    const englishValues = new Map(
      keysOf(en).map((key) => [key, read(en, key)] as const),
    );
    const same = keysOf(catalogue).filter((key) => read(catalogue, key) === englishValues.get(key));
    expect(same.length).toBeLessThan(12);
  });

  it.each(CATALOGUES)('%s keeps its interpolations working', (_name, catalogue) => {
    const counter = catalogue.counter.characters;
    const result = typeof counter === 'function' ? counter({ count: 42 }) : counter;
    expect(result).toContain('42');

    const results = catalogue.find.results;
    const shown = typeof results === 'function' ? results({ index: 2, total: 9 }) : results;
    expect(shown).toContain('2');
    expect(shown).toContain('9');
  });

  it('declares its own locale tag and direction', () => {
    for (const [name, catalogue] of CATALOGUES) {
      expect(catalogue.locale).toBe(name);
      expect(catalogue.dir).toBe('ltr');
    }
  });
});

/** Reads a dotted key out of a catalogue. */
function read(catalogue: RteLocalization, key: string): unknown {
  return key
    .split('.')
    .reduce<unknown>((value, part) => (value as Record<string, unknown> | undefined)?.[part], catalogue);
}

describe('the editor uses the catalogue it is given', () => {
  it.each([
    ['hu', hu, 'Félkövér'],
    ['de', de, 'Fett'],
    ['es', es, 'Negrita'],
  ])('renders the %s toolbar', async (_name, catalogue, bold) => {
    render(<RichTextEditor preset="standard" localization={catalogue} />);
    expect(await screen.findByRole('button', { name: bold })).toBeInTheDocument();
  });

  it('takes a partial override without losing the rest', async () => {
    render(
      <RichTextEditor
        preset="standard"
        localization={{ toolbar: { bold: 'Make it loud' } }}
      />,
    );
    expect(await screen.findByRole('button', { name: 'Make it loud' })).toBeInTheDocument();
    // Everything not overridden still comes from the default catalogue.
    expect(screen.getByRole('button', { name: 'Italic' })).toBeInTheDocument();
  });
});

describe('the pseudo-locale', () => {
  it('accents and pads a string while keeping it readable', () => {
    const result = pseudoize('Bold');
    expect(result).not.toBe('Bold');
    expect(result).toContain('⟦');
    expect(result.length).toBeGreaterThan('Bold'.length);
  });

  it('keeps interpolated values intact', () => {
    const counter = pseudo.counter.characters;
    const result = typeof counter === 'function' ? counter({ count: 7 }) : counter;
    expect(result).toContain('7');
  });

  it('marks every string, so an untranslated one stands out', async () => {
    render(<RichTextEditor preset="standard" localization={pseudo} />);

    const buttons = await screen.findAllByRole('button');
    const names = buttons.map((button) => button.getAttribute('aria-label') ?? '');
    // A control whose name does not carry the marker was never localized (R17).
    expect(names.filter((name) => name !== '' && !name.startsWith('⟦'))).toEqual([]);
  });
});

describe('right-to-left', () => {
  it('mirrors the whole field, not only the text', async () => {
    render(<RichTextEditor preset="standard" dir="rtl" label="رسالة" />);

    await waitFor(() => {
      expect(document.querySelector('.rte-root')).toHaveAttribute('dir', 'rtl');
    });
  });

  it('follows the catalogue when no direction is given', async () => {
    const rtlCatalogue: Partial<RteLocalization> = { dir: 'rtl' };
    render(<RichTextEditor preset="standard" localization={rtlCatalogue} />);

    await waitFor(() => {
      expect(document.querySelector('.rte-root')).toHaveAttribute('dir', 'rtl');
    });
  });
});
