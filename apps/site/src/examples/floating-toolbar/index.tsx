import { useState } from 'react';
import { RichTextEditor, type EditorValue } from 'react-rtekit';

/**
 * Floating, sticky and overflowing toolbars.
 *
 * All three are the same `Toolbar` component: one roving-focus implementation, one
 * set of slots, three placements.
 */

const SAMPLE =
  '<p>Select a few words and the bubble toolbar appears above them.</p>' +
  '<p>Scroll this editor and the docked toolbar stays put.</p>' +
  Array.from({ length: 12 }, (_, index) => `<p>Filler paragraph ${index + 1}.</p>`).join('');

export default function FloatingToolbarExample() {
  const [value, setValue] = useState(SAMPLE);
  const [floating, setFloating] = useState(true);
  const [sticky, setSticky] = useState(true);

  return (
    <div className="stack">
      <div className="button-row">
        <label className="field-inline">
          <input
            type="checkbox"
            checked={floating}
            onChange={(event) => {
              setFloating(event.target.checked);
            }}
          />
          Bubble toolbar on selection
        </label>
        <label className="field-inline">
          <input
            type="checkbox"
            checked={sticky}
            onChange={(event) => {
              setSticky(event.target.checked);
            }}
          />
          Sticky docked toolbar
        </label>
      </div>

      <p className="page__lead">
        Narrow the window: the groups that no longer fit move into a “more” menu at the end of the
        row.
      </p>

      <RichTextEditor
        preset="full"
        label="Content"
        value={value}
        stickyToolbar={sticky}
        floatingToolbar={floating}
        maxHeight={320}
        onChange={(next: EditorValue) => {
          setValue(next as string);
        }}
      />
    </div>
  );
}
