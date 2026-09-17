import { useMemo, useState } from 'react';
import generated from '../content/props.json';

/**
 * The playground's control panel.
 *
 * Generated from `RichTextEditorProps`, not hand-written — which is what the old panel's
 * comment claimed and could not deliver. It exposed 40 of 140 props and nothing noticed
 * the other hundred; this reads the same schema the API reference does, so a prop that
 * exists is a prop somebody can try, and a new one appears here without being added.
 *
 * Every value resets two ways: choose "default" (or clear the field), or press the reset
 * beside a control that has been changed. "Reset all" puts the whole panel back.
 *
 * @module
 */

/** One generated control. */
export interface PropControl {
  name: string;
  group: string;
  type: string;
  kind: 'boolean' | 'number' | 'string' | 'enum';
  options?: string[];
  default?: string;
  description: string;
}

export const PROPS = generated as PropControl[];

/** The groups, in the order the generator emitted them. */
const GROUPS = [...new Set(PROPS.map((prop) => prop.group))];

/** What the panel holds: only the props that have been changed from their default. */
export type PropValue = boolean | number | string;
export type PropState = Record<string, PropValue>;

/** Props for {@link ControlPanel}. */
export interface ControlPanelProps {
  /** The changed props, keyed by name. A prop absent from this is at its default. */
  value: PropState;
  /** Called with the next state whenever a control changes. */
  onChange: (next: PropState) => void;
  /** Rendered inside the collapsible Setup section above the prop list. */
  setup?: React.ReactNode;
}

export function ControlPanel({ value, onChange, setup }: ControlPanelProps) {
  const [query, setQuery] = useState('');
  const [changedOnly, setChangedOnly] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  // The first group opens so the panel is not a wall of closed rows on arrival.
  const [open, setOpen] = useState<Set<string>>(() => new Set(GROUPS.slice(0, 1)));

  const changedCount = Object.keys(value).length;

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return PROPS.filter((prop) => {
      if (changedOnly && value[prop.name] === undefined) return false;
      if (needle === '') return true;
      return (
        prop.name.toLowerCase().includes(needle) ||
        prop.description.toLowerCase().includes(needle)
      );
    });
  }, [query, changedOnly, value]);

  const set = (name: string, next: PropValue | undefined): void => {
    // "Back to the library's default" is the *absence* of the prop, not a prop set to
    // undefined — those are different to React, and only the first produces the
    // behaviour the reader asked for. Rebuilt rather than deleted from, so the state is
    // never briefly holding a key it should not.
    const draft = Object.fromEntries(Object.entries(value).filter(([key]) => key !== name));
    if (next !== undefined) draft[name] = next;
    onChange(draft);
  };

  // A search hides the accordion: a filtered list the reader has to open group by group
  // is worse than no filter at all.
  const filtering = query.trim() !== '' || changedOnly;

  return (
    <div className="panel">
      <div className="panel__bar">
        <button
          type="button"
          className="panel__reset-all"
          disabled={changedCount === 0}
          onClick={() => {
            onChange({});
          }}
        >
          Reset all
        </button>
      </div>

      {setup ? (
        <section className="panel__section">
          <button
            type="button"
            className="panel__summary"
            aria-expanded={setupOpen}
            onClick={() => {
              setSetupOpen((current) => !current);
            }}
          >
            <Caret open={setupOpen} />
            <span className="panel__summary-title">Setup</span>
          </button>
          {setupOpen ? <div className="panel__setup">{setup}</div> : null}
        </section>
      ) : null}

      <div className="panel__filter">
        <p className="panel__count">
          <strong>Props {PROPS.length}</strong> · <strong>{changedCount} changed</strong>
        </p>
        <input
          type="search"
          className="panel__search"
          placeholder="Filter props, e.g. maxLength"
          aria-label="Filter props"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
          }}
        />
        <label className="panel__changed-only">
          <input
            type="checkbox"
            checked={changedOnly}
            onChange={(event) => {
              setChangedOnly(event.target.checked);
            }}
          />
          Changed only
        </label>
      </div>

      <div className="panel__groups">
        {GROUPS.map((group) => {
          const entries = visible.filter((prop) => prop.group === group);
          if (entries.length === 0) return null;
          const expanded = filtering || open.has(group);
          // Counted on the group's own props, not on `entries`: a filtered-away change is
          // still a change, and a collapsed group has to say so or it hides one.
          const changed = PROPS.filter(
            (prop) => prop.group === group && value[prop.name] !== undefined,
          ).length;

          return (
            <section key={group} className="panel__section">
              <button
                type="button"
                className="panel__summary"
                aria-expanded={expanded}
                onClick={() => {
                  setOpen((current) => {
                    const next = new Set(current);
                    if (next.has(group)) next.delete(group);
                    else next.add(group);
                    return next;
                  });
                }}
              >
                <Caret open={expanded} />
                <span className="panel__summary-title">{group}</span>
                <span className="panel__summary-count">
                  ({entries.length}
                  {changed > 0 ? (
                    <>
                      , <strong className="panel__summary-changed">{changed} changed</strong>
                    </>
                  ) : null}
                  )
                </span>
              </button>

              {expanded ? (
                <div className="panel__grid">
                  {entries.map((prop) => (
                    <Control
                      key={prop.name}
                      prop={prop}
                      value={value[prop.name]}
                      onChange={(next) => {
                        set(prop.name, next);
                      }}
                    />
                  ))}
                </div>
              ) : null}
            </section>
          );
        })}

        {visible.length === 0 ? (
          <p className="panel__empty">No prop matches “{query}”.</p>
        ) : null}
      </div>
    </div>
  );
}

