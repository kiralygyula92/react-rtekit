import { Callout, Code, Section, SeeAlso } from './Guide';

/** Four serializations of one document, and the two questions every form asks of it: is it empty, and how long is it? */
export function ValueAndFormats() {
  return (
    <>
      <p className="page__lead">
        Four serializations of one document, and the two questions every form asks of it: is it empty, and how long is it?
      </p>

      <Section id="formats" title="The four formats">
        <p>
          <code>valueFormat</code> decides what <code>onChange</code> hands you. All four
          describe the same document, and you can ask for any of them at any time.
        </p>

        <Code label="Value formats">{`<RichTextEditor valueFormat="html" />      // '<p>Hi</p>' — the default
<RichTextEditor valueFormat="json" />      // the portable EditorDocument
<RichTextEditor valueFormat="markdown" />  // '# Hi'
<RichTextEditor valueFormat="text" />      // 'Hi'

// Or read whichever you need, whatever the value format is:
editor.getHTML();
editor.getJSON();
editor.getMarkdown();
editor.getText();
editor.getPlainTextAlternative(); // for the text/plain part of an e-mail`}</Code>

        <p>
          Store JSON when you control both ends: it round-trips exactly and needs no parsing.
          Store HTML when something else has to read it — an e-mail, a legacy renderer, a
          different editor.
        </p>
      </Section>

      <Section id="is-empty" title="Emptiness">
        <p>
          An editor that has been typed in and cleared does not serialize to an empty string. It
          serializes to <code>&lt;p&gt;&lt;br&gt;&lt;/p&gt;</code>, which is a truthy string, and
          truthiness is why empty messages get sent.
        </p>

        <Code label="Emptiness">{`editor.isEmpty();          // true for '', '<p></p>', '<p><br></p>', '<p>   </p>'
isEmptyHtml('<p><br></p>') // true — the same rule, as a function

// A non-breaking space is content: the author typed it on purpose.
isEmptyHtml('<p>&nbsp;</p>') // false`}</Code>

        <Callout kind="warning">
          Never validate emptiness with <code>!value</code>. Use <code>editor.isEmpty()</code>, or{' '}
          <code>isEmptyHtml(value)</code>, or — in a form —{' '}
          <code>&lt;RteField&gt;</code> from <code>react-rtekit-rhf</code>, which does it for you.
        </Callout>
      </Section>

      <Section id="counting" title="Counting">
        <p>
          Limits count text, never markup. Bolding a message does not make it longer, which is
          both obvious and the opposite of what a length check on the HTML string does.
        </p>

        <Code label="Counting">{`editor.getLength();          // characters of text
editor.getLength('words');   // words
countText('<p><b>five</b></p>'); // 4

<RichTextEditor maxLength={2048} countUnit="characters" maxLengthBehaviour="block" />`}</Code>
      </Section>

      <SeeAlso examples={['value-formats', 'counter-and-limits', 'basic']} guides={['forms']} />
    </>
  );
}
