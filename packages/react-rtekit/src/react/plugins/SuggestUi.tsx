import { useCallback, useMemo } from 'react';
import type { RichTextEditorProps } from '../../types/props.js';
import type { InlineSuggestMenuItem } from '../../types/slots.js';
import type { MentionCandidate, MergeTagDefinition, SlashMenuConfig } from '../../types/config.js';
import { DEFAULT_EMOJI } from '../../core/emoji.js';
import { useEditorContext, useLocalization } from '../context.js';
import { resolveMessage } from '../localization.js';
import { useInlineSuggest, type SuggestItem } from '../hooks/useInlineSuggest.js';
import { SuggestPopover } from '../ui/SuggestPopover.js';

/**
 * The four trigger menus.
 *
 * Merge tags, mentions, emoji and the slash palette, all through one hook and one
 * slot, so they cannot drift apart in behaviour or in accessibility. Only the menus
 * whose feature is enabled are mounted.
 *
 * @module
 */

/** Props for {@link SuggestUi}. */
export interface SuggestUiProps {
  props: RichTextEditorProps;
  features: ReadonlySet<string>;
}

export function SuggestUi({ props, features }: SuggestUiProps) {
  const mergeTags = props.enableMergeTags ?? (features.has('mergeTag') || props.mergeTags !== undefined);
  const mentions = props.enableMentions ?? (features.has('mention') || props.mentions !== undefined);
  const emoji = props.enableEmoji ?? features.has('emoji');
  const slash = props.slashMenu !== undefined ? props.slashMenu !== false : features.has('slashMenu');

  return (
    <>
      {mergeTags && props.mergeTags ? <MergeTagSuggest config={props.mergeTags} /> : null}
      {mentions && props.mentions ? <MentionSuggest config={props.mentions} /> : null}
      {emoji ? <EmojiSuggest /> : null}
      {slash ? <SlashSuggest config={typeof props.slashMenu === 'object' ? props.slashMenu : {}} /> : null}
    </>
  );
}

/** Turns suggest items into the rows the slot renders. */
function toRows<Item extends SuggestItem>(items: Item[]): InlineSuggestMenuItem<Item>[] {
  return items.map((item) => ({
    key: item.id,
    label: item.label,
    ...(item.description ? { description: item.description } : {}),
    ...(item.group ? { group: item.group } : {}),
    data: item,
  }));
}

/** `{{` — insert a merge tag. */
function MergeTagSuggest({ config }: { config: NonNullable<RichTextEditorProps['mergeTags']> }) {
  const editor = useEditorContext();
  const t = useLocalization();

  const items = useMemo(
    () =>
      config.tags.map((tag: MergeTagDefinition) => ({
        id: tag.key,
        label: tag.label ?? tag.key,
        ...(tag.description ? { description: tag.description } : {}),
        ...(tag.group ? { group: tag.group } : {}),
        ...(tag.sample ? { keywords: [tag.sample] } : {}),
      })),
    [config.tags],
  );

  const suggest = useInlineSuggest({
    trigger: config.trigger ?? '{{',
    items,
    onSelect: (item) => {
      editor.exec('insertMergeTag', { key: item.id });
    },
  });

  return (
    <SuggestPopover
      suggest={suggest}
      rows={toRows(suggest.items)}
      label={resolveMessage(t.mergeTag.title)}
      emptyMessage={resolveMessage(t.mergeTag.noResults)}
    />
  );
}

