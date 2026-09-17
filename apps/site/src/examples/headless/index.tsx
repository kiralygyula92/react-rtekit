import { useState } from 'react';
import {
  Rte,
  plugins,
  useCharacterCount,
  useCommand,
  useEditor,
  useFormatState,
  useIsEmpty,
  type CommandId,
} from 'react-rtekit';

/**
 * `useEditor` with a UI built from nothing (06 §7).
 *
 * The fourth entry point in 02 §3: no `<RichTextEditor>`, no slots, no theme. What
 * remains is the editor instance, the subscription hooks and `<Rte.Content>` — which
 * exists because the contenteditable element belongs to the engine and has to be
 * attached rather than rendered.
 */

/** A control bound to one command. Everything a toolbar button really needs. */
function Control({ command, children }: { command: CommandId; children: string }) {
  const { exec, canExec, isActive } = useCommand(command);

  return (
    <button
      type="button"
      className="headless__control"
      aria-pressed={isActive}
      disabled={!canExec}
      // Without this the click moves focus out of the editor first, and the command
      // applies to a selection that no longer exists (fixes R5).
      onMouseDown={(event) => {
        event.preventDefault();
      }}
      onClick={() => {
        exec();
      }}
    >
      {children}
    </button>
  );
}

/** A read-out of the state the hooks expose, so the subscriptions are visible. */
function StateReadout() {
  const format = useFormatState();
  const count = useCharacterCount();
  const empty = useIsEmpty();

  const active = Object.entries(format.marks)
    .filter(([, value]) => value === true)
    .map(([name]) => name);

  return (
    <dl className="headless__state" data-testid="headless-state">
      <dt>Block</dt>
      <dd>
        {format.block.type}
        {format.block.headingLevel ? ` ${String(format.block.headingLevel)}` : ''} ·{' '}
        {format.block.align}
      </dd>
      <dt>Marks</dt>
      <dd>{active.length > 0 ? active.join(', ') : 'none'}</dd>
      <dt>List</dt>
      <dd>{format.list.type ?? 'none'}</dd>
      <dt>Length</dt>
      <dd>
        {count} characters · {empty ? 'empty' : 'not empty'}
      </dd>
    </dl>
  );
}

const SAMPLE = '<p>This whole page is four components and three hooks.</p>';

export default function HeadlessExample() {
  const [html, setHtml] = useState(SAMPLE);

  const editor = useEditor({
    defaultValue: SAMPLE,
    // No preset: the plugin list is exactly what this UI can reach.
    plugins: [
      plugins.paragraph,
      plugins.bold,
      plugins.italic,
      plugins.underline,
      plugins.list,
      plugins.history,
    ],
    onChange: (value) => {
      setHtml(value as string);
    },
  });

  return (
    <div className="stack">
      <Rte.Root editor={editor} className="headless">
        <div className="headless__bar" role="toolbar" aria-label="Formatting">
          <Control command="toggleBold">Bold</Control>
          <Control command="toggleItalic">Italic</Control>
          <Control command="toggleUnderline">Underline</Control>
          <Control command="toggleBulletList">Bullets</Control>
          <Control command="undo">Undo</Control>
          <Control command="redo">Redo</Control>
        </div>

        <Rte.Content aria-label="Message" placeholder="Nothing here is a shipped component." />
        <StateReadout />
      </Rte.Root>

      <div className="button-row">
        <button
          type="button"
          className="button"
          onClick={() => {
            editor.setContent(SAMPLE);
          }}
        >
          Reset content
        </button>
        <span className="example-basic__state">{html.length} bytes of HTML</span>
      </div>

      <p className="callout">
        The one component that could not be replaced is <code>{'<Rte.Content>'}</code>. The
        engine owns that element — it is where the selection, the IME and the undo stack
        live — so the library attaches it rather than rendering it, and everything else
        is yours.
      </p>
    </div>
  );
}
