import { describe, expect, it } from 'vitest';
import type { EditorDocument } from '../../types/document.js';
import { DocumentTree, ROOT_KEY, isEmptyChange } from './tree.js';

/** A document with one paragraph of one text run. */
const simple: EditorDocument = {
  type: 'doc',
  version: 1,
  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'hello' }] }],
};

/** A document with nesting on every axis the tree has to flatten. */
const nested: EditorDocument = {
  type: 'doc',
  version: 1,
  content: [
    { type: 'paragraph', content: [{ type: 'text', text: 'before' }] },
    {
      type: 'list',
      listType: 'bullet',
      items: [
        { type: 'listItem', content: [{ type: 'text', text: 'one' }] },
        {
          type: 'listItem',
          content: [
            { type: 'text', text: 'two' },
            {
              type: 'link',
              href: 'https://example.com',
              content: [{ type: 'text', text: 'link' }],
            },
          ],
        },
      ],
    },
    {
      type: 'table',
      rows: [
        {
          type: 'tableRow',
          cells: [
            {
              type: 'tableCell',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'a' }] }],
            },
            {
              type: 'tableCell',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'b' }] }],
            },
          ],
        },
      ],
    },
  ],
};

describe('fromDocument / toDocument', () => {
  it('round-trips a simple document unchanged', () => {
    expect(DocumentTree.fromDocument(simple).toDocument()).toEqual(simple);
  });

  it('round-trips lists, links and tables', () => {
    expect(DocumentTree.fromDocument(nested).toDocument()).toEqual(nested);
  });

  it('round-trips an empty document', () => {
    const empty: EditorDocument = { type: 'doc', version: 1, content: [] };
    expect(DocumentTree.fromDocument(empty).toDocument()).toEqual(empty);
  });

  it('keeps an empty container a container rather than dropping its field', () => {
    const doc: EditorDocument = {
      type: 'doc',
      version: 1,
      content: [{ type: 'paragraph', content: [] }],
    };
    expect(DocumentTree.fromDocument(doc).toDocument()).toEqual(doc);
  });

  it('round-trips a list item that has both inline content and nested lists', () => {
    // `listItem` is the one type with two child fields. A tree that assumed one field per
    // type put both sets in `content` and dropped `children` entirely on the way out.
    const doc: EditorDocument = {
      type: 'doc',
      version: 1,
      content: [
        {
          type: 'list',
          listType: 'bullet',
          items: [
            {
              type: 'listItem',
              content: [{ type: 'text', text: 'outer' }],
              children: [
                {
                  type: 'list',
                  listType: 'bullet',
                  items: [{ type: 'listItem', content: [{ type: 'text', text: 'inner' }] }],
                },
              ],
            },
          ],
        },
      ],
    };
    expect(DocumentTree.fromDocument(doc).toDocument()).toEqual(doc);
  });

  it('does not invent an empty `children` on a plain list item', () => {
    const doc: EditorDocument = {
      type: 'doc',
      version: 1,
      content: [
        {
          type: 'list',
          listType: 'bullet',
          items: [{ type: 'listItem', content: [{ type: 'text', text: 'one' }] }],
        },
      ],
    };
    const back = DocumentTree.fromDocument(doc).toDocument();
    const item = (back.content[0] as unknown as { items: Record<string, unknown>[] }).items[0]!;
    expect('children' in item).toBe(false);
  });

  it('flattens every node into its own entry', () => {
    const tree = DocumentTree.fromDocument(simple);
    // root, paragraph, text
    expect(tree.size).toBe(3);
  });

  it('gives every node a distinct key', () => {
    const tree = DocumentTree.fromDocument(nested);
    const seen = new Set([ROOT_KEY]);
    const walk = (key: string): void => {
      for (const child of tree.children(key)) {
        expect(seen.has(child)).toBe(false);
        seen.add(child);
        walk(child);
      }
    };
    walk(ROOT_KEY);
    expect(seen.size).toBe(tree.size);
  });

  it('an empty tree is a root with no children', () => {
    const tree = DocumentTree.empty();
    expect(tree.size).toBe(1);
    expect(tree.children(ROOT_KEY)).toEqual([]);
    expect(tree.toDocument()).toEqual({ type: 'doc', version: 1, content: [] });
  });
});

