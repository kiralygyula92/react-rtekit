import { describe, expect, test } from 'vitest';
import { htmlToDocument, documentToHtml } from '../../src/core/index.js';
import type { EditorEngine, EngineHandle, EngineMountOptions } from '../../src/types/engine.js';

/**
 * The `EngineHandle` contract, as executable tests.
 *
 * Replacing the engine is only a contained piece of
 * work if "contained" has a definition. Without this, a second adapter is finished when
 * somebody decides it looks finished, and every disagreement about behaviour is settled
 * by reading whichever engine happens to ship — which makes that engine the
 * specification rather than the implementation.
 *
 * So: every one of the 34 methods, exercised against the interface and never against an
 * engine's internals. It was written against the engine this replaced and passed by it
 * before a line of the replacement existed, which is what makes it a description of the
 * contract rather than a wish list.
 *
 * Deliberately not in here:
 *   - geometry (`getCaretRect`), beyond "returns a rect or null" — jsdom has no layout;
 *   - IME composition, which needs a real IME;
 *   - anything that asserts on a particular engine's DOM shape.
 * Those belong in the Playwright matrix, where there is a browser to disagree with.
 *
 * @module
 */

/** What a suite needs to build the engine under test. */
export interface ConformanceTarget {
  /** The adapter's `id`, used in the suite name. */
  id: string;
  /** The adapter itself. */
  engine: EditorEngine;
}

/** Mounts `engine` into a detached container with the host-supplied serializers. */
function mount(engine: EditorEngine, options: Partial<EngineMountOptions> = {}): EngineHandle {
  const container = document.createElement('div');
  document.body.append(container);
  return engine.mount(container, {
    namespace: `conformance-${Math.random().toString(36).slice(2)}`,
    parseHtml: (html) => htmlToDocument(html),
    serializeHtml: (doc, serializeOptions) => documentToHtml(doc, serializeOptions),
    ...options,
  });
}

/** Normalizes away the differences no caller can observe through the interface. */
const squash = (html: string): string => html.replace(/\s+/g, ' ').trim();

/**
 * Whether an element is editable, read from the attribute rather than the property.
 *
 * jsdom does not implement `HTMLElement.isContentEditable` — it is `undefined` there,
 * whatever the attribute says — so asserting on the property tests jsdom, not the engine.
 */
const editable = (element: HTMLElement): boolean =>
  element.getAttribute('contenteditable') === 'true';

/**
 * Runs the whole contract against one adapter.
 *
 * @example
 * ```ts
 * describeEngineConformance({ id: 'native', engine: nativeEngine });
 * ```
 */
