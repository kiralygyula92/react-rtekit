import { useCallback, useState } from 'react';

/**
 * The recently used colours, remembered across sessions (05 §2).
 *
 * Shared by `<RichTextEditor>` and `<Rte.Root>` so the two entry points cannot end up
 * with different storage keys or different eviction rules. Every access is guarded:
 * in a private window, with site data blocked, or during SSR, the list is simply
 * empty for that session rather than an exception on mount.
 *
 * @module
 */

/** What {@link useRecentColors} returns. */
export interface RecentColors {
  /** The remembered colours, most recent first. */
  recent: string[];
  /** Records a colour, moving it to the front if it was already there. */
  remember: (color: string) => void;
}

/** Reads the list a previous session stored. */
function read(storageKey: string): string[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((entry): entry is string => typeof entry === 'string')
      : [];
  } catch {
    // Private mode or blocked storage: recents are a convenience, not state we keep.
    return [];
  }
}

/** The recent-colour list and the function that adds to it. */
export function useRecentColors(storageKey: string, limit: number): RecentColors {
  const [recent, setRecent] = useState<string[]>(() =>
    // Lazily, and never on a server: `storageKey` is a configuration constant, so
    // there is nothing to re-read afterwards.
    typeof window === 'undefined' ? [] : read(storageKey),
  );

  const remember = useCallback(
    (color: string) => {
      setRecent((previous) => {
        const next = [color, ...previous.filter((entry) => entry !== color)].slice(0, limit);
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          /* private mode: the list still works for this session */
        }
        return next;
      });
    },
    [limit, storageKey],
  );

  return { recent, remember };
}
