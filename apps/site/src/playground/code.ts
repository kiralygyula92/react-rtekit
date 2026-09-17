import { classicTheme, borderedTheme, compactTheme, darkTheme, lightTheme } from 'react-rtekit';
import type { RichTextEditorProps } from 'react-rtekit';
import { PLAYGROUND_CONTROLS, type PlaygroundState } from './controls';

/**
 * Turns playground state into props and into the code that would produce them
 * (08 §4).
 *
 * The generated snippet lists only what differs from the defaults, because a wall of
 * props that happen to equal their defaults teaches nothing and is not what anyone
 * would paste into their own code.
 */

const THEMES = {
  light: lightTheme,
  classic: classicTheme,
  dark: darkTheme,
  compact: compactTheme,
  bordered: borderedTheme,
};

/** Control names that are not props, or that need translating into one. */
const NOT_PROPS = new Set(['locale', 'theme', 'density']);

/**
 * One control's value as a string.
 *
 * Playground state is `Record<string, unknown>` because the control list is data; a
 * select's value is always a string, but the type cannot know that, and interpolating
 * an unknown would happily produce "[object Object]".
 */
function text(state: PlaygroundState, name: string): string {
  const value = state[name];
  return typeof value === 'string' ? value : '';
}

/** The props the current state describes. */
export function toProps(state: PlaygroundState): Partial<RichTextEditorProps> {
  const props: Record<string, unknown> = {};

  for (const control of PLAYGROUND_CONTROLS) {
    const value = state[control.name];
    if (value === undefined || value === '' || NOT_PROPS.has(control.name)) continue;
    props[control.name] = value;
  }

  const theme = THEMES[text(state, 'theme') as keyof typeof THEMES];
  if (theme) {
    // Density is a token, so it rides on the theme rather than on a prop of its own.
    props.theme =
      state.density && state.density !== theme.density
        ? { ...theme, density: state.density }
        : theme;
  }

  return props;
}

/** Formats one prop for the generated snippet. */
function formatProp(name: string, value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (value === true) return name;
  if (value === false) return `${name}={false}`;
  if (typeof value === 'number') return `${name}={${value}}`;
  if (typeof value === 'string') return `${name}="${value}"`;
  return `${name}={${JSON.stringify(value)}}`;
}

/**
 * The TSX for the current configuration.
 *
 * @example
 * ```ts
 * generateCode({ preset: 'classic', required: true });
 * // <RichTextEditor preset="classic" required />
 * ```
 */
export function generateCode(state: PlaygroundState): string {
  const lines: string[] = [];

  for (const control of PLAYGROUND_CONTROLS) {
    const value = state[control.name];
    // Only what differs from the default: the rest is noise.
    if (value === control.value) continue;
    if (control.name === 'locale' || control.name === 'theme') continue;
    const formatted = formatProp(control.name, value);
    if (formatted) lines.push(`  ${formatted}`);
  }

  const themeName = text(state, 'theme');
  const localeName = text(state, 'locale');
  if (themeName && themeName !== 'light') lines.push(`  theme={${themeName}Theme}`);
  if (localeName && localeName !== 'en') lines.push(`  localization={${localeName}}`);

  const imports = [
    "import { RichTextEditor } from 'react-rtekit';",
    "import 'react-rtekit/styles.css';",
  ];
  if (themeName && themeName !== 'light') {
    imports.splice(1, 0, `import { ${themeName}Theme } from 'react-rtekit';`);
  }
  if (localeName && localeName !== 'en') {
    imports.splice(1, 0, `import { ${localeName} } from 'react-rtekit';`);
  }

  const element =
    lines.length === 0
      ? '<RichTextEditor value={value} onChange={setValue} />'
      : `<RichTextEditor\n${lines.join('\n')}\n  value={value}\n  onChange={setValue}\n/>`;

  return `${imports.join('\n')}\n\n${element}`;
}
