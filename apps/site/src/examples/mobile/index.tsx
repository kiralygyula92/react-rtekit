import { useState } from 'react';
import { RichTextEditor, type EditorValue } from 'react-rtekit';

/**
 * The editor at phone width.
 *
 * The frame is 375px wide, which is where the toolbar has to start making decisions:
 * scroll the row, collapse it into a menu, or dock it at the bottom above the
 * keyboard.
 */

export default function MobileExample() {
  const [value, setValue] = useState('<p>This editor is 375px wide.</p>');
  const [position, setPosition] = useState<'top' | 'bottom'>('bottom');
  const [overflow, setOverflow] = useState<'menu' | 'scroll' | 'wrap'>('scroll');

  return (
    <div className="stack">
      <div className="button-row">
        <label className="field-inline">
          Toolbar
          <select
            value={position}
            onChange={(event) => {
              setPosition(event.target.value as 'top' | 'bottom');
            }}
          >
            <option value="top">docked at the top</option>
            <option value="bottom">docked at the bottom, above the keyboard</option>
          </select>
        </label>
        <label className="field-inline">
          Overflow
          <select
            value={overflow}
            onChange={(event) => {
              setOverflow(event.target.value as 'menu' | 'scroll' | 'wrap');
            }}
          >
            <option value="scroll">scroll</option>
            <option value="menu">menu</option>
            <option value="wrap">wrap</option>
          </select>
        </label>
      </div>

      <div className="phone-frame">
        <RichTextEditor
          preset="full"
          label="Message"
          value={value}
          toolbarPosition={position}
          toolbarOverflow={overflow}
          minHeight={220}
          onChange={(next: EditorValue) => {
            setValue(next as string);
          }}
        />
      </div>
    </div>
  );
}
