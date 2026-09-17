import type { EditorThemeClasses } from 'lexical';

/**
 * Lexical's class-name map, pointed at our own stable class names (07 §1).
 *
 * Lexical does not ship CSS; it only puts these classes on the DOM it creates. Naming
 * them `rte-*` means the content stylesheet styles the live editor and stored HTML with
 * the same rules, which is what makes `<RteContentView>` match the editor exactly.
 *
 * @module
 */
export const lexicalTheme: EditorThemeClasses = {
  paragraph: 'rte-paragraph',
  quote: 'rte-blockquote',
  heading: {
    h1: 'rte-h1',
    h2: 'rte-h2',
    h3: 'rte-h3',
    h4: 'rte-h4',
    h5: 'rte-h5',
    h6: 'rte-h6',
  },
  list: {
    ul: 'rte-list rte-list--bullet',
    ol: 'rte-list rte-list--ordered',
    checklist: 'rte-list rte-list--check',
    listitem: 'rte-list-item',
    listitemChecked: 'rte-list-item--checked',
    listitemUnchecked: 'rte-list-item--unchecked',
    nested: { listitem: 'rte-list-item--nested' },
    olDepth: ['rte-list--ol1', 'rte-list--ol2', 'rte-list--ol3', 'rte-list--ol4', 'rte-list--ol5'],
    ulDepth: ['rte-list--ul1', 'rte-list--ul2', 'rte-list--ul3', 'rte-list--ul4', 'rte-list--ul5'],
  },
  link: 'rte-link',
  text: {
    bold: 'rte-bold',
    italic: 'rte-italic',
    underline: 'rte-underline',
    strikethrough: 'rte-strike',
    underlineStrikethrough: 'rte-underline rte-strike',
    code: 'rte-code',
    subscript: 'rte-subscript',
    superscript: 'rte-superscript',
  },
  code: 'rte-code-block',
  hashtag: 'rte-hashtag',
  indent: 'rte-indent',
  ltr: 'rte-ltr',
  rtl: 'rte-rtl',
};
