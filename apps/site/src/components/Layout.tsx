import { NavLink, Outlet } from 'react-router';
import { SearchDialog } from './SearchDialog';
import { ThemeSwitch } from './ThemeSwitch';
import { VERSION } from 'react-rtekit';

const NAV = [
  { to: '/docs', label: 'Docs' },
  { to: '/examples', label: 'Examples' },
  { to: '/api', label: 'API' },
  { to: '/playground', label: 'Playground' },
  { to: '/theme-editor', label: 'Theme editor' },
];

/** Global chrome: top bar, content column and footer (08 §1). */
export function Layout() {
  return (
    <div className="site">
      <a className="site-skip" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <NavLink to="/" className="site-brand">
          <span className="site-brand__mark" aria-hidden="true" />
          react-rtekit
          <span className="site-brand__version">v{VERSION}</span>
        </NavLink>
        <nav className="site-nav" aria-label="Main">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} className="site-nav__link">
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="site-header__end">
          <SearchDialog />
          <ThemeSwitch />
          <a
            className="site-nav__link"
            href="https://github.com/kiralygyula92/react-rtekit"
            rel="noreferrer noopener"
            target="_blank"
          >
            GitHub
          </a>
        </div>
      </header>
      <main id="main" className="site-main">
        <Outlet />
      </main>
      <footer className="site-footer">
        <p>
          MIT licensed. Built to replace a 514-line Quill wrapper and fix all 26 of its known
          bugs.
        </p>
      </footer>
    </div>
  );
}
