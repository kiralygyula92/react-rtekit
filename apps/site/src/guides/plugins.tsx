import { Code, Section, SeeAlso } from './Guide';

/** Writing a plugin: a feature, its commands, its keymap, its serialization and its UI. */
export function Plugins() {
  return (
    <>
      <p className="page__lead">
        Writing a plugin: a feature, its commands, its keymap, its serialization and its UI.
      </p>

      <Section id="shape" title="What a plugin is">
        <p>
          A plugin declares a feature. It can add commands, key bindings, toolbar items, slash
          items, sanitizer rules, serializer rules, theme tokens, localization keys and a piece
          of UI. Nothing in it is required.
        </p>

        <Code label="A plugin">{`import { definePlugin } from 'react-rtekit';

export const highlight = definePlugin({
  name: 'highlight',
  // Feature ids this plugin adds to the schema. Defaults to [name].
  provides: ['highlight'],
  keymap: { 'Mod+Shift+H': 'setBackgroundColor' },
  sanitize: { allowTags: ['mark'] },
  toolbar: [
    {
      name: 'highlight',
      kind: 'toggle',
      label: 'Highlight',
      command: 'setBackgroundColor',
      payload: { color: '#FFF3A3' },
      isActive: ({ format }) => format.marks.backgroundColor !== null,
    },
  ],
});`}</Code>
      </Section>

      <Section id="using" title="Using one">
        <Code label="Adding a plugin">{`<RichTextEditor preset="standard" addPlugins={[highlight]} />

// Or replace the list entirely:
<RichTextEditor plugins={[bold, italic, link, highlight]} />

// Or drop one the preset included:
<RichTextEditor preset="full" removePlugins={['table']} />`}</Code>
      </Section>

      <Section id="commands" title="Commands">
        <p>
          Command handlers are middleware, ordered by priority. Calling <code>next()</code> reaches the
          handler registered before yours — ultimately the built-in.
        </p>

        <Code label="A command handler">{`editor.registerCommand('insertLink', (ctx, next) => {
  // Force every link inserted through this editor to open in a new tab.
  return next({ ...ctx.payload, target: '_blank', rel: 'noopener noreferrer' });
}, 10);`}</Code>
      </Section>

      <Section id="schema" title="Schema and serialization">
        <p>
          A plugin that introduces markup has to say so in both directions, or content will
          round-trip lossily: a sanitizer rule so the tag survives input, and a serializer rule
          so it survives output. Anything the active schema does not know is downgraded rather
          than dropped.
        </p>
      </Section>

      <SeeAlso examples={['toolbar-config', 'presets']} guides={['slots-and-handlers', 'sanitization']} />
    </>
  );
}
