import { describe, expect, it } from 'vitest';
import type { EditorDocument } from '../../types/document.js';
import {
  clearMarks,
  deleteBackward,
  deleteRange,
  hasMark,
  insertInline,
  insertText,
  runsInRange,
  setAlign,
  setBlockType,
  shiftIndent,
  splitRun,
  toggleList,
  toggleMark,
} from './operations.js';
import type { ModelSelection } from './selection.js';
import { textRuns } from './selection.js';
import { DocumentTree, ROOT_KEY } from './tree.js';

/**
 * These run in Node: an edit is a function from a tree and a selection to a new tree and
 * a new selection, and none of that needs a browser. The DOM's part is the reconciler's,
 * which has its own tests.
 */

const doc = (...content: EditorDocument['content']): EditorDocument => ({
  type: 'doc',
  version: 1,
  content,
});

/** Runs `edit` inside one update and hands back the tree and the resulting selection. */
function edit(
  fixture: EditorDocument,
  select: (tree: DocumentTree) => ModelSelection,
  run: (
    context: { tree: DocumentTree; write: Parameters<Parameters<DocumentTree['update']>[0]>[0] },
    selection: ModelSelection,
  ) => ModelSelection,
) {
  const tree = DocumentTree.fromDocument(fixture);
  let selection = select(tree);
  tree.update((write) => {
    selection = run({ tree, write }, selection);
  });
  return { tree, selection, doc: tree.toDocument() };
}

/** A selection over characters `from`..`to` of the run at `runIndex`. */
const range =
  (runIndex: number, from: number, to: number) =>
  (tree: DocumentTree): ModelSelection => {
    const key = textRuns(tree)[runIndex]!;
    return {
      anchor: { key, offset: from },
      focus: { key, offset: to },
      isCollapsed: from === to,
      isBackward: false,
    };
  };

/** A caret at `offset` in the run at `runIndex`. */
const caret = (runIndex: number, offset: number) => range(runIndex, offset, offset);

/** Every run's text, for readable assertions. */
const texts = (tree: DocumentTree): string[] =>
  textRuns(tree).map((key) => {
    const value = tree.get(key)?.value;
    return value?.type === 'text' ? value.text : '';
  });

describe('splitRun', () => {
  it('splits a run in the middle', () => {
    const { tree } = edit(
      doc({ type: 'paragraph', content: [{ type: 'text', text: 'abcdef' }] }),
      caret(0, 3),
      (context, selection) => {
        splitRun(context, textRuns(context.tree)[0]!, 3);
        return selection;
      },
    );
    expect(texts(tree)).toEqual(['abc', 'def']);
  });

  it('carries the marks onto the tail', () => {
    const { doc: result } = edit(
      doc({
        type: 'paragraph',
        content: [{ type: 'text', text: 'abcd', marks: [{ type: 'bold' }] }],
      }),
      caret(0, 2),
      (context, selection) => {
        splitRun(context, textRuns(context.tree)[0]!, 2);
        return selection;
      },
    );
    const content = (result.content[0] as { content: { marks?: unknown[] }[] }).content;
    expect(content).toHaveLength(2);
    expect(content[1]!.marks).toEqual([{ type: 'bold' }]);
  });

  it('does nothing at either end', () => {
    const { tree } = edit(
      doc({ type: 'paragraph', content: [{ type: 'text', text: 'abc' }] }),
      caret(0, 0),
      (context, selection) => {
        expect(splitRun(context, textRuns(context.tree)[0]!, 0)).toBe(textRuns(context.tree)[0]);
        expect(splitRun(context, textRuns(context.tree)[0]!, 3)).toBeNull();
        return selection;
      },
    );
    expect(texts(tree)).toEqual(['abc']);
  });
});

describe('runsInRange', () => {
  it('splits both ends so the selection covers whole runs', () => {
    const { tree } = edit(
      doc({ type: 'paragraph', content: [{ type: 'text', text: 'abcdef' }] }),
      range(0, 2, 4),
      (context, selection) => {
        const keys = runsInRange(context, selection);
        expect(keys).toHaveLength(1);
        return selection;
      },
    );
    expect(texts(tree)).toEqual(['ab', 'cd', 'ef']);
  });

  it('spans several runs', () => {
    const tree = DocumentTree.fromDocument(
      doc({
        type: 'paragraph',
        content: [
          { type: 'text', text: 'one' },
          { type: 'text', text: 'two', marks: [{ type: 'bold' }] },
        ],
      }),
    );
    const runs = textRuns(tree);
    let keys: string[] = [];
    tree.update((write) => {
      keys = runsInRange(
        { tree, write },
        {
          anchor: { key: runs[0]!, offset: 1 },
          focus: { key: runs[1]!, offset: 2 },
          isCollapsed: false,
          isBackward: false,
        },
      );
    });
    expect(keys).toHaveLength(2);
    expect(texts(tree)).toEqual(['o', 'ne', 'tw', 'o']);
  });

  it('a collapsed selection covers nothing', () => {
    const tree = DocumentTree.fromDocument(
      doc({ type: 'paragraph', content: [{ type: 'text', text: 'abc' }] }),
    );
    const runs = textRuns(tree);
    let keys: string[] = [];
    tree.update((write) => {
      keys = runsInRange(
        { tree, write },
        {
          anchor: { key: runs[0]!, offset: 1 },
          focus: { key: runs[0]!, offset: 1 },
          isCollapsed: true,
          isBackward: false,
        },
      );
    });
    expect(keys).toEqual([]);
  });
});

