import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { CodeBlock } from '../components/CodeBlock';

/**
 * The shared pieces every guide is built from.
 *
 * Guides are written as components rather than Markdown so that a code sample and a
 * live editor can sit next to each other on the same page — which is the whole
 * argument for having a docs site rather than a README.
 */

/** A section with an anchor, so a link can point at it. */
export function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section className="guide__section" aria-labelledby={id}>
      <h2 id={id}>
        <a className="guide__anchor" href={`#${id}`}>
          {title}
        </a>
      </h2>
      {children}
    </section>
  );
}

/** A code sample. */
export function Code({ label, children }: { label: string; children: string }) {
  return <CodeBlock label={label}>{children}</CodeBlock>;
}

/** A pointer to an example page. */
export function SeeAlso({ examples = [], guides = [] }: { examples?: string[]; guides?: string[] }) {
  if (examples.length === 0 && guides.length === 0) return null;
  return (
    <aside className="guide__see-also">
      <h3>See also</h3>
      <ul>
        {examples.map((slug) => (
          <li key={slug}>
            <Link to={`/examples/${slug}`}>The {slug.replace(/-/g, ' ')} example</Link>
          </li>
        ))}
        {guides.map((slug) => (
          <li key={slug}>
            <Link to={`/docs/guides/${slug}`}>The {slug.replace(/-/g, ' ')} guide</Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}

/** Something worth stopping at. */
export function Callout({ kind = 'note', children }: { kind?: 'note' | 'warning'; children: ReactNode }) {
  return (
    <div className={kind === 'warning' ? 'callout callout--danger' : 'callout'}>{children}</div>
  );
}
