import { forwardRef, useState } from 'react';
import {
  RichTextEditor,
  type RteSlots,
  type SlotBaseProps,
  type ToolbarButtonSlotProps,
} from 'react-rtekit';
import './utilities.css';

/**
 * Unstyled mode with a utility-class skin.
 *
 * `unstyled` drops the chrome visuals and keeps two things: the structural CSS, so the
 * layout still works, and the prose styles, so stored content renders the same here as
 * it does in `<RteContentView>` on a list page. Everything visual is a utility class,
 * reaching the editor two ways:
 *
 * - The parts that are components — the toolbar controls, the label, the counter, the
 *   error — are slots, so a replacement takes classes like any component of yours.
 * - The fixed structure — the toolbar row, the content box, the footer — is styled from
 *   the root's `className` with arbitrary variants aimed at its stable `rte-*` class
 *   names, which are part of the public contract.
 */

const SAMPLE =
  '<h2>Release notes</h2>' +
  '<p>Every visible style below is a utility class. The <strong>prose</strong> styles are not: ' +
  'those come from <code>content.css</code>, which is what keeps stored content consistent.</p>' +
  '<ul><li>Structure kept</li><li>Chrome replaced</li></ul>';

/** The root, and — through arbitrary variants — the structure inside it. */
const ROOT = [
  'tw-rounded-lg tw-border tw-border-slate-200 tw-bg-white tw-shadow-sm',
  '[&_.rte-toolbar]:tw-bg-slate-50 [&_.rte-toolbar]:tw-border-b [&_.rte-toolbar]:tw-p-2',
  '[&_.rte-content]:tw-p-3 [&_.rte-content]:tw-min-h-40',
  '[&_.rte-footer]:tw-p-2 [&_.rte-footer]:tw-text-xs [&_.rte-footer]:tw-text-slate-500',
].join(' ');

const BUTTON =
  'tw-rounded-md tw-px-2 tw-py-1 tw-text-sm tw-text-slate-700 tw-cursor-pointer ' +
  'tw-hover:bg-slate-100 tw-focus:outline-indigo-600';

/**
 * A toolbar control in utility classes.
 *
 * The ref is forwarded and the remaining props are spread, because the toolbar's roving
 * focus moves through that ref and `tabIndex`, `aria-label` and `aria-pressed` arrive in
 * the props.
 */
const TwToolbarControl = forwardRef<HTMLButtonElement, ToolbarButtonSlotProps & SlotBaseProps>(
  function TwToolbarControl(
    { active, label, shortcut, icon, showLabel, className, command, type: _type, ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type="button"
        className={[BUTTON, active ? 'tw-bg-slate-100' : '', className].filter(Boolean).join(' ')}
        data-command={command}
        title={shortcut ? `${label} (${shortcut})` : label}
        {...rest}
      >
        {icon}
        {showLabel ? <span>{label}</span> : null}
      </button>
    );
  },
);

const slots: Partial<RteSlots> = {
  ToolbarButton: TwToolbarControl as RteSlots['ToolbarButton'],
  ToolbarToggle: TwToolbarControl as RteSlots['ToolbarToggle'],
  Label: ({ htmlFor, children }) => (
    <label htmlFor={htmlFor} className="tw-text-sm tw-font-medium tw-text-slate-700">
      {children}
    </label>
  ),
  Counter: ({ id, text }) => (
    <span id={id} className="tw-text-xs tw-text-slate-500">
      {text}
    </span>
  ),
  ErrorText: ({ id, role, children }) => (
    <p id={id} role={role} className="tw-mt-1 tw-text-sm tw-text-rose-600">
      {children}
    </p>
  ),
};

export default function TailwindSkinExample() {
  const [html, setHtml] = useState(SAMPLE);

  return (
    <div className="stack">
      <RichTextEditor
        unstyled
        preset="standard"
        label="Release notes"
        maxLength={400}
        showCounter
        className={ROOT}
        slots={slots}
        value={html}
        onChange={(value) => {
          setHtml(value as string);
        }}
      />

      <p className="callout">
        In your application these classes come from Tailwind. This site does not build with Tailwind
        — adding it for one page would change every other page — so the classes used here are
        written out in <code>utilities.css</code> next to this file, with Tailwind&rsquo;s own
        values, arbitrary variants included.
      </p>

      <p className="callout">
        Note what <code>unstyled</code> keeps: the layout still works and the content still reads as
        prose. Dropping <code>content.css</code> as well would make this editor and a list page
        render the same stored HTML differently, which is the one difference users notice.
      </p>
    </div>
  );
}
