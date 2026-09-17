import { useMemo, useState } from 'react';
import { RichTextEditor, de, en, es, hu, pseudo, type RteLocalization } from 'react-rtekit';

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
      <div className="button-row" role="radiogroup" aria-label="Language">
        {CATALOGUES.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="radio"
            aria-checked={entry.id === id && !rightToLeft}
            className="chip"
            data-active={entry.id === id && !rightToLeft}
            onClick={() => {
              setId(entry.id);
              setRightToLeft(false);
            }}
          >
            {entry.label}
          </button>
        ))}
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
        Nothing above sets <code>dir</code> on the editor: the catalogue carries its own,
        and the editor follows it when no prop overrides it. The toolbar order, the
        indent direction, the alignment defaults and the popover placement all mirror
        with it.
      </p>

      <p className="callout">
        The pseudo-locale is a test, not a language. Every string is accented and padded
        by about a third, so a label that comes out plain was hard-coded somewhere and a
        control that overflows was sized for English.
      </p>
    </div>
  );
}
