import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FindOptions } from '../../types/editor.js';
import type { FindReplacePanelSlotProps } from '../../types/slots.js';
import { buildFindPattern, replaceMatches } from '../../core/find.js';
import { useEditorContext, useLocalization, useRteSlots } from '../context.js';
import { useEditorState } from '../hooks.js';
import { resolveMessage } from '../localization.js';
import { Button, Checkbox, TextInput } from '../ui/primitives.js';

/**
 * Find and replace (05 §16).
 *
 * Matches are highlighted with an overlay rather than by marking up the document:
 * a search must not change what the author would save, and it must not push an entry
 * onto the undo stack. The overlay is positioned from DOM ranges, so it follows
 * wrapping, scrolling and formatting for free.
 *
 * @module
 */

/** One highlighted match, in viewport coordinates relative to the content box. */
interface HighlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
  current: boolean;
}

/** Every text node inside an element, in document order. */
function textNodesOf(root: HTMLElement): Text[] {
  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
    nodes.push(node as Text);
  }
  return nodes;
}

/**
 * Builds a DOM range for a match expressed in whole-content text offsets.
 *
 * Returns `null` when the offsets fall outside the content, which happens for a
 * moment after an edit and before the next search.
 */
function rangeForOffsets(root: HTMLElement, start: number, end: number): Range | null {
  const nodes = textNodesOf(root);
  const range = root.ownerDocument.createRange();
  let cursor = 0;
  let startSet = false;

  for (const node of nodes) {
    const length = node.data.length;
    if (!startSet && cursor + length > start) {
      range.setStart(node, start - cursor);
      startSet = true;
    }
    if (startSet && cursor + length >= end) {
      range.setEnd(node, end - cursor);
      return range;
    }
    cursor += length;
  }
  return null;
}

export function FindReplaceUi() {
  const editor = useEditorContext();
  const t = useLocalization();
  const { slots } = useRteSlots();
  const revision = useEditorState((snapshot) => snapshot.revision);
  const [open, setOpen] = useState(false);

  const [query, setQuery] = useState('');
  const [replacement, setReplacement] = useState('');
  const [options, setOptions] = useState<FindOptions>({});
  const [index, setIndex] = useState(0);
  const [rects, setRects] = useState<HighlightRect[]>([]);

  // `openFindReplace` is the single entry point, so the toolbar, `Mod+F` and consumer
  // code all reach the same panel.
  useEffect(
    () =>
      editor.registerCommand('openFindReplace', (_ctx, next) => {
        setOpen(true);
        next();
        return true;
      }),
    [editor],
  );

  /** Offsets of every match in the content element's text, in document order. */
  const matches = useMemo(() => {
    const content = editor.engine.contentElement;
    const pattern = buildFindPattern(query, options);
    // `revision` is read so the search re-runs when the content changes under it:
    // a highlight over text that has since been edited points at the wrong place.
    if (!open || !pattern || revision < 0) return [];

    const text = textNodesOf(content)
      .map((node) => node.data)
      .join('');
    const found: { start: number; end: number }[] = [];
    pattern.lastIndex = 0;
    for (let match = pattern.exec(text); match !== null; match = pattern.exec(text)) {
      if (match[0] === '') {
        pattern.lastIndex += 1;
        continue;
      }
      found.push({ start: match.index, end: match.index + match[0].length });
    }
    return found;
  }, [editor, open, options, query, revision]);

  const current = matches.length === 0 ? -1 : ((index % matches.length) + matches.length) % matches.length;

  // Position the overlay from the DOM, after the browser has laid the content out.
  // This is a measurement pass: it has to read layout and then store what it read,
  // which is the one case the rule below is otherwise right about.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open || matches.length === 0) {
      setRects([]);
      return;
    }
    const content = editor.engine.contentElement;
    const origin = content.getBoundingClientRect();
    const next: HighlightRect[] = [];

    matches.forEach((match, position) => {
      const range = rangeForOffsets(content, match.start, match.end);
      if (!range) return;
      for (const rect of range.getClientRects()) {
        next.push({
          top: rect.top - origin.top + content.scrollTop,
          left: rect.left - origin.left,
          width: rect.width,
          height: rect.height,
          current: position === current,
        });
      }
      if (position === current) {
        // Scrolling the current match into view is what makes the counter useful.
        const target = range.startContainer.parentElement;
        target?.scrollIntoView({ block: 'nearest', behavior: 'auto' });
      }
    });

    setRects(next);
  }, [current, editor, matches, open]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const close = useCallback(() => {
    setOpen(false);
    setRects([]);
    editor.focus('restore');
  }, [editor]);

  const replaceCurrent = useCallback(() => {
    const { document, replaced } = replaceMatches(
      editor.getJSON(),
      query,
      replacement,
      options,
      current,
    );
    if (replaced > 0) editor.setContent(document, { format: 'json' });
  }, [current, editor, options, query, replacement]);

  const replaceAll = useCallback(() => {
    const count = editor.replace(query, replacement, options);
    editor.announce(resolveMessage(t.announce.findResults, { count }));
  }, [editor, options, query, replacement, t.announce.findResults]);

  if (!open) return null;

  const Panel = slots.FindReplacePanel;
  return (
    <>
      <div className="rte-find-highlights" aria-hidden="true">
        {rects.map((rect, position) => (
          <span
            // Highlights are positional geometry; two identical rects are two rects.
            key={position}
            className="rte-find-highlight"
            data-current={rect.current}
            style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
          />
        ))}
      </div>

      <Panel
        query={query}
        replacement={replacement}
        matches={matches.length}
        index={current}
        matchCase={options.matchCase ?? false}
        wholeWord={options.wholeWord ?? false}
        regex={options.regex ?? false}
        onQueryChange={(next: string) => {
          setQuery(next);
          setIndex(0);
        }}
        onReplacementChange={setReplacement}
        onNext={() => {
          setIndex((value) => value + 1);
        }}
        onPrevious={() => {
          setIndex((value) => value - 1);
        }}
        onReplace={replaceCurrent}
        onReplaceAll={replaceAll}
        onToggle={(option) => {
          setOptions((value) => ({ ...value, [option]: !value[option] }));
          setIndex(0);
        }}
        onClose={close}
      />
    </>
  );
}

