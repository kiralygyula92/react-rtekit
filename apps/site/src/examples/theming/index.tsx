import { useMemo, useState } from 'react';
import {
  RichTextEditor,
  createTheme,
  themes,
  type ColorScheme,
  type Density,
  type ResolvedRteTheme,
} from 'react-rtekit';
import { ChoiceGroup } from '../../components/ChoiceGroup';
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
      <ChoiceGroup
        label="Theme"
        hint="A whole set of tokens — colours, radii, spacing — as one object."
        options={[...PRESETS, 'brand' as const]}
        value={name}
        onChange={setName}
      />

      <ChoiceGroup
        label="Colour scheme"
        hint="Which palette the theme resolves to. Auto follows the operating system."
        options={['light', 'dark', 'auto'] as ColorScheme[]}
        value={colorScheme}
        onChange={setColorScheme}
      />

      <ChoiceGroup
        label="Density"
        hint="Scales every spacing token at once, so it composes with any theme rather than replacing it."
        options={DENSITIES}
        value={density}
        onChange={setDensity}
      />

      <RichTextEditor
        preset="standard"
        label="Message"
        hideLabel
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
