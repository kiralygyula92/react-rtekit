import { Link } from 'react-router';
import { capabilities, config } from './manifest';
import { Badge } from './Badge';

/**
 * The features index.
 *
 * Rendered from the same nav data as the sidebar, grouped by the same `subheader`
 * values, in the same order. Check 6 makes any divergence between the two a defect, so
 * neither is authored — the page's Markdown carries only the scope-setting prose above
 * this grid.
 *
 * @module
 */

export function FeaturesIndex() {
  return (
    <>
      {config.taxonomy.map((group) => {
        const entries = capabilities.filter((page) => page.group === group);
        if (entries.length === 0) return null;
        return (
          <section key={group} className="feature-group">
            <h2 id={group.toLowerCase().replace(/[^\w]+/g, '-')}>{group}</h2>
            <ul className="card-grid">
              {entries.map((page) => (
                <li key={page.pathname}>
                  <Link className="card" to={page.pathname}>
                    <span className="card__title">
                      {page.title}
                      <Badge plan={page.plan} lifecycle={page.lifecycle} />
                    </span>
                    <span className="card__line">{page.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}
