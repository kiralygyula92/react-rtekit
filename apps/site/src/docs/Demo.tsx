import { Component, Suspense, use, useCallback, useEffect, useRef, useState } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { CodeBlock } from '../components/CodeBlock';
import { hasExample, loadExample, peekExample, type ExampleEntry } from '../examples';

/**
 * A live demo and its toolbar: copy the source, show it, and reset the demo.
 *
 * Reset is a remount, keyed on a counter: the editors hold their own state, so there is
 * nothing to reach into and clear. A reader who has typed over a demo has no other way
 * back to the case the page is describing.
 *
 * @module
 */

/** Where a Markdown ```demo fence mounts: the demo, once its code is loaded. */
export function DemoSlot({ slug }: { slug: string }) {
  const entry = peekExample(slug);
  if (entry) return <Demo entry={entry} />;

  if (!hasExample(slug)) {
    // A fence naming a demo that does not exist is a content bug, and saying so in place
    // is more useful than rendering nothing and leaving the section empty.
    return (
      <div className="demo demo--missing" role="alert">
        Unknown demo: <code>{slug}</code>
      </div>
    );
  }

  // The route loader normally has every demo on the page loaded before it renders; this
  // is the path for one that is not, such as after a hot update in development.
  return (
    <Suspense fallback={<div className="demo demo--loading" aria-busy="true" />}>
      <LazyDemo slug={slug} />
    </Suspense>
  );
}

function LazyDemo({ slug }: { slug: string }) {
  const entry = use(loadExample(slug));
  return entry ? <Demo entry={entry} /> : null;
}

function Demo({ entry }: { entry: ExampleEntry }) {
  const [showSource, setShowSource] = useState(false);
  const [copy, setCopy] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [generation, setGeneration] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(
    () => () => {
      clearTimeout(timer.current);
    },
    [],
  );

  const copySource = useCallback(() => {
    const settle = (state: 'copied' | 'failed') => {
      setCopy(state);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        setCopy('idle');
      }, 2000);
    };
    // The clipboard API is missing outside a secure context and can be refused, and a
    // button that silently does nothing is worse than one that says it failed.
    if (!navigator.clipboard) {
      settle('failed');
      return;
    }
    navigator.clipboard.writeText(entry.source).then(
      () => {
        settle('copied');
      },
      () => {
        settle('failed');
      },
    );
  }, [entry.source]);

  const { Component: Example } = entry;

  return (
    <div className="demo">
      <div className="demo__surface">
        <DemoBoundary
          key={generation}
          onReset={() => {
            setGeneration((value) => value + 1);
          }}
        >
          <Example />
        </DemoBoundary>
      </div>

      <div className="demo__bar">
        <p className="demo__caption">{entry.description}</p>
        <div className="demo__actions">
          <button type="button" className="demo__action" onClick={copySource}>
            {copy === 'copied' ? 'Copied' : copy === 'failed' ? 'Copy failed' : 'Copy'}
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
          <button
            type="button"
            className="demo__action"
            onClick={() => {
              setGeneration((value) => value + 1);
            }}
          >
            Reset
          </button>
          <span className="rte-visually-hidden" role="status">
            {copy === 'copied' ? 'Source copied to the clipboard' : ''}
            {copy === 'failed' ? 'The source could not be copied' : ''}
          </span>
        </div>
      </div>

      {showSource ? (
        <div className="demo__source">
          <CodeBlock label={`${entry.title} example source`}>{entry.source}</CodeBlock>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Keeps one broken demo from taking the page down with it.
 *
 * The rest of the page is prose that is still worth reading, so a demo that throws is
 * replaced by a message and a way to try again, and the error still reaches the console.
 */
class DemoBoundary extends Component<
  { children: ReactNode; onReset: () => void },
  { failed: boolean }
> {
  override state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('A demo failed to render', error, info.componentStack);
  }

  override render(): ReactNode {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="demo__error" role="alert">
        <p>This demo stopped working.</p>
        <button type="button" className="demo__action" onClick={this.props.onReset}>
          Restart demo
        </button>
      </div>
    );
  }
}
