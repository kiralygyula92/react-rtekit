import { describe, expect, it } from 'vitest';
import type { EditorDocument } from '../../types/document.js';
import { renderTree } from './render.js';
import {
  atEnd,
  atStart,
  blockOf,
  fromEditorPoint,
  readSelection,
  selectAll,
  textBeforeCaret,
  textRuns,
  toEditorPoint,
  toModelPoint,
  writeSelection,
} from './selection.js';
import { DocumentTree, ROOT_KEY } from './tree.js';

/**
 * The cases here are the ones browsers disagree about: a selection on an element rather
 * than a text node, a selection on a `<br>`, a selection inside a mark stack, and a
 * selection on an atomic node that renders as text. Each has to resolve to "a run and a
 * character offset" or nothing above the engine can reason about it.
 */

const doc = (...content: EditorDocument['content']): EditorDocument => ({
  type: 'doc',
  version: 1,
  content,
});

function mount(fixture: EditorDocument) {
  const tree = DocumentTree.fromDocument(fixture);
  const container = document.createElement('div');
  document.body.append(container);
  const index = renderTree(tree, container);
  return { tree, container, index };
}

describe('toModelPoint', () => {
  it('resolves a text node position directly', () => {
    const { tree, index, container } = mount(
      doc({ type: 'paragraph', content: [{ type: 'text', text: 'hello' }] }),
    );
    const text = container.querySelector('p')!.firstChild!;
    const point = toModelPoint(tree, index, text, 3);
    expect(point).toEqual({ key: textRuns(tree)[0], offset: 3 });
  });

  it('clamps an offset past the end of the run', () => {
    const { tree, index, container } = mount(
      doc({ type: 'paragraph', content: [{ type: 'text', text: 'ab' }] }),
    );
    const text = container.querySelector('p')!.firstChild!;
    expect(toModelPoint(tree, index, text, 99)?.offset).toBe(2);
  });

  it('resolves a position on an element, where the offset counts children', () => {
    const { tree, index, container } = mount(
      doc({
        type: 'paragraph',
        content: [
          { type: 'text', text: 'one' },
          { type: 'text', text: 'two', marks: [{ type: 'bold' }] },
        ],
      }),
    );
    const paragraph = container.querySelector('p')!;
    // "before child 1" is the start of the second run.
    const point = toModelPoint(tree, index, paragraph, 1);
    expect(point).toEqual({ key: textRuns(tree)[1], offset: 0 });
  });

  it('resolves a position inside a mark stack to the run it wraps', () => {
    const { tree, index, container } = mount(
      doc({
        type: 'paragraph',
        content: [{ type: 'text', text: 'bi', marks: [{ type: 'bold' }, { type: 'italic' }] }],
      }),
    );
    const strong = container.querySelector('strong')!;
    expect(toModelPoint(tree, index, strong, 0)?.key).toBe(textRuns(tree)[0]);
  });

  it('resolves a position on an empty paragraph to a run in the document', () => {
    const { tree, index, container } = mount(
      doc(
        { type: 'paragraph', content: [] },
        { type: 'paragraph', content: [{ type: 'text', text: 'after' }] },
      ),
    );
    const empty = container.querySelector('p')!;
    const point = toModelPoint(tree, index, empty, 0);
    expect(point).not.toBeNull();
    expect(textRuns(tree)).toContain(point!.key);
  });

  it('resolves a position on an atomic node to a run beside it', () => {
    const { tree, index, container } = mount(
      doc({
        type: 'paragraph',
        content: [
          { type: 'text', text: 'hi ' },
          { type: 'mention', id: 'u_1', label: 'Dana' },
        ],
      }),
    );
    const mention = container.querySelector('.rte-mention')!.firstChild!;
    const point = toModelPoint(tree, index, mention, 2);
    expect(point).not.toBeNull();
    expect(textRuns(tree)).toContain(point!.key);
  });

  it('returns null for a node that is not the editor’s', () => {
    const { tree, index } = mount(
      doc({ type: 'paragraph', content: [{ type: 'text', text: 'x' }] }),
    );
    const stranger = document.createElement('div');
    expect(toModelPoint(tree, index, stranger, 0)).toBeNull();
  });
});

