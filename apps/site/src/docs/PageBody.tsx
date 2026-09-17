import { Fragment, useMemo } from 'react';
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

export function PageBody({ html }: PageBodyProps) {
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
          {part.html ? <div dangerouslySetInnerHTML={{ __html: part.html }} /> : null}
          {part.demo ? <Demo slug={part.demo} entry={examples.get(part.demo)} /> : null}
        </Fragment>
      ))}
    </div>
  );
}
