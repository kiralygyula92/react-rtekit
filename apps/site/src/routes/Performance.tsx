import { useCallback, useRef, useState } from 'react';
import { RichTextEditor, type EditorInstance } from 'react-rtekit';
import { buildLargeDocument, buildLargeWordPaste } from '../fixtures';

/**
 * The performance harness (09 §4).
 *
 * Not linked from the navigation and not in the search index: it exists so the e2e
 * suite can measure the three budgets in a real browser, against the same build a
 * visitor gets. Measuring them anywhere else would measure something else — jsdom has
 * no layout, and a synthetic benchmark has no React.
 *
 * Everything it does is exposed on `window.__rtePerf` rather than through the DOM,
 * because a test that has to scrape numbers out of markup measures the scraping too.
 */

/** What the harness exposes to the e2e suite. */
interface PerfApi {
  /** Loads a document of roughly this many bytes and resolves when it has settled. */
  load: (bytes: number) => Promise<number>;
  /** Mounts a fresh editor and resolves with the time from render to ready, in ms. */
  remount: () => Promise<number>;
  /** Pastes a Word payload of roughly this many bytes; resolves with ms to settle. */
  pasteWord: (bytes: number) => Promise<number>;
  /** Types `count` characters, resolving with the latency of each, in ms. */
  type: (count: number) => Promise<number[]>;
  /** The editor instance, for anything the test wants to drive directly. */
  editor: () => EditorInstance | null;
}

declare global {
  var __rtePerf: PerfApi | undefined;
}

export function Performance() {
  const editorRef = useRef<EditorInstance | null>(null);
  const [generation, setGeneration] = useState(0);
  const [status, setStatus] = useState('idle');
  const mountStarted = useRef(0);
  const mountResolve = useRef<((ms: number) => void) | null>(null);

  const onReady = useCallback((editor: EditorInstance) => {
    editorRef.current = editor;
    const resolve = mountResolve.current;
    if (resolve) {
      mountResolve.current = null;
      resolve(performance.now() - mountStarted.current);
    }

    globalThis.__rtePerf = {
      editor: () => editorRef.current,

      load: (bytes) => {
        const html = buildLargeDocument(bytes);
        const started = performance.now();
        editor.setContent(html, { source: 'api', history: false });
        return Promise.resolve(performance.now() - started);
      },

      remount: () =>
        new Promise<number>((resolve) => {
          mountResolve.current = resolve;
          mountStarted.current = performance.now();
          setGeneration((value) => value + 1);
        }),

      /**
       * One keystroke's latency, measured to the editor's own change event.
       *
       * Not to the end of `execCommand`: the browser applies the input, and the engine
       * reconciles afterwards, so a window that closes when `execCommand` returns
       * excludes the entire cost of the editor. Not to the next animation frame either,
       * which would quantise every sample to the frame interval.
       */
      type: async (count) => {
        const element = editor.engine.contentElement;
        editor.focus('end');
        editor.setSelection('end');

        const samples: number[] = [];
        for (let index = 0; index < count; index += 1) {
          const started = performance.now();
          const settled = new Promise<void>((resolve) => {
            const off = editor.on('change', () => {
              off();
              resolve();
            });
          });

          element.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true }),
          );
          // The one way to make the browser insert text the way a key does. Its
          // replacement, `beforeinput`, cannot be dispatched with effect from script.
          // eslint-disable-next-line @typescript-eslint/no-deprecated -- no alternative exists
          document.execCommand('insertText', false, 'a');

          await settled;
          samples.push(performance.now() - started);
        }
        return samples;
      },

      pasteWord: (bytes) => {
        const html = buildLargeWordPaste(bytes);
        // A command applies to the selection, so there has to be one: without this the
        // paste measures how long it takes to do nothing.
        editor.focus('end');
        editor.setSelection('end');

        const started = performance.now();
        // Through the command, which is the same path a real paste takes: cleanup,
        // sanitize, parse, insert.
        editor.exec('insertHTML', { html });
        return Promise.resolve(performance.now() - started);
      },
    };

    setStatus('ready');
  }, []);

  return (
    <div className="page">
      <h1>Performance harness</h1>
      <p className="page__lead">
        A fixed page for the budget measurements in 09 §4. Not part of the documentation
        — it is here so the e2e suite can measure typing latency, mount time and paste
        cost against the same build everyone else gets.
      </p>

      <p className="example-basic__state" data-testid="perf-status">
        {status}
      </p>

      <RichTextEditor
        key={generation}
        preset="standard"
        label="Document"
        defaultValue="<p>Ready.</p>"
        maxHeight={320}
        onReady={onReady}
      />
    </div>
  );
}
