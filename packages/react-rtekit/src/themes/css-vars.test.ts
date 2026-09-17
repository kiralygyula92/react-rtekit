import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { themeToCssVars } from './css-vars.js';
import { classicTheme, compactTheme, createTheme, darkTheme, lightTheme } from './index.js';

/**
 * The theme ↔ stylesheet contract.
 *
 * The theme names tokens by owner and the CSS names them by use, so the two can drift
 * without either side erroring: the variable just resolves to nothing and the token
 * silently does nothing. These tests are the only thing that notices.
 */

const STYLES_DIR = fileURLToPath(new URL('../styles', import.meta.url));

/** Every `--rte-*` variable the shipped stylesheets read. */
function variablesRead(): Set<string> {
  const found = new Set<string>();
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(path);
        continue;
      }
      if (!entry.name.endsWith('.css')) continue;
      for (const match of readFileSync(path, 'utf8').matchAll(/var\((--rte-[a-z0-9-]+)/g)) {
        found.add(match[1]!);
      }
    }
  };
  walk(STYLES_DIR);
  return found;
}

/**
 * Variables the CSS reads that no token owns.
 *
 * Each is set by a component at runtime rather than by a theme, so a theme that does
 * not produce it is correct.
 */
const RUNTIME_ONLY = new Set([
  // Set on the colour button so the glyph can show the active colour.
  '--rte-current-color',
  // Set by the toolbar when `sticky` is on.
  '--rte-toolbar-sticky-offset',
  // Set by the colour picker from its `columns` prop.
  '--rte-swatch-columns',
]);

/**
 * Tokens the shipped stylesheets do not read.
 *
 * They exist for consumer CSS and for presets that opt into them.
 * Anything else in this direction is a token that does nothing and should be deleted.
 */
const CONSUMER_ONLY = new Set([
  // Offered as a toolbar background; `light` and `classic` both use `transparent`.
  '--rte-color-surface-muted',
  // Paired with `--rte-color-danger` for status UI the consumer draws around the editor.
  '--rte-color-success',
]);

describe('every variable the stylesheets read is produced by a theme', () => {
  it('has no unmapped variable', () => {
    const produced = new Set(Object.keys(lightTheme.toCssVars()));
    const missing = [...variablesRead()]
      .filter((name) => !produced.has(name) && !RUNTIME_ONLY.has(name))
      .sort();
    expect(missing).toEqual([]);
  });

  it('produces no variable the stylesheets never read', () => {
    // The reverse direction: a token nothing reads is a token that does nothing.
    const read = variablesRead();
    const unused = Object.keys(lightTheme.toCssVars())
      .filter((name) => !read.has(name) && !CONSUMER_ONLY.has(name))
      .sort();
    expect(unused).toEqual([]);
  });
});

describe('the documented mapping', () => {
  it.each([
    ['editor.minHeight', '--rte-min-height', '287px'],
    ['editor.padding', '--rte-content-padding', '12px'],
    ['editor.radius', '--rte-radius', '4px'],
    ['editor.borderWidth', '--rte-border-width', '1px'],
    ['editor.background', '--rte-editor-bg', 'var(--rte-color-surface)'],
    ['editor.disabledBackground', '--rte-disabled-bg', '#FAFAFA'],
    ['toolbar.background', '--rte-toolbar-bg', 'transparent'],
    ['button.iconSize', '--rte-icon-size', '24px'],
    ['colorPicker.swatchSize', '--rte-swatch-size', '24px'],
    ['mergeTag.bg', '--rte-mergetag-bg', '#EAF6FF'],
    ['findMatch.bg', '--rte-find-bg', '#FFF3A3'],
    ['content.listIndent', '--rte-list-indent', '1.5em'],
    ['content.codeBg', '--rte-code-bg', '#F5F5F5'],
    ['font.lineHeight', '--rte-line-height', '1.5'],
  ])('%s → %s', (_path, variable, value) => {
    expect(lightTheme.toCssVars()[variable]).toBe(value);
  });

  it('numbers the heading scale', () => {
    const vars = lightTheme.toCssVars();
    expect(vars['--rte-h1-size']).toBe('2em');
    expect(vars['--rte-h6-size']).toBe('0.67em');
  });

  it('turns density into a multiplier', () => {
    expect(lightTheme.toCssVars()['--rte-density-scale']).toBe('1');
    expect(compactTheme.toCssVars()['--rte-density-scale']).toBe('0.85');
    expect(themeToCssVars({ density: 'comfortable' })['--rte-density-scale']).toBe('1.15');
  });

  it('flattens a partial override on its own', () => {
    expect(themeToCssVars({ editor: { borderWidth: '2px' } })).toEqual({ '--rte-border-width': '2px' });
  });

  it('leaves an unknown token as its kebab-cased path', () => {
    expect(themeToCssVars({ custom: { fancyThing: '3px' } } as never)['--rte-custom-fancy-thing']).toBe(
      '3px',
    );
  });

  it('omits the keys that describe the theme rather than style it', () => {
    const vars = classicTheme.toCssVars();
    expect(vars['--rte-name']).toBeUndefined();
    expect(vars['--rte-defaults']).toBeUndefined();
  });
});

describe('the classic theme reaches the stylesheet (fixes R10, R22)', () => {
  it('sets the 287px height, 12px padding and 4px radius', () => {
    const vars = classicTheme.toCssVars();
    expect(vars['--rte-min-height']).toBe('287px');
    expect(vars['--rte-content-padding']).toBe('12px');
    expect(vars['--rte-radius']).toBe('4px');
  });

  it('focuses with an inset ring and never changes the border width', () => {
    const vars = classicTheme.toCssVars();
    expect(vars['--rte-focus-ring']).toBe('inset 0 0 0 2px #2196F3');
    expect(vars['--rte-border-width']).toBe('1px');
    // Nothing in the stylesheet changes the border on focus; only the shadow appears.
    const theme = readFileSync(join(STYLES_DIR, 'theme.css'), 'utf8');
    const focusRule = theme.slice(theme.indexOf(".rte-root[data-focused='true']"));
    expect(focusRule.slice(0, focusRule.indexOf('}'))).not.toContain('border');
  });

  it('has no paragraph spacing, matching Quill', () => {
    expect(classicTheme.toCssVars()['--rte-paragraph-spacing']).toBe('0');
  });
});

describe('createTheme', () => {
  it('produces the merged variable, not the base one', () => {
    const brand = createTheme(classicTheme, { color: { accent: '#7C3AED' } });
    expect(brand.toCssVars()['--rte-color-accent']).toBe('#7C3AED');
    expect(brand.toCssVars()['--rte-min-height']).toBe('287px');
  });

  it('every shipped theme produces the same variable set', () => {
    const keys = (theme: { toCssVars(): Record<string, string> }): string[] =>
      Object.keys(theme.toCssVars()).sort();
    expect(keys(darkTheme)).toEqual(keys(lightTheme));
    expect(keys(classicTheme)).toEqual(keys(lightTheme));
    expect(keys(compactTheme)).toEqual(keys(lightTheme));
  });
});
