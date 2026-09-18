import { useEffect, useState } from 'react';
import type { PageHeading } from './manifest';

/**
 * The "on this page" rail.
 *
 * Generated from the page's own H2s and H3s, with the section nearest the top of the
 * viewport marked active. An `IntersectionObserver` rather than a scroll
 * handler: the browser does the work off the main thread, and a long reference page has
 * two hundred headings to track.
 *
 * @module
 */

export function Toc({ headings }: { headings: PageHeading[] }) {
  const [active, setActive] = useState<string | null>(headings[0]?.id ?? null);

  useEffect(() => {
    if (headings.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        // The topmost heading currently on screen wins. Taking the first intersecting
        // entry in observer order would instead pick whichever fired last.
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      // The band is the top third of the viewport, so a heading becomes active as it
      // reaches reading position rather than as it appears at the bottom.
      { rootMargin: '0px 0px -67% 0px', threshold: 0 },
    );

    for (const heading of headings) {
      const element = document.getElementById(heading.id);
      if (element) observer.observe(element);
    }
    return () => {
      observer.disconnect();
    };
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav className="toc" aria-label="On this page">
      <p className="toc__title">On this page</p>
      <ul className="toc__list">
        {headings.map((heading) => (
          <li key={heading.id} data-depth={heading.depth}>
            <a
              href={`#${heading.id}`}
              className={`toc__link${active === heading.id ? ' toc__link--active' : ''}`}
              aria-current={active === heading.id ? 'location' : undefined}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
