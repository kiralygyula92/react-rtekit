/**
 * Example registrations.
 *
 * Each example lives in `src/examples/<slug>/` with a default component and a `meta`
 * object; the raw source is imported with Vite's `?raw` suffix so the Code tab always
 * shows exactly what runs.
 *
 * Generated from the directories in `src/examples`; keep them in sync by adding a
 * folder with an `index.tsx` and a `meta.ts`.
 */
import { registerExample } from './registry';

import AccessibilityExample from './accessibility';
import { meta as AccessibilityMeta } from './accessibility/meta';
import AccessibilitySource from './accessibility/index.tsx?raw';
import AutosaveExample from './autosave';
import { meta as AutosaveMeta } from './autosave/meta';
import AutosaveSource from './autosave/index.tsx?raw';
import BasicExample from './basic';
import { meta as BasicMeta } from './basic/meta';
import BasicSource from './basic/index.tsx?raw';
import CommandOverridesExample from './command-overrides';
import { meta as CommandOverridesMeta } from './command-overrides/meta';
import CommandOverridesSource from './command-overrides/index.tsx?raw';
import ComposableExample from './composable';
import { meta as ComposableMeta } from './composable/meta';
import ComposableSource from './composable/index.tsx?raw';
import ContentStylesExample from './content-styles';
import { meta as ContentStylesMeta } from './content-styles/meta';
import ContentStylesSource from './content-styles/index.tsx?raw';
import ControlledExample from './controlled';
import { meta as ControlledMeta } from './controlled/meta';
import ControlledSource from './controlled/index.tsx?raw';
import CounterAndLimitsExample from './counter-and-limits';
import { meta as CounterAndLimitsMeta } from './counter-and-limits/meta';
import CounterAndLimitsSource from './counter-and-limits/index.tsx?raw';
import DesignSystemSkinExample from './design-system-skin';
import { meta as DesignSystemSkinMeta } from './design-system-skin/meta';
import DesignSystemSkinSource from './design-system-skin/index.tsx?raw';
import EmailOutputExample from './email-output';
import { meta as EmailOutputMeta } from './email-output/meta';
import EmailOutputSource from './email-output/index.tsx?raw';
import EmojiAndSlashExample from './emoji-and-slash';
import { meta as EmojiAndSlashMeta } from './emoji-and-slash/meta';
import EmojiAndSlashSource from './emoji-and-slash/index.tsx?raw';
import FindReplaceExample from './find-replace';
import { meta as FindReplaceMeta } from './find-replace/meta';
import FindReplaceSource from './find-replace/index.tsx?raw';
import FloatingToolbarExample from './floating-toolbar';
import { meta as FloatingToolbarMeta } from './floating-toolbar/meta';
import FloatingToolbarSource from './floating-toolbar/index.tsx?raw';
import FormattingExample from './formatting';
import { meta as FormattingMeta } from './formatting/meta';
import FormattingSource from './formatting/index.tsx?raw';
import FullscreenExample from './fullscreen';
import { meta as FullscreenMeta } from './fullscreen/meta';
import FullscreenSource from './fullscreen/index.tsx?raw';
import HandlersMiddlewareExample from './handlers-middleware';
import { meta as HandlersMiddlewareMeta } from './handlers-middleware/meta';
import HandlersMiddlewareSource from './handlers-middleware/index.tsx?raw';
import HeadlessExample from './headless';
import { meta as HeadlessMeta } from './headless/meta';
import HeadlessSource from './headless/index.tsx?raw';
import HistoryExample from './history';
import { meta as HistoryMeta } from './history/meta';
import HistorySource from './history/index.tsx?raw';
import HtmlInteropExample from './html-interop';
import { meta as HtmlInteropMeta } from './html-interop/meta';
import HtmlInteropSource from './html-interop/index.tsx?raw';
import ImagesExample from './images';
import { meta as ImagesMeta } from './images/meta';
import ImagesSource from './images/index.tsx?raw';
import LargeDocumentExample from './large-document';
import { meta as LargeDocumentMeta } from './large-document/meta';
import LargeDocumentSource from './large-document/index.tsx?raw';
import LegacyParityExample from './legacy-parity';
import { meta as LegacyParityMeta } from './legacy-parity/meta';
import LegacyParitySource from './legacy-parity/index.tsx?raw';
import LinksExample from './links';
import { meta as LinksMeta } from './links/meta';
import LinksSource from './links/index.tsx?raw';
import ListsExample from './lists';
import { meta as ListsMeta } from './lists/meta';
import ListsSource from './lists/index.tsx?raw';
import LocalizationExample from './localization';
import { meta as LocalizationMeta } from './localization/meta';
import LocalizationSource from './localization/index.tsx?raw';
import MarkdownExample from './markdown';
import { meta as MarkdownMeta } from './markdown/meta';
import MarkdownSource from './markdown/index.tsx?raw';
import MentionsExample from './mentions';
import { meta as MentionsMeta } from './mentions/meta';
import MentionsSource from './mentions/index.tsx?raw';
import MergeTagsExample from './merge-tags';
import { meta as MergeTagsMeta } from './merge-tags/meta';
import MergeTagsSource from './merge-tags/index.tsx?raw';
import MobileExample from './mobile';
import { meta as MobileMeta } from './mobile/meta';
import MobileSource from './mobile/index.tsx?raw';
import MultipleEditorsExample from './multiple-editors';
import { meta as MultipleEditorsMeta } from './multiple-editors/meta';
import MultipleEditorsSource from './multiple-editors/index.tsx?raw';
import PasteCleanupExample from './paste-cleanup';
import { meta as PasteCleanupMeta } from './paste-cleanup/meta';
import PasteCleanupSource from './paste-cleanup/index.tsx?raw';
import PluginAuthoringExample from './plugin-authoring';
import { meta as PluginAuthoringMeta } from './plugin-authoring/meta';
import PluginAuthoringSource from './plugin-authoring/index.tsx?raw';
import PresetsExample from './presets';
import { meta as PresetsMeta } from './presets/meta';
import PresetsSource from './presets/index.tsx?raw';
import ReadonlyAndDisabledExample from './readonly-and-disabled';
import { meta as ReadonlyAndDisabledMeta } from './readonly-and-disabled/meta';
import ReadonlyAndDisabledSource from './readonly-and-disabled/index.tsx?raw';
import SanitizationExample from './sanitization';
import { meta as SanitizationMeta } from './sanitization/meta';
import SanitizationSource from './sanitization/index.tsx?raw';
import SlotsCustomExample from './slots-custom';
import { meta as SlotsCustomMeta } from './slots-custom/meta';
import SlotsCustomSource from './slots-custom/index.tsx?raw';
import SourceViewExample from './source-view';
import { meta as SourceViewMeta } from './source-view/meta';
import SourceViewSource from './source-view/index.tsx?raw';
import TablesExample from './tables';
import { meta as TablesMeta } from './tables/meta';
import TablesSource from './tables/index.tsx?raw';
import TailwindSkinExample from './tailwind-skin';
import { meta as TailwindSkinMeta } from './tailwind-skin/meta';
import TailwindSkinSource from './tailwind-skin/index.tsx?raw';
import ThemingExample from './theming';
import { meta as ThemingMeta } from './theming/meta';
import ThemingSource from './theming/index.tsx?raw';
import ToolbarConfigExample from './toolbar-config';
import { meta as ToolbarConfigMeta } from './toolbar-config/meta';
import ToolbarConfigSource from './toolbar-config/index.tsx?raw';
import ValidationFormikExample from './validation-formik';
import { meta as ValidationFormikMeta } from './validation-formik/meta';
import ValidationFormikSource from './validation-formik/index.tsx?raw';
import ValidationRhfExample from './validation-rhf';
import { meta as ValidationRhfMeta } from './validation-rhf/meta';
import ValidationRhfSource from './validation-rhf/index.tsx?raw';
import ValueFormatsExample from './value-formats';
import { meta as ValueFormatsMeta } from './value-formats/meta';
import ValueFormatsSource from './value-formats/index.tsx?raw';

