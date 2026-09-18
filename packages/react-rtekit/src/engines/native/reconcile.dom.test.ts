import { describe, expect, it } from 'vitest';
import type { EditorDocument } from '../../types/document.js';
import { documentToHtml } from '../../core/serialize/to-html.js';
import { KEY_ATTRIBUTE, renderTree } from './render.js';
import { reconcile, signaturesOf } from './reconcile.js';
import { DocumentTree, ROOT_KEY } from './tree.js';

/**
 * Two things are being tested, and the second is the one that matters.
 *
 * The first is that reconciling produces the right DOM — checked by comparing against a
 * full re-render of the same model, so the reconciler cannot drift from the renderer.
 *
 * The second is that it produces the right DOM *without touching more than it has to*.
 * A reconciler that passes the first check by calling `replaceChildren` on the root would
 * move the caret to the start of the document on every keystroke and cancel every IME
 * composition. So the identity assertions below — "this is still the same text node" —
 * are the real subject.
 */

const doc = (...content: EditorDocument['content']): EditorDocument => ({
  type: 'doc',
  version: 1,
  content,
});

/** Mounts a tree and returns everything a caller needs to edit and re-check it. */
function mount(fixture: EditorDocument) {
  const tree = DocumentTree.fromDocument(fixture);
  const container = document.createElement('div');
  const index = renderTree(tree, container);
  const signatures = signaturesOf(tree);
  return {
    tree,
    container,
    index,
    signatures,
    apply(edit: Parameters<DocumentTree['update']>[0]) {
      const change = tree.update(edit);
      reconcile(tree, change, index, signatures);
      return change;
    },
    /** The DOM as HTML, minus the bookkeeping attribute. */
    html() {
      const clone = container.cloneNode(true) as HTMLElement;
      for (const element of clone.querySelectorAll(`[${KEY_ATTRIBUTE}]`)) {
        element.removeAttribute(KEY_ATTRIBUTE);
      }
      return clone.innerHTML;
    },
  };
}

