import { useState } from 'react';
import { RichTextEditor, createToolbarItem, definePlugin } from 'react-rtekit';
import { CodeBlock } from '../../components/CodeBlock';
import source from './highlight?raw';
import { highlight } from './highlight';

/**
 * A plugin, end to end.
 *
 * Six declarations make a feature: the mark so the document can hold it, the command
 * so something can apply it, the keymap and the toolbar item so a person can reach it,
 * the sanitizer rule so it survives a paste, and the localization key so it is not
 * hard-coded English (fixes R17).
 */
const SAMPLE =
  '<p>Select a few words and press <strong>Ctrl+Shift+H</strong>, or use the toolbar button.</p>' +
  '<p>Highlighted text survives a copy and paste, because the plugin says <code>mark</code> is allowed.</p>';

export default function PluginAuthoringExample() {
  const [html, setHtml] = useState(SAMPLE);

  return (
    <div className="stack">
      <RichTextEditor
        preset="standard"
        label="Message"
        addPlugins={[highlight]}
        toolbar={[['bold', 'italic'], ['highlight'], ['undo', 'redo']]}
        localization={{ custom: { highlight: 'Highlight' } }}
        value={html}
        onChange={(value) => {
          setHtml(value as string);
        }}
      />

      <h2>Output</h2>
      <CodeBlock label="Highlight output" testId="plugin-output">
        {html}
      </CodeBlock>

      <h2>The whole plugin</h2>
      <CodeBlock label="Highlight plugin source">{source}</CodeBlock>

      <p className="callout">
        Nothing above reaches into the engine. <code>definePlugin</code> is an identity
        function — it exists so the object is inferred rather than annotated — and{' '}
        <code>{'createToolbarItem'}</code> does the same for one control. Both are re-exported
        here only so this file shows the imports a plugin author needs.
      </p>

      <p className="example-basic__state">
        {typeof definePlugin === 'function' && typeof createToolbarItem === 'function'
          ? 'definePlugin and createToolbarItem are plain functions: no registry, no side effects.'
          : ''}
      </p>
    </div>
  );
}
