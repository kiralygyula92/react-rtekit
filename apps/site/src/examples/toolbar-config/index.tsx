import { useState } from 'react';
import { RichTextEditor, type ToolbarConfig, type ToolbarItemSpec } from 'react-rtekit';

/**
 * Every shape the `toolbar` prop takes.
 *
 * The same registry backs all of them: a flat list, groups, or the object form with
 * overflow, labels and a size. Anything not in the registry is a spec of your own,
 * like the word-count item below.
 */

/** A custom item: no command, just a handler and a live label. */
const wordCountItem: ToolbarItemSpec = {
  name: 'wordCount',
  kind: 'button',
  label: 'Word count',
  // Reads the same state the toolbar buttons read, so it updates with the content.
  render: (ctx) => (
    <span className="toolbar-word-count" aria-live="off">
      {ctx.editor.getLength('words')} words
    </span>
  ),
};

/** An item that runs a command with a fixed payload. */
const signatureItem: ToolbarItemSpec = {
  name: 'signature',
  kind: 'button',
  label: 'Insert signature',
  onClick: ({ editor }) => {
    editor.insertContent('<p>— Northwind Ltd support</p>');
  },
};

/** The five configurations this page cycles through. */
const LAYOUTS: { id: string; title: string; note: string; toolbar: ToolbarConfig }[] = [
  {
    id: 'flat',
    title: 'Flat list',
    note: 'An array of names. No separators, no grouping.',
    toolbar: ['bold', 'italic', 'underline', 'bulletList', 'orderedList', 'undo', 'redo'],
  },
  {
    id: 'grouped',
    title: 'Groups',
    note: 'An array of arrays. Each inner array becomes a group, with a separator between them.',
    toolbar: [
      ['bold', 'italic', 'underline'],
      ['color'],
      ['alignLeft', 'alignCenter', 'alignRight'],
      ['bulletList', 'orderedList'],
    ],
  },
  {
    id: 'labels',
    title: 'Visible labels',
    note: 'showLabels renders the name next to each icon; useful on wide, low-density chrome.',
    toolbar: {
      items: [['bold', 'italic'], ['bulletList']],
      showLabels: true,
      ariaLabel: 'Message formatting',
    },
  },
  {
    id: 'compact',
    title: 'Compact size',
    note: "size: 'sm' scales the buttons down without changing the touch target model.",
    toolbar: {
      items: [['bold', 'italic', 'underline', 'strike'], ['color', 'backgroundColor'], ['bulletList', 'orderedList']],
      size: 'sm',
    },
  },
  {
    id: 'custom',
    title: 'Custom items',
    note: 'Items of your own sit next to registry items and share the same roving focus.',
    toolbar: {
      items: [['bold', 'italic'], [signatureItem], [wordCountItem]],
      ariaLabel: 'Formatting and actions',
    },
  },
];

export default function ToolbarConfigExample() {
  const [layout, setLayout] = useState(LAYOUTS[0]!);
  const [overflow, setOverflow] = useState<'wrap' | 'menu' | 'scroll'>('menu');

  return (
    <div className="stack">
      <div className="button-row" role="radiogroup" aria-label="Layout">
        {LAYOUTS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="radio"
            aria-checked={entry.id === layout.id}
            className="chip"
            data-active={entry.id === layout.id}
            onClick={() => {
              setLayout(entry);
            }}
          >
            {entry.title}
          </button>
        ))}
      </div>

      <label className="field-inline">
        Overflow
        <select
          value={overflow}
          onChange={(event) => {
            setOverflow(event.target.value as 'wrap' | 'menu' | 'scroll');
          }}
        >
          <option value="menu">menu — extra items move into a “more” menu</option>
          <option value="wrap">wrap — the toolbar grows taller</option>
          <option value="scroll">scroll — the toolbar scrolls horizontally</option>
        </select>
      </label>

      <p className="page__lead" data-testid="toolbar-note">
        {layout.note}
      </p>

      <RichTextEditor
        key={layout.id}
        preset="standard"
        label="Message"
        toolbar={layout.toolbar}
        toolbarOverflow={overflow}
        defaultValue="<p>Resize the window to watch the overflow behaviour change.</p>"
        placeholder="Write something…"
      />
    </div>
  );
}
