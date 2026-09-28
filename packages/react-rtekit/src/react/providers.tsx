import { useMemo, type ReactNode } from 'react';
import type { DeepPartial } from '../types/common.js';
import type { RteLocalization } from '../types/localization.js';
import type { ColorScheme, ResolvedRteTheme, RteTheme } from '../types/theme.js';
import type { RichTextEditorProps } from '../types/props.js';
import {
  DefaultsContextProvider,
  LocaleContextProvider,
  ThemeContextProvider,
  useRteDefaults,
} from './context.js';
import { mergeLocalization } from './localization.js';
import { en } from '../locales/en.js';

/**
 * App-wide providers.
 *
 * Precedence, highest first: props, then the nearest provider, then the preset's
 * defaults, then the library's. Nested providers merge.
 *
 * @module
 */

/** Props for {@link RteThemeProvider}. */
export interface RteThemeProviderProps {
  /** The token tree every editor below inherits. */
  theme: ResolvedRteTheme | RteTheme;
  /** Light, dark, or follow the operating system. @default 'light' */
  colorScheme?: ColorScheme;
  /** The subtree the provider covers. */
  children?: ReactNode;
}

/**
 * Sets the theme for every editor below.
 *
 * @example
 * ```tsx
 * <RteThemeProvider theme={classicTheme} colorScheme="auto">
 *   <App />
 * </RteThemeProvider>
 * ```
 */
export function RteThemeProvider({ theme, colorScheme = 'light', children }: RteThemeProviderProps) {
  const value = useMemo(
    () => ({ theme: theme as ResolvedRteTheme, colorScheme }),
    [colorScheme, theme],
  );
  return <ThemeContextProvider value={value}>{children}</ThemeContextProvider>;
}

/** Props for {@link RteLocaleProvider}. */
export interface RteLocaleProviderProps {
  /** The catalogue, or the keys to override on top of English. */
  localization: RteLocalization | DeepPartial<RteLocalization>;
  /** The subtree the provider covers. */
  children?: ReactNode;
}

/**
 * Sets the message catalogue for every editor below.
 *
 * @example
 * ```tsx
 * // Wiring i18next once, for the whole app:
 * <RteLocaleProvider localization={{ toolbar: { bold: t('rte.bold') } }}>
 *   <App />
 * </RteLocaleProvider>
 * ```
 */
export function RteLocaleProvider({ localization, children }: RteLocaleProviderProps) {
  const value = useMemo(
    () => mergeLocalization(en, localization),
    [localization],
  );
  return <LocaleContextProvider value={value}>{children}</LocaleContextProvider>;
}

/** Props for {@link RteDefaultsProvider}. */
export interface RteDefaultsProviderProps {
  /** Props every editor below starts from. */
  value: Partial<RichTextEditorProps>;
  /** The subtree the provider covers. */
  children?: ReactNode;
}

/**
 * Sets app-wide prop defaults.
 *
 * The one place a team configures sanitization, the HTML profile, merge tags and the
 * upload handler, so no individual field can get it wrong.
 *
 * @example
 * ```tsx
 * <RteDefaultsProvider value={{ sanitize: 'email', htmlProfile: 'quill-compatible' }}>
 *   <App />
 * </RteDefaultsProvider>
 * ```
 */
export function RteDefaultsProvider({ value, children }: RteDefaultsProviderProps) {
  const inherited = useRteDefaults();
  // Nested providers merge, with the inner one winning.
  const merged = useMemo(() => ({ ...inherited, ...value }), [inherited, value]);
  return <DefaultsContextProvider value={merged}>{children}</DefaultsContextProvider>;
}
