import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { KIND_LABEL, loadSearchIndex, search, type SearchEntry } from '../lib/search';

/**
 * The Ctrl+K palette (08 §1).
 *
 * Built as a combobox rather than a list of links: the input keeps focus while the
 * arrows move a virtual highlight, which is the one pattern screen readers announce
 * correctly, and it means Enter always does what the highlighted row says.
 */

/** Whether a keyboard event is the palette's own shortcut. */
function isOpenShortcut(event: KeyboardEvent): boolean {
  return (event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 'k';
}

/** Whether the event came from somewhere that is already taking text. */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT'
  );
}

export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [entries, setEntries] = useState<SearchEntry[] | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const navigate = useNavigate();
  const listId = useId();

  const results = useMemo(() => (entries ? search(entries, query) : []), [entries, query]);

  // A new query means a new first result, so the highlight goes back to the top.
  // Adjusting state during render rather than in an effect avoids a frame where the
  // highlight points at a row from the previous query.
  const [lastQuery, setLastQuery] = useState(query);
  if (lastQuery !== query) {
    setLastQuery(query);
    setActive(0);
  }

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setActive(0);
    // Focus goes back where it came from, so a keyboard user is not dropped at the
    // top of the document.
    openerRef.current?.focus();
  }, []);

  const go = useCallback(
    (entry: SearchEntry) => {
      close();
      void navigate(entry.to);
    },
    [close, navigate],
  );

  // The shortcut is global: it has to work from anywhere on the page except a field
  // that is already taking text, where Ctrl+K may mean something to the browser.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!isOpenShortcut(event)) return;
      if (!open && isTypingTarget(event.target)) return;
      event.preventDefault();
      if (open) {
        close();
      } else {
        openerRef.current = document.activeElement as HTMLElement | null;
        setOpen(true);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [close, open]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    // The index pulls in the guides, the examples and the API data, so it is fetched
    // when the palette first opens rather than on every page load (08 §8).
    let cancelled = false;
    void loadSearchIndex().then((loaded) => {
      if (!cancelled) setEntries(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  // Keep the highlighted row in view when the arrows walk past the visible window.
  useEffect(() => {
    if (!open) return;
    const row = listRef.current?.children[active];
    if (row instanceof HTMLElement) row.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (results.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((index) => (index + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((index) => (index - 1 + results.length) % results.length);
    } else if (event.key === 'Home') {
      event.preventDefault();
      setActive(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setActive(results.length - 1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const entry = results[active];
      if (entry) go(entry);
    }
  }

  return (
    <>
      <button
        type="button"
        className="site-search-trigger"
        onClick={(event) => {
          openerRef.current = event.currentTarget;
          setOpen(true);
        }}
      >
        <span aria-hidden="true">⌕</span>
        Search
        <kbd className="site-search-trigger__key">Ctrl K</kbd>
      </button>

      {open ? (
        <div
          className="search-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <div className="search-dialog" role="dialog" aria-modal="true" aria-label="Search">
            <input
              ref={inputRef}
              className="search-dialog__input"
              type="text"
              role="combobox"
              aria-expanded
              aria-controls={listId}
              aria-activedescendant={results[active] ? `${listId}-${active}` : undefined}
              aria-autocomplete="list"
              aria-label="Search the documentation"
              placeholder="Search guides, API and examples"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
              }}
              onKeyDown={onInputKeyDown}
            />

            <ul ref={listRef} id={listId} className="search-dialog__results" role="listbox">
              {results.map((entry, index) => (
                <li
                  key={entry.id}
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={index === active}
                  className="search-result"
                  data-active={index === active}
                  onMouseMove={() => {
                    setActive(index);
                  }}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    go(entry);
                  }}
                >
                  <span className="search-result__kind">{KIND_LABEL[entry.kind]}</span>
                  <span className="search-result__title">{entry.title}</span>
                  <span className="search-result__context">{entry.context}</span>
                </li>
              ))}
            </ul>

            <p className="search-dialog__status" role="status">
              {query.trim() === ''
                ? 'Type to search the guides, the API reference and the examples.'
                : entries === null
                  ? 'Loading the index…'
                  : results.length === 0
                    ? `Nothing matches “${query}”.`
                    : `${results.length} result${results.length === 1 ? '' : 's'}.`}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
