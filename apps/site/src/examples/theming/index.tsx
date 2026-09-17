import { useMemo, useState } from 'react';
import {
  RichTextEditor,
  createTheme,
  themes,
  type ColorScheme,
  type Density,
  type ResolvedRteTheme,
} from 'react-rtekit';
import { CodeBlock } from '../../components/CodeBlock';

/**
 * Themes, schemes and densities.
 *
 * A theme is data. There is no visual in the library that is not one of these tokens,
 * which is what lets the theme editor list them all and what makes a brand theme three
 * lines rather than a stylesheet.
 */

const PRESETS = ['light', 'classic', 'dark', 'compact', 'bordered'] as const;
type PresetTheme = (typeof PRESETS)[number];

const DENSITIES: Density[] = ['compact', 'standard', 'comfortable'];

/** A brand theme: the default, with four values changed. */
const brandTheme = createTheme(themes.light, {
  name: 'brand',
  color: {
    accent: '#7C3AED',
    accentSoft: '#F3EDFF',
    accentBorder: '#C4B5FD',
  },
  editor: { radius: '10px' },
});

const SAMPLE =
  '<h2>Quarterly summary</h2>' +
  '<p>The <strong>April</strong> results are <em>within range</em>, with one exception.</p>' +
  '<ul><li>Revenue: on target</li><li>Costs: <span style="color: #C81E1E">above plan</span></li></ul>' +
  '<p><a href="https://example.com/report">Full report</a></p>';

export default function ThemingExample() {
  const [name, setName] = useState<PresetTheme | 'brand'>('light');
  const [colorScheme, setColorScheme] = useState<ColorScheme>('light');
  const [density, setDensity] = useState<Density>('standard');
  const [html, setHtml] = useState(SAMPLE);

  const base: ResolvedRteTheme = name === 'brand' ? brandTheme : themes[name];

  // Density is a multiplier rather than a second set of numbers, so it composes with
  // whichever theme is selected instead of replacing it.
  const theme = useMemo(() => createTheme(base, { density }), [base, density]);

  const vars = useMemo(() => theme.toCssVars(), [theme]);

  return (
    <div className="stack">
      <div className="button-row" role="radiogroup" aria-label="Theme">
        {[...PRESETS, 'brand' as const].map((entry) => (
          <button
            key={entry}
            type="button"
            role="radio"
            aria-checked={entry === name}
            className="chip"
            data-active={entry === name}
            onClick={() => {
              setName(entry);
            }}
          >
            {entry}
          </button>
        ))}
      </div>

      <div className="button-row">
        <div role="radiogroup" aria-label="Colour scheme" className="button-row">
          {(['light', 'dark', 'auto'] as ColorScheme[]).map((entry) => (
            <button
              key={entry}
              type="button"
              role="radio"
              aria-checked={entry === colorScheme}
              className="chip"
              data-active={entry === colorScheme}
              onClick={() => {
                setColorScheme(entry);
              }}
            >
              {entry}
            </button>
          ))}
        </div>

        <div role="radiogroup" aria-label="Density" className="button-row">
          {DENSITIES.map((entry) => (
            <button
              key={entry}
              type="button"
              role="radio"
              aria-checked={entry === density}
              className="chip"
              data-active={entry === density}
              onClick={() => {
                setDensity(entry);
              }}
            >
              {entry}
            </button>
          ))}
        </div>
      </div>

      <RichTextEditor
        preset="standard"
        label="Message"
        theme={theme}
        colorScheme={colorScheme}
        value={html}
        onChange={(value) => {
          setHtml(value as string);
        }}
      />

      <p className="example-basic__state" data-testid="theming-summary">
        {theme.name} · {colorScheme} · density {density} · {Object.keys(vars).length} CSS variables
      </p>

      <h2>The brand theme, in full</h2>
      <CodeBlock label="Brand theme">
        {`const brandTheme = createTheme(themes.light, {
  name: 'brand',
  color: { accent: '#7C3AED', accentSoft: '#F3EDFF', accentBorder: '#C4B5FD' },
  editor: { radius: '10px' },
});`}
      </CodeBlock>

      <h2>What that becomes</h2>
      <CodeBlock label="Theme css variables" testId="theming-vars">
        {Object.entries(vars)
          .map(([key, value]) => `${key}: ${value};`)
          .join('\n')}
      </CodeBlock>
    </div>
  );
}