describe('reconciling lands on the same DOM a fresh render would', () => {
  it('after changing text', () => {
    const editor = mount(doc({ type: 'paragraph', content: [{ type: 'text', text: 'before' }] }));
    const run = editor.tree.children(editor.tree.children(ROOT_KEY)[0]!)[0]!;
    editor.apply((w) => {
      w.setValue(run, { type: 'text', text: 'after' });
    });
    expect(editor.html()).toBe(documentToHtml(editor.tree.toDocument()));
  });

  it('after adding a block', () => {
    const editor = mount(doc({ type: 'paragraph', content: [{ type: 'text', text: 'one' }] }));
    editor.apply((w) => {
      w.insert(ROOT_KEY, { type: 'paragraph', content: [{ type: 'text', text: 'two' }] });
    });
    expect(editor.html()).toBe(documentToHtml(editor.tree.toDocument()));
  });

  it('after inserting a block in the middle', () => {
    const editor = mount(
      doc(
        { type: 'paragraph', content: [{ type: 'text', text: 'one' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'three' }] },
      ),
    );
    editor.apply((w) => {
      w.insert(ROOT_KEY, { type: 'paragraph', content: [{ type: 'text', text: 'two' }] }, 1);
    });
    expect(editor.html()).toBe(documentToHtml(editor.tree.toDocument()));
  });

  it('after removing a block', () => {
    const editor = mount(
      doc(
        { type: 'paragraph', content: [{ type: 'text', text: 'one' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'two' }] },
      ),
    );
    editor.apply((w) => {
      w.remove(editor.tree.children(ROOT_KEY)[0]!);
    });
    expect(editor.html()).toBe(documentToHtml(editor.tree.toDocument()));
  });

  it('after changing a block type', () => {
    const editor = mount(doc({ type: 'paragraph', content: [{ type: 'text', text: 'title' }] }));
    editor.apply((w) => {
      w.setValue(editor.tree.children(ROOT_KEY)[0]!, { type: 'heading', level: 2, content: [] });
    });
    expect(editor.html()).toBe(documentToHtml(editor.tree.toDocument()));
    expect(editor.container.querySelector('h2')).not.toBeNull();
  });

  it('after adding a mark', () => {
    const editor = mount(doc({ type: 'paragraph', content: [{ type: 'text', text: 'plain' }] }));
    const run = editor.tree.children(editor.tree.children(ROOT_KEY)[0]!)[0]!;
    editor.apply((w) => {
      w.setValue(run, { type: 'text', text: 'plain', marks: [{ type: 'bold' }] });
    });
    expect(editor.html()).toBe(documentToHtml(editor.tree.toDocument()));
  });

  it('after removing a mark', () => {
    const editor = mount(
      doc({
        type: 'paragraph',
        content: [{ type: 'text', text: 'bold', marks: [{ type: 'bold' }] }],
      }),
    );
    const run = editor.tree.children(editor.tree.children(ROOT_KEY)[0]!)[0]!;
    editor.apply((w) => {
      w.setValue(run, { type: 'text', text: 'bold' });
    });
    expect(editor.html()).toBe(documentToHtml(editor.tree.toDocument()));
    expect(editor.container.querySelector('strong')).toBeNull();
  });

  it('after reordering siblings', () => {
    const editor = mount(
      doc(
        { type: 'paragraph', content: [{ type: 'text', text: 'one' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'two' }] },
      ),
    );
    const [first] = editor.tree.children(ROOT_KEY);
    editor.apply((w) => {
      w.move(first!, ROOT_KEY, 2);
    });
    expect(editor.html()).toBe(documentToHtml(editor.tree.toDocument()));
    expect(editor.container.textContent).toBe('twoone');
  });

  it('after emptying a paragraph', () => {
    const editor = mount(doc({ type: 'paragraph', content: [{ type: 'text', text: 'gone' }] }));
    const run = editor.tree.children(editor.tree.children(ROOT_KEY)[0]!)[0]!;
    editor.apply((w) => {
      w.remove(run);
    });
    expect(editor.html()).toBe(documentToHtml(editor.tree.toDocument()));
    expect(editor.container.querySelector('p > br')).not.toBeNull();
  });

  it('after adding a list item', () => {
    const editor = mount(
      doc({
        type: 'list',
        listType: 'bullet',
        items: [{ type: 'listItem', content: [{ type: 'text', text: 'one' }] }],
      }),
    );
    const list = editor.tree.children(ROOT_KEY)[0]!;
    editor.apply((w) => {
      w.insert(list, { type: 'listItem', content: [{ type: 'text', text: 'two' }] });
    });
    expect(editor.html()).toBe(documentToHtml(editor.tree.toDocument()));
  });

  it('after adding a row to a table', () => {
    const editor = mount(
      doc({
        type: 'table',
        rows: [
          {
            type: 'tableRow',
            cells: [
              {
                type: 'tableCell',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'a' }] }],
              },
            ],
          },
        ],
      }),
    );
    const table = editor.tree.children(ROOT_KEY)[0]!;
    editor.apply((w) => {
      w.insert(table, {
        type: 'tableRow',
        cells: [
          {
            type: 'tableCell',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'b' }] }],
          },
        ],
      });
    });
    expect(editor.html()).toBe(documentToHtml(editor.tree.toDocument()));
    expect(editor.container.querySelectorAll('tbody > tr')).toHaveLength(2);
  });

  it('after nesting a list inside an item', () => {
    const editor = mount(
      doc({
        type: 'list',
        listType: 'bullet',
        items: [{ type: 'listItem', content: [{ type: 'text', text: 'outer' }] }],
      }),
    );
    const item = editor.tree.children(editor.tree.children(ROOT_KEY)[0]!)[0]!;
    editor.apply((w) => {
      w.insert(
        item,
        {
          type: 'list',
          listType: 'bullet',
          items: [{ type: 'listItem', content: [{ type: 'text', text: 'inner' }] }],
        },
        undefined,
        'children',
      );
    });
    expect(editor.html()).toBe(documentToHtml(editor.tree.toDocument()));
  });
});