describe('navigation', () => {
  it('reports parents and children', () => {
    const tree = DocumentTree.fromDocument(simple);
    const [paragraph] = tree.children(ROOT_KEY);
    const [text] = tree.children(paragraph!);
    expect(tree.parent(paragraph!)).toBe(ROOT_KEY);
    expect(tree.parent(text!)).toBe(paragraph!);
    expect(tree.parent(ROOT_KEY)).toBeNull();
  });

  it('walks ancestors nearest first', () => {
    const tree = DocumentTree.fromDocument(nested);
    const list = tree.children(ROOT_KEY)[1]!;
    const item = tree.children(list)[1]!;
    const link = tree.children(item)[1]!;
    const text = tree.children(link)[0]!;
    expect(tree.ancestors(text)).toEqual([link, item, list, ROOT_KEY]);
  });

  it('answers undefined for a key it does not have', () => {
    const tree = DocumentTree.fromDocument(simple);
    expect(tree.get('nope')).toBeUndefined();
    expect(tree.parent('nope')).toBeUndefined();
    expect(tree.children('nope')).toEqual([]);
  });
});

describe('update', () => {
  it('setValue changes the node and reports it', () => {
    const tree = DocumentTree.fromDocument(simple);
    const text = tree.children(tree.children(ROOT_KEY)[0]!)[0]!;
    const change = tree.update((w) => {
      w.setValue(text, { type: 'text', text: 'goodbye' });
    });
    expect([...change.updated]).toEqual([text]);
    expect(tree.toDocument().content[0]).toEqual({
      type: 'paragraph',
      content: [{ type: 'text', text: 'goodbye' }],
    });
  });

  it('setValue keeps the node’s children', () => {
    const tree = DocumentTree.fromDocument(simple);
    const paragraph = tree.children(ROOT_KEY)[0]!;
    tree.update((w) => {
      w.setValue(paragraph, { type: 'heading', level: 2, content: [] });
    });
    expect(tree.toDocument().content[0]).toEqual({
      type: 'heading',
      level: 2,
      content: [{ type: 'text', text: 'hello' }],
    });
  });

  it('insert adds a subtree and reports every key in it', () => {
    const tree = DocumentTree.fromDocument(simple);
    const change = tree.update(
      (w) =>
        void w.insert(ROOT_KEY, {
          type: 'paragraph',
          content: [{ type: 'text', text: 'added' }],
        }),
    );
    expect(change.added.size).toBe(2); // the paragraph and its text
    expect(change.rearranged.has(ROOT_KEY)).toBe(true);
    expect(tree.toDocument().content).toHaveLength(2);
  });

  it('insert honours the index, and clamps one past the end', () => {
    const tree = DocumentTree.fromDocument(simple);
    tree.update((w) => {
      w.insert(ROOT_KEY, { type: 'paragraph', content: [{ type: 'text', text: 'first' }] }, 0);
      w.insert(ROOT_KEY, { type: 'paragraph', content: [{ type: 'text', text: 'last' }] }, 99);
      w.insert(
        ROOT_KEY,
        { type: 'paragraph', content: [{ type: 'text', text: 'also first' }] },
        -5,
      );
    });
    const texts = tree.toDocument().content.map((block) => {
      const content = (block as { content?: { text?: string }[] }).content ?? [];
      return content[0]?.text;
    });
    expect(texts).toEqual(['also first', 'first', 'hello', 'last']);
  });

  it('insert into an unknown parent throws rather than losing the node', () => {
    const tree = DocumentTree.fromDocument(simple);
    expect(() =>
      tree.update((w) => void w.insert('nope', { type: 'paragraph', content: [] })),
    ).toThrow(/no such parent/);
  });

  it('remove takes the whole subtree', () => {
    const tree = DocumentTree.fromDocument(nested);
    const list = tree.children(ROOT_KEY)[1]!;
    const before = tree.size;
    const change = tree.update((w) => {
      w.remove(list);
    });
    // the list, two items, three inline nodes under them
    expect(change.removed.size).toBe(before - tree.size);
    expect(tree.toDocument().content.map((block) => block.type)).toEqual(['paragraph', 'table']);
  });

  it('remove of an unknown key is a no-op, not a throw', () => {
    const tree = DocumentTree.fromDocument(simple);
    const change = tree.update((w) => {
      w.remove('nope');
    });
    expect(isEmptyChange(change)).toBe(true);
  });

  it('the root cannot be removed', () => {
    const tree = DocumentTree.fromDocument(simple);
    expect(() =>
      tree.update((w) => {
        w.remove(ROOT_KEY);
      }),
    ).toThrow(/root/);
  });

  it('move keeps the key and the subtree', () => {
    const tree = DocumentTree.fromDocument(nested);
    const [paragraph, list] = tree.children(ROOT_KEY);
    const item = tree.children(list!)[0]!;
    tree.update((w) => {
      w.move(paragraph!, item, 0);
    });
    expect(tree.parent(paragraph!)).toBe(item);
    expect(tree.children(ROOT_KEY)).not.toContain(paragraph);
    expect(tree.get(paragraph!)).toBeDefined();
  });

  it('a node cannot be moved inside itself', () => {
    const tree = DocumentTree.fromDocument(nested);
    const list = tree.children(ROOT_KEY)[1]!;
    const item = tree.children(list)[0]!;
    expect(() =>
      tree.update((w) => {
        w.move(list, item);
      }),
    ).toThrow(/inside itself/);
    expect(() =>
      tree.update((w) => {
        w.move(list, list);
      }),
    ).toThrow(/inside itself/);
  });

  it('a node added and removed in one update is reported as neither', () => {
    const tree = DocumentTree.fromDocument(simple);
    const change = tree.update((w) => {
      const key = w.insert(ROOT_KEY, { type: 'paragraph', content: [] });
      w.remove(key);
    });
    expect(change.added.size).toBe(0);
    expect(change.removed.size).toBe(0);
  });

  it('an added node is not also reported as updated', () => {
    const tree = DocumentTree.fromDocument(simple);
    const change = tree.update((w) => {
      const key = w.insert(ROOT_KEY, { type: 'paragraph', content: [] });
      w.setValue(key, { type: 'paragraph', align: 'center', content: [] });
    });
    expect(change.updated.size).toBe(0);
    expect(change.added.size).toBe(1);
  });

  it('a removed node is not also reported as updated', () => {
    const tree = DocumentTree.fromDocument(simple);
    const paragraph = tree.children(ROOT_KEY)[0]!;
    const change = tree.update((w) => {
      w.setValue(paragraph, { type: 'paragraph', align: 'right', content: [] });
      w.remove(paragraph);
    });
    expect(change.updated.has(paragraph)).toBe(false);
    expect(change.removed.has(paragraph)).toBe(true);
  });

  it('nested updates commit once', () => {
    const tree = DocumentTree.fromDocument(simple);
    const before = tree.version;
    const change = tree.update((outer) => {
      outer.insert(ROOT_KEY, { type: 'paragraph', content: [] });
      tree.update((inner) => {
        inner.insert(ROOT_KEY, { type: 'paragraph', content: [] });
      });
    });
    expect(tree.version).toBe(before + 1);
    expect(change.added.size).toBe(2);
    expect(tree.toDocument().content).toHaveLength(3);
  });

  it('an update that changes nothing does not bump the version', () => {
    const tree = DocumentTree.fromDocument(simple);
    const before = tree.version;
    const change = tree.update(() => {
      // nothing
    });
    expect(isEmptyChange(change)).toBe(true);
    expect(tree.version).toBe(before);
  });

  it('the version advances once per committed update', () => {
    const tree = DocumentTree.fromDocument(simple);
    const start = tree.version;
    tree.update((w) => void w.insert(ROOT_KEY, { type: 'paragraph', content: [] }));
    tree.update((w) => void w.insert(ROOT_KEY, { type: 'paragraph', content: [] }));
    expect(tree.version).toBe(start + 2);
  });

  it('survives a throwing update without staying locked', () => {
    const tree = DocumentTree.fromDocument(simple);
    expect(() =>
      tree.update(() => {
        throw new Error('boom');
      }),
    ).toThrow('boom');
    // The next update still works, which it would not if the in-update flag had stuck.
    const change = tree.update((w) => void w.insert(ROOT_KEY, { type: 'paragraph', content: [] }));
    expect(change.added.size).toBe(1);
  });

  it('a stored node is a copy, so mutating the input cannot reach into the tree', () => {
    const doc: EditorDocument = {
      type: 'doc',
      version: 1,
      content: [{ type: 'paragraph', align: 'left', content: [] }],
    };
    const tree = DocumentTree.fromDocument(doc);
    doc.content[0] = { type: 'paragraph', align: 'right', content: [] };
    expect((tree.toDocument().content[0] as { align?: string }).align).toBe('left');
  });
});
