import { describe, expect, it, vi } from 'vitest';
import {
  createToolbarItem,
  definePlugin,
  featuresOf,
  resolvePluginOrder,
} from '../../src/core/plugins/define.js';
import { presets, resolvePlugins } from '../../src/core/plugins/presets.js';
import type { RtePlugin } from '../../src/types/plugin.js';

/**
 * The plugin API.
 *
 * `definePlugin` and `createToolbarItem` are identity functions — they exist for the
 * inference — so what is worth testing is the resolution around them: the order plugins
 * end up in decides which command handler wins, and the feature list decides what the
 * schema keeps rather than downgrades. Both are silent when they are wrong.
 */

const plugin = (name: string, extra: Partial<RtePlugin> = {}): RtePlugin =>
  definePlugin({ name, ...extra });

describe('definePlugin and createToolbarItem', () => {
  it('return what they were given', () => {
    const highlight = plugin('highlight');
    expect(definePlugin(highlight)).toBe(highlight);

    const item = { name: 'highlight', label: 'Highlight' };
    expect(createToolbarItem(item)).toBe(item);
  });
});

describe('resolvePluginOrder', () => {
  it('keeps registration order when nothing depends on anything', () => {
    const order = resolvePluginOrder([plugin('a'), plugin('b'), plugin('c')]);
    expect(order.map((entry) => entry.name)).toEqual(['a', 'b', 'c']);
  });

  it('puts a dependency before the plugin that wants it', () => {
    const order = resolvePluginOrder([plugin('b', { dependsOn: ['a'] }), plugin('a')]);
    expect(order.map((entry) => entry.name)).toEqual(['a', 'b']);
  });

  it('resolves a chain of dependencies', () => {
    const order = resolvePluginOrder([
      plugin('c', { dependsOn: ['b'] }),
      plugin('b', { dependsOn: ['a'] }),
      plugin('a'),
    ]);
    expect(order.map((entry) => entry.name)).toEqual(['a', 'b', 'c']);
  });

  it('reports a dependency that is not there rather than dropping the plugin', () => {
    const onMissing = vi.fn();
    const order = resolvePluginOrder([plugin('b', { dependsOn: ['missing'] })], onMissing);

    expect(onMissing).toHaveBeenCalledWith('b', 'missing');
    // The plugin still loads: a missing dependency is a warning, not a reason to give
    // the consumer an editor with a feature silently absent.
    expect(order.map((entry) => entry.name)).toEqual(['b']);
  });

  it('survives a dependency cycle instead of looping forever', () => {
    const order = resolvePluginOrder([
      plugin('a', { dependsOn: ['b'] }),
      plugin('b', { dependsOn: ['a'] }),
    ]);
    expect(order).toHaveLength(2);
  });

  it('de-duplicates by name, last registration winning', () => {
    const first = plugin('bold', { priority: 1 });
    const second = plugin('bold', { priority: 2 });
    const order = resolvePluginOrder([first, second]);

    // This is what lets `addPlugins` replace a built-in by using its name.
    expect(order).toHaveLength(1);
    expect(order[0]).toBe(second);
  });

  it('sorts by priority, higher last', () => {
    const order = resolvePluginOrder([
      plugin('high', { priority: 10 }),
      plugin('low', { priority: -10 }),
      plugin('middle'),
    ]);

    // Higher priority is registered later, so its command handler is reached first.
    expect(order.map((entry) => entry.name)).toEqual(['low', 'middle', 'high']);
  });
});

describe('featuresOf', () => {
  it('uses the plugin name when it provides nothing explicitly', () => {
    expect(featuresOf([plugin('bold'), plugin('italic')])).toEqual(['bold', 'italic']);
  });

  it('uses the provided list when there is one', () => {
    // `subSup` is one plugin and two schema features, which is why the flag that turns
    // it on is checked against `subscript` rather than against the plugin's name.
    expect(featuresOf([plugin('subSup', { provides: ['subscript', 'superscript'] })])).toEqual([
      'subscript',
      'superscript',
    ]);
  });

  it('returns nothing for no plugins', () => {
    expect(featuresOf([])).toEqual([]);
  });
});

describe('resolvePlugins', () => {
  it('returns the preset’s list', () => {
    const resolved = resolvePlugins({ preset: 'minimal' });
    expect(resolved.length).toBeGreaterThan(0);
    expect(resolved).toEqual(presets.minimal.plugins);
  });

  it('adds to the preset', () => {
    const extra = plugin('highlight');
    const resolved = resolvePlugins({ preset: 'minimal', addPlugins: [extra] });

    expect(resolved).toContain(extra);
    expect(resolved.length).toBe(presets.minimal.plugins.length + 1);
  });

  it('removes from the preset by name', () => {
    const withLink = resolvePlugins({ preset: 'standard' });
    expect(withLink.some((entry) => entry.name === 'link')).toBe(true);

    const without = resolvePlugins({ preset: 'standard', removePlugins: ['link'] });
    expect(without.some((entry) => entry.name === 'link')).toBe(false);
  });

  it('replaces the preset entirely when given an explicit list', () => {
    const only = plugin('paragraph');
    expect(resolvePlugins({ preset: 'full', plugins: [only] })).toEqual([only]);
  });

  it('gives every preset a paragraph to put text in', () => {
    for (const name of Object.keys(presets) as (keyof typeof presets)[]) {
      const features = featuresOf(resolvePlugins({ preset: name }));
      expect(features, `${name} has nowhere to put text`).toContain('paragraph');
    }
  });
});
