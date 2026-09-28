import { Link } from 'react-router';
import { config } from './manifest';

/**
 * The shared footer: where to go next in the docs, the tools, and the project itself.
 *
 * @module
 */

/** One column's links. External destinations come from `config.links`, never inline. */
const COLUMNS: { title: string; links: { label: string; href: string; external?: boolean }[] }[] = [
  {
    title: 'Docs',
    links: [
      { label: 'Installation', href: `/${config.id}/getting-started/installation/` },
      { label: 'Usage', href: `/${config.id}/getting-started/usage/` },
      { label: 'All features', href: `/${config.id}/all-features/` },
      { label: 'Guides', href: `/${config.id}/guides/` },
      { label: 'API reference', href: `/${config.id}/api/` },
    ],
  },
  {
    title: 'Try it',
    links: [
      { label: 'Playground', href: `/${config.id}/demos/playground/` },
      { label: 'Theme editor', href: `/${config.id}/demos/theme-editor/` },
      { label: 'All demos', href: `/${config.id}/demos/` },
    ],
  },
  {
    title: 'Project',
    links: [
      { label: 'Changelog', href: `/${config.id}/discover-more/changelog/` },
      { label: 'Roadmap', href: `/${config.id}/discover-more/roadmap/` },
      { label: 'Support', href: `/${config.id}/getting-started/support/` },
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