/** The disclosure triangle, rotated rather than swapped for a second glyph. */
function Caret({ open }: { open: boolean }) {
  return (
    <svg className="panel__caret" data-open={open} viewBox="0 0 24 24" width="11" height="11" aria-hidden="true">
      <path fill="currentColor" d="M8.6 16.6 13.2 12 8.6 7.4 10 6l6 6-6 6z" />
    </svg>
  );
}

/** Props for {@link Control}. */
interface ControlProps {
  prop: PropControl;
  value: PropValue | undefined;
  onChange: (next: PropValue | undefined) => void;
}

/** One prop: its name, its control, and what it is when you leave it alone. */
function Control({ prop, value, onChange }: ControlProps) {
  const changed = value !== undefined;
  const id = `prop-${prop.name}`;

  return (
    <div className="control" data-changed={changed}>
      <div className="control__head">
        <label className="control__name" htmlFor={id}>
          {prop.name}
        </label>
        {/* Only on a changed control: a reset that is always there is a row of noise,
            and the "default" option already resets the ones that have one. */}
        {changed ? (
          <button
            type="button"
            className="control__reset"
            aria-label={`Reset ${prop.name}`}
            onClick={() => {
              onChange(undefined);
            }}
          >
            Reset
          </button>
        ) : null}
      </div>

      {prop.kind === 'boolean' ? (
        <select
          id={id}
          className="control__input"
          value={value === undefined ? '' : String(value)}
          onChange={(event) => {
            onChange(event.target.value === '' ? undefined : event.target.value === 'true');
          }}
        >
          <option value="">default</option>
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      ) : null}

      {prop.kind === 'enum' ? (
        <select
          id={id}
          className="control__input"
          value={value === undefined ? '' : String(value)}
          onChange={(event) => {
            onChange(event.target.value === '' ? undefined : event.target.value);
          }}
        >
          <option value="">default</option>
          {prop.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : null}

      {prop.kind === 'number' || prop.kind === 'string' ? (
        <input
          id={id}
          className="control__input"
          type={prop.kind === 'number' ? 'number' : 'text'}
          placeholder="default"
          value={value === undefined ? '' : String(value)}
          onChange={(event) => {
            const raw = event.target.value;
            if (raw === '') {
              onChange(undefined);
              return;
            }
            onChange(prop.kind === 'number' ? Number(raw) : raw);
          }}
        />
      ) : null}

      <p className="control__meta">
        <code>{prop.type}</code>
        {prop.default !== undefined ? <span> · default {prop.default}</span> : null}
      </p>
    </div>
  );
}
