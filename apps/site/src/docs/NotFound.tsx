import { Link } from 'react-router';
import { config } from './manifest';

/** The not-found page. Always offers a way back into the docs, never a dead end. */
export function NotFound() {
  return (
    <article className="docs-article">
      <h1>Page not found</h1>
      <p className="docs-article__lead">
        That URL does not exist. Every page that ever existed on this site still resolves,
        so this was either mistyped or never a page.
      </p>
      <ul>
        <li>
          <Link to={`/${config.id}/`}>Documentation overview</Link>
        </li>
        <li>
          <Link to={`/${config.id}/all-features/`}>All features</Link>
        </li>
        <li>
          <Link to={`/${config.id}/api/`}>API reference</Link>
        </li>
      </ul>
    </article>
  );
}
