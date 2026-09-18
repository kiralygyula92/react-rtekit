import { Fragment, useCallback, useMemo, type MouseEvent } from 'react';
import { useNavigate } from 'react-router';
import { examples } from '../examples';
import { Demo } from './Demo';

/**
 * Renders a compiled page, mounting live demos where the Markdown asked for them.
 *
 * The HTML arrives pre-rendered from the build, and a ```demo fence has become
 * `<div data-demo="slug"></div>`. Those placeholders are the seams: the HTML is split on
 * them and React renders the real component in the gap, so a page is ordinary Markdown
 * with running editors in it rather than a component pretending to be a document.
 *
 * Splitting rather than hydrating in place is deliberate. `dangerouslySetInnerHTML`
 * takes ownership of a subtree, and mounting an editor inside one means React would
 * destroy the contenteditable on the next render — a bug this project has already had
 * once, and which the browser matrix caught rather than the unit tests.
 *
 * @module
 */

const PLACEHOLDER = /<div data-demo="([^"]+)"><\/div>/g;

/** Props for {@link PageBody}. */
export interface PageBodyProps {
  /** The compiled HTML for the page body. */
  html: string;
}

/**
 * Sends a click on an internal link through the router instead of the network.
 *
 * The compiled HTML is plain markup, so its `<a href>`s are plain anchors: React Router
 * never sees them, and every "Used by" entry, cross-reference and "Start now" link was a
 * full page load — the whole bundle re-parsed and every editor on the page re-mounted to
 * move between two pages of the same application. It also meant each click asked the
 * server for the page afresh, which is how a deployment still carrying the old
 * `index.md` twins answered a link with raw Markdown and no application at all.
 *
 * Only a plain left click on a same-origin page link is taken. Everything the browser
 * does natively with a link is left to it: a modifier or middle click (new tab or
 * window), a `target`, a `download`, another origin, a jump to a fragment on this page,
 * and any path with an extension — the Markdown twins, `llms.txt` and the sitemap are
 * files to be served, not routes to be rendered.
 */
function useInternalLinks(): (event: MouseEvent<HTMLElement>) => void {
  const navigate = useNavigate();
  return useCallback(
    (event: MouseEvent<HTMLElement>) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as Element).closest('a');
      if (!anchor || !event.currentTarget.contains(anchor)) return;
      if (anchor.hasAttribute('download')) return;
      if (anchor.target !== '' && anchor.target !== '_self') return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (/\.[a-z0-9]+$/i.test(url.pathname)) return;
      const samePage =
        url.pathname === window.location.pathname && url.search === window.location.search;
      if (samePage && url.hash !== '') return;

      event.preventDefault();
      void navigate(`${url.pathname}${url.search}${url.hash}`);
    },
    [navigate],
  );
}

export function PageBody({ html }: PageBodyProps) {
  const onClick = useInternalLinks();
  const parts = useMemo(() => {
    const segments: { html: string; demo?: string }[] = [];
    let cursor = 0;
    for (const match of html.matchAll(PLACEHOLDER)) {
      segments.push({ html: html.slice(cursor, match.index), demo: match[1] });
      cursor = (match.index ?? 0) + match[0].length;
    }
    segments.push({ html: html.slice(cursor) });
    return segments;
  }, [html]);

  return (
    <div className="prose">
      {parts.map((part, index) => (
        // Positional by nature: the segments are the gaps between demo placeholders.
        <Fragment key={index}>
          {/*
           * On each compiled segment rather than on `.prose`, so a link inside a live demo
           * — an editor's own content, a content view — is never taken over.
           *
           * The two jsx-a11y rules are about a div that is itself the control, and this one
           * is not: it delegates for the native `<a>` elements inside it, which are already
           * focusable and fire `click` on Enter, so the handler runs for keyboard users
           * with no listener of its own. A role or a `tabIndex` here would add a focus stop
           * that does nothing.
           */}
          {part.html ? (
            // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
            <div onClick={onClick} dangerouslySetInnerHTML={{ __html: part.html }} />
          ) : null}
          {part.demo ? <Demo slug={part.demo} entry={examples.get(part.demo)} /> : null}
        </Fragment>
      ))}
    </div>
  );
}
