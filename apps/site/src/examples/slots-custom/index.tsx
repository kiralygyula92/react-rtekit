import { useState } from 'react';
import { RichTextEditor, type RteSlots } from 'react-rtekit';

/**
 * Four replaced slots.
 *
 * The rule each replacement follows: spread the props you were given. They carry the
 * behaviour — the `mousedown` that keeps the selection alive (fixes R5), the ARIA the
 * toolbar's keyboard model depends on, the ids that tie the counter to the field. A
 * replacement that spreads them can look like anything and still work.
 */

const SAMPLE =
  '<p>Every control here is a component from this file. Select some text and try them.</p>' +
  '<p>Add a <a href="https://example.com">link</a> to see the replaced popover.</p>';

const slots: Partial<RteSlots> = {
  /** A pill-shaped button. `aria-pressed` and the handlers come from the spread. */
  ToolbarButton: ({ icon, label, active, showLabel, ...rest }) => (
    <button {...rest} className="skin-pill" data-active={active}>
      <span aria-hidden="true">{icon}</span>
      {showLabel ? <span className="skin-pill__label">{label}</span> : null}
    </button>
  ),

  ToolbarToggle: ({ icon, label, active, showLabel, ...rest }) => (
    <button {...rest} className="skin-pill" data-active={active}>
      <span aria-hidden="true">{icon}</span>
      {showLabel ? <span className="skin-pill__label">{label}</span> : null}
    </button>
  ),

  /** A single-field link editor: no target checkbox, no title, just a URL. */
  LinkPopover: ({ href, text, onApply, onRemove, onClose, validate, editing }) => {
    return (
      <form
        className="skin-link"
        onSubmit={(event) => {
          event.preventDefault();
          const url = new FormData(event.currentTarget).get('url');
          if (typeof url !== 'string') return;
          const problem = validate(url);
          if (problem === null) onApply({ href: url, text });
        }}
      >
        <label className="skin-link__label" htmlFor="slots-custom-url">
          {editing ? 'Edit link' : 'Add link'}
        </label>
        <input
          id="slots-custom-url"
          name="url"
          className="skin-link__input"
          type="url"
          defaultValue={href}
          placeholder="https://"
        />
        <button type="submit" className="skin-pill">
          Save
        </button>
        {editing ? (
          <button type="button" className="skin-pill" onClick={onRemove}>
            Remove
          </button>
        ) : null}
        <button type="button" className="skin-pill" onClick={onClose}>
          Cancel
        </button>
      </form>
    );
  },

  /** A ring rather than a number. The `id` still links it with `aria-describedby`. */
  Counter: ({ id, count, max, overLimit, nearLimit, text }) => {
    const fraction = max ? Math.min(count / max, 1) : 0;
    return (
      <span id={id} className="skin-counter" data-state={overLimit ? 'over' : nearLimit ? 'near' : 'ok'}>
        <span
          className="skin-counter__ring"
          style={{ ['--fill' as string]: `${String(Math.round(fraction * 100))}%` }}
          aria-hidden="true"
        />
        {text}
      </span>
    );
  },

  /** A placeholder with a hint under it. */
  Placeholder: ({ text }) => (
    <span className="skin-placeholder">
      {text}
      <small>Markdown shortcuts work here — try “# ” or “- ”.</small>
    </span>
  ),
};

export default function SlotsCustomExample() {
  const [html, setHtml] = useState(SAMPLE);

  return (
    <div className="stack">
      <RichTextEditor
        preset="standard"
        label="Message"
        maxLength={240}
        showCounter
        slots={slots}
        value={html}
        onChange={(value) => {
          setHtml(value as string);
        }}
      />

      <p className="callout">
        Nothing here changes what the editor <em>does</em>. The four replacements are
        presentation only, which is why the keyboard model, the announcements and the
        selection handling are all still the shipped ones.
      </p>
    </div>
  );
}
