import { Code, Section, SeeAlso } from './Guide';

/** Every string, the shipped catalogues, an i18next recipe, and right-to-left. */
export function Localization() {
  return (
    <>
      <p className="page__lead">
        Every string, the shipped catalogues, an i18next recipe, and right-to-left.
      </p>

      <Section id="catalogues" title="Catalogues">
        <p>
          Every visible string, tooltip, <code>aria-label</code> and announcement comes from the
          catalogue. English, Hungarian, German and Spanish ship complete — a partial catalogue
          falls back silently, and a half-translated editor reads like a broken one.
        </p>

        <Code label="Using a catalogue">{`import { de } from 'react-rtekit';

<RichTextEditor localization={de} />

// Or override a few strings on top of the default:
<RichTextEditor localization={{ toolbar: { bold: 'Make it loud' } }} />`}</Code>
      </Section>

      <Section id="i18next" title="With i18next">
        <Code label="i18next">{`const { t } = useTranslation('editor');

<RichTextEditor
  localization={{
    toolbar: { bold: t('bold'), italic: t('italic') },
    counter: { characters: ({ count }) => t('characters', { count }) },
  }}
/>`}</Code>

        <p>
          A value may be a function, which is how plural rules and locale-specific ordering are
          expressed without the library inventing an interpolation syntax.
        </p>
      </Section>

      <Section id="rtl" title="Right to left">
        <p>
          <code>dir=&quot;rtl&quot;</code> mirrors the whole field — the toolbar order, the indent direction, the
          alignment defaults and the popover placement — because the stylesheet is written in
          logical properties. A catalogue can carry its own <code>dir</code>, which the editor follows
          when no prop is given.
        </p>
      </Section>

      <Section id="pseudo" title="The pseudo-locale">
        <p>
          <code>pseudo</code> accents and pads every string. Anything that comes out plain was never
          routed through the catalogue, and anything that overflows was a layout that only ever
          fit English.
        </p>

        <Code label="Pseudo-locale">{`import { pseudo } from 'react-rtekit';

<RichTextEditor localization={pseudo} />`}</Code>
      </Section>

      <SeeAlso examples={['accessibility']} guides={['accessibility', 'theming']} />
    </>
  );
}
