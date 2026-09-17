/**
 * The playground's control schema (08 §4).
 *
 * Generated rather than hand-written: a prop missing from this list is a prop nobody
 * can try, so the list is the thing to keep in step with the API — not a panel full
 * of JSX that happens to mirror it.
 */

/** What the playground holds, keyed by control name. */
export type PlaygroundState = Record<string, unknown>;

/** One control in the panel. */
export type ControlSpec =
  | { name: string; label: string; type: 'boolean'; value: boolean; group: string }
  | { name: string; label: string; type: 'number'; value: number | undefined; group: string }
  | { name: string; label: string; type: 'text'; value: string; group: string }
  | { name: string; label: string; type: 'select'; value: string; options: string[]; group: string };

/** Shorthand builders, so the list below reads as data. */
const select = (
  name: string,
  label: string,
  options: string[],
  value: string,
  group: string,
): ControlSpec => ({ name, label, type: 'select', options, value, group });

const toggle = (name: string, label: string, value: boolean, group: string): ControlSpec => ({
  name,
  label,
  type: 'boolean',
  value,
  group,
});

const number = (
  name: string,
  label: string,
  value: number | undefined,
  group: string,
): ControlSpec => ({ name, label, type: 'number', value, group });

const text = (name: string, label: string, value: string, group: string): ControlSpec => ({
  name,
  label,
  type: 'text',
  value,
  group,
});

export const PLAYGROUND_CONTROLS: ControlSpec[] = [
  // ── composition ───────────────────────────────────────────────────────────
  select('preset', 'Preset', ['minimal', 'classic', 'standard', 'email', 'comment', 'full'], 'standard', 'Composition'),
  select('valueFormat', 'Value format', ['html', 'json', 'markdown', 'text'], 'html', 'Composition'),
  select('htmlProfile', 'HTML profile', ['standard', 'quill-compatible', 'email', 'minimal'], 'standard', 'Composition'),
  select('sanitize', 'Sanitize profile', ['strict', 'standard', 'email', 'permissive'], 'standard', 'Composition'),
  select('pasteMode', 'Paste mode', ['rich', 'clean', 'text'], 'rich', 'Composition'),

  // ── features ──────────────────────────────────────────────────────────────
  toggle('enableHeadings', 'Headings', true, 'Features'),
  toggle('enableLists', 'Lists', true, 'Features'),
  toggle('enableCheckList', 'Check lists', true, 'Features'),
  toggle('enableLinks', 'Links', true, 'Features'),
  toggle('enableImages', 'Images', true, 'Features'),
  toggle('enableTables', 'Tables', true, 'Features'),
  toggle('enableBlockquote', 'Blockquote', true, 'Features'),
  toggle('enableCodeBlock', 'Code blocks', true, 'Features'),
  toggle('enableColor', 'Text colour', true, 'Features'),
  toggle('enableAlign', 'Alignment', true, 'Features'),
  toggle('enableIndent', 'Indent', true, 'Features'),
  toggle('enableEmoji', 'Emoji', true, 'Features'),
  toggle('enableMergeTags', 'Merge tags', false, 'Features'),
  toggle('enableMarkdownShortcuts', 'Markdown shortcuts', false, 'Features'),
  toggle('enableFindReplace', 'Find and replace', true, 'Features'),
  toggle('enableSourceView', 'Source view', true, 'Features'),
  toggle('enableFullscreen', 'Fullscreen', true, 'Features'),

  // ── chrome ────────────────────────────────────────────────────────────────
  select('toolbarPosition', 'Toolbar position', ['top', 'bottom', 'none'], 'top', 'Chrome'),
  select('toolbarOverflow', 'Toolbar overflow', ['menu', 'wrap', 'scroll'], 'menu', 'Chrome'),
  toggle('stickyToolbar', 'Sticky toolbar', false, 'Chrome'),
  toggle('floatingToolbar', 'Bubble toolbar', false, 'Chrome'),
  text('placeholder', 'Placeholder', 'Write something…', 'Chrome'),
  number('minHeight', 'Min height', 200, 'Chrome'),
  number('maxHeight', 'Max height', undefined, 'Chrome'),
  toggle('autoGrow', 'Autogrow', true, 'Chrome'),

  // ── limits and validation ─────────────────────────────────────────────────
  number('maxLength', 'Max length', undefined, 'Limits'),
  select('countUnit', 'Count unit', ['characters', 'words'], 'characters', 'Limits'),
  select('maxLengthBehaviour', 'Over the limit', ['block', 'warn'], 'block', 'Limits'),
  toggle('showCounter', 'Show counter', true, 'Limits'),
  toggle('required', 'Required', false, 'Limits'),

  // ── appearance ────────────────────────────────────────────────────────────
  select('theme', 'Theme', ['light', 'classic', 'dark', 'compact', 'bordered'], 'light', 'Appearance'),
  select('colorScheme', 'Colour scheme', ['light', 'dark', 'auto'], 'light', 'Appearance'),
  select('density', 'Density', ['standard', 'compact', 'comfortable'], 'standard', 'Appearance'),
  toggle('unstyled', 'Unstyled', false, 'Appearance'),

  // ── locale and state ──────────────────────────────────────────────────────
  select('locale', 'Locale', ['en', 'hu', 'de', 'es', 'pseudo'], 'en', 'Locale'),
  select('dir', 'Direction', ['ltr', 'rtl'], 'ltr', 'Locale'),
  toggle('readOnly', 'Read only', false, 'State'),
  toggle('disabled', 'Disabled', false, 'State'),
];
