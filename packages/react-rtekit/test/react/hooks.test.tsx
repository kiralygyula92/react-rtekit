import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Rte, useEditor, useEditorState } from '../../src/index.js';
import type { EditorSnapshot } from '../../src/types/editor.js';
import { getRuntime } from '../../src/react/runtime.js';
import type { EditorInstance } from '../../src/types/editor.js';

function Selected({
  selector,
  isEqual,
}: {
  selector: (snapshot: EditorSnapshot) => number;
  isEqual?: (a: number, b: number) => boolean;
}) {
  return <output aria-label="Selected value">{useEditorState(selector, isEqual)}</output>;
}

function Harness({
  selector,
  isEqual,
  onEditor,
}: Parameters<typeof Selected>[0] & {
  onEditor?: (editor: EditorInstance) => void;
}) {
  const editor = useEditor({});
  onEditor?.(editor);
  return (
    <Rte.Root editor={editor}>
      <Selected selector={selector} isEqual={isEqual} />
    </Rte.Root>
  );
}

describe('editor state selectors', () => {
  it('updates when the selector changes without a store notification', () => {
    const view = render(<Harness selector={() => 1} />);
    expect(screen.getByRole('status', { name: 'Selected value' })).toHaveTextContent('1');
    view.rerender(<Harness selector={() => 2} />);
    expect(screen.getByRole('status', { name: 'Selected value' })).toHaveTextContent('2');
  });

  it('rechecks a cached selection when the equality function changes', () => {
    let editor!: EditorInstance;
    const selector = (snapshot: EditorSnapshot) => snapshot.length;
    const onEditor = (value: EditorInstance) => {
      editor = value;
    };
    const view = render(<Harness selector={selector} isEqual={() => true} onEditor={onEditor} />);
    act(() => {
      getRuntime(editor).store.update({ length: 3 });
    });
    expect(screen.getByRole('status', { name: 'Selected value' })).toHaveTextContent('0');
    view.rerender(<Harness selector={selector} isEqual={Object.is} onEditor={onEditor} />);
    expect(screen.getByRole('status', { name: 'Selected value' })).toHaveTextContent('3');
  });
});
