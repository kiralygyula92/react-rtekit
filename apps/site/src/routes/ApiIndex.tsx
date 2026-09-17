import { Link } from 'react-router';

/** The generated API reference index. */
export const API_PAGES = [
  { slug: 'rich-text-editor', title: '<RichTextEditor>', description: 'Every prop, grouped and searchable.' },
  { slug: 'editor-instance', title: 'EditorInstance', description: 'The imperative handle.' },
  { slug: 'commands', title: 'Commands', description: 'Every command id, payload and default binding.' },
  { slug: 'hooks', title: 'Hooks', description: 'useEditor, useEditorState, useFormatState, useCommand…' },
  { slug: 'slots', title: 'Slots', description: 'Every replaceable component and its context props.' },
  { slug: 'handlers', title: 'Handlers', description: 'Interaction middleware and their contexts.' },
  { slug: 'plugins', title: 'Plugins', description: 'The plugin API and the built-in plugin list.' },
  { slug: 'theme-tokens', title: 'Theme tokens', description: 'Every token and its CSS variable.' },
  { slug: 'localization', title: 'Localization', description: 'Every message key.' },
  { slug: 'icons', title: 'Icons', description: 'Every replaceable icon.' },
  { slug: 'types', title: 'Types', description: 'The exported type surface.' },
  { slug: 'utilities', title: 'Utilities', description: 'sanitizeHtml, htmlToDocument, countText…' },
];

export function ApiIndex() {
  return (
    <div className="page">
      <h1>API reference</h1>
      <p className="page__lead">
        Props come from TypeDoc; slots, commands, handlers, tokens, locale keys and icons come
        from the library&rsquo;s runtime metadata, so these lists cannot drift.
      </p>
      <ul className="card-grid">
        {API_PAGES.map((page) => (
          <li key={page.slug}>
            <Link className="card" to={`/api/${page.slug}`}>
              <h2>{page.title}</h2>
              <p>{page.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
