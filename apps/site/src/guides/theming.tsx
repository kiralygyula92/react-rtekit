import { Code, Section, SeeAlso } from './Guide';

/** Tokens, presets, dark mode, density, unstyled mode, and keeping stored content looking the same everywhere. */
export function Theming() {
  return (
    <>
      <p className="page__lead">
        Tokens, presets, dark mode, density, unstyled mode, and keeping stored content looking the same everywhere.
      </p>

      <Section id="tokens" title="Tokens">
        <p>
          Every visual the library has is a token that becomes a CSS variable. There is no
          hard-coded colour, radius or spacing anywhere in the stylesheet — which is what makes
          the theme editor&rsquo;s list exhaustive.
        </p>

        <Code label="Applying a theme">{`// A) CSS only
import 'react-rtekit/styles.css';
import 'react-rtekit/presets/classic.css';
<RichTextEditor data-theme="classic" />

// B) Tokens as data
import { classicTheme, createTheme } from 'react-rtekit';
<RichTextEditor theme={createTheme(classicTheme, { color: { accent: '#7C3AED' } })} />

// C) Application-wide
<RteThemeProvider theme={classicTheme} colorScheme="auto">…</RteThemeProvider>`}</Code>
      </Section>

      <Section id="presets" title="The shipped themes">
        <p>
          <code>light</code> is the default. <code>classic</code> reproduces the Skimmer editor exactly and is
          frozen — changing one of its values is a major version. <code>dark</code> is AA-verified,
          <code>compact</code> scales everything down, and <code>bordered</code> puts the toolbar and the
          editor in one box.
        </p>
      </Section>

      <Section id="density" title="Density">
        <p>
          Density is a multiplier rather than a second set of numbers, so it composes with any
          theme: <code>compact</code> is 0.85, <code>comfortable</code> is 1.15, and the latter is what gets
          you 44px touch targets.
        </p>
      </Section>

      <Section id="unstyled" title="Unstyled mode">
        <Code label="Unstyled">{`// Structure and prose styles, no chrome visuals.
import 'react-rtekit/base.css';
import 'react-rtekit/content.css';

<RichTextEditor
  unstyled
  classNames={{ toolbar: 'flex gap-1 border-b p-2', content: 'prose p-3 min-h-40' }}
/>`}</Code>
      </Section>

      <Section id="content-styles" title="Content styles">
        <p>
          <code>content.css</code> is shipped on its own so a list page, an e-mail preview and the
          editor all render stored HTML identically. <code>&lt;RteContentView&gt;</code> applies it for
          you, and sanitizes on the way.
        </p>
      </Section>

      <SeeAlso examples={['presets', 'readonly-and-disabled']} guides={['slots-and-handlers', 'accessibility']} />
    </>
  );
}
