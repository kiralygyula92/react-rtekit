import { useMemo, useState } from 'react';
import {
  RichTextEditor,
  classicTheme,
  contrastRatio,
  createTheme,
  darkTheme,
  lightTheme,
  meetsContrastAA,
  themeToCssVars,
  type ResolvedRteTheme,
} from 'react-rtekit';
import { CodeBlock } from '../components/CodeBlock';

/**
 * The theme editor.
 *
 * The token list is read off the theme itself rather than written out here, which is
 * the acceptance test for token coverage: a visual that is not a token cannot appear
 * in this list, and a token that exists always does.
 */

const BASES: Record<string, ResolvedRteTheme> = {
  light: lightTheme,
  classic: classicTheme,
  dark: darkTheme,
};

/** Pairs whose contrast has to hold, whatever the author does to them. */
const CONTRAST_PAIRS: { label: string; foreground: string; background: string }[] = [
  { label: 'Body text on the editor', foreground: 'color.text', background: 'color.surface' },
  {
    label: 'Placeholder on the editor',
    foreground: 'color.placeholder',
    background: 'color.surface',
  },
  { label: 'Helper text on the page', foreground: 'color.textMuted', background: 'color.surface' },
  { label: 'Error text on the page', foreground: 'color.danger', background: 'color.surface' },
];

/** Reads a dotted token path off a theme. */
function read(theme: ResolvedRteTheme, path: string): string {
  const value = path
    .split('.')
    .reduce<unknown>(
      (current, part) => (current as Record<string, unknown> | undefined)?.[part],
      theme,
    );
  // Only leaf tokens are readable; a group would stringify as "[object Object]".
  return typeof value === 'string' ? value : '';
}

/** True for a token whose value is a colour we can measure. */
function isColor(value: string): boolean {
  return /^#[0-9a-f]{3,8}$/i.test(value.trim());
}

export function ThemeEditor() {
  const [base, setBase] = useState('light');
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  const theme = useMemo(() => {
    const patch: Record<string, Record<string, string>> = {};
    for (const [path, value] of Object.entries(overrides)) {
      const [group, name] = path.split('.');
      if (!group || !name) continue;
      patch[group] = { ...patch[group], [name]: value };
    }
    return createTheme(BASES[base] ?? lightTheme, patch);
  }, [base, overrides]);

  const vars = useMemo(() => themeToCssVars(theme), [theme]);

  /** Every token, grouped as the theme groups them. */
  const groups = useMemo(() => {
    const result = new Map<string, { path: string; value: string }[]>();
    for (const [group, section] of Object.entries(theme) as [string, unknown][]) {
      if (typeof section !== 'object' || section === null || Array.isArray(section)) continue;
      const entries = Object.entries(section as Record<string, unknown>)
        .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
        .map(([name, value]) => ({ path: `${group}.${name}`, value }));
      if (entries.length > 0) result.set(group, entries);
    }
    return result;
  }, [theme]);

  const setToken = (path: string, value: string): void => {
    setOverrides((current) => ({ ...current, [path]: value }));
  };

  return (
    <div className="theme-editor">
      <aside className="theme-editor__tokens" aria-label="Tokens">
        <label className="field-inline">
          Base
          <select
            value={base}
            onChange={(event) => {
              setBase(event.target.value);
              setOverrides({});
            }}
          >
            {Object.keys(BASES).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>

        {[...groups.entries()].map(([group, tokens]) => (
          <details key={group} open={group === 'color'}>
            <summary>{group}</summary>
            {tokens.map((token) => (
              <label key={token.path} className="theme-editor__token">
                <span>{token.path.split('.')[1]}</span>
                {isColor(token.value) ? (
                  <input
                    type="color"
                    value={token.value}
                    onChange={(event) => {
                      setToken(token.path, event.target.value);
                    }}
                  />
                ) : null}
                <input
                  type="text"
                  value={token.value}
                  onChange={(event) => {
                    setToken(token.path, event.target.value);
                  }}
                />
              </label>
            ))}
          </details>
        ))}
      </aside>

      <section className="theme-editor__preview" aria-label="Preview">
        <RichTextEditor
          preset="full"
          label="Preview"
          hideLabel
          theme={theme}
          helperText="Helper text, in the muted colour."
          maxLength={80}
          showCounter
          defaultValue={
            '<h2>Heading</h2><p>Body text with <strong>bold</strong>, <em>italic</em> and ' +
            '<a href="https://example.com">a link</a>.</p>' +
            '<ul><li>A list item</li></ul><blockquote><p>A quotation.</p></blockquote>'
          }
        />

        <h2>Contrast</h2>
        <table className="data-table" data-testid="contrast-table">
          <thead>
            <tr>
              <th>Pair</th>
              <th>Ratio</th>
              <th>AA</th>
            </tr>
          </thead>
          <tbody>
            {CONTRAST_PAIRS.map((pair) => {
              const foreground = read(theme, pair.foreground);
              const background = read(theme, pair.background);
              const measurable = isColor(foreground) && isColor(background);
              const ratio = measurable ? contrastRatio(foreground, background) : null;
              return (
                <tr key={pair.label}>
                  <td>{pair.label}</td>
                  <td>{ratio === null ? '—' : ratio.toFixed(2)}</td>
                  <td>
                    {ratio === null
                      ? 'not measurable'
                      : meetsContrastAA(foreground, background)
                        ? 'pass'
                        : 'fail'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <h2>Export</h2>
        <CodeBlock label="createTheme call" testId="theme-export-js">
          {`import { createTheme, ${base}Theme } from 'react-rtekit';\n\nexport const myTheme = createTheme(${base}Theme, ${JSON.stringify(
            groupOverrides(overrides),
            null,
            2,
          )});`}
        </CodeBlock>

        <CodeBlock label="CSS variables" testId="theme-export-css">
          {`.rte-root {\n${Object.entries(vars)
            .map(([name, value]) => `  ${name}: ${value};`)
            .join('\n')}\n}`}
        </CodeBlock>
      </section>
    </div>
  );
}

/** Turns flat `group.name` overrides back into the nested shape `createTheme` takes. */
function groupOverrides(overrides: Record<string, string>): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {};
  for (const [path, value] of Object.entries(overrides)) {
    const [group, name] = path.split('.');
    if (!group || !name) continue;
    result[group] = { ...result[group], [name]: value };
  }
  return result;
}