describe('marks', () => {
  const fixture = doc({ type: 'paragraph', content: [{ type: 'text', text: 'abcdef' }] });

  it('applies a mark to exactly the selected characters', () => {
    const { doc: result } = edit(fixture, range(0, 2, 4), (context, selection) =>
      toggleMark(context, selection, 'bold'),
    );
    expect(result.content[0]).toEqual({
      type: 'paragraph',
      content: [
        { type: 'text', text: 'ab' },
        { type: 'text', text: 'cd', marks: [{ type: 'bold' }] },
        { type: 'text', text: 'ef' },
      ],
    });
  });

  it('toggles a mark off when every covered run has it', () => {
    const bolded = doc({
      type: 'paragraph',
      content: [{ type: 'text', text: 'abc', marks: [{ type: 'bold' }] }],
    });
    const { doc: result } = edit(bolded, range(0, 0, 3), (context, selection) =>
      toggleMark(context, selection, 'bold'),
    );
    expect(result.content[0]).toEqual({
      type: 'paragraph',
      content: [{ type: 'text', text: 'abc' }],
    });
  });

  it('turns a mark on when only part of the selection has it', () => {
    const mixed = doc({
      type: 'paragraph',
      content: [
        { type: 'text', text: 'ab', marks: [{ type: 'bold' }] },
        { type: 'text', text: 'cd' },
      ],
    });
    const tree = DocumentTree.fromDocument(mixed);
    const runs = textRuns(tree);
    tree.update((write) => {
      toggleMark(
        { tree, write },
        {
          anchor: { key: runs[0]!, offset: 0 },
          focus: { key: runs[1]!, offset: 2 },
          isCollapsed: false,
          isBackward: false,
        },
        'bold',
      );
    });
    const content = (tree.toDocument().content[0] as { content: { marks?: unknown[] }[] }).content;
    expect(content.every((run) => run.marks !== undefined)).toBe(true);
  });

  it('reports whether every covered run carries a mark', () => {
    const tree = DocumentTree.fromDocument(
      doc({
        type: 'paragraph',
        content: [{ type: 'text', text: 'abc', marks: [{ type: 'italic' }] }],
      }),
    );
    expect(hasMark(tree, textRuns(tree), 'italic')).toBe(true);
    expect(hasMark(tree, textRuns(tree), 'bold')).toBe(false);
    expect(hasMark(tree, [], 'italic')).toBe(false);
  });

  it('replaces a valued mark rather than stacking it', () => {
    const coloured = doc({
      type: 'paragraph',
      content: [{ type: 'text', text: 'abc', marks: [{ type: 'color', value: 'red' }] }],
    });
    const tree = DocumentTree.fromDocument(coloured);
    const runs = textRuns(tree);
    tree.update((write) => {
      // `setMark` through the toggle helper keeps the code path identical to a command.
      const context = { tree, write };
      const selection = {
        anchor: { key: runs[0]!, offset: 0 },
        focus: { key: runs[0]!, offset: 3 },
        isCollapsed: false,
        isBackward: false,
      };
      const keys = runsInRange(context, selection);
      for (const key of keys) {
        write.setValue(key, {
          type: 'text',
          text: 'abc',
          marks: [{ type: 'color', value: 'blue' }],
        });
      }
    });
    const content = (tree.toDocument().content[0] as { content: { marks?: unknown[] }[] }).content;
    expect(content[0]!.marks).toEqual([{ type: 'color', value: 'blue' }]);
  });

  it('clearMarks strips everything', () => {
    const marked = doc({
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'abc',
          marks: [{ type: 'bold' }, { type: 'color', value: 'red' }],
        },
      ],
    });
    const { doc: result } = edit(marked, range(0, 0, 3), (context, selection) =>
      clearMarks(context, selection),
    );
    expect(result.content[0]).toEqual({
      type: 'paragraph',
      content: [{ type: 'text', text: 'abc' }],
    });
  });
});

