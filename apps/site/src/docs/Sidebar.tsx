import { Fragment } from 'react';
import { NavLink, useLocation } from 'react-router';
import { canonicalPath, nav, titleOf, type NavNode } from './manifest';
import { Badge } from './Badge';

/**
 * The documentation sidebar.
 *
 * Rendered from `nav.json` and nothing else: the order is editorial and reviewed like
 * code (N1), the titles come from the title map (N2), and every badge traces back to a
 * `plan` or `lifecycle` on the node (N4/P7). No component here decides what to show.
 *
 * Sections expand in place rather than collapsing the rest, because a reader moving
 * between Features and Reference should not have to re-open what they were reading.
 *
 * @module
 */

/** The section containing a pathname, so it opens on a deep link. */
function openSectionFor(pathname: string): string | null {
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
  const openSection = openSectionFor(pathname);

  return (
    <nav className="docs-nav" aria-label="Documentation">
      {nav.map((section) => {
        const open = section.pathname === openSection;
        return (
          <div key={section.pathname} className="docs-nav__section">
            <p className="docs-nav__section-title" data-open={open}>
              {section.title}
            </p>

            {open ? (
              <ul className="docs-nav__list">
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
