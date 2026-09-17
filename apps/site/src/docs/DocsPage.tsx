import { Link, useLocation } from 'react-router';
import {
  canonicalPath,
  config,
  findPage,
  neighbours,
  sectionOf,
} from './manifest';
import { Badge } from './Badge';
import { PageBody } from './PageBody';
import { Toc } from './Toc';
import { FeaturesIndex } from './FeaturesIndex';
import { NotFound } from './NotFound';
import { useMetadata } from './useMetadata';

/**
 * One documentation page.
 *
 * Everything on it comes from the manifest: the breadcrumb from the section the nav puts
 * it in, the badges from its nav node, the "on this page" rail from its own headings,
 * and the metadata from the one title/description pair the Markdown declares (P10).
 *
 * @module
 */

/** The repository path a page's "Edit this page" link points at. */
const EDIT_BASE = `${config.repo}/edit/main/`;

export function DocsPage() {
  const { pathname } = useLocation();
  const page = findPage(pathname);
  const section = sectionOf(pathname);

  useMetadata({
    title: page?.title ?? 'Not found',
    description: page?.description ?? config.description,
    pathname: canonicalPath(pathname),
    ...(page?.archetype ? { archetype: page.archetype } : {}),
  });

  if (!page) return <NotFound />;

  const { previous, next } = neighbours(page.pathname);
  const isOverview = page.pathname === `/${config.id}/`;

  return (
    <>
      <article className="docs-article">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to={`/${config.id}/`}>{config.name}</Link>
          {section ? (
            <>
              <span aria-hidden="true">›</span>
              <span>{section.title}</span>
            </>
          ) : null}
        </nav>

        <h1>
          {isOverview ? `${config.name} — Overview` : page.title}
          <Badge plan={page.plan} lifecycle={page.lifecycle} />
        </h1>

        {/* The subtitle is the same string as the meta description and the llms.txt
            line, read from one field — which is what P10 asks for and what the audit
            found missing everywhere. */}
        <p className="docs-article__lead">{page.description}</p>

        <PageBody html={page.html} />

        {/* The features index is rendered from nav data rather than authored, so that
            it and the sidebar cannot disagree (check 6). */}
        {page.archetype === 'C' ? <FeaturesIndex /> : null}

        <footer className="page-actions">
          <div className="page-actions__row">
            <a href={`${EDIT_BASE}${page.source}`} target="_blank" rel="noreferrer">
              Edit this page
            </a>
            <Feedback pathname={page.pathname} />
          </div>

          <nav className="pager" aria-label="Previous and next page">
            {previous ? (
              <Link className="pager__link" to={previous.pathname} rel="prev">
                <span>Previous</span>
                {previous.title}
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link className="pager__link pager__link--next" to={next.pathname} rel="next">
                <span>Next</span>
                {next.title}
              </Link>
            ) : null}
          </nav>
        </footer>
      </article>

      <aside className="docs-rail">
        <Toc headings={page.headings} />
      </aside>
    </>
  );
}

/**
 * Per-page feedback (PPDS §7.3).
 *
 * Records the answer locally and says thank you. There is no analytics endpoint to send
 * it to, and inventing one would be worse than being honest about where it goes.
 */
function Feedback({ pathname }: { pathname: string }) {
  const answer = (helpful: boolean): void => {
    try {
      localStorage.setItem(`feedback:${pathname}`, helpful ? 'yes' : 'no');
    } catch {
      // Private browsing, or storage disabled. The thank-you still shows.
    }
    const node = document.getElementById('feedback-status');
    if (node) node.textContent = 'Thanks for the feedback.';
  };

  return (
    <div className="feedback">
      <span>Was this page helpful?</span>
      <button type="button" onClick={() => { answer(true); }}>
        Yes
      </button>
      <button type="button" onClick={() => { answer(false); }}>
        No
      </button>
      <span id="feedback-status" role="status" aria-live="polite" />
    </div>
  );
}