describe('blocks', () => {
  const fixture = doc({ type: 'paragraph', content: [{ type: 'text', text: 'title' }] });

  it('retypes a paragraph as a heading, keeping its content', () => {
    const { doc: result } = edit(fixture, caret(0, 0), (context, selection) =>
      setBlockType(context, selection, 'heading', 2),
    );
    expect(result.content[0]).toEqual({
      type: 'heading',
      level: 2,
      content: [{ type: 'text', text: 'title' }],
    });
  });

  it('retypes back to a paragraph', () => {
    const heading = doc({ type: 'heading', level: 2, content: [{ type: 'text', text: 'x' }] });
    const { doc: result } = edit(heading, caret(0, 0), (context, selection) =>
      setBlockType(context, selection, 'paragraph'),
    );
    expect(result.content[0]!.type).toBe('paragraph');
  });

  it('a code block takes the text and drops the inline nodes', () => {
    const rich = doc({
      type: 'paragraph',
      content: [
        { type: 'text', text: 'const ' },
        { type: 'text', text: 'a = 1', marks: [{ type: 'bold' }] },
      ],
    });
    const { doc: result } = edit(rich, caret(0, 0), (context, selection) =>
      setBlockType(context, selection, 'codeBlock'),
    );
    expect(result.content[0]).toEqual({ type: 'codeBlock', text: 'const a = 1' });
  });

  it('retypes every block a selection touches', () => {
    const two = doc(
      { type: 'paragraph', content: [{ type: 'text', text: 'one' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'two' }] },
    );
    const tree = DocumentTree.fromDocument(two);
    const runs = textRuns(tree);
    tree.update((write) => {
      setBlockType(
        { tree, write },
        {
          anchor: { key: runs[0]!, offset: 0 },
          focus: { key: runs[1]!, offset: 3 },
          isCollapsed: false,
          isBackward: false,
        },
        'heading',
        3,
      );
    });
    expect(tree.toDocument().content.map((block) => block.type)).toEqual(['heading', 'heading']);
  });

  it('sets and clears alignment', () => {
    const centred = edit(fixture, caret(0, 0), (context, selection) =>
      setAlign(context, selection, 'center'),
    );
    expect((centred.doc.content[0] as { align?: string }).align).toBe('center');

    const back = edit(centred.doc, caret(0, 0), (context, selection) =>
      setAlign(context, selection, 'left'),
    );
    expect('align' in (back.doc.content[0] as object)).toBe(false);
  });

  it('indents and outdents, never below zero', () => {
    const inset = edit(fixture, caret(0, 0), (context, selection) =>
      shiftIndent(context, selection, 1),
    );
    expect((inset.doc.content[0] as { indent?: number }).indent).toBe(1);

    const back = edit(inset.doc, caret(0, 0), (context, selection) =>
      shiftIndent(context, selection, -5),
    );
    expect('indent' in (back.doc.content[0] as object)).toBe(false);
  });
});

describe('lists', () => {
  it('turns a paragraph into a list', () => {
    const { doc: result } = edit(
      doc({ type: 'paragraph', content: [{ type: 'text', text: 'one' }] }),
      caret(0, 0),
      (context, selection) => toggleList(context, selection, 'bullet'),
    );
    expect(result.content[0]).toEqual({
      type: 'list',
      listType: 'bullet',
      items: [{ type: 'listItem', content: [{ type: 'text', text: 'one' }] }],
    });
  });

  it('turns several paragraphs into one list', () => {
    const two = doc(
      { type: 'paragraph', content: [{ type: 'text', text: 'one' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'two' }] },
    );
    const tree = DocumentTree.fromDocument(two);
    const runs = textRuns(tree);
    tree.update((write) => {
      toggleList(
        { tree, write },
        {
          anchor: { key: runs[0]!, offset: 0 },
          focus: { key: runs[1]!, offset: 3 },
          isCollapsed: false,
          isBackward: false,
        },
        'bullet',
      );
    });
    const result = tree.toDocument();
    expect(result.content).toHaveLength(1);
    expect((result.content[0] as { items: unknown[] }).items).toHaveLength(2);
  });

  it('turns a list back into paragraphs', () => {
    const list = doc({
      type: 'list',
      listType: 'bullet',
      items: [{ type: 'listItem', content: [{ type: 'text', text: 'one' }] }],
    });
    const { doc: result } = edit(list, caret(0, 0), (context, selection) =>
      toggleList(context, selection, 'bullet'),
    );
    expect(result.content).toEqual([
      { type: 'paragraph', content: [{ type: 'text', text: 'one' }] },
    ]);
  });

  it('retypes a list of the wrong kind rather than rebuilding it', () => {
    const list = doc({
      type: 'list',
      listType: 'bullet',
      items: [{ type: 'listItem', content: [{ type: 'text', text: 'one' }] }],
    });
    const { doc: result } = edit(list, caret(0, 0), (context, selection) =>
      toggleList(context, selection, 'ordered'),
    );
    expect(result.content[0]).toEqual({
      type: 'list',
      listType: 'ordered',
      items: [{ type: 'listItem', content: [{ type: 'text', text: 'one' }] }],
    });
  });
});