/** The default panel (05 §16). */
export function FindReplacePanel({
  query,
  replacement,
  matches,
  index,
  matchCase,
  wholeWord,
  regex,
  onQueryChange,
  onReplacementChange,
  onNext,
  onPrevious,
  onReplace,
  onReplaceAll,
  onToggle,
  onClose,
}: FindReplacePanelSlotProps) {
  const t = useLocalization();

  return (
    <div className="rte-find-panel" role="search" aria-label={resolveMessage(t.find.title)}>
      <div className="rte-find-panel__row">
        <TextInput
          label={resolveMessage(t.find.find)}
          value={query}
          onChange={onQueryChange}
          onKeyDown={(event) => {
            // Enter walks the matches and Escape closes, which is what every find
            // field in every application does.
            if (event.key === 'Enter') {
              event.preventDefault();
              if (event.shiftKey) onPrevious();
              else onNext();
            }
            if (event.key === 'Escape') {
              event.preventDefault();
              onClose();
            }
          }}
        />
        <span className="rte-find-panel__count" aria-live="polite">
          {matches === 0
            ? resolveMessage(t.find.noResults)
            : resolveMessage(t.find.results, { index: index + 1, total: matches })}
        </span>
        <Button onClick={onPrevious} disabled={matches === 0}>
          {resolveMessage(t.find.previous)}
        </Button>
        <Button onClick={onNext} disabled={matches === 0}>
          {resolveMessage(t.find.next)}
        </Button>
      </div>

      <div className="rte-find-panel__row">
        <TextInput
          label={resolveMessage(t.find.replace)}
          value={replacement}
          onChange={onReplacementChange}
        />
        <Button onClick={onReplace} disabled={matches === 0}>
          {resolveMessage(t.find.replace)}
        </Button>
        <Button onClick={onReplaceAll} disabled={matches === 0}>
          {resolveMessage(t.find.replaceAll)}
        </Button>
      </div>

      <div className="rte-find-panel__row">
        <Checkbox
          label={resolveMessage(t.find.matchCase)}
          checked={matchCase}
          onChange={() => {
            onToggle('matchCase');
          }}
        />
        <Checkbox
          label={resolveMessage(t.find.wholeWord)}
          checked={wholeWord}
          onChange={() => {
            onToggle('wholeWord');
          }}
        />
        <Checkbox
          label={resolveMessage(t.find.regex)}
          checked={regex}
          onChange={() => {
            onToggle('regex');
          }}
        />
        <Button onClick={onClose}>{resolveMessage(t.find.close)}</Button>
      </div>
    </div>
  );
}
