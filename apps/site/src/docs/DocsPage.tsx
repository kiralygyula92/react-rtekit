import { Link, useLoaderData } from 'react-router';
import { config, neighbours, sectionOf } from './manifest';
import type { PageData } from './content';
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
 * and the metadata from the one title/description pair the Markdown declares. The body,
 * its demos and any interactive tool arrive through the route loader (`content.ts`).
 *
 * @module
 */

/** The repository path a page's "Edit this page" link points at. */
const EDIT_BASE = `${config.repo}/edit/main/`;

export function DocsPage() {
  const data = useLoaderData<PageData | null>();
  if (!data) return <NotFound />;
  return <Page {...data} />;
}

function Page({ page, html, Tool }: PageData) {
  const section = sectionOf(page.pathname);
  const { previous, next } = neighbours(page.pathname);
  const isOverview = page.pathname === `/${config.id}/`;

  useMetadata(page);

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
          {isOverview ? config.name : page.title}
          <Badge plan={page.plan} lifecycle={page.lifecycle} />
        </h1>

        {/* The subtitle is the same string as the meta description and the llms.txt
            line, read from one field so the three cannot disagree. */}
        <p className="docs-article__lead">{page.description}</p>

        <PageBody html={html} />

        {/* The features index is rendered from nav data rather than authored, so that
            it and the sidebar cannot disagree. */}
        {page.archetype === 'C' ? <FeaturesIndex /> : null}

        {/* The playground and the theme editor: prose above, the instrument below. */}
        {Tool ? <Tool /> : null}

        <footer className="page-actions">
          <a
            className="page-actions__edit"
            href={`${EDIT_BASE}${page.source}`}
            target="_blank"
            rel="noreferrer"
          >
            Edit this page on GitHub
          </a>

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
 * What the article area shows while the first page of a visit loads.
 *
 * Only on that first load: later navigations keep the current page on screen until the
 * next one is ready, which is the router's default and what a reader expects of a link.
 * Shaped like a page (a title, a lead, paragraphs) so the layout does not jump.
 */
export function PageSkeleton() {
  return (
    <article className="docs-article page-skeleton" aria-busy="true" aria-label="Loading page">
      <span className="page-skeleton__line page-skeleton__line--crumb" />
      <span className="page-skeleton__line page-skeleton__line--title" />
      <span className="page-skeleton__line page-skeleton__line--lead" />
      {[92, 100, 84, 96, 60].map((width, index) => (
        <span key={index} className="page-skeleton__line" style={{ width: `${width}%` }} />
      ))}
    </article>
  );
}
