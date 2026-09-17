import { Code, Section, SeeAlso } from './Guide';

/** Three shapes of configuration, custom items, and what happens when the row runs out of room. */
export function Toolbar() {
  return (
    <>
      <p className="page__lead">
        Three shapes of configuration, custom items, and what happens when the row runs out of room.
      </p>

      <Section id="config" title="Configuring it">
        <Code label="Toolbar shapes">{`// A flat list; '|' inserts a separator.
<RichTextEditor toolbar={['bold', 'italic', '|', 'bulletList']} />

// Groups, rendered with separators between them.
<RichTextEditor toolbar={[['bold', 'italic'], ['bulletList', 'orderedList']]} />

// The object form.
<RichTextEditor
  toolbar={{
    items: [['bold', 'italic'], ['link']],
    ariaLabel: 'Message formatting',
    showLabels: true,
    size: 'sm',
  }}
/>`}</Code>
      </Section>

      <Section id="custom-items" title="Custom items">
        <Code label="A custom item">{`const signature: ToolbarItemSpec = {
  name: 'signature',
  label: 'Insert signature',
  onClick: ({ editor }) => editor.insertContent('<p>— Support</p>'),
};

<RichTextEditor toolbar={{ items: [['bold', 'italic'], [signature]] }} />`}</Code>

        <p>
          Custom items sit in the same roving-focus order as built-in ones and go through the
          same <code>onToolbarCommand</code> middleware.
        </p>
      </Section>

      <Section id="overflow" title="Overflow and placement">
        <Code label="Overflow">{`<RichTextEditor toolbarOverflow="menu" />    // extra groups move into a "more" menu
<RichTextEditor toolbarOverflow="scroll" />  // the row scrolls, with its own tab stop
<RichTextEditor toolbarOverflow="wrap" />    // the toolbar grows taller

<RichTextEditor stickyToolbar />                       // stays put while the content scrolls
<RichTextEditor toolbarPosition="bottom" />            // docks above the keyboard on mobile
<RichTextEditor floatingToolbar />                     // a bubble over the selection`}</Code>
        <p>
          The bubble toolbar is on by default only where no toolbar is docked — with one on
          screen already, a second rising over the text on every selection just duplicates it.
          Set <code>floatingToolbar</code> to ask for both, or <code>{'{ false }'}</code> to turn
          it off in an editor that docks none. It carries the items that name{' '}
          <code>bubble</code> in their <code>showIn</code>: the marks and the link, not the whole
          row.
        </p>
      </Section>

      <Section id="keyboard" title="The keyboard model">
        <p>
          The toolbar is one tab stop. Arrow keys move between controls, Home and End jump to the
          ends, and Escape puts the caret back where it was. <kbd>Alt</kbd>+<kbd>F10</kbd> reaches
          it from inside the text.
        </p>
      </Section>

      <SeeAlso examples={['toolbar-config', 'floating-toolbar', 'mobile']} guides={['accessibility', 'slots-and-handlers']} />
    </>
  );
}
