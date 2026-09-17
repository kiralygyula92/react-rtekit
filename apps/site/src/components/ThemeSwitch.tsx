import { useEffect, useState } from 'react';

const OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'classic', label: 'Classic' },
] as const;

/** The site-wide theme identifier, also used as the editors' `data-theme`. */
export type SiteTheme = (typeof OPTIONS)[number]['value'];

const STORAGE_KEY = 'rtekit-site-theme';

function read(): SiteTheme {
  if (typeof localStorage === 'undefined') return 'light';
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'dark' || stored === 'classic' ? stored : 'light';
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

  return (
    <label className="site-theme-switch">
      <span className="site-visually-hidden">Theme</span>
      <select
        value={theme}
        onChange={(event) => {
          setTheme(event.target.value as SiteTheme);
        }}
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
