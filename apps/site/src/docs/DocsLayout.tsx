import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { SearchDialog } from '../components/SearchDialog';

/**
 * The three-column documentation shell.
 *
 * Full-bleed rather than a centred column: the sidebar and the rail are fixed, the
 * article takes what is left, and the page fills the window at any width. One surface,
 * so there is no marketing chrome to switch between (EXCEPTIONS E-01).
 *
 * @module
 */

export function DocsLayout() {
  const { pathname, hash } = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  // `/` focuses search, the way every docs site does it, unless the reader is typing.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.closest('input, textarea, select, [contenteditable="true"]') !== null;
      if (event.key === '/' && !typing) {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  // A new page starts at the top; a fragment link goes to its heading. Without this the
  // router keeps the previous scroll position and a long reference page opens halfway
  // down.
  useEffect(() => {
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView();
      return;
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return (
    <div className="docs-shell" data-nav-open={navOpen}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <Header
        navOpen={navOpen}
        onSearch={() => {
          setSearchOpen(true);
        }}
        onToggleNav={() => {
          setNavOpen((value) => !value);
        }}
      />

      <div className="docs-shell__body">
        <aside className="docs-sidebar">
          <Sidebar
            onNavigate={() => {
              setNavOpen(false);
            }}
          />
        </aside>

        <main id="main" className="docs-main">
          <Outlet />
        </main>
      </div>

      <Footer />

      <SearchDialog
        open={searchOpen}
        onClose={() => {
          setSearchOpen(false);
        }}
      />
    </div>
  );
}
