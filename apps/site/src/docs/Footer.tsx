import { Link } from 'react-router';
import { config } from './manifest';

/**
 * The shared footer (PPDS §2.3).
 *
 * Four columns, and the column names are forbidden variation under §12 — they are the
 * same on every plugin site in the portfolio. "Products" holds one entry here because
 * there is one product; the column stays so the next plugin inherits the same footer
 * rather than a fork of it.
 *
 * @module
 */

/** One column's links. External destinations come from `config.links`, never inline. */
const COLUMNS: { title: string; links: { label: string; href: string; external?: boolean }[] }[] = [
  {
    title: 'Products',
    links: [{ label: config.name, href: `/${config.id}/` }],
  },
  {
    title: 'Resources',
    links: [
      { label: 'All features', href: `/${config.id}/all-features/` },
      { label: 'Demos', href: `/${config.id}/demos/` },
      { label: 'Customization', href: `/${config.id}/customization/` },
      { label: 'Integrations', href: `/${config.id}/integrations/` },
    ],
  },
  {
    title: 'Explore',
    links: [
      { label: 'Documentation', href: `/${config.id}/` },
      { label: 'API reference', href: `/${config.id}/api/` },
      { label: 'Guides', href: `/${config.id}/guides/` },
      { label: 'Showcase', href: `/${config.id}/discover-more/showcase/` },
      { label: 'Roadmap', href: `/${config.id}/discover-more/roadmap/` },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Support', href: `/${config.id}/getting-started/support/` },
      { label: 'Changelog', href: `/${config.id}/discover-more/changelog/` },
      { label: 'Versions', href: `/${config.id}/getting-started/versions/` },
      { label: 'GitHub', href: config.repo, external: true },
      { label: 'npm', href: config.links.npm ?? '', external: true },
    ],
  },
];

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__columns">
        {COLUMNS.map((column) => (
          <div key={column.title}>
            <p className="site-footer__title">{column.title}</p>
            <ul>
              {column.links
                .filter((entry) => entry.href !== '')
                .map((entry) => (
                  <li key={entry.label}>
                    {entry.external ? (
                      <a href={entry.href} target="_blank" rel="noreferrer">
                        {entry.label}
                      </a>
                    ) : (
                      <Link to={entry.href}>{entry.label}</Link>
                    )}
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="site-footer__legal">
        <span>
          {config.name} v{config.currentVersion} · MIT licensed
        </span>
        <a href={`/${config.id}/llms.txt`}>llms.txt</a>
      </div>
    </footer>
  );
}
