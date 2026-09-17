import type { RichTextEditorProps } from '../../types/props.js';
import type { CommandId } from '../../types/commands.js';
import { useEditorReady } from '../hooks.js';
import { LinkUi } from './LinkUi.js';
import { ImageUi } from './ImageUi.js';
import { SuggestUi } from './SuggestUi.js';
import { TableUi } from './TableUi.js';
import { AutosaveUi, FullscreenUi, PrintUi } from './ChromeUi.js';
import { FindReplaceUi } from './FindReplaceUi.js';
import { SourceViewUi } from './SourceViewUi.js';
import { ShortcutHelp } from './ShortcutHelp.js';

/**
 * The chrome the feature plugins own (05 §6–§10).
 *
 * Popovers and menus live here rather than in the engine adapter: they are React, and
 * the engine is deliberately renderer-agnostic (02 §2). One host keeps the mounting
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
}

export function FeatureUi({ props, features, keymap }: FeatureUiProps) {
  // Nothing here can touch the imperative API before the engine exists.
  const ready = useEditorReady();
  const links = props.enableLinks ?? features.has('link');
  const images = props.enableImages ?? features.has('image');
  const tables = props.enableTables ?? features.has('table');
  const findReplace = props.enableFindReplace ?? features.has('findReplace');
  const sourceView = props.enableSourceView ?? features.has('sourceView');
  const fullscreen = props.enableFullscreen ?? features.has('fullscreen');

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
      <PrintUi />
      <ShortcutHelp keymap={keymap} {...(props.disableShortcuts ? { disabled: props.disableShortcuts } : {})} />
    </>
  );
}
