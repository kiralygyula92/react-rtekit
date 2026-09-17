import { RichTextEditor } from 'react-rtekit';
import { useState } from 'react';
import { Callout, Code, Section, SeeAlso } from './Guide';

/** Install, import, first editor, controlled versus uncontrolled. */
export function GettingStarted() {
  const [value, setValue] = useState('<p>This editor is live. Type in it.</p>');

  return (
    <>
      <p className="page__lead">
        A rich-text editor you can own: every part is replaceable, every interaction is
        overridable, and nothing about it is a surprise when you need to change it.
      </p>

      <Section id="install" title="Install">
        <Code label="Install command">{`pnpm add react-rtekit
# or: npm install react-rtekit / yarn add react-rtekit`}</Code>

        <p>
          React 18 or 19 and the Lexical packages are peer dependencies, so your app controls
          their versions:
        </p>

        <Code label="Peer dependencies">{`pnpm add lexical @lexical/rich-text @lexical/list @lexical/link \\
  @lexical/history @lexical/utils @lexical/selection @lexical/code @lexical/table`}</Code>
      </Section>

      <Section id="styles" title="Import the styles">
        <p>
          One stylesheet gives you structure, prose styles and the default theme. Everything it
          contains lives in the <code>rtekit</code> cascade layer, so your own CSS wins without
          a specificity fight and without <code>!important</code>.
        </p>

        <Code label="Style import">{`import 'react-rtekit/styles.css';

// Or pick the pieces:
//   react-rtekit/base.css      structure only
//   react-rtekit/content.css   prose styles, for rendering stored HTML anywhere
//   react-rtekit/presets/classic.css`}</Code>
      </Section>

      <Section id="first-editor" title="Your first editor">
        <Code label="First editor">{`import { RichTextEditor } from 'react-rtekit';
import 'react-rtekit/styles.css';

export function MessageField() {
  const [value, setValue] = useState('<p>Hello</p>');

  return (
    <RichTextEditor
      label="Message"
      value={value}
      onChange={setValue}
      maxLength={2048}
      showCounter
    />
  );
}`}</Code>

        <RichTextEditor
          label="Message"
          value={value}
          onChange={(next) => {
            setValue(next as string);
          }}
          maxLength={2048}
          showCounter
        />
      </Section>

      <Section id="controlled" title="Controlled and uncontrolled">
        <p>
          Pass <code>value</code> and you own the state; pass <code>defaultValue</code> and the
          editor does. Both work, and neither jumps the caret: a controlled value that equals
          what the editor already has is ignored rather than re-applied.
        </p>

        <Code label="Both modes">{`// Controlled: the parent is the source of truth.
<RichTextEditor value={value} onChange={setValue} />

// Uncontrolled: read it when you need it.
const editorRef = useRef<EditorInstance>(null);
<RichTextEditor defaultValue={initial} editorRef={editorRef} />
editorRef.current?.getHTML();`}</Code>

        <p>
          Every change tells you where it came from, which is what keeps a controlled parent
          from looping:
        </p>

        <Code label="Change source">{`onChange={(value, meta) => {
  // meta.source: 'user' | 'api' | 'paste' | 'history' | 'init'
  if (meta.source === 'user') markDirty();
  setValue(value);
}}`}</Code>
      </Section>

      <Section id="presets" title="Presets">
        <p>
          A preset is a plugin bundle plus the props it implies. Start with one and adjust from
          there rather than assembling a toolbar from nothing.
        </p>

        <Code label="Presets">{`<RichTextEditor preset="minimal" />   // bold, italic, links
<RichTextEditor preset="standard" />  // the general-purpose bundle
<RichTextEditor preset="email" />     // what an e-mail client renders
<RichTextEditor preset="comment" />   // compact, submit on Ctrl+Enter
<RichTextEditor preset="full" />      // everything, including tables and images
<RichTextEditor preset="classic" />   // the legacy parity bundle`}</Code>
      </Section>

      <Callout>
        <strong>Do not render stored HTML with <code>dangerouslySetInnerHTML</code>.</strong> Use{' '}
        <code>&lt;RteContentView&gt;</code>: it sanitizes, and it applies the same prose styles the
        editor does, so a list page and the editor cannot drift apart.
      </Callout>

      <SeeAlso examples={['basic', 'controlled', 'presets']} guides={['value-and-formats', 'forms']} />
    </>
  );
}
