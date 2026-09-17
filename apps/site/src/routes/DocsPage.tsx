import { useEffect } from 'react';
import { Link, NavLink, useParams } from 'react-router';
import { GUIDES, findGuide, guideHeadings } from '../guides';

/**
 * One guide page: the sidebar, the guide itself and an "on this page" list.
 *
 * The guide list is the reading order, so "previous" and "next" come from it rather
 * than from a second table that could disagree with the sidebar.
 */
export function DocsPage() {
  const { slug, section } = useParams();
  const current = slug ?? section ?? 'getting-started';
  const guide = findGuide(current);
  const index = GUIDES.findIndex((entry) => entry.slug === current);
  const previous = index > 0 ? GUIDES[index - 1] : undefined;
  const next = index >= 0 && index < GUIDES.length - 1 ? GUIDES[index + 1] : undefined;
  const headings = guideHeadings(current);

  // A guide is a document, so arriving at one should start at its top rather than
  // wherever the previous page happened to be scrolled to.
  useEffect(() => {
    if (window.location.hash === '') window.scrollTo({ top: 0 });
  }, [current]);

  return (
    <div className="page page--with-sidebar">
      <nav className="sidebar" aria-label="Documentation">
        <h2 className="sidebar__title">Guides</h2>
        <ul>
          {GUIDES.map((entry) => (
            <li key={entry.slug}>
              <NavLink to={`/docs/guides/${entry.slug}`} className="sidebar__link">
                {entry.title}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <article className="page__body guide">
        <h1>{guide?.title ?? 'Documentation'}</h1>

        {guide ? (
          <guide.Component />
        ) : (
          <p className="empty-state">
            No guide called <code>{current}</code>. <Link to="/docs">Start from the beginning</Link>.
          </p>
        )}

        {guide ? (
          <nav className="guide__pager" aria-label="Guide navigation">
            {previous ? (
              <Link className="guide__pager-link" to={`/docs/guides/${previous.slug}`} rel="prev">
                <span className="guide__pager-label">Previous</span>
                {previous.title}
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                className="guide__pager-link guide__pager-link--next"
                to={`/docs/guides/${next.slug}`}
                rel="next"
              >
                <span className="guide__pager-label">Next</span>
                {next.title}
              </Link>
            ) : null}
          </nav>
        ) : null}
      </article>

      {headings.length > 0 ? (
        <nav className="toc" aria-label="On this page">
          <h2 className="toc__title">On this page</h2>
          <ul>
            {headings.map((heading) => (
              <li key={heading.id}>
                <a className="toc__link" href={`#${heading.id}`}>
                  {heading.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
