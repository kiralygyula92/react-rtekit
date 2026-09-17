import { useMemo, useState } from 'react';
import { RichTextEditor, de, en, es, hu, pseudo, type RteLocalization } from 'react-rtekit';
import { ChoiceGroup } from '../../components/ChoiceGroup';

/**
 * Four catalogues, a pseudo-locale and right-to-left.
 *
 * Every visible string, tooltip, `aria-label` and announcement comes from the
 * catalogue — which is what the pseudo-locale is for: anything that comes out in plain
 * English was never routed through it, and anything that overflows was a layout that
 * only ever fitted English (fixes R17).
 */

const CATALOGUES: { id: string; label: string; catalogue: RteLocalization }[] = [
  { id: 'en', label: 'English', catalogue: en },
  { id: 'hu', label: 'Magyar', catalogue: hu },
  { id: 'de', label: 'Deutsch', catalogue: de },
  { id: 'es', label: 'Español', catalogue: es },
  { id: 'pseudo', label: 'Pseudo', catalogue: pseudo },
];

const SAMPLE = '<p>Hover a toolbar button, or open the link popover.</p>';

/**
 * A right-to-left catalogue.
 *
 * The library ships no RTL locale, so this builds one from English with `dir` flipped:
 * the point of the demo is the mirroring, which is driven by `dir` alone because the
 * whole stylesheet is written in logical properties.
 */
const rtl: RteLocalization = { ...en, locale: 'ar', dir: 'rtl' };

export default function LocalizationExample() {
  const [id, setId] = useState('en');
  const [rightToLeft, setRightToLeft] = useState(false);
  const [html, setHtml] = useState(SAMPLE);

  const localization = useMemo(() => {
    if (rightToLeft) return rtl;
    return CATALOGUES.find((entry) => entry.id === id)?.catalogue ?? en;
  }, [id, rightToLeft]);

  return (
    <div className="stack">
      <ChoiceGroup
        label="Language"
        hint="Which catalogue the editor's own strings come from — labels, placeholders and announcements."
        options={CATALOGUES.map((entry) => ({ value: entry.id, label: entry.label }))}
        value={rightToLeft ? '' : id}
        onChange={(next) => {
          setId(next);
          setRightToLeft(false);
        }}
      />

      {/*
        Outside the radiogroup, not inside it: a checkbox among radios is a control the
        group claims to contain and cannot describe, and a screen reader announces it as
        one of N options when it is not an option at all. It is also a different question
        — direction, not language — so it gets its own line.
      */}
      <div className="choice-group">
        <div className="choice-group__head">
          <span className="choice-group__label">Direction</span>
          <span className="choice-group__hint">
            Mirrors the layout and reorders the toolbar. Independent of the catalogue.
          </span>
        </div>
        <label className="field-inline">
          <input
            type="checkbox"
            checked={rightToLeft}
            onChange={(event) => {
              setRightToLeft(event.target.checked);
            }}
          />
          Right to left
        </label>
      </div>

      <RichTextEditor
        // A catalogue change is cheap, but `dir` reorders the toolbar, so remounting
        // keeps the two modes honestly separate.
        key={`${id}-${String(rightToLeft)}`}
        preset="standard"
        label={localization.editor.label as string}
        localization={localization}
        maxLength={240}
        showCounter
        value={html}
        onChange={(value) => {
          setHtml(value as string);
        }}
      />

      <p className="example-basic__state" data-testid="localization-state">
        locale: {localization.locale} · dir: {localization.dir}
      </p>

      <p className="callout">
        Nothing above sets <code>dir</code> on the editor: the catalogue carries its own, and the
        editor follows it when no prop overrides it. The toolbar order, the indent direction, the
        alignment defaults and the popover placement all mirror with it.
      </p>

      <p className="callout">
        The pseudo-locale is a test, not a language. Every string is accented and padded by about a
        third, so a label that comes out plain was hard-coded somewhere and a control that overflows
        was sized for English.
      </p>
    </div>
  );
}
