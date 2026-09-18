import { Fragment, useState } from 'react';
import { NavLink, useLocation } from 'react-router';
import { canonicalPath, nav, titleOf, type NavNode } from './manifest';
import { Badge } from './Badge';

/**
 * The documentation sidebar.
 *
 * Rendered from `nav.json` and nothing else: the order is editorial and reviewed like
 * code, the titles come from the title map, and every badge traces back to a `plan` or
 * `lifecycle` on the node. No component here decides what to show.
 *
 * A section opens two ways — because the route is inside it, or because the reader
 * clicked it. It used to open only the first way, which made every section heading look
 * like a control and behave like a label.
 *
 * @module
 */

/** The section containing a pathname, so a deep link opens the right one. */
function sectionFor(pathname: string): string | null {
  const target = canonicalPath(pathname);
  for (const section of nav) {
    if (section.children?.some((child) => child.pathname === target)) return section.pathname;
  }
  return null;
}

/** One page row. */
function Item({ node, onNavigate }: { node: NavNode; onNavigate?: () => void }) {
  return (
    <li>
      <NavLink
        to={node.pathname}
        className={({ isActive }) => `docs-nav__link${isActive ? ' docs-nav__link--active' : ''}`}
        onClick={onNavigate}
        end
      >
        <span>{titleOf(node)}</span>
        <Badge plan={node.plan} lifecycle={node.lifecycle} />
      </NavLink>
    </li>
  );
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState<string | null>(() => sectionFor(pathname));

  /*
   * Navigating into another section opens it.
   *
   * Held in state rather than derived, so a reader can also open a section to look
   * through it without leaving the page they are on. Adjusted during render rather than
   * in an effect: an effect would render once with the old section open and once with
   * the new one, and the first of those frames is visible.
   */
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    const section = sectionFor(pathname);
    if (section) setOpen(section);
  }

  return (
    <nav className="docs-nav" aria-label="Documentation">
      {nav.map((section) => {
        const expanded = section.pathname === open;
        const listId = `${section.pathname.replace(/\W+/g, '-')}-list`;
        return (
          <div key={section.pathname} className="docs-nav__section">
            <button
              type="button"
              className="docs-nav__section-title"
              data-open={expanded}
              aria-expanded={expanded}
              aria-controls={listId}
              onClick={() => {
                setOpen(expanded ? null : section.pathname);
              }}
            >
              {section.title}
            </button>

            {expanded ? (
              <ul className="docs-nav__list" id={listId}>
                {section.children?.map((child) => (
                  // A `subheader` opens a group and the rows after it belong to it, so
                  // the label is rendered before its first member rather than as a
                  // wrapper — which is what keeps the nav data flat and depth at 2.
                  <Fragment key={child.pathname}>
                    {child.subheader ? (
                      <li className="docs-nav__group">{child.subheader}</li>
                    ) : null}
                    <Item node={child} onNavigate={onNavigate} />
                  </Fragment>
                ))}
              </ul>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
