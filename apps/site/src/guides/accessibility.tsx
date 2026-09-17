import { Code, Section, SeeAlso } from './Guide';

/** The semantics, the keyboard model, what gets announced, and how to test it. */
export function Accessibility() {
  return (
    <>
      <p className="page__lead">
        The semantics, the keyboard model, what gets announced, and how to test it.
      </p>

      <Section id="semantics" title="Semantics">
        <ul>
          <li>The content is <code>role=&quot;textbox&quot;</code> with <code>aria-multiline</code>, an accessible name from <code>label</code>, and <code>aria-describedby</code> linking the helper text, the counter and the error.</li>
          <li>The toolbar is a real <code>role=&quot;toolbar&quot;</code> with roving tabindex: one tab stop, arrows inside.</li>
          <li>Toggles expose <code>aria-pressed</code>; dropdowns expose <code>aria-expanded</code> and <code>aria-haspopup</code>.</li>
          <li>Popovers and dialogs trap focus, close on Escape and return focus to the trigger.</li>
        </ul>
      </Section>

      <Section id="keyboard" title="Keyboard">
        <p>
          Every formatting command has a binding, <code>Alt+F10</code> moves focus to the toolbar, and
          <code>Mod+/</code> opens a reference built from the keymap that is actually in force — so a
          rebound or disabled shortcut is shown as it really is.
        </p>
      </Section>

      <Section id="announcements" title="Announcements">
        <p>
          Format changes, link insertions, image uploads, list level changes, search results and
          the character limit are announced through a polite live region.
        </p>

        <Code label="Announcing your own">{`editor.announce('Template applied');`}</Code>
      </Section>

      <Section id="testing" title="Testing">
        <p>
          The library&rsquo;s own suite runs axe over every example page and fails the build on a
          serious or critical violation. For your integration, check the three things a component
          library cannot: that the field has a label, that the error is associated with it, and
          that your colours meet AA.
        </p>

        <Code label="axe in a test">{`const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
expect(results.violations.filter((v) => v.impact === 'serious')).toEqual([]);`}</Code>
      </Section>

      <SeeAlso examples={['accessibility', 'toolbar-config', 'mobile']} guides={['toolbar', 'localization']} />
    </>
  );
}
