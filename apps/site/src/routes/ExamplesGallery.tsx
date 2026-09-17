import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { listExamples } from '../examples';

/** The examples gallery with a tag filter. */
export function ExamplesGallery() {
  const all = useMemo(() => listExamples(), []);
  const [tag, setTag] = useState<string | null>(null);

  const tags = useMemo(() => {
    const set = new Set<string>();
    for (const example of all) for (const t of example.tags) set.add(t);
    return [...set].sort();
  }, [all]);

  const visible = tag ? all.filter((example) => example.tags.includes(tag)) : all;

  return (
    <div className="page">
      <h1>Examples</h1>
      <p className="page__lead">
        Every example is a live editor with its real source, the current value in all four
        formats, and an event log.
      </p>

      {tags.length > 0 && (
        <div className="filter-row" role="group" aria-label="Filter by tag">
          <button
            type="button"
            className="chip"
            data-active={tag === null}
            onClick={() => {
              setTag(null);
            }}
          >
            All
          </button>
          {tags.map((t) => (
            <button
              key={t}
              type="button"
              className="chip"
              data-active={tag === t}
              onClick={() => {
                setTag(t);
              }}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <p className="empty-state">
          No examples yet. They land with milestone 2, starting with the legacy parity page.
        </p>
      ) : (
        <ul className="card-grid">
          {visible.map((example) => (
            <li key={example.slug}>
              <Link className="card" to={`/examples/${example.slug}`}>
                <h2>{example.title}</h2>
                <p>{example.description}</p>
                <span className="card__tags">{example.tags.join(' · ')}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
