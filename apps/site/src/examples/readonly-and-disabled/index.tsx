import { useState } from 'react';
import { RichTextEditor } from 'react-rtekit';
import { RteContentView } from 'react-rtekit/view';

/**
 * Read-only, disabled, and the view renderer (05 §17, fixes R18).
 *
 * The two states are not the same thing: read-only content stays selectable and
 * copyable, disabled content is inert and marked so. The old editor mapped both onto
 * one flag with no visual difference at all.
 */

const SAMPLE =
  '<h2>Water test report</h2><p>The <strong>April</strong> results are <em>within range</em>.</p>' +
  '<ul><li>Chlorine: normal</li><li>pH: high</li></ul>';

export default function ReadonlyAndDisabledExample() {
  const [value] = useState(SAMPLE);

  return (
    <div className="stack">
      <h2>readOnly</h2>
      <p className="page__lead">Selectable and copyable; the toolbar is hidden.</p>
      <RichTextEditor preset="standard" label="Read-only" value={value} readOnly />

      <h2>disabled</h2>
      <p className="page__lead">
        Not focusable, marked <code>aria-disabled</code>, visibly inert.
      </p>
      <RichTextEditor preset="standard" label="Disabled" value={value} disabled />

      <h2>RteContentView</h2>
      <p className="page__lead">
        No engine at all, which is the right way to render stored content on a list page.
      </p>
      <div className="example-basic__preview" data-testid="readonly-view">
        <RteContentView value={value} />
      </div>
    </div>
  );
}