describe('reading and writing the browser selection', () => {
  it('round-trips a caret', () => {
    const { tree, index, container } = mount(
      doc({ type: 'paragraph', content: [{ type: 'text', text: 'hello' }] }),
    );
    const run = textRuns(tree)[0]!;
    writeSelection(index, container, {
      anchor: { key: run, offset: 2 },
      focus: { key: run, offset: 2 },
      isCollapsed: true,
      isBackward: false,
    });
    const read = readSelection(tree, index, container);
    expect(read).toEqual({
      anchor: { key: run, offset: 2 },
      focus: { key: run, offset: 2 },
      isCollapsed: true,
      isBackward: false,
    });
  });

  it('round-trips a range across two runs', () => {
    const { tree, index, container } = mount(
      doc({
        type: 'paragraph',
        content: [
          { type: 'text', text: 'one' },
          { type: 'text', text: 'two', marks: [{ type: 'bold' }] },
        ],
      }),
    );
    const [first, second] = textRuns(tree);
    writeSelection(index, container, {
      anchor: { key: first!, offset: 1 },
      focus: { key: second!, offset: 2 },
      isCollapsed: false,
      isBackward: false,
    });
    const read = readSelection(tree, index, container);
    expect(read?.anchor).toEqual({ key: first, offset: 1 });
    expect(read?.focus).toEqual({ key: second, offset: 2 });
    expect(read?.isCollapsed).toBe(false);
  });

  it('reports a backward selection as backward', () => {
    const { tree, index, container } = mount(
      doc({
        type: 'paragraph',
        content: [
          { type: 'text', text: 'one' },
          { type: 'text', text: 'two', marks: [{ type: 'bold' }] },
        ],
      }),
    );
    const [first, second] = textRuns(tree);
    const selection = document.getSelection()!;
    const range = document.createRange();
    range.setStart(index.textByKey.get(first!)!, 1);
    range.setEnd(index.textByKey.get(second!)!, 2);
    selection.removeAllRanges();
    selection.addRange(range);
    selection.extend(index.textByKey.get(first!)!, 0);
    const read = readSelection(tree, index, container);
    expect(read?.isBackward).toBe(true);
  });

  it('returns null when the selection is elsewhere on the page', () => {
    const { tree, index, container } = mount(
      doc({ type: 'paragraph', content: [{ type: 'text', text: 'hello' }] }),
    );
    const outside = document.createElement('p');
    outside.textContent = 'elsewhere';
    document.body.append(outside);
    const range = document.createRange();
    range.selectNodeContents(outside);
    const selection = document.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
    expect(readSelection(tree, index, container)).toBeNull();
    outside.remove();
  });

  it('writing an out-of-range offset collapses rather than throwing', () => {
    const { tree, index, container } = mount(
      doc({ type: 'paragraph', content: [{ type: 'text', text: 'ab' }] }),
    );
    const run = textRuns(tree)[0]!;
    expect(() => {
      writeSelection(index, container, {
        anchor: { key: run, offset: 99 },
        focus: { key: run, offset: 99 },
        isCollapsed: true,
        isBackward: false,
      });
    }).not.toThrow();
  });
});

