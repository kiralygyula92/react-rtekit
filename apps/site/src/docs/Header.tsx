import { Link } from 'react-router';
import { config } from './manifest';
import { ThemeSwitch } from '../components/ThemeSwitch';

/**
 * The docs header.
 *
 * Product name, version selector, search, repository, theme. No mega-menus: this site
 * has one surface, so there is nothing to navigate between.
 * The name links to the docs root rather than to a marketing home, for the same reason.
 *
 * @module
 */

/** Props for {@link Header}. */
export interface HeaderProps {
  /** Opens the search dialog. */
  onSearch: () => void;
  /** Toggles the sidebar on narrow screens. */
  onToggleNav: () => void;
  /** Whether the sidebar is currently showing, for `aria-expanded`. */
  navOpen: boolean;
}

export function Header({ onSearch, onToggleNav, navOpen }: HeaderProps) {
  const current = config.versions.find((entry) => entry.current) ?? config.versions[0];

  return (
    <header className="docs-header">
      <button
        type="button"
        className="docs-header__burger"
        aria-label="Documentation menu"
        aria-expanded={navOpen}
        onClick={onToggleNav}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path fill="currentColor" d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z" />
        </svg>
      </button>

      <Link to={`/${config.id}/`} className="docs-header__brand">
        {config.name}
      </Link>

      <label className="docs-header__version">
        <span className="rte-visually-hidden">Version</span>
        <select
          value={current?.href}
          onChange={(event) => {
            window.location.assign(event.target.value);
          }}
        >
          {config.versions.map((entry) => (
            <option key={entry.href} value={entry.href}>
              {entry.label}
            </option>
          ))}
          <option value={`/${config.id}/getting-started/versions/`}>All versions…</option>
        </select>
      </label>

      <div className="docs-header__spacer" />

      <button type="button" className="docs-header__search" onClick={onSearch}>
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path
            fill="currentColor"
            d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14"
          />
        </svg>
        <span>Search</span>
        <kbd>/</kbd>
      </button>

      <a
        className="docs-header__icon"
        href={config.repo}
        target="_blank"
        rel="noreferrer"
        aria-label="Repository on GitHub"
      >
        <svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true">
          <path
            fill="currentColor"
            d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.4 7.4 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8"
          />
        </svg>
      </a>

      <ThemeSwitch />
    </header>
  );
}