/** `@` — mention someone. */
function MentionSuggest({ config }: { config: NonNullable<RichTextEditorProps['mentions']> }) {
  const editor = useEditorContext();
  const t = useLocalization();

  const search = useCallback(
    async (query: string, signal: AbortSignal) => {
      const results = await config.search(query, signal);
      return results.map((candidate: MentionCandidate) => ({
        id: candidate.id,
        label: candidate.label,
        ...(candidate.description ? { description: candidate.description } : {}),
      }));
    },
    [config],
  );

  const suggest = useInlineSuggest({
    trigger: config.trigger ?? '@',
    search,
    onSelect: (item) => {
      const candidate = { id: item.id, label: item.label };
      if (config.insert) config.insert(candidate, editor);
      else editor.exec('insertMention', candidate);
    },
  });

  return (
    <SuggestPopover
      suggest={suggest}
      rows={toRows(suggest.items)}
      label={resolveMessage(t.toolbar.mention)}
      emptyMessage={resolveMessage(suggest.loading ? t.mention.loading : t.mention.noResults)}
    />
  );
}

/** `:` — insert an emoji character. */
function EmojiSuggest() {
  const editor = useEditorContext();
  const t = useLocalization();

  const items = useMemo(
    () =>
      DEFAULT_EMOJI.map((entry) => ({
        id: entry.name,
        label: `${entry.char} ${entry.name}`,
        keywords: entry.keywords,
        group: entry.group,
      })),
    [],
  );

  const suggest = useInlineSuggest({
    trigger: ':',
    items,
    // Two characters before anything shows: a lone `:` is a colon far more often
    // than it is the start of an emoji.
    onSelect: (item) => {
      const entry = DEFAULT_EMOJI.find((candidate) => candidate.name === item.id);
      if (entry) editor.exec('insertEmoji', { char: entry.char });
    },
  });

  const open = suggest.open && suggest.query.length >= 2;
  return (
    <SuggestPopover
      suggest={{ ...suggest, open }}
      rows={toRows(suggest.items)}
      label={resolveMessage(t.emoji.title)}
      emptyMessage={resolveMessage(t.emoji.noResults)}
    />
  );
}

/** `/` — the command palette. */
function SlashSuggest({ config }: { config: SlashMenuConfig }) {
  const editor = useEditorContext();
  const t = useLocalization();

  const items = useMemo(() => {
    const all = [
      { id: 'heading1', label: 'Heading 1', run: () => editor.exec('setBlockType', { type: 'heading', level: 1 }) },
      { id: 'heading2', label: 'Heading 2', run: () => editor.exec('setBlockType', { type: 'heading', level: 2 }) },
      { id: 'heading3', label: 'Heading 3', run: () => editor.exec('setBlockType', { type: 'heading', level: 3 }) },
      { id: 'bulletList', label: 'Bulleted list', run: () => editor.exec('toggleBulletList') },
      { id: 'orderedList', label: 'Numbered list', run: () => editor.exec('toggleOrderedList') },
      { id: 'checkList', label: 'Check list', run: () => editor.exec('toggleCheckList') },
      { id: 'blockquote', label: 'Quote', run: () => editor.exec('setBlockType', { type: 'blockquote' }) },
      { id: 'codeBlock', label: 'Code block', run: () => editor.exec('setBlockType', { type: 'codeBlock' }) },
      { id: 'horizontalRule', label: 'Divider', run: () => editor.exec('insertHorizontalRule') },
      { id: 'table', label: 'Table', run: () => editor.exec('insertTable', { rows: 3, cols: 3 }) },
      { id: 'image', label: 'Image', run: () => editor.exec('openImageDialog') },
      { id: 'link', label: 'Link', run: () => editor.exec('openLinkEditor') },
    ];
    return config.items ? all.filter((item) => config.items!.includes(item.id)) : all;
  }, [config.items, editor]);

  const suggest = useInlineSuggest({
    trigger: config.trigger ?? '/',
    items,
    // A palette that opens mid-sentence turns every date into a menu.
    atBlockStart: config.emptyBlockOnly !== false,
    onSelect: (item) => {
      items.find((candidate) => candidate.id === item.id)?.run();
    },
  });

  return (
    <SuggestPopover
      suggest={suggest}
      rows={toRows(suggest.items)}
      label={resolveMessage(t.slash.title)}
      emptyMessage={resolveMessage(t.slash.noResults)}
    />
  );
}
