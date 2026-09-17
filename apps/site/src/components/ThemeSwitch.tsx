import { useEffect, useState } from 'react';

/**
 * The themes the document can carry.
 *
 * A type rather than a value: the header toggles between light and dark, and `classic`
 * is set by the theme editor, so nothing here iterates the list.
 */
export type SiteTheme = 'light' | 'dark' | 'classic';

/** The site-wide theme identifier, also used as the editors' `data-theme`. */

const STORAGE_KEY = 'rtekit-site-theme';

/**
 * The theme to start in.
 *
 * A stored choice wins; otherwise the system's. Defaulting to light regardless meant a
 * reader whose machine is dark got a white page until they found the switch, which is
 * not a preference anybody expressed.
 */
function read(): SiteTheme {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(STORAGE_KEY);
  } catch {
    /* private mode, or no storage at all */
  }
  if (stored === 'dark' || stored === 'light' || stored === 'classic') return stored;
  const prefersDark =
    typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

/** Reads the current site theme and re-renders when it changes. */
export function useSiteTheme(): SiteTheme {
  const [theme, setTheme] = useState<SiteTheme>(read);
  useEffect(() => {
    const onChange = () => {
      setTheme(read());
    };
    window.addEventListener('rtekit-theme', onChange);
    return () => {
      window.removeEventListener('rtekit-theme', onChange);
    };
  }, []);
  return theme;
}

/** Light / dark / classic switch in the top bar. */
export function ThemeSwitch() {
  const [theme, setTheme] = useState<SiteTheme>(read);

  useEffect(() => {
    const { dataset } = document.documentElement;
    dataset.siteTheme = theme;
    dataset.colorScheme = theme === 'dark' ? 'dark' : 'light';
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* private mode: the switch still works for this session */
    }
    window.dispatchEvent(new Event('rtekit-theme'));
  }, [theme]);

  /*
   * An icon button, not a select.
   *
   * Light and dark are the two a reader switches between; `classic` is the editor preset
   * the parity demo needs and is reachable from the theme editor, not from the header.
   * A two-state control is one click rather than two, and reads as a toggle.
   */
  const isDark = theme === 'dark';
  const next: SiteTheme = isDark ? 'light' : 'dark';

  return (
    <button
      type="button"
      className="docs-header__icon"
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      onClick={() => {
        setTheme(next);
      }}
    >
      {/*
       * The glyph is the theme you are in, not the one you would move to.
       *
       * The two conventions both exist and the icon alone is ambiguous under either, so
       * the accessible name and the tooltip carry the action — "Switch to light theme" —
       * while the moon or sun reports the current state. That is also why the name is not
       * derived from the glyph: a button is named for what it does.
       */}
      {isDark ? (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          {/* moon */}
          <path
            fill="currentColor"
            d="M21.64 13a1 1 0 0 0-1.05-.14 8 8 0 0 1-3.37.73 8.15 8.15 0 0 1-8.14-8.1 8 8 0 0 1 .25-2A1 1 0 0 0 8 2.36a10.14 10.14 0 1 0 14 11.69 1 1 0 0 0-.36-1.05"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          {/* sun */}
          <path
            fill="currentColor"
            d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10m0-5a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1m0 17a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0v-2a1 1 0 0 1 1-1M4.2 4.2a1 1 0 0 1 1.4 0l1.4 1.4a1 1 0 0 1-1.4 1.4L4.2 5.6a1 1 0 0 1 0-1.4m12.8 12.8a1 1 0 0 1 1.4 0l1.4 1.4a1 1 0 0 1-1.4 1.4L17 18.4a1 1 0 0 1 0-1.4M2 12a1 1 0 0 1 1-1h2a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1m17 0a1 1 0 0 1 1-1h2a1 1 0 1 1 0 2h-2a1 1 0 0 1-1-1M7 17a1 1 0 0 1 0 1.4l-1.4 1.4a1 1 0 0 1-1.4-1.4L5.6 17A1 1 0 0 1 7 17m12.8-12.8a1 1 0 0 1 0 1.4L18.4 7A1 1 0 0 1 17 5.6l1.4-1.4a1 1 0 0 1 1.4 0"
          />
        </svg>
      )}
    </button>
  );
}
