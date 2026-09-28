import { Link, useLocation, useRouteError } from 'react-router';
import { config } from './manifest';
import { useMetadata } from './useMetadata';

/**
 * What a route shows when loading or rendering it failed.
 *
 * Two causes are worth telling apart. The common one is a deployment that happened while
 * the tab was open: the page asks for a chunk the new build no longer has, and reloading
 * is the whole fix (`main.tsx` usually does that on its own). Anything else is a bug,
 * and the reader is offered the reload anyway and a way to report it.
 *
 * @module
 */

/** An error from `import()` of a chunk that is no longer on the server. */
function isStaleChunk(error: unknown): boolean {
  return (
    error instanceof Error &&
    /dynamically imported module|importing a module script failed|error loading dynamically imported/i.test(
      error.message,
    )
  );
}

export function RouteError({ standalone = false }: { standalone?: boolean }) {
  const error = useRouteError();
  const { pathname } = useLocation();
  const stale = isStaleChunk(error);
  const title = stale ? 'This page could not be loaded' : 'Something went wrong';

  useMetadata({ title, description: 'This page failed to load.', pathname, notFound: true });

  const article = (
    <article className="docs-article">
      <h1>{title}</h1>
      <p className="docs-article__lead">
        {stale
          ? 'The site was updated while this tab was open. Reloading picks up the new version.'
          : 'An error stopped this page from rendering. Reloading usually fixes it; if it keeps happening, please report it.'}
      </p>
      <div className="button-row">
        <button
          type="button"
          className="button button--solid"
          onClick={() => {
            window.location.reload();
          }}
        >
          Reload the page
        </button>
        <Link className="button" to={`/${config.id}/`}>
          Go to the overview
        </Link>
        {stale ? null : (
          <a className="button" href={config.links.issues} target="_blank" rel="noreferrer">
            Report the problem
          </a>
        )}
      </div>
      {import.meta.env.DEV && error instanceof Error ? (
        <pre className="route-error__stack">{error.stack ?? error.message}</pre>
      ) : null}
    </article>
  );

  // When the layout itself is what failed, there is no shell to render inside.
  return standalone ? <main className="route-error--standalone">{article}</main> : article;
}
