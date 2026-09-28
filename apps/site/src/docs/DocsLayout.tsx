import { useEffect, useState } from 'react';
import { Outlet, ScrollRestoration, useNavigation } from 'react-router';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { SearchDialog } from '../components/SearchDialog';

/**
 * The three-column documentation shell.
 *
 * Full-bleed rather than a centred column: the sidebar and the rail are fixed, the
 * article takes what is left, and the page fills the window at any width. One surface,
 * so there is no marketing chrome to switch between.
 *
 * @module
 */

export function DocsLayout() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const navigating = useNavigation().state !== 'idle';

  // `/` focuses search, the way every docs site does it, unless the reader is typing.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const target = event.target as HTMLElement | null;
      const typing = target?.closest('input, textarea, select, [contenteditable="true"]') !== null;
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

  return (
    <div className="docs-shell" data-nav-open={navOpen}>
      {/*
       * The router's own scroll handling, in place of a hand-rolled effect.
       *
       * The effect this replaces called `scrollTo(0, 0)` on every pathname change — which
       * includes Back and Forward — and again on mount, which includes a reload. So Back
       * dropped the reader at the top of the page they had been reading, and a refresh did
       * the same; measured on production, Back from 900px landed at 91 and a refresh from
       * 700 landed at 0. It also left `history.scrollRestoration` on `auto`, so the browser
       * was restoring at the same time the effect was resetting, which is where the 91
       * came from.
       *
       * `ScrollRestoration` does what a reader expects of a link: a new page opens at the
       * top, or at its `#fragment`; Back, Forward and reload return to the position saved
       * for that history entry. It takes `scrollRestoration` over from the browser, so
       * there is one thing deciding.
       */}
      <ScrollRestoration />
      {/* Shown only when a page is slow to arrive; see `.nav-progress`. */}
      <div className="nav-progress" data-active={navigating} aria-hidden="true" />
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

        <main id="main" className="docs-main" aria-busy={navigating}>
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
