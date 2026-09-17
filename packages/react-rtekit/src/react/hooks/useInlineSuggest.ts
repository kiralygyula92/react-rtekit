import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useEditorContext } from '../context.js';

/**
 * The trigger-menu engine behind merge tags, mentions, emoji and the slash menu
 * (05 §10).
 *
 * All four are the same interaction: a trigger string typed at a word boundary opens
 * a list, further typing filters it, the arrow keys move, Enter or Tab inserts, and
 * Escape closes. Writing it once is what makes their keyboard model and their
 * accessibility identical rather than merely similar.
 *
 * @module
 */

/** One entry in a suggestion list. */
export interface SuggestItem {
  /** Stable identity; also what `onSelect` receives. */
  id: string;
  label: string;
  description?: string;
  /** Extra words the filter matches against. */
  keywords?: string[];
  group?: string;
}

/** Options for {@link useInlineSuggest}. */
export interface InlineSuggestOptions<Item extends SuggestItem = SuggestItem> {
  /** The string that opens the menu, e.g. `'@'` or `'{{'`. */
  trigger: string;
  /** Items to filter locally. Ignored when `search` is given. */
  items?: Item[];
  /** Asynchronous source, for mentions. Receives the query after the trigger. */
  search?: (query: string, signal: AbortSignal) => Promise<Item[]>;
  /** Runs when an item is chosen. The trigger and query are already removed. */
  onSelect: (item: Item) => void;
  /** Only open at the start of an otherwise empty block, as the slash menu does. */
  atBlockStart?: boolean;
  /** Give up on a query longer than this, so a stray `@` does not follow the author. */
  maxQueryLength?: number;
  /** @default true */
  enabled?: boolean;
}

/** What the menu needs in order to render. */
export interface InlineSuggestState<Item extends SuggestItem = SuggestItem> {
  open: boolean;
  items: Item[];
  activeIndex: number;
  /** The text typed after the trigger. */
  query: string;
  loading: boolean;
  /** Where to put the menu. */
  rect: DOMRect | null;
  /** Chooses the item at `index`, or the active one. */
  select: (index?: number) => void;
  close: () => void;
  /** Handles a key while the menu is open; returns true when it consumed the key. */
  onKeyDown: (event: KeyboardEvent) => boolean;
}

/**
 * A non-breaking space, by code point.
 *
 * Written this way rather than as a literal because a literal one is invisible in a
 * character class, and formatters normalize it into an ordinary space, which would
 * silently stop it matching.
 */
const NBSP = String.fromCharCode(160);

/** Characters that may not appear in a query, which is what ends the menu. */
const QUERY_BREAK = new RegExp(`[\\s${NBSP}]`);

/** Escapes a trigger for use in a regular expression. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Finds an open trigger in the text before the caret.
 *
 * Returns the query typed after it, or `null` when there is no open trigger. The
 * trigger has to start at a word boundary, so an e-mail address does not open the
 * mention menu halfway through.
 */
export function matchTrigger(
  textBeforeCaret: string,
  trigger: string,
  options: { atBlockStart?: boolean; maxQueryLength?: number } = {},
): { query: string; offset: number } | null {
  const pattern = new RegExp(`(^|[\\s\\u00A0(])(${escapeRegExp(trigger)})([^\\s\\u00A0]*)$`);
  const match = pattern.exec(textBeforeCaret);
  if (!match) return null;

  const query = match[3] ?? '';
  if (QUERY_BREAK.test(query)) return null;
  if (options.maxQueryLength !== undefined && query.length > options.maxQueryLength) return null;
  if (options.atBlockStart === true && match.index + (match[1]?.length ?? 0) !== 0) return null;

  return { query, offset: trigger.length + query.length };
}

/** Case-insensitive match against the label, the description and the keywords. */
function matches(item: SuggestItem, query: string): boolean {
  if (query === '') return true;
  const needle = query.toLowerCase();
  return (
    item.label.toLowerCase().includes(needle) ||
    item.id.toLowerCase().includes(needle) ||
    (item.description?.toLowerCase().includes(needle) ?? false) ||
    (item.keywords?.some((keyword) => keyword.toLowerCase().includes(needle)) ?? false)
  );
}

