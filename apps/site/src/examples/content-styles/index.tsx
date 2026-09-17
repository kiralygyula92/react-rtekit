import { useCallback, useEffect, useRef, useState } from 'react';
import { RichTextEditor } from 'react-rtekit';
import { RteContentView } from 'react-rtekit/view';

/**
 * One stylesheet, two places.
 *
 * `content.css` ships on its own precisely so that stored HTML looks the same in the
 * editor that produced it, on the list page that shows it and in the preview that
 * sends it. This page measures that rather than asserting it: it reads the computed
 * styles of matching elements on both sides and reports any that differ.
 */

const SAMPLE =
  '<h2>Sampling notes</h2>' +
  '<p>Figures were <strong>within plan</strong> except for <em>costs</em>, which were ' +
  '<span style="color: #C81E1E">high</span>.</p>' +
  '<ul><li>Revenue: on target</li><li>Headcount: stable</li></ul>' +
  '<blockquote><p>Re-test before the next visit.</p></blockquote>' +
  '<p><a href="https://example.com/report">Full report</a> · <code>ph=8.2</code></p>';

/** The properties a reader would notice if they differed. */
const PROPERTIES = [
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'color',
  'margin-block-start',
  'margin-block-end',
  'padding-inline-start',
];

/** The elements compared, in document order. */
const SELECTORS = ['h2', 'p', 'strong', 'em', 'ul', 'li', 'blockquote', 'a', 'code'];

/** One difference found between the two renderings. */
interface Difference {
  selector: string;
  property: string;
  editor: string;
  view: string;
}

export default function ContentStylesExample() {
  const [html, setHtml] = useState(SAMPLE);
  const [differences, setDifferences] = useState<Difference[] | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<HTMLDivElement | null>(null);

  const compare = useCallback(() => {
    const left = editorRef.current?.querySelector('.rte-content');
    const right = viewRef.current?.querySelector('.rte-content');
    if (!(left instanceof HTMLElement) || !(right instanceof HTMLElement)) return;

    const found: Difference[] = [];
    for (const selector of SELECTORS) {
      const a = left.querySelector(selector);
      const b = right.querySelector(selector);
      if (!(a instanceof HTMLElement) || !(b instanceof HTMLElement)) continue;

      const stylesA = getComputedStyle(a);
      const stylesB = getComputedStyle(b);
      for (const property of PROPERTIES) {
        const valueA = stylesA.getPropertyValue(property);
        const valueB = stylesB.getPropertyValue(property);
        if (valueA !== valueB) found.push({ selector, property, editor: valueA, view: valueB });
      }
    }
    setDifferences(found);
  }, []);

  // Compare once the first paint has happened, so fonts and variables are resolved.
  useEffect(() => {
    const id = requestAnimationFrame(compare);
    return () => {
      cancelAnimationFrame(id);
    };
  }, [compare]);

  return (
    <div className="stack">
      <div className="split">
        <section ref={editorRef}>
          <h2>In the editor</h2>
          <RichTextEditor
            preset="standard"
            label="Notes"
            hideLabel
            value={html}
            onChange={(value) => {
              setHtml(value as string);
            }}
          />
        </section>

        <section ref={viewRef}>
          <h2>In RteContentView</h2>
          <RteContentView value={html} />
        </section>
      </div>

      <div className="button-row">
        <button type="button" className="button" onClick={compare}>
          Compare computed styles
        </button>
        <span className="parity__status" data-testid="content-styles-status">
          {differences === null
            ? 'Not compared yet'
            : differences.length === 0
              ? `Identical across ${SELECTORS.length} elements and ${PROPERTIES.length} properties.`
              : `${differences.length} difference${differences.length === 1 ? '' : 's'} found.`}
        </span>
      </div>

      {differences && differences.length > 0 ? (
        <table className="data-table">
          <thead>
            <tr>
              <th>Element</th>
              <th>Property</th>
              <th>Editor</th>
              <th>View</th>
            </tr>
          </thead>
          <tbody>
            {differences.map((difference) => (
              <tr key={`${difference.selector}-${difference.property}`}>
                <td>
                  <code>{difference.selector}</code>
                </td>
                <td>
                  <code>{difference.property}</code>
                </td>
                <td>{difference.editor}</td>
                <td>{difference.view}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

      <p className="callout">
        This is why <code>content.css</code> is a separate file rather than part of the
        editor&rsquo;s stylesheet: a server-rendered list page can load the prose styles without
        loading an editor at all.
      </p>
    </div>
  );
}
