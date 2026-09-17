import { describe, expect, it } from 'vitest';
import type { EditorDocument } from '../../types/document.js';
import { History } from './history.js';

const doc = (text: string): EditorDocument => ({
  type: 'doc',
  version: 1,
  content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
});

/** A clock the test drives, so coalescing is tested rather than raced against. */
function clock(start = 1000) {
  let at = start;
  return {
    now: () => at,
    advance(by: number) {
      at += by;
    },
  };
}

describe('History', () => {
  it('starts empty', () => {
    const history = new History();
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(false);
    expect(history.current).toBeNull();
    expect(history.undo()).toBeNull();
    expect(history.redo()).toBeNull();
  });

  it('a single push is a baseline, not something to undo', () => {
    const history = new History();
    history.push(doc('loaded'), null);
    expect(history.canUndo()).toBe(false);
    expect(history.current?.document).toEqual(doc('loaded'));
  });

  it('undoes and redoes', () => {
    const history = new History();
    history.push(doc('one'), null, 'api');
    history.push(doc('two'), null, 'format');
    expect(history.canUndo()).toBe(true);
    expect(history.undo()?.document).toEqual(doc('one'));
    expect(history.canRedo()).toBe(true);
    expect(history.redo()?.document).toEqual(doc('two'));
    expect(history.canRedo()).toBe(false);
  });

  it('coalesces typing inside the window', () => {
    const time = clock();
    const history = new History({ groupMs: 300, now: time.now });
    history.push(doc(''), null, 'api');
    history.push(doc('a'), null, 'typing');
    time.advance(50);
    history.push(doc('ab'), null, 'typing');
    time.advance(50);
    history.push(doc('abc'), null, 'typing');

    expect(history.size).toBe(2);
    expect(history.undo()?.document).toEqual(doc(''));
  });

  it('starts a new entry once the window has passed', () => {
    const time = clock();
    const history = new History({ groupMs: 300, now: time.now });
    history.push(doc(''), null, 'api');
    history.push(doc('a'), null, 'typing');
    time.advance(400);
    history.push(doc('ab'), null, 'typing');
    expect(history.size).toBe(3);
  });

  it('measures the window from where the run started, not from the last keystroke', () => {
    // Otherwise a fast typist produces one undo entry for a whole paragraph.
    const time = clock();
    const history = new History({ groupMs: 300, now: time.now });
    history.push(doc(''), null, 'api');
    history.push(doc('a'), null, 'typing');
    for (let step = 0; step < 5; step += 1) {
      time.advance(100);
      history.push(doc('a'.repeat(step + 2)), null, 'typing');
    }
    expect(history.size).toBeGreaterThan(2);
  });

  it('does not coalesce across different causes', () => {
    const time = clock();
    const history = new History({ groupMs: 300, now: time.now });
    history.push(doc(''), null, 'api');
    history.push(doc('a'), null, 'typing');
    history.push(doc('a'), null, 'format');
    history.push(doc('ab'), null, 'typing');
    expect(history.size).toBe(4);
  });

  it('never coalesces a format change, however fast', () => {
    const time = clock();
    const history = new History({ groupMs: 10_000, now: time.now });
    history.push(doc('x'), null, 'api');
    history.push(doc('x'), null, 'format');
    history.push(doc('x'), null, 'format');
    expect(history.size).toBe(3);
  });

  it('editing after an undo discards the redo branch', () => {
    const history = new History();
    history.push(doc('one'), null, 'api');
    history.push(doc('two'), null, 'format');
    history.push(doc('three'), null, 'format');
    history.undo();
    history.push(doc('other'), null, 'format');
    expect(history.canRedo()).toBe(false);
    expect(history.current?.document).toEqual(doc('other'));
    // Back to where the user was when they made the edit, which is 'two' — not 'one'.
    expect(history.undo()?.document).toEqual(doc('two'));
    expect(history.undo()?.document).toEqual(doc('one'));
  });

  it('drops the oldest entry past the limit', () => {
    const history = new History({ limit: 3 });
    for (const text of ['a', 'b', 'c', 'd', 'e']) history.push(doc(text), null, 'format');
    expect(history.size).toBe(3);
    history.undo();
    history.undo();
    expect(history.canUndo()).toBe(false);
    expect(history.current?.document).toEqual(doc('c'));
  });

  it('a limit below one is still one', () => {
    const history = new History({ limit: 0 });
    history.push(doc('a'), null, 'format');
    history.push(doc('b'), null, 'format');
    expect(history.size).toBe(1);
  });

  it('reset makes the current state the only one', () => {
    const history = new History();
    history.push(doc('one'), null, 'api');
    history.push(doc('two'), null, 'format');
    history.reset();
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(false);
    expect(history.current?.document).toEqual(doc('two'));
  });

  it('reset can install a different baseline', () => {
    const history = new History();
    history.push(doc('one'), null, 'api');
    history.reset(doc('loaded'));
    expect(history.current?.document).toEqual(doc('loaded'));
    expect(history.canUndo()).toBe(false);
  });

  it('carries the selection with each entry', () => {
    const history = new History();
    const selection = {
      anchor: { path: [0, 0], offset: 1 },
      focus: { path: [0, 0], offset: 2 },
      isCollapsed: false,
      isBackward: false,
    };
    history.push(doc('one'), null, 'api');
    history.push(doc('two'), selection, 'format');
    history.undo();
    expect(history.redo()?.selection).toEqual(selection);
  });
});
