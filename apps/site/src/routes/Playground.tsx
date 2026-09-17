import { useEffect, useMemo, useRef, useState } from 'react';
import {
  RichTextEditor,
  de,
  documentToMarkdown,
  documentToText,
  en,
  es,
  hu,
  htmlToDocument,
  pseudo,
  type ChangeMeta,
  type EditorInstance,
  type EditorValue,
  type FormatState,
} from 'react-rtekit';
import { CodeBlock } from '../components/CodeBlock';
import { PLAYGROUND_CONTROLS, type ControlSpec, type PlaygroundState } from '../playground/controls';
import { generateCode, toProps } from '../playground/code';
import { ControlPanel, type PropState } from '../playground/ControlPanel';

/**
 * The playground.
 *
 * The control panel is generated from a schema rather than hand-written, which is what
 * keeps it honest: a prop that is not in the schema is a prop nobody can try, and the
 * schema sits next to the prop table it mirrors.
 */

/** The catalogues the locale control offers. */
const LOCALES = { en, hu, de, es, pseudo };

/** Reads the shared state out of the URL, so a link carries the whole configuration. */
function readHash(): Partial<PlaygroundState> {
  if (typeof window === 'undefined' || window.location.hash.length < 2) return {};
  try {
    return JSON.parse(decodeURIComponent(window.location.hash.slice(1))) as Partial<PlaygroundState>;
  } catch {
    // A hand-edited or truncated hash is not worth failing over.
    return {};
  }
}

/**
 * The structural choices, which are not props in the same sense.
 *
 * A preset, a locale and a theme are resolved when the editor is created, so changing
 * one remounts it. They live in the panel's Setup section rather than among the props,
 * where a reader would reasonably expect a change to be live.
 */
const SETUP = new Set(['preset', 'locale', 'theme', 'colorScheme', 'density', 'valueFormat']);

const setupControls = PLAYGROUND_CONTROLS.filter((control) => SETUP.has(control.name));

/** The state every control starts in. */
function initialState(): PlaygroundState {
  const defaults = Object.fromEntries(
    PLAYGROUND_CONTROLS.map((control) => [control.name, control.value]),
  ) as PlaygroundState;
  return { ...defaults, ...readHash() };
}

export function Playground() {
  const [state, setState] = useState<PlaygroundState>(initialState);
  // The generated panel's state: only the props that differ from the library's
  // defaults, so the snippet lists what a reader would actually have to write.
  const [propState, setPropState] = useState<PropState>({});
  const [value, setValue] = useState<string>('<p>Try the controls on the left.</p>');
  const [events, setEvents] = useState<string[]>([]);
  const [format, setFormat] = useState<FormatState | null>(null);
  const [tab, setTab] = useState<'code' | 'value' | 'events' | 'state'>('code');
  const editorRef = useRef<EditorInstance | null>(null);

  // The configuration lives in the hash, so a playground link is the whole setup.
  useEffect(() => {
    const encoded = encodeURIComponent(JSON.stringify({ ...state, ...propState }));
    window.history.replaceState(null, '', `#${encoded}`);
  }, [state, propState]);

  const props = useMemo(() => ({ ...toProps(state), ...propState }), [state, propState]);
  const code = useMemo(() => generateCode({ ...state, ...propState }), [state, propState]);
  const doc = useMemo(() => htmlToDocument(value), [value]);

  const set = (name: string, next: unknown): void => {
    setState((current) => ({ ...current, [name]: next }));
  };

  return (
    <div className="playground">
      <aside className="playground__controls" aria-label="Options">
        <ControlPanel
          value={propState}
          onChange={setPropState}
          setup={
            <div className="panel__setup-grid">
              {setupControls.map((control) => (
                <Control
                  key={control.name}
                  spec={control}
                  value={state[control.name]}
                  onChange={set}
                />
              ))}
            </div>
          }
        />
      </aside>

      <section className="playground__editor" aria-label="Editor">
        <RichTextEditor
          // Remounting on a structural change is the honest thing: presets and plugin
          // lists are resolved when the editor is created.
          key={`${String(state.preset)}-${String(state.locale)}-${String(state.theme)}`}
          {...props}
          localization={LOCALES[state.locale as keyof typeof LOCALES] ?? en}
          value={value}
          editorRef={editorRef}
          onChange={(next: EditorValue, meta: ChangeMeta) => {
            setValue(next as string);
            setEvents((log) =>
              [`change · ${meta.source} · ${meta.length} chars · ${meta.wordCount} words`, ...log].slice(0, 30),
            );
            setFormat(editorRef.current?.getFormatState() ?? null);
          }}
          onSelectionChange={() => {
            setFormat(editorRef.current?.getFormatState() ?? null);
          }}
        />
      </section>

      <section className="playground__output" aria-label="Output">
        <div className="example-tabs" role="tablist" aria-label="Output view">
          {(['code', 'value', 'events', 'state'] as const).map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              className="example-tabs__tab"
              onClick={() => {
                setTab(id);
              }}
            >
              {id}
            </button>
          ))}
        </div>

        {tab === 'code' ? (
          <CodeBlock label="Generated code" testId="playground-code">
            {code}
          </CodeBlock>
        ) : null}

        {tab === 'value' ? (
          <div className="stack">
            <CodeBlock label="HTML value" testId="playground-html">
              {value}
            </CodeBlock>
            <CodeBlock label="JSON value">{JSON.stringify(doc, null, 2)}</CodeBlock>
            <CodeBlock label="Markdown value">{documentToMarkdown(doc)}</CodeBlock>
            <CodeBlock label="Text value">{documentToText(doc)}</CodeBlock>
          </div>
        ) : null}

        {tab === 'events' ? (
          <ul className="example-related" data-testid="playground-events">
            {events.length === 0 ? <li>Nothing yet.</li> : null}
            {events.map((entry, index) => (
              // Positional history: the index is the identity.
              <li key={index}>{entry}</li>
            ))}
          </ul>
        ) : null}

        {tab === 'state' ? (
          <CodeBlock label="Format state" testId="playground-state">
            {JSON.stringify(format, null, 2)}
          </CodeBlock>
        ) : null}
      </section>
    </div>
  );
}

/** Props for {@link Control}. */
interface ControlProps {
  spec: ControlSpec;
  value: unknown;
  onChange: (name: string, value: unknown) => void;
}

/** One generated control. */
function Control({ spec, value, onChange }: ControlProps) {
  if (spec.type === 'boolean') {
    return (
      <label className="field-inline">
        <input
          type="checkbox"
          checked={value === true}
          onChange={(event) => {
            onChange(spec.name, event.target.checked);
          }}
        />
        {spec.label}
      </label>
    );
  }

  if (spec.type === 'number') {
    return (
      <label className="field-inline">
        {spec.label}
        <input
          type="number"
          value={typeof value === 'number' ? value : ''}
          onChange={(event) => {
            onChange(spec.name, event.target.value === '' ? undefined : Number(event.target.value));
          }}
        />
      </label>
    );
  }

  if (spec.type === 'text') {
    return (
      <label className="field-inline">
        {spec.label}
        <input
          type="text"
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => {
            onChange(spec.name, event.target.value);
          }}
        />
      </label>
    );
  }

  return (
    <label className="field-inline">
      {spec.label}
      <select
        value={String(value)}
        onChange={(event) => {
          onChange(spec.name, event.target.value);
        }}
      >
        {spec.options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
