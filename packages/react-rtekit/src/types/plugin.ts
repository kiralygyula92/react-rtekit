import type { ComponentType } from 'react';
import type { DeepPartial, Unregister } from './common.js';
import type { CommandHandler, CommandId } from './commands.js';
import type {
  EngineHandle,
  HtmlParserRule,
  HtmlSerializerRule,
  MarkdownRule,
  MarkSpec,
  NodeSpec,
} from './engine.js';
import type { EditorInstance } from './editor.js';
import type { RteLocalization } from './localization.js';
import type { ResolvedRteTheme, RteTheme } from './theme.js';
import type { SlashItemSpec, ToolbarItemSpec } from './toolbar.js';

/** Plugin system. @group Plugins */

/** What a plugin's `setup` receives. Everything registered here is cleaned up for you. */
export interface PluginContext<Options = unknown> {
  /** The instance this plugin is attached to. */
  editor: EditorInstance;
  /** The mounted engine, for anything the instance does not expose. */
  engine: EngineHandle;
  /** Subscribes to an engine event; cleaned up on teardown. */
  on: EngineHandle['on'];
  /** Runs a command through its middleware chain. */
  exec: EngineHandle['exec'];
  /** Adds a handler to a command's chain; cleaned up on teardown. */
  registerCommand<Id extends CommandId>(
    id: Id,
    handler: CommandHandler<Id>,
    priority?: number,
  ): Unregister;
  /** Teaches the engine a custom node type; cleaned up on teardown. */
  registerNode(node: NodeSpec): Unregister;
  /** Teaches the engine a custom inline mark; cleaned up on teardown. */
  registerMark(mark: MarkSpec): Unregister;
  /** This plugin's own options, as passed through `pluginOptions`. */
  getOptions(): Options;
  /** The resolved catalogue, including this plugin’s own keys under `custom`. */
  localization: RteLocalization;
  /** The resolved token tree. */
  theme: ResolvedRteTheme;
  /** Announce through the editor's polite live region. */
  announce(message: string): void;
}

/** Serializer contributions. */
export interface PluginSerializers {
  /** How this plugin’s nodes and marks are written to HTML. */
  toHTML?: HtmlSerializerRule[];
  /** How foreign HTML is recognized as this plugin’s markup. */
  fromHTML?: HtmlParserRule[];
  /** How this plugin’s nodes and marks are written to Markdown. */
  toMarkdown?: MarkdownRule[];
  /** How Markdown is recognized as this plugin’s markup. */
  fromMarkdown?: MarkdownRule[];
}

/** Sanitizer additions. These widen the allowlist; they can never widen a hard rule. */
export interface PluginSanitizeRules {
  /** Extra tags the sanitizer should keep. */
  allowTags?: string[];
  /** Extra attributes per tag; the `'*'` key applies to every tag. */
  allowAttributes?: Record<string, string[]>;
  /** Extra CSS properties allowed in an inline `style`. */
  allowStyles?: string[];
  /** Extra class names the sanitizer should keep. */
  allowClasses?: (string | RegExp)[];
}

/**
 * A plugin.
 *
 * Every built-in feature is one of these, which is what makes `enableX` props,
 * presets and third-party extensions the same mechanism.
 *
 * @example
 * ```tsx
 * const highlight = definePlugin({
 *   name: 'highlight',
 *   marks: [{ name: 'highlight', tag: 'mark' }],
 *   commands: { toggleHighlight: ({ editor }) => editor.exec('toggleBold') },
 *   keymap: { 'Mod+Shift+H': 'toggleHighlight' },
 *   sanitize: { allowTags: ['mark'] },
 * });
 * ```
 */
export interface RtePlugin<Options = unknown> {
  /** Unique id. Duplicate names are de-duplicated, last registration winning. */
  name: string;
  /** Names of plugins that must be set up first. */
  dependsOn?: string[];
  /** Feature ids this plugin adds to the active schema. Defaults to `[name]`. */
  provides?: string[];
  /** Runs once on mount; anything it returns is called on teardown. */
  setup?(ctx: PluginContext<Options>): void | (() => void);
  /** Command handlers, added to the chains of the ids they name. */
  commands?: Partial<Record<CommandId, CommandHandler>>;
  /** Custom node types this plugin introduces. */
  nodes?: NodeSpec[];
  /** Custom inline marks this plugin introduces. */
  marks?: MarkSpec[];
  /** `'Mod+B'` style bindings. A string value is a command id. */
  keymap?: Record<string, CommandId | ((ctx: PluginContext<Options>, e: KeyboardEvent) => boolean)>;
  /** Controls this plugin contributes to the toolbar. */
  toolbar?: ToolbarItemSpec[];
  /** Entries this plugin contributes to the slash palette. */
  slashItems?: SlashItemSpec[];
  /** Serializer rules, in both directions, so the markup round-trips. */
  serialize?: PluginSerializers;
  /** Sanitizer additions, so the markup survives input. */
  sanitize?: PluginSanitizeRules;
  /** Rendered inside the editor root; the home of popovers and menus. */
  ui?: ComponentType;
  /** Extra localization keys, merged under `custom`. */
  localization?: Record<string, string>;
  /** Extra theme tokens. */
  theme?: DeepPartial<RteTheme>;
  /** Default options for this plugin. */
  options?: Options;
  /** Higher runs its command handlers later, so it wins. @default 0 */
  priority?: number;
}

/** The shipped preset names. */
export type PresetName = 'minimal' | 'classic' | 'standard' | 'email' | 'comment' | 'full';
