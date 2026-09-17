import type { RtePlugin } from '../../types/plugin.js';
import type { ToolbarItemSpec } from '../../types/toolbar.js';

/**
 * The plugin authoring API.
 *
 * `definePlugin` is an identity function with a type parameter: it exists so authors
 * get inference and autocomplete on every field without annotating the whole object.
 *
 * @module
 */

/**
 * Declares a plugin.
 *
 * @example
 * ```tsx
 * export const highlight = definePlugin({
 *   name: 'highlight',
 *   marks: [{ name: 'highlight', tag: 'mark' }],
 *   keymap: { 'Mod+Shift+H': 'toggleHighlight' },
 *   sanitize: { allowTags: ['mark'] },
 * });
 * ```
 */
export function definePlugin<Options = unknown>(plugin: RtePlugin<Options>): RtePlugin<Options> {
  return plugin;
}

/**
 * Declares a toolbar item.
 *
 * @example
 * ```tsx
 * const signature = createToolbarItem({
 *   name: 'insertSignature',
 *   icon: <SignatureIcon />,
 *   label: (t) => t.custom.insertSignature,
 *   onClick: ({ editor }) => editor.insertContent(signatureHtml),
 *   showIn: ['toolbar', 'slash'],
 * });
 * ```
 */
export function createToolbarItem(item: ToolbarItemSpec): ToolbarItemSpec {
  return item;
}

/**
 * Resolves a plugin list: dependencies first, duplicates removed.
 *
 * A plugin registered twice keeps its last definition, which is what makes
 * `addPlugins` able to replace a built-in by name.
 *
 * @param plugins the requested plugins, in registration order
 * @param onMissingDependency called with the plugin and the dependency it wanted
 */
export function resolvePluginOrder(
  plugins: RtePlugin[],
  onMissingDependency?: (plugin: string, dependency: string) => void,
): RtePlugin[] {
  const byName = new Map<string, RtePlugin>();
  for (const plugin of plugins) byName.set(plugin.name, plugin);

  const ordered: RtePlugin[] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visit = (plugin: RtePlugin): void => {
    if (visited.has(plugin.name)) return;
    if (visiting.has(plugin.name)) {
      // A cycle: emit in registration order rather than looping forever.
      return;
    }
    visiting.add(plugin.name);
    for (const dependency of plugin.dependsOn ?? []) {
      const resolved = byName.get(dependency);
      if (resolved) visit(resolved);
      else onMissingDependency?.(plugin.name, dependency);
    }
    visiting.delete(plugin.name);
    visited.add(plugin.name);
    ordered.push(plugin);
  };

  for (const plugin of byName.values()) visit(plugin);
  // Higher priority last, so its command handlers are reached first.
  return ordered.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
}

/** The feature ids a plugin list enables, for the schema downgrade. */
export function featuresOf(plugins: RtePlugin[]): string[] {
  return plugins.flatMap((plugin) => plugin.provides ?? [plugin.name]);
}
