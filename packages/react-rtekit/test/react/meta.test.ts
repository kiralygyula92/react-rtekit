import { describe, expect, it } from 'vitest';
import { meta } from '../../src/meta.js';
import { defaultIcons } from '../../src/icons/index.js';
import { defaultSlots } from '../../src/react/slots/defaults.js';
import { lightTheme } from '../../src/themes/index.js';
import { en } from '../../src/locales/en.js';

/**
 * Runtime metadata (08 §6.4).
 *
 * The docs site builds its slot, command, handler, token, locale and icon pages from
 * `meta`. If it goes out of step with the implementation the pages silently lie, so
 * these tests compare it against the registries it claims to describe.
 */

describe('completeness', () => {
  it('describes every slot the library ships', () => {
    expect(meta.slots.map((entry) => entry.name).sort()).toEqual(Object.keys(defaultSlots).sort());
  });

  it('describes every icon', () => {
    expect(meta.icons).toEqual(Object.keys(defaultIcons).sort());
  });

  it('lists every theme token as its CSS variable', () => {
    expect(meta.tokens.map((entry) => entry.name).sort()).toEqual(
      Object.keys(lightTheme.toCssVars()).sort(),
    );
    for (const token of meta.tokens) {
      expect(token.name.startsWith('--rte-')).toBe(true);
    }
  });

  it('lists every localization key, dotted', () => {
    const flatten = (value: unknown, prefix = ''): string[] =>
      value === null || typeof value !== 'object'
        ? prefix
          ? [prefix]
          : []
        : Object.entries(value).flatMap(([key, child]) =>
            flatten(child, prefix ? `${prefix}.${key}` : key),
          );

    expect(meta.localizationKeys).toEqual(flatten(en).sort());
    expect(meta.localizationKeys).toContain('toolbar.bold');
    expect(meta.localizationKeys).toContain('color.reset');
  });

  it('covers the commands the parity toolbar runs', () => {
    const names = meta.commands.map((entry) => entry.name);
    for (const command of ['toggleBold', 'toggleItalic', 'toggleUnderline', 'setColor', 'setAlign', 'toggleBulletList']) {
      expect(names).toContain(command);
    }
  });

  it('covers every middleware entry point', () => {
    const names = meta.handlers.map((entry) => entry.name);
    expect(names).toContain('onToolbarCommand');
    expect(names).toContain('onSanitizeViolation');
    expect(names).toContain('onBeforeChange');
  });

  it('lists the plugins each preset installs', () => {
    const bold = meta.plugins.find((entry) => entry.name === 'bold');
    expect(bold?.description).toContain('classic');
    expect(bold?.description).toContain('standard');
  });
});

describe('shape', () => {
  it('gives every entry a name, a group and a description', () => {
    const lists = [meta.slots, meta.commands, meta.handlers, meta.toolbarItems, meta.tokens, meta.plugins];
    for (const list of lists) {
      expect(list.length).toBeGreaterThan(0);
      for (const entry of list) {
        expect(entry.name).not.toBe('');
        expect(entry.group).not.toBe('');
        expect(entry.description).not.toBe('');
      }
    }
  });

  it('has no duplicate names within a list', () => {
    for (const list of [meta.slots, meta.commands, meta.handlers, meta.toolbarItems]) {
      const names = list.map((entry) => entry.name);
      expect(new Set(names).size).toBe(names.length);
    }
  });

  it('reports the library version', () => {
    expect(meta.version).toMatch(/^\d+\.\d+\.\d+/);
  });
});