/**
 * Wires one trigger menu to the editor.
 *
 * @example
 * ```ts
 * const suggest = useInlineSuggest({
 *   trigger: '@',
 *   search: (query, signal) => findPeople(query, signal),
 *   onSelect: (item) => { editor.exec('insertMention', { id: item.id, label: item.label }); },
 * });
 * ```
 */
export function useInlineSuggest<Item extends SuggestItem = SuggestItem>(
  options: InlineSuggestOptions<Item>,
): InlineSuggestState<Item> {
  const editor = useEditorContext();
  const { trigger, items, search, onSelect, atBlockStart, maxQueryLength = 40, enabled = true } = options;

  const [query, setQuery] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [asyncItems, setAsyncItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  /** Length of trigger + query, so selecting can delete exactly what was typed. */
  const consumed = useRef(0);
  /** Set while an insertion is in flight, so the change it causes does not reopen. */
  const inserting = useRef(false);

  const close = useCallback(() => {
    setQuery(null);
    setActiveIndex(0);
    setAsyncItems([]);
    setLoading(false);
  }, []);

  // Re-evaluate on every content or selection change: those are exactly the moments
  // the text before the caret can have changed.
  useEffect(() => {
    if (!enabled) return;

    const check = (): void => {
      if (inserting.current) return;
      const before = editor.engine.getTextBeforeCaret();
      const match = matchTrigger(before, trigger, {
        ...(atBlockStart !== undefined ? { atBlockStart } : {}),
        maxQueryLength,
      });
      if (!match) {
        setQuery((current) => (current === null ? current : null));
        return;
      }
      consumed.current = match.offset;
      setQuery(match.query);
      setRect(editor.engine.getCaretRect());
    };

    const offChange = editor.on('change', check);
    const offSelection = editor.on('selectionChange', check);
    check();
    return () => {
      offChange();
      offSelection();
    };
  }, [atBlockStart, editor, enabled, maxQueryLength, trigger]);

  // Asynchronous sources run per query, and an in-flight request is abandoned as soon
  // as the author types again.
  useEffect(() => {
    if (!search || query === null) return;
    const controller = new AbortController();
    setLoading(true);
    search(query, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setAsyncItems(result);
        setActiveIndex(0);
      })
      .catch(() => {
        if (!controller.signal.aborted) setAsyncItems([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => {
      controller.abort();
    };
  }, [query, search]);

  const visible = useMemo(() => {
    if (query === null) return [];
    if (search) return asyncItems;
    return (items ?? []).filter((item) => matches(item, query));
  }, [asyncItems, items, query, search]);

  const select = useCallback(
    (index?: number) => {
      const item = visible[index ?? activeIndex];
      if (!item) return;
      inserting.current = true;
      try {
        // The trigger and the query go first, so the item lands where they were.
        editor.engine.deleteBackward(consumed.current);
        onSelect(item);
      } finally {
        inserting.current = false;
      }
      close();
    },
    [activeIndex, close, editor, onSelect, visible],
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent): boolean => {
      if (query === null) return false;
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setActiveIndex((current) => (visible.length === 0 ? 0 : (current + 1) % visible.length));
          return true;
        case 'ArrowUp':
          event.preventDefault();
          setActiveIndex((current) =>
            visible.length === 0 ? 0 : (current - 1 + visible.length) % visible.length,
          );
          return true;
        case 'Enter':
        case 'Tab':
          if (visible.length === 0) return false;
          event.preventDefault();
          select();
          return true;
        case 'Escape':
          event.preventDefault();
          close();
          return true;
        default:
          return false;
      }
    },
    [close, query, select, visible.length],
  );

  return {
    open: query !== null && (loading || visible.length > 0),
    items: visible,
    activeIndex,
    query: query ?? '',
    loading,
    rect,
    select,
    close,
    onKeyDown,
  };
}
