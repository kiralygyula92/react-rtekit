import { useCallback, useState } from 'react';
import type { ExampleEntry } from '../examples';

/**
 * A live demo and its toolbar.
 *
 * Four affordances on every demo: copy, show/hide source, open in a live sandbox, and
 * reset.
 *
 * Reset is a remount, keyed on a counter — the editors hold their own state, so there is
 * nothing to reach into and clear. That is also why reset matters here more than on a
 * static site: a reader who has typed over a demo has no other way back to the case the
 * page is describing.
 *
 * @module
 */

/** Where "open in a live sandbox" goes. */
const SANDBOX = 'https://stackblitz.com/github/kiralygyula92/react-rtekit';

/** Props for {@link Demo}. */
export interface DemoProps {
  /** The example slug named by the Markdown fence. */
  slug: string;
  /** The registered example, if the slug resolves. */
  entry?: ExampleEntry;
}

export function Demo({ slug, entry }: DemoProps) {
  const [showSource, setShowSource] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generation, setGeneration] = useState(0);

  const copy = useCallback(() => {
    if (!entry) return;
    void navigator.clipboard?.writeText(entry.source).then(() => {
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 1500);
    });
  }, [entry]);

  if (!entry) {
    // A fence naming a demo that is not registered is a content bug, and saying so in
    // place is more useful than rendering nothing and leaving the section empty.
    return (
      <div className="demo demo--missing" role="alert">
        Unknown demo: <code>{slug}</code>
      </div>
    );
  }

  const { Component } = entry;

  return (
    <div className="demo">
      <div className="demo__surface">
        <Component key={generation} />
      </div>

      <div className="demo__bar">
        <p className="demo__caption">{entry.description}</p>
        <div className="demo__actions">
          <button type="button" className="demo__action" onClick={copy}>
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            type="button"
            className="demo__action"
            aria-expanded={showSource}
            onClick={() => {
              setShowSource((value) => !value);
            }}
          >
            {showSource ? 'Hide source' : 'Show source'}
          </button>
          <a className="demo__action" href={SANDBOX} target="_blank" rel="noreferrer">
            Open in StackBlitz
          </a>
          <button
            type="button"
            className="demo__action"
            onClick={() => {
              setGeneration((value) => value + 1);
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {showSource ? (
        <pre className="demo__source">
          <code>{entry.source}</code>
        </pre>
      ) : null}
    </div>
  );
}
