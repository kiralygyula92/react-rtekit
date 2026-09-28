import { Link, useLocation } from 'react-router';
import { config } from './manifest';
import { useMetadata } from './useMetadata';

/** The not-found page. Always offers a way back into the docs, never a dead end. */
export function NotFound() {
  const { pathname } = useLocation();
  useMetadata({
    title: 'Page not found',
    description: 'There is no page at this address.',
    pathname,
    notFound: true,
  });

  return (
    <article className="docs-article">
      <h1>Page not found</h1>
      <p className="docs-article__lead">
        There is no page at <code>{pathname}</code>. The address may be mistyped, or the page may
        have moved. Search from the header, or start from one of these:
      </p>
      <ul>
        <li>
          <Link to={`/${config.id}/`}>Documentation overview</Link>
        </li>
        <li>
          <Link to={`/${config.id}/getting-started/installation/`}>Installation</Link>
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