describe('named positions', () => {
  const fixture = doc(
    { type: 'paragraph', content: [{ type: 'text', text: 'first' }] },
    { type: 'paragraph', content: [{ type: 'text', text: 'last' }] },
  );

  it('atStart is the start of the first run', () => {
    const { tree } = mount(fixture);
    expect(atStart(tree)).toMatchObject({
      anchor: { key: textRuns(tree)[0], offset: 0 },
      isCollapsed: true,
    });
  });

  it('atEnd is the end of the last run', () => {
    const { tree } = mount(fixture);
    expect(atEnd(tree)).toMatchObject({
      anchor: { key: textRuns(tree)[1], offset: 4 },
      isCollapsed: true,
    });
  });

  it('selectAll spans the whole document', () => {
    const { tree } = mount(fixture);
    const all = selectAll(tree)!;
    expect(all.anchor).toEqual({ key: textRuns(tree)[0], offset: 0 });
    expect(all.focus).toEqual({ key: textRuns(tree)[1], offset: 4 });
    expect(all.isCollapsed).toBe(false);
  });

  it('an empty document has no positions to name', () => {
    const { tree } = mount(doc());
    expect(atStart(tree)).toBeNull();
    expect(atEnd(tree)).toBeNull();
    expect(selectAll(tree)).toBeNull();
  });
});

describe('the published path form', () => {
  it('round-trips through a path', () => {
    const { tree } = mount(
      doc(
        { type: 'paragraph', content: [{ type: 'text', text: 'one' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'two' }] },
      ),
    );
    const run = textRuns(tree)[1]!;
    const path = toEditorPoint(tree, { key: run, offset: 2 });
    expect(path).toEqual({ path: [1, 0], offset: 2 });
    expect(fromEditorPoint(tree, path)).toEqual({ key: run, offset: 2 });
  });

  it('a path that addresses nothing resolves to null', () => {
    const { tree } = mount(doc({ type: 'paragraph', content: [{ type: 'text', text: 'x' }] }));
    expect(fromEditorPoint(tree, { path: [9, 9], offset: 0 })).toBeNull();
  });
});

describe('textBeforeCaret', () => {
  it('reads back through the runs of one block', () => {
    const { tree } = mount(
      doc({
        type: 'paragraph',
        content: [
          { type: 'text', text: 'hello ' },
          { type: 'text', text: 'world', marks: [{ type: 'bold' }] },
        ],
      }),
    );
    const second = textRuns(tree)[1]!;
    const caret = { key: second, offset: 3 };
    expect(
      textBeforeCaret(tree, { anchor: caret, focus: caret, isCollapsed: true, isBackward: false }),
    ).toBe('hello wor');
  });

  it('stops at the block boundary', () => {
    const { tree } = mount(
      doc(
        { type: 'paragraph', content: [{ type: 'text', text: 'before' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'here' }] },
      ),
    );
    const second = textRuns(tree)[1]!;
    const caret = { key: second, offset: 4 };
    expect(
      textBeforeCaret(tree, { anchor: caret, focus: caret, isCollapsed: true, isBackward: false }),
    ).toBe('here');
  });

  it('honours maxLength by keeping the end', () => {
    const { tree } = mount(doc({ type: 'paragraph', content: [{ type: 'text', text: 'abcdef' }] }));
    const run = textRuns(tree)[0]!;
    const caret = { key: run, offset: 6 };
    expect(
      textBeforeCaret(
        tree,
        { anchor: caret, focus: caret, isCollapsed: true, isBackward: false },
        3,
      ),
    ).toBe('def');
  });
});

describe('blockOf', () => {
  it('finds the paragraph a run sits in', () => {
    const { tree } = mount(doc({ type: 'paragraph', content: [{ type: 'text', text: 'x' }] }));
    const run = textRuns(tree)[0]!;
    expect(blockOf(tree, run)).toBe(tree.children(ROOT_KEY)[0]);
  });

  it('finds the list item rather than the list', () => {
    const { tree } = mount(
      doc({
        type: 'list',
        listType: 'bullet',
        items: [{ type: 'listItem', content: [{ type: 'text', text: 'x' }] }],
      }),
    );
    const run = textRuns(tree)[0]!;
    const list = tree.children(ROOT_KEY)[0]!;
    expect(blockOf(tree, run)).toBe(tree.children(list)[0]);
  });
});
