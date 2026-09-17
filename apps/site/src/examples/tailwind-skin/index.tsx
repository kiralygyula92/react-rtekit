import { useState } from 'react';
import { RichTextEditor } from 'react-rtekit';
import './utilities.css';

/**
 * Unstyled mode with a utility-class skin.
 *
 * `unstyled` drops the chrome visuals and keeps two things: the structural CSS, so the
 * layout still works, and the prose styles, so stored content renders the same here as
 * it does in `<RteContentView>` on a list page. Everything you can see is a class in
 * this file.
 */

const SAMPLE =
  '<h2>Release notes</h2>' +
  '<p>Every visible style below is a utility class. The <strong>prose</strong> styles are not: ' +
  'those come from <code>content.css</code>, which is what keeps stored content consistent.</p>' +
  '<ul><li>Structure kept</li><li>Chrome replaced</li></ul>';

/** Tailwind classes, prefixed here only because this page defines them locally. */
const SKIN = {
  root: 'tw-rounded-lg tw-border tw-border-slate-200 tw-bg-white tw-shadow-sm',
  toolbar: 'tw-flex tw-flex-wrap tw-items-center tw-gap-1 tw-border-b tw-bg-slate-50 tw-p-2',
  toolbarGroup: 'tw-flex tw-items-center tw-gap-1',
  toolbarButton:
    'tw-rounded-md tw-px-2 tw-py-1 tw-text-sm tw-text-slate-700 tw-cursor-pointer ' +
    'tw-hover:bg-slate-100 tw-focus:outline-indigo-600',
  toolbarToggle:
    'tw-rounded-md tw-px-2 tw-py-1 tw-text-sm tw-text-slate-700 tw-cursor-pointer ' +
    'tw-hover:bg-slate-100 tw-focus:outline-indigo-600',
  content: 'tw-min-h-40 tw-w-full tw-p-3',
  footer:
    'tw-flex tw-items-center tw-justify-between tw-border-b tw-p-2 tw-text-xs tw-text-slate-500',
  label: 'tw-text-sm tw-font-medium tw-text-slate-700',
  errorText: 'tw-mt-1 tw-text-sm tw-text-rose-600',
  placeholder: 'tw-p-3 tw-text-sm tw-text-slate-500',
};

export default function TailwindSkinExample() {
  const [html, setHtml] = useState(SAMPLE);

  return (
    <div className="stack">
      <RichTextEditor
        unstyled
        preset="standard"
        label="Release notes"
        hideLabel
        maxLength={400}
        showCounter
        classNames={SKIN}
        value={html}
        onChange={(value) => {
          setHtml(value as string);
        }}
      />

      <p className="callout">
        In your application these classes come from Tailwind. This site does not build with Tailwind
        — adding it for one page would change every other page — so the classes used here are
        written out in <code>utilities.css</code> next to this file, with Tailwind&rsquo;s own
        values.
      </p>

      <p className="callout">
        Note what <code>unstyled</code> keeps: the layout still works and the content still reads as
        prose. Dropping <code>content.css</code> as well would make this editor and a list page
        render the same stored HTML differently, which is the one difference users notice.
      </p>
    </div>
  );
}
