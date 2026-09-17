import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { meta } from 'react-rtekit/meta';
import { API_PAGES } from './ApiIndex';
import apiPages from '../api/pages.json';

/**
 * One API page.
 *
 * Two sources feed these tables, and the difference matters. Props and types come from
 * TypeDoc, so they carry the real signatures. Slots, commands, handlers, tokens,
 * locale keys and icons come from the library's *runtime* metadata, so those lists
 * cannot drift from the implementation — they are the implementation, enumerated.
 */

/** One row of a generated table. */
interface ApiEntry {
  name: string;
  type: string;
  optional: boolean;
  default: string;
  description: string;
  group: string;
  deprecated: string;
  example: string;
}

/** The TypeDoc-derived pages, keyed by slug. */
const GENERATED = apiPages as Record<string, ApiEntry[]>;

/** Turns runtime metadata into the same row shape. */
function fromMeta(entries: { name: string; group: string; description: string }[]): ApiEntry[] {
  return entries.map((entry) => ({
    name: entry.name,
    type: '',
    optional: false,
    default: '',
    description: entry.description,
    group: entry.group,
    deprecated: '',
    example: '',
  }));
}

/** Every page's rows, whichever source they come from. */
function rowsFor(slug: string): { rows: ApiEntry[]; source: string } {
  switch (slug) {
    case 'slots':
      return { rows: fromMeta(meta.slots), source: 'runtime metadata' };
    case 'commands':
      return { rows: fromMeta(meta.commands), source: 'runtime metadata' };
    case 'handlers':
      return { rows: fromMeta(meta.handlers), source: 'runtime metadata' };
    case 'theme-tokens':
      return { rows: fromMeta(meta.tokens), source: 'runtime metadata' };
    case 'plugins':
      return { rows: fromMeta(meta.plugins), source: 'runtime metadata' };
    case 'localization':
      return {
        rows: meta.localizationKeys.map((key) => ({
          name: key,
          type: 'LocalizedString',
          optional: false,
          default: '',
          description: '',
          group: key.split('.')[0] ?? 'general',
          deprecated: '',
          example: '',
        })),
        source: 'runtime metadata',
      };
    case 'icons':
      return {
        rows: meta.icons.map((name) => ({
          name,
          type: 'ReactNode',
          optional: false,
          default: '',
          description: '',
          group: 'icons',
          deprecated: '',
          example: '',
        })),
        source: 'runtime metadata',
      };
    default:
      return { rows: GENERATED[slug] ?? [], source: 'TypeDoc' };
  }
}

export function ApiPage() {
  const { slug } = useParams();
  const page = API_PAGES.find((entry) => entry.slug === slug);
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('all');

  const { rows, source } = useMemo(() => rowsFor(slug ?? ''), [slug]);

  const groups = useMemo(
    () => ['all', ...new Set(rows.map((row) => row.group))].sort(),
    [rows],
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter(
      (row) =>
        (group === 'all' || row.group === group) &&
        (needle === '' ||
          row.name.toLowerCase().includes(needle) ||
          row.type.toLowerCase().includes(needle) ||
          row.description.toLowerCase().includes(needle)),
    );
  }, [group, query, rows]);

  if (!page) {
    return (
      <div className="page page--narrow">
        <h1>Unknown API page</h1>
        <p>
          <Link to="/api">Back to the API index</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>{page.title}</h1>
      <p className="page__lead">{page.description}</p>
      <p className="api__source">
        {rows.length} entries, from {source}.
      </p>

      <div className="button-row">
        <label className="field-inline">
          Filter
          <input
            type="search"
            value={query}
            placeholder="name, type or description"
            onChange={(event) => {
              setQuery(event.target.value);
            }}
          />
        </label>
        {groups.length > 2 ? (
          <label className="field-inline">
            Group
            <select
              value={group}
              onChange={(event) => {
                setGroup(event.target.value);
              }}
            >
              {groups.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      {visible.length === 0 ? (
        <p className="empty-state">Nothing matches that filter.</p>
      ) : (
        <table className="data-table api__table" data-testid="api-table">
          <thead>
            <tr>
              <th>Name</th>
              {rows.some((row) => row.type) ? <th>Type</th> : null}
              {rows.some((row) => row.default) ? <th>Default</th> : null}
              {rows.some((row) => row.description) ? <th>Description</th> : null}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.name} id={`${slug}-${row.name}`}>
                <td>
                  <code>{row.name}</code>
                  {row.optional ? <span className="api__optional">optional</span> : null}
                  {row.deprecated ? <span className="api__deprecated">deprecated</span> : null}
                </td>
                {rows.some((entry) => entry.type) ? (
                  <td>
                    <code className="api__type">{row.type}</code>
                  </td>
                ) : null}
                {rows.some((entry) => entry.default) ? (
                  <td>{row.default ? <code>{row.default}</code> : null}</td>
                ) : null}
                {rows.some((entry) => entry.description) ? <td>{row.description}</td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