registerExample({
  ...AccessibilityMeta,
  Component: AccessibilityExample,
  source: AccessibilitySource,
});
registerExample({ ...AutosaveMeta, Component: AutosaveExample, source: AutosaveSource });
registerExample({ ...BasicMeta, Component: BasicExample, source: BasicSource });
registerExample({
  ...CommandOverridesMeta,
  Component: CommandOverridesExample,
  source: CommandOverridesSource,
});
registerExample({ ...ComposableMeta, Component: ComposableExample, source: ComposableSource });
registerExample({
  ...ContentStylesMeta,
  Component: ContentStylesExample,
  source: ContentStylesSource,
});
registerExample({ ...ControlledMeta, Component: ControlledExample, source: ControlledSource });
registerExample({
  ...CounterAndLimitsMeta,
  Component: CounterAndLimitsExample,
  source: CounterAndLimitsSource,
});
registerExample({
  ...DesignSystemSkinMeta,
  Component: DesignSystemSkinExample,
  source: DesignSystemSkinSource,
});
registerExample({ ...EmailOutputMeta, Component: EmailOutputExample, source: EmailOutputSource });
registerExample({
  ...EmojiAndSlashMeta,
  Component: EmojiAndSlashExample,
  source: EmojiAndSlashSource,
});
registerExample({ ...FindReplaceMeta, Component: FindReplaceExample, source: FindReplaceSource });
registerExample({
  ...FloatingToolbarMeta,
  Component: FloatingToolbarExample,
  source: FloatingToolbarSource,
});
registerExample({ ...FormattingMeta, Component: FormattingExample, source: FormattingSource });
registerExample({ ...FullscreenMeta, Component: FullscreenExample, source: FullscreenSource });
registerExample({
  ...HandlersMiddlewareMeta,
  Component: HandlersMiddlewareExample,
  source: HandlersMiddlewareSource,
});
registerExample({ ...HeadlessMeta, Component: HeadlessExample, source: HeadlessSource });
registerExample({ ...HistoryMeta, Component: HistoryExample, source: HistorySource });
registerExample({ ...HtmlInteropMeta, Component: HtmlInteropExample, source: HtmlInteropSource });
registerExample({ ...ImagesMeta, Component: ImagesExample, source: ImagesSource });
registerExample({
  ...LargeDocumentMeta,
  Component: LargeDocumentExample,
  source: LargeDocumentSource,
});
registerExample({
  ...LegacyParityMeta,
  Component: LegacyParityExample,
  source: LegacyParitySource,
});
registerExample({ ...LinksMeta, Component: LinksExample, source: LinksSource });
registerExample({ ...ListsMeta, Component: ListsExample, source: ListsSource });
registerExample({
  ...LocalizationMeta,
  Component: LocalizationExample,
  source: LocalizationSource,
});
registerExample({ ...MarkdownMeta, Component: MarkdownExample, source: MarkdownSource });
registerExample({ ...MentionsMeta, Component: MentionsExample, source: MentionsSource });
registerExample({ ...MergeTagsMeta, Component: MergeTagsExample, source: MergeTagsSource });
registerExample({ ...MobileMeta, Component: MobileExample, source: MobileSource });
registerExample({
  ...MultipleEditorsMeta,
  Component: MultipleEditorsExample,
  source: MultipleEditorsSource,
});
registerExample({
  ...PasteCleanupMeta,
  Component: PasteCleanupExample,
  source: PasteCleanupSource,
});
registerExample({
  ...PluginAuthoringMeta,
  Component: PluginAuthoringExample,
  source: PluginAuthoringSource,
});
registerExample({ ...PresetsMeta, Component: PresetsExample, source: PresetsSource });
registerExample({
  ...ReadonlyAndDisabledMeta,
  Component: ReadonlyAndDisabledExample,
  source: ReadonlyAndDisabledSource,
});
registerExample({
  ...SanitizationMeta,
  Component: SanitizationExample,
  source: SanitizationSource,
});
registerExample({ ...SlotsCustomMeta, Component: SlotsCustomExample, source: SlotsCustomSource });
registerExample({ ...SourceViewMeta, Component: SourceViewExample, source: SourceViewSource });
registerExample({ ...TablesMeta, Component: TablesExample, source: TablesSource });
registerExample({
  ...TailwindSkinMeta,
  Component: TailwindSkinExample,
  source: TailwindSkinSource,
});
registerExample({ ...ThemingMeta, Component: ThemingExample, source: ThemingSource });
registerExample({
  ...ToolbarConfigMeta,
  Component: ToolbarConfigExample,
  source: ToolbarConfigSource,
});
registerExample({
  ...ValidationFormikMeta,
  Component: ValidationFormikExample,
  source: ValidationFormikSource,
});
registerExample({
  ...ValidationRhfMeta,
  Component: ValidationRhfExample,
  source: ValidationRhfSource,
});
registerExample({
  ...ValueFormatsMeta,
  Component: ValueFormatsExample,
  source: ValueFormatsSource,
});

export {};