describe('reconciling touches as little as it can', () => {
  it('preserves inline DOM when only the block alignment changes', () => {
    const editor = mount(doc({ type: 'paragraph', content: [{ type: 'text', text: 'text' }] }));
    const paragraph = editor.tree.children(ROOT_KEY)[0]!;
    const run = editor.tree.children(paragraph)[0]!;
    const text = editor.index.textByKey.get(run);
    editor.apply((w) => {
      w.setValue(paragraph, { type: 'paragraph', align: 'center', content: [] });
    });
    expect(editor.index.textByKey.get(run)).toBe(text);
    expect(editor.container.querySelector('p')?.firstChild).toBe(text);
    expect(editor.html()).toBe('<p class="rte-align-center">text</p>');
  });

  it('releases every old DOM mapping after repeated formatting and removal', () => {
    const editor = mount(doc({ type: 'paragraph', content: [{ type: 'text', text: 'text' }] }));
    const paragraph = editor.tree.children(ROOT_KEY)[0]!;
    const run = editor.tree.children(paragraph)[0]!;
    for (let step = 0; step < 20; step += 1) {
      editor.apply((w) => {
        w.setValue(run, {
          type: 'text', text: 'text',
          marks: step % 2 === 0 ? [{ type: 'bold' }, { type: 'italic' }] : [],
        });
      });
    }
    expect([...editor.index.byNode.keys()].every((node) => editor.container.contains(node))).toBe(true);
    editor.apply((w) => { w.remove(paragraph); });
    expect([...editor.index.byNode.keys()]).toEqual([editor.container]);
    expect(editor.index.textByKey.size).toBe(0);
  });

  it('drops the old text mapping when a run becomes empty', () => {
    const editor = mount(doc({ type: 'paragraph', content: [{ type: 'text', text: 'text' }] }));
    const run = editor.tree.children(editor.tree.children(ROOT_KEY)[0]!)[0]!;
    editor.apply((w) => { w.setValue(run, { type: 'text', text: '' }); });
    expect(editor.index.textByKey.has(run)).toBe(false);
    expect(editor.html()).toBe('<p><br></p>');
  });

  it('keeps the text node when only its characters change', () => {
    // The whole point. A replaced text node takes the caret with it, so typing would
    // send the caret back to the start of the line on every keystroke.
    const editor = mount(doc({ type: 'paragraph', content: [{ type: 'text', text: 'ab' }] }));
    const run = editor.tree.children(editor.tree.children(ROOT_KEY)[0]!)[0]!;
    const before = editor.index.textByKey.get(run);
    editor.apply((w) => {
      w.setValue(run, { type: 'text', text: 'abc' });
    });
    expect(editor.index.textByKey.get(run)).toBe(before);
    expect(before?.data).toBe('abc');
  });

  it('keeps the paragraph element when only its text changes', () => {
    const editor = mount(doc({ type: 'paragraph', content: [{ type: 'text', text: 'ab' }] }));
    const paragraph = editor.tree.children(ROOT_KEY)[0]!;
    const before = editor.index.byKey.get(paragraph);
    const run = editor.tree.children(paragraph)[0]!;
    editor.apply((w) => {
      w.setValue(run, { type: 'text', text: 'abc' });
    });
    expect(editor.index.byKey.get(paragraph)).toBe(before);
  });

  it('keeps untouched siblings when one is added', () => {
    const editor = mount(
      doc(
        { type: 'paragraph', content: [{ type: 'text', text: 'one' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'two' }] },
      ),
    );
    const untouched = editor.tree.children(ROOT_KEY).map((key) => editor.index.byKey.get(key));
    editor.apply((w) => {
      w.insert(ROOT_KEY, { type: 'paragraph', content: [{ type: 'text', text: 'three' }] }, 1);
    });
    const [first, , third] = editor.tree.children(ROOT_KEY);
    expect(editor.index.byKey.get(first!)).toBe(untouched[0]);
    expect(editor.index.byKey.get(third!)).toBe(untouched[1]);
  });

  it('moves an element on a reorder rather than rebuilding it', () => {
    const editor = mount(
      doc(
        { type: 'paragraph', content: [{ type: 'text', text: 'one' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'two' }] },
      ),
    );
    const [first] = editor.tree.children(ROOT_KEY);
    const before = editor.index.byKey.get(first!);
    editor.apply((w) => {
      w.move(first!, ROOT_KEY, 2);
    });
    expect(editor.index.byKey.get(first!)).toBe(before);
    expect(editor.container.lastChild).toBe(before);
  });

  it('keeps a paragraph’s children when a sibling paragraph changes', () => {
    const editor = mount(
      doc(
        { type: 'paragraph', content: [{ type: 'text', text: 'one' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'two' }] },
      ),
    );
    const second = editor.tree.children(ROOT_KEY)[1]!;
    const secondText = editor.index.textByKey.get(editor.tree.children(second)[0]!);
    const first = editor.tree.children(ROOT_KEY)[0]!;
    editor.apply((w) => {
      w.setValue(editor.tree.children(first)[0]!, { type: 'text', text: 'changed' });
    });
    expect(editor.index.textByKey.get(editor.tree.children(second)[0]!)).toBe(secondText);
  });

  it('an update that changes nothing leaves the DOM untouched', () => {
    const editor = mount(doc({ type: 'paragraph', content: [{ type: 'text', text: 'same' }] }));
    const paragraph = editor.index.byKey.get(editor.tree.children(ROOT_KEY)[0]!);
    const html = editor.html();
    editor.apply(() => {
      // nothing
    });
    expect(editor.index.byKey.get(editor.tree.children(ROOT_KEY)[0]!)).toBe(paragraph);
    expect(editor.html()).toBe(html);
  });

  it('drops the index entries of a removed subtree', () => {
    const editor = mount(
      doc({
        type: 'list',
        listType: 'bullet',
        items: [{ type: 'listItem', content: [{ type: 'text', text: 'one' }] }],
      }),
    );
    const list = editor.tree.children(ROOT_KEY)[0]!;
    const item = editor.tree.children(list)[0]!;
    const run = editor.tree.children(item)[0]!;
    editor.apply((w) => {
      w.remove(list);
    });
    for (const key of [list, item, run]) {
      expect(editor.index.byKey.has(key)).toBe(false);
      expect(editor.signatures.has(key)).toBe(false);
    }
  });
});