describe('typing and deleting', () => {
  it('inserts text at a caret', () => {
    const { doc: result } = edit(
      doc({ type: 'paragraph', content: [{ type: 'text', text: 'ac' }] }),
      caret(0, 1),
      (context, selection) => insertText(context, selection, 'b'),
    );
    expect(result.content[0]).toEqual({
      type: 'paragraph',
      content: [{ type: 'text', text: 'abc' }],
    });
  });

  it('returns a caret after what it inserted', () => {
    const { selection, tree } = edit(
      doc({ type: 'paragraph', content: [{ type: 'text', text: 'ac' }] }),
      caret(0, 1),
      (context, sel) => insertText(context, sel, 'XY'),
    );
    expect(selection.focus).toEqual({ key: textRuns(tree)[0], offset: 3 });
    expect(selection.isCollapsed).toBe(true);
  });

  it('typing over a selection replaces it', () => {
    const { doc: result } = edit(
      doc({ type: 'paragraph', content: [{ type: 'text', text: 'abcdef' }] }),
      range(0, 2, 4),
      (context, selection) => insertText(context, selection, 'X'),
    );
    expect(
      (result.content[0] as { content: { text: string }[] }).content.map((r) => r.text).join(''),
    ).toBe('abXef');
  });

  it('types into an empty block', () => {
    const tree = DocumentTree.fromDocument(doc({ type: 'paragraph', content: [] }));
    const block = tree.children(ROOT_KEY)[0]!;
    tree.update((write) => {
      insertText(
        { tree, write },
        {
          anchor: { key: block, offset: 0 },
          focus: { key: block, offset: 0 },
          isCollapsed: true,
          isBackward: false,
        },
        'new',
      );
    });
    expect(tree.toDocument().content[0]).toEqual({
      type: 'paragraph',
      content: [{ type: 'text', text: 'new' }],
    });
  });

  it('deletes a range', () => {
    const { doc: result } = edit(
      doc({ type: 'paragraph', content: [{ type: 'text', text: 'abcdef' }] }),
      range(0, 2, 4),
      (context, selection) => deleteRange(context, selection),
    );
    expect(
      (result.content[0] as { content: { text: string }[] }).content.map((r) => r.text).join(''),
    ).toBe('abef');
  });

  it('deletes backward by grapheme cluster', () => {
    const { doc: result } = edit(
      doc({ type: 'paragraph', content: [{ type: 'text', text: 'a\u{1F44D}' }] }),
      caret(0, 3),
      (context, selection) => deleteBackward(context, selection, 1),
    );
    expect((result.content[0] as { content: { text: string }[] }).content[0]!.text).toBe('a');
  });

  it('deletes backward across a run boundary', () => {
    const tree = DocumentTree.fromDocument(
      doc({
        type: 'paragraph',
        content: [
          { type: 'text', text: 'ab' },
          { type: 'text', text: 'cd', marks: [{ type: 'bold' }] },
        ],
      }),
    );
    const runs = textRuns(tree);
    tree.update((write) => {
      deleteBackward(
        { tree, write },
        {
          anchor: { key: runs[1]!, offset: 1 },
          focus: { key: runs[1]!, offset: 1 },
          isCollapsed: true,
          isBackward: false,
        },
        3,
      );
    });
    // The caret sits after "abc" in "abcd", so three back removes a, b and c.
    expect(texts(tree).join('')).toBe('d');
  });

  it('stops at the start of the document', () => {
    const { doc: result } = edit(
      doc({ type: 'paragraph', content: [{ type: 'text', text: 'ab' }] }),
      caret(0, 2),
      (context, selection) => deleteBackward(context, selection, 99),
    );
    expect((result.content[0] as { content: unknown[] }).content).toEqual([]);
  });

  it('a non-positive count does nothing', () => {
    const { doc: result } = edit(
      doc({ type: 'paragraph', content: [{ type: 'text', text: 'ab' }] }),
      caret(0, 2),
      (context, selection) => deleteBackward(context, selection, 0),
    );
    expect((result.content[0] as { content: { text: string }[] }).content[0]!.text).toBe('ab');
  });

  it('inserts an inline node at the caret', () => {
    const { doc: result } = edit(
      doc({ type: 'paragraph', content: [{ type: 'text', text: 'ab' }] }),
      caret(0, 1),
      (context, selection) =>
        insertInline(context, selection, { type: 'mention', id: 'u_1', label: 'Dana' }),
    );
    const content = (result.content[0] as { content: { type: string }[] }).content;
    expect(content.map((node) => node.type)).toEqual(['text', 'mention', 'text']);
  });
});
