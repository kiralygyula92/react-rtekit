import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { examples } from '../examples';

/**
 * One example: the live demo, its source, and a width switcher.
 *
 * The Value and Events tabs arrive with the playground in M5; they need the example
 * to expose its editor instance, which the demos deliberately do not do yet.
 */

/** Viewport widths the switcher offers, in pixels. `null` means "fill the page". */
const WIDTHS: { label: string; value: number | null }[] = [
  { label: 'Full', value: null },
  { label: '1280', value: 1280 },
  { label: '768', value: 768 },
  { label: '375', value: 375 },
];

export function ExamplePage() {
  const { slug } = useParams();
  const example = slug ? examples.get(slug) : undefined;
  const [tab, setTab] = useState<'demo' | 'code'>('demo');
  const [width, setWidth] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  if (!example) {
    return (
      <div className="page page--narrow">
        <h1>Example not found</h1>
        <p>
          <Link to="/examples">Back to the gallery</Link>
        </p>
      </div>
    );
  }

  const { Component } = example;

  return (
    <div className="page">
      <h1>{example.title}</h1>
      <p className="page__lead">{example.description}</p>

      <div className="example-bar">
        <div className="example-tabs" role="tablist" aria-label="Example view">
          {(['demo', 'code'] as const).map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              id={`example-tab-${id}`}
              aria-selected={tab === id}
              aria-controls={`example-panel-${id}`}
              className="example-tabs__tab"
              onClick={() => {
                setTab(id);
              }}
            >
              {id === 'demo' ? 'Demo' : 'Code'}
            </button>
          ))}
        </div>

        {tab === 'demo' ? (
          <div className="example-widths" role="group" aria-label="Preview width">
            {WIDTHS.map((entry) => (
              <button
                key={entry.label}
                type="button"
                className="chip"
                data-active={width === entry.value}
                aria-pressed={width === entry.value}
                onClick={() => {
                  setWidth(entry.value);
                }}
              >
                {entry.label}
              </button>
            ))}
          </div>
        ) : (
          <button
            type="button"
            className="button"
            onClick={() => {
              void navigator.clipboard?.writeText(example.source).then(() => {
                setCopied(true);
                setTimeout(() => {
                  setCopied(false);
                }, 1500);
              });
            }}
          >
            {copied ? 'Copied' : 'Copy source'}
          </button>
        )}
      </div>

      <div
        role="tabpanel"
        id="example-panel-demo"
        aria-labelledby="example-tab-demo"
        hidden={tab !== 'demo'}
      >
        <div
          className="example-surface"
          data-width={width ?? 'full'}
          style={width === null ? undefined : { maxWidth: `${width}px` }}
        >
          <Component />
        </div>
      </div>

      <div
        role="tabpanel"
        id="example-panel-code"
        aria-labelledby="example-tab-code"
        hidden={tab !== 'code'}
      >
        <pre className="example-source">
          <code>{example.source}</code>
        </pre>
      </div>

      {example.related && example.related.length > 0 ? (
        <>
          <h2>Related examples</h2>
          <ul className="example-related">
            {example.related
              .filter((related) => examples.has(related))
              .map((related) => (
                <li key={related}>
                  <Link to={`/examples/${related}`}>{examples.get(related)!.title}</Link>
                </li>
              ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
