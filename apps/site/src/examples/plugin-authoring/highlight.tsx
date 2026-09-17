import { createToolbarItem, definePlugin, resolveMessage } from 'react-rtekit';

/**
 * A highlight plugin (06 §5).
 *
 * Deliberately complete rather than minimal: a plugin that adds markup without adding
 * a sanitizer rule loses its formatting on the next paste, and one that hard-codes its
 * label cannot be translated. Both are easy to forget, so both are here.
 */

/** The swatch a new highlight uses. */
const DEFAULT_COLOR = '#FFF3A3';

/** A marker pen, drawn rather than imported, so the example has no icon dependency. */
function HighlightIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
      <path d="M3 11.5 9.5 5l1.5 1.5L4.5 13H3v-1.5Z" fill="currentColor" />
      <rect x="2" y="14" width="12" height="1.5" rx="0.75" fill={DEFAULT_COLOR} />
    </svg>
  );
}

export const highlight = definePlugin({
  name: 'highlight',
  // The schema feature this adds. Without it the mark is stripped as unknown (03 §2).
  provides: ['highlight'],

  marks: [
    {
      name: 'highlight',
      tag: 'mark',
      attrs: { color: { default: DEFAULT_COLOR } },
      // Both a real <mark> and the inline style Word and Google Docs paste.
      parseHTML: [{ tag: 'mark' }, { style: 'background-color', priority: 10 }],
      toHTML: (attrs) => ['mark', { style: `background-color:${String(attrs.color)}` }],
    },
  ],

  // Reusing the background-colour command keeps one code path for "a colour on text".
  keymap: { 'Mod+Shift+H': 'setBackgroundColor' },

  toolbar: [
    createToolbarItem({
      name: 'highlight',
      kind: 'toggle',
      icon: <HighlightIcon />,
      label: (t) => resolveMessage(t.custom.highlight ?? 'Highlight'),
      shortcut: 'Mod+Shift+H',
      command: 'setBackgroundColor',
      payload: { color: DEFAULT_COLOR },
      isActive: ({ format }) => format.marks.backgroundColor !== null,
      // Also offered in the slash palette, at no extra cost.
      showIn: ['toolbar', 'slash', 'bubble'],
      keywords: ['highlight', 'marker', 'background'],
    }),
  ],

  // Without this, a pasted <mark> is dropped as an unknown tag.
  sanitize: { allowTags: ['mark'], allowAttributes: { mark: ['style'] } },

  // Every string a plugin shows belongs in the catalogue (fixes R17).
  localization: { highlight: 'Highlight' },
});
