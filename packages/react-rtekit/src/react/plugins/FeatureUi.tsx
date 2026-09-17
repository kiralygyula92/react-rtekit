import type { RichTextEditorProps } from '../../types/props.js';
import type { CommandId } from '../../types/commands.js';
import type { ToolbarItemSpec } from '../../types/toolbar.js';
import { useEditorReady } from '../hooks.js';
import { LinkUi } from './LinkUi.js';
import { ImageUi } from './ImageUi.js';
import { SuggestUi } from './SuggestUi.js';
import { TableUi } from './TableUi.js';
import { AutosaveUi, FullscreenUi, PrintUi } from './ChromeUi.js';
import { FindReplaceUi } from './FindReplaceUi.js';
import { SourceViewUi } from './SourceViewUi.js';
import { ShortcutHelp } from './ShortcutHelp.js';
import { FloatingToolbarUi } from './FloatingToolbarUi.js';

/**
 * The chrome the feature plugins own.
 *
 * Popovers and menus live here rather than in the engine adapter: they are React, and
 * the engine is deliberately renderer-agnostic. One host keeps the mounting
 * rules in one place — each piece renders only when its feature is on, so a `classic`
 * editor pays nothing for the link popover it cannot open.
 *
 * These imports are deliberately static, although loading them on demand would take
 * about 5 kB out of a headless import. Each of these components *registers commands*
 * when it mounts — `openLinkEditor`, `openImageDialog`, `toggleSourceView` — so a lazy
 * one leaves its toolbar button disabled and `editor.saveDraft()` a no-op until the
 * chunk arrives. Bytes are worth less than a toolbar that works on the first frame.
 *
 * @module
 */

/** Props for {@link FeatureUi}. */
export interface FeatureUiProps {
  /** The resolved editor props, already merged with the preset's defaults. */
  props: RichTextEditorProps;
  /** Feature names the resolved plugin list provides. */
  features: ReadonlySet<string>;
  /** The keymap in force, for the shortcut reference. */
  keymap: Record<string, CommandId>;
  /** The resolved toolbar groups, for the toolbar that follows the selection. */
  groups?: ToolbarItemSpec[][];
  /** Whether a docked toolbar is on screen, which decides the bubble toolbar's default. */
  toolbarVisible?: boolean;
}

export function FeatureUi({
  props,
  features,
  keymap,
  groups = [],
  toolbarVisible = true,
}: FeatureUiProps) {
  // Nothing here can touch the imperative API before the engine exists.
  const ready = useEditorReady();
  const links = props.enableLinks ?? features.has('link');
  const images = props.enableImages ?? features.has('image');
  const tables = props.enableTables ?? features.has('table');
  const findReplace = props.enableFindReplace ?? features.has('findReplace');
  const sourceView = props.enableSourceView ?? features.has('sourceView');
  const fullscreen = props.enableFullscreen ?? features.has('fullscreen');

  // The bubble toolbar shows its own item list when one is given, and otherwise the
  // items that asked for the `bubble` surface — the marks and the link, not the whole
  // docked toolbar. Handing it every group put forty controls in a floating strip wider
  // than the viewport; `showIn` has always described which items belong here, and this
  // is what reads it.
  // Off by default wherever a docked toolbar is already on screen: two toolbars
  // offering the same commands, one of them jumping over the text as the selection
  // moves, is noise rather than a feature. Setting `floatingToolbar` asks for it
  // regardless, which is what the editors that dock no toolbar at all rely on.
  const floating = props.floatingToolbar ?? !toolbarVisible;
  const floatingItems = props.bubbleMenuItems
    ? [props.bubbleMenuItems]
    : groups
        .map((group) => group.filter((item) => (item.showIn ?? ['toolbar']).includes('bubble')))
        .filter((group) => group.length > 0);

  if (!ready) return null;

  return (
    <>
      {links ? (
        <LinkUi
          {...(props.linkValidator ? { validator: props.linkValidator } : {})}
          {...(props.defaultProtocol ? { defaultProtocol: props.defaultProtocol } : {})}
          {...(props.handlers ? { handlers: props.handlers } : {})}
        />
      ) : null}
      {images ? (
        <ImageUi
          {...(props.imageOptions ? { options: props.imageOptions } : {})}
          canUpload={props.onUpload !== undefined}
          accept={props.uploadAccept ?? 'image/*'}
        />
      ) : null}
      {tables ? <TableUi /> : null}
      <SuggestUi props={props} features={features} />
      {findReplace ? <FindReplaceUi /> : null}
      {sourceView ? <SourceViewUi /> : null}
      {fullscreen ? (
        <FullscreenUi {...(props.fullscreen !== undefined ? { fullscreen: props.fullscreen } : {})} />
      ) : null}
      {props.autosave ? (
        <AutosaveUi config={props.autosave} {...(props.handlers ? { handlers: props.handlers } : {})} />
      ) : null}
      {floating && floatingItems.length > 0 ? (
        <FloatingToolbarUi
          config={typeof floating === 'object' ? floating : {}}
          items={floatingItems}
        />
      ) : null}
      <PrintUi />
      <ShortcutHelp keymap={keymap} {...(props.disableShortcuts ? { disabled: props.disableShortcuts } : {})} />
    </>
  );
}