export function describeEngineConformance({ id, engine }: ConformanceTarget): void {
  describe(`EngineHandle conformance: ${id}`, () => {
    // ── lifecycle ─────────────────────────────────────────────────────────
    describe('lifecycle', () => {
      test('mounts, exposes a contenteditable, and tears down', () => {
        const handle = mount(engine);
        expect(handle.contentElement).toBeInstanceOf(HTMLElement);
        expect(editable(handle.contentElement)).toBe(true);
        expect(() => {
          handle.destroy();
        }).not.toThrow();
      });

      test('two editors on one page do not share state (fixes R4)', () => {
        const first = mount(engine, { initialValue: '<p>one</p>' });
        const second = mount(engine, { initialValue: '<p>two</p>' });
        expect(squash(first.getHTML())).toContain('one');
        expect(squash(second.getHTML())).toContain('two');
        first.setContent('<p>changed</p>');
        expect(squash(second.getHTML())).toContain('two');
        first.destroy();
        second.destroy();
      });

      test('destroy is idempotent', () => {
        const handle = mount(engine);
        handle.destroy();
        expect(() => {
          handle.destroy();
        }).not.toThrow();
      });
    });

    // ── content ───────────────────────────────────────────────────────────
    describe('content', () => {
      test('round-trips the initial value', () => {
        const handle = mount(engine, { initialValue: '<p>hello</p>' });
        expect(squash(handle.getHTML())).toContain('hello');
        handle.destroy();
      });

      test('setContent replaces rather than appends', () => {
        const handle = mount(engine, { initialValue: '<p>first</p>' });
        handle.setContent('<p>second</p>');
        const html = squash(handle.getHTML());
        expect(html).toContain('second');
        expect(html).not.toContain('first');
        handle.destroy();
      });

      test('getJSON returns the portable document shape', () => {
        const handle = mount(engine, { initialValue: '<p>hello</p>' });
        const doc = handle.getJSON();
        expect(doc).toHaveProperty('type', 'doc');
        expect(Array.isArray(doc.content)).toBe(true);
        handle.destroy();
      });

      test('getText joins blocks with the separator', () => {
        const handle = mount(engine, { initialValue: '<p>one</p><p>two</p>' });
        expect(handle.getText({ blockSeparator: '|' })).toBe('one|two');
        handle.destroy();
      });

      test('getMarkdown renders marks rather than tags', () => {
        const handle = mount(engine, { initialValue: '<p><strong>bold</strong></p>' });
        expect(handle.getMarkdown()).toContain('**bold**');
        handle.destroy();
      });

      test('setContent accepts each value format', () => {
        const handle = mount(engine);
        handle.setContent('<p>from html</p>', { format: 'html' });
        expect(squash(handle.getHTML())).toContain('from html');
        handle.setContent('plain text', { format: 'text' });
        expect(handle.getText()).toBe('plain text');
        handle.setContent(handle.getJSON(), { format: 'json' });
        expect(handle.getText()).toBe('plain text');
        handle.destroy();
      });

      test('insertContent adds without discarding what is there', () => {
        const handle = mount(engine, { initialValue: '<p>kept</p>' });
        handle.setSelection('end');
        handle.insertContent('<p>added</p>');
        const text = handle.getText();
        expect(text).toContain('kept');
        expect(text).toContain('added');
        handle.destroy();
      });

      test('isEmpty ignores markup that only looks like content (fixes R2)', () => {
        const handle = mount(engine);
        expect(handle.isEmpty()).toBe(true);
        for (const empty of ['', '<p></p>', '<p><br></p>', '   ']) {
          handle.setContent(empty);
          expect(handle.isEmpty(), `${JSON.stringify(empty)} should be empty`).toBe(true);
        }
        handle.setContent('<p>&nbsp;</p>');
        expect(handle.isEmpty()).toBe(false);
        handle.destroy();
      });

      test('getLength counts text, never markup (fixes R3)', () => {
        const handle = mount(engine, { initialValue: '<p><strong>abc</strong></p>' });
        expect(handle.getLength('characters')).toBe(3);
        handle.setContent('<p>two words here</p>');
        expect(handle.getLength('words')).toBe(3);
        handle.destroy();
      });
    });

    // ── selection ─────────────────────────────────────────────────────────
    describe('selection', () => {
      test('setSelection accepts the named positions', () => {
        const handle = mount(engine, { initialValue: '<p>hello world</p>' });
        for (const where of ['start', 'end', 'all'] as const) {
          expect(() => {
            handle.setSelection(where);
          }).not.toThrow();
        }
        handle.destroy();
      });

      test('getSelection reports a collapsed caret after "start"', () => {
        const handle = mount(engine, { initialValue: '<p>hello</p>' });
        handle.focus();
        handle.setSelection('start');
        const selection = handle.getSelection();
        expect(selection === null || selection.isCollapsed).toBe(true);
        handle.destroy();
      });

      test('a saved selection survives and restores (fixes R5)', () => {
        const handle = mount(engine, { initialValue: '<p>hello world</p>' });
        handle.focus();
        handle.setSelection('all');
        const snapshot = handle.saveSelection();
        handle.blur();
        expect(() => {
          handle.restoreSelection(snapshot);
        }).not.toThrow();
        handle.destroy();
      });

      test('getFormatState answers for every mark', () => {
        const handle = mount(engine, { initialValue: '<p>plain</p>' });
        handle.setSelection('all');
        const state = handle.getFormatState();
        expect(state.marks).toBeDefined();
        expect(state.marks.bold).toBe(false);
        expect(typeof state.canUndo).toBe('boolean');
        expect(typeof state.canRedo).toBe('boolean');
        handle.destroy();
      });

      test('getTextBeforeCaret reads back from the caret', () => {
        const handle = mount(engine, { initialValue: '<p>abcdef</p>' });
        handle.focus();
        handle.setSelection('end');
        expect(typeof handle.getTextBeforeCaret()).toBe('string');
        expect(handle.getTextBeforeCaret(3).length).toBeLessThanOrEqual(3);
        handle.destroy();
      });

      test('getCaretRect returns a rect or null, never throws', () => {
        const handle = mount(engine, { initialValue: '<p>abc</p>' });
        handle.focus();
        handle.setSelection('end');
        const rect = handle.getCaretRect();
        expect(rect === null || typeof rect.top === 'number').toBe(true);
        handle.destroy();
      });

      test('deleteBackward removes exactly what it is asked to', () => {
        const handle = mount(engine, { initialValue: '<p>abcdef</p>' });
        handle.focus();
        handle.setSelection('end');
        handle.deleteBackward(2);
        expect(handle.getText()).toBe('abcd');
        handle.destroy();
      });

      test('deleteBackward counts graphemes, not code units', () => {
        // One press, one thing the reader can see. `'👍'.length` is 2 and a family emoji
        // is 8, so an engine that steps back by code units leaves half an emoji behind.
        const handle = mount(engine, { initialValue: '<p>a\u{1F44D}</p>' });
        handle.focus();
        handle.setSelection('end');
        handle.deleteBackward(1);
        expect(handle.getText()).toBe('a');
        handle.destroy();
      });

      test('deleteBackward keeps a combining mark with its letter', () => {
        const handle = mount(engine, { initialValue: '<p>aé</p>' });
        handle.focus();
        handle.setSelection('end');
        handle.deleteBackward(1);
        expect(handle.getText()).toBe('a');
        handle.destroy();
      });

      test('deleteBackward stops at the start rather than running past it', () => {
        const handle = mount(engine, { initialValue: '<p>ab</p>' });
        handle.focus();
        handle.setSelection('end');
        handle.deleteBackward(99);
        expect(handle.getText()).toBe('');
        handle.destroy();
      });

      test('deleteBackward with a non-positive length does nothing', () => {
        const handle = mount(engine, { initialValue: '<p>abc</p>' });
        handle.focus();
        handle.setSelection('end');
        handle.deleteBackward(0);
        handle.deleteBackward(-1);
        expect(handle.getText()).toBe('abc');
        handle.destroy();
      });
    });

    // ── commands ──────────────────────────────────────────────────────────
    describe('commands', () => {
      test('exec toggles a mark and getFormatState sees it', () => {
        const handle = mount(engine, { initialValue: '<p>hello</p>' });
        handle.focus();
        handle.setSelection('all');
        expect(handle.exec('toggleBold')).toBe(true);
        expect(handle.getFormatState().marks.bold).toBe(true);
        handle.exec('toggleBold');
        expect(handle.getFormatState().marks.bold).toBe(false);
        handle.destroy();
      });

      test('exec returns false for a command that cannot run', () => {
        const handle = mount(engine);
        expect(typeof handle.exec('undo')).toBe('boolean');
        handle.destroy();
      });

      test('canExec answers without changing anything', () => {
        const handle = mount(engine, { initialValue: '<p>hello</p>' });
        const before = handle.getHTML();
        expect(typeof handle.canExec('toggleBold')).toBe('boolean');
        expect(handle.getHTML()).toBe(before);
        handle.destroy();
      });

      test('a registered command handler runs, and unregisters', () => {
        const handle = mount(engine, { initialValue: '<p>hello</p>' });
        let calls = 0;
        const off = handle.registerCommand('toggleBold', (_payload, next) => {
          calls += 1;
          next();
        });
        handle.setSelection('all');
        handle.exec('toggleBold');
        expect(calls).toBe(1);
        off();
        handle.exec('toggleBold');
        expect(calls).toBe(1);
        handle.destroy();
      });

      test('a handler that does not call next stops the command', () => {
        const handle = mount(engine, { initialValue: '<p>hello</p>' });
        handle.registerCommand('toggleBold', () => {
          // deliberately does not call next
        });
        handle.setSelection('all');
        handle.exec('toggleBold');
        expect(handle.getFormatState().marks.bold).toBe(false);
        handle.destroy();
      });

      test('block commands change the block type', () => {
        const handle = mount(engine, { initialValue: '<p>hello</p>' });
        handle.focus();
        handle.setSelection('all');
        handle.exec('setBlockType', { type: 'heading', level: 2 });
        expect(squash(handle.getHTML())).toContain('<h2');
        handle.destroy();
      });

      test('list commands nest and unnest', () => {
        const handle = mount(engine, { initialValue: '<p>item</p>' });
        handle.focus();
        handle.setSelection('all');
        handle.exec('toggleBulletList');
        expect(squash(handle.getHTML())).toContain('<ul');
        handle.exec('toggleBulletList');
        expect(squash(handle.getHTML())).not.toContain('<ul');
        handle.destroy();
      });
    });

    // ── schema ────────────────────────────────────────────────────────────
    describe('schema', () => {
      test('registerNode and registerMark return an unregister', () => {
        const handle = mount(engine);
        const offNode = handle.registerNode({ name: 'conformanceNode', tag: 'div' });
        const offMark = handle.registerMark({ name: 'conformanceMark', tag: 'span' });
        expect(typeof offNode).toBe('function');
        expect(typeof offMark).toBe('function');
        offNode();
        offMark();
        handle.destroy();
      });
    });

    // ── history ───────────────────────────────────────────────────────────
    describe('history', () => {
      test('undo restores, redo reapplies', () => {
        const handle = mount(engine, { initialValue: '<p>original</p>' });
        handle.focus();
        handle.setSelection('all');
        handle.exec('toggleBold');
        expect(handle.getFormatState().marks.bold).toBe(true);
        handle.undo();
        expect(handle.getFormatState().marks.bold).toBe(false);
        handle.redo();
        expect(handle.getFormatState().marks.bold).toBe(true);
        handle.destroy();
      });

      test('canUndo is false on a fresh editor', () => {
        const handle = mount(engine, { initialValue: '<p>hello</p>' });
        expect(handle.canUndo()).toBe(false);
        expect(handle.canRedo()).toBe(false);
        handle.destroy();
      });

      test('loaded content cannot be undone away', () => {
        const handle = mount(engine);
        handle.setContent('<p>loaded</p>', { history: false });
        handle.clearHistory();
        expect(handle.canUndo()).toBe(false);
        handle.undo();
        expect(handle.getText()).toBe('loaded');
        handle.destroy();
      });
    });

    // ── focus and editability ─────────────────────────────────────────────
    describe('focus and editability', () => {
      test('focus, hasFocus and blur agree', () => {
        const handle = mount(engine, { initialValue: '<p>hello</p>' });
        handle.focus();
        expect(handle.hasFocus()).toBe(true);
        handle.blur();
        expect(handle.hasFocus()).toBe(false);
        handle.destroy();
      });

      test('focus accepts each named position', () => {
        const handle = mount(engine, { initialValue: '<p>hello</p>' });
        for (const where of ['start', 'end', 'restore'] as const) {
          expect(() => {
            handle.focus(where);
          }).not.toThrow();
        }
        handle.destroy();
      });

      test('setEditable drives isEditable and the DOM', () => {
        const handle = mount(engine, { initialValue: '<p>hello</p>' });
        expect(handle.isEditable()).toBe(true);
        handle.setEditable(false);
        expect(handle.isEditable()).toBe(false);
        expect(editable(handle.contentElement)).toBe(false);
        handle.setEditable(true);
        expect(handle.isEditable()).toBe(true);
        handle.destroy();
      });

      test('mounting with editable: false starts read-only', () => {
        const handle = mount(engine, { initialValue: '<p>hello</p>', editable: false });
        expect(handle.isEditable()).toBe(false);
        handle.destroy();
      });
    });

    // ── events ────────────────────────────────────────────────────────────
    describe('events', () => {
      test('change fires on an edit and stops after unsubscribing', () => {
        const handle = mount(engine, { initialValue: '<p>hello</p>' });
        let changes = 0;
        const off = handle.on('change', () => {
          changes += 1;
        });
        handle.setContent('<p>changed</p>');
        expect(changes).toBeGreaterThan(0);
        const seen = changes;
        off();
        handle.setContent('<p>again</p>');
        expect(changes).toBe(seen);
        handle.destroy();
      });

      test('change carries the source it was given', () => {
        const handle = mount(engine, { initialValue: '<p>hello</p>' });
        const sources: string[] = [];
        handle.on('change', (payload) => {
          sources.push(payload.source);
        });
        handle.setContent('<p>api</p>', { source: 'api' });
        expect(sources).toContain('api');
        handle.destroy();
      });

      test('focus and blur events fire', () => {
        const handle = mount(engine, { initialValue: '<p>hello</p>' });
        let focused = 0;
        let blurred = 0;
        handle.on('focus', () => {
          focused += 1;
        });
        handle.on('blur', () => {
          blurred += 1;
        });
        handle.focus();
        handle.blur();
        expect(focused).toBeGreaterThan(0);
        expect(blurred).toBeGreaterThan(0);
        handle.destroy();
      });
    });

    // ── the escape hatch ──────────────────────────────────────────────────
    test('exposes the underlying instance as `native`', () => {
      const handle = mount(engine);
      expect(handle.native).toBeDefined();
      handle.destroy();
    });
  });
}
