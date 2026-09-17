/**
 * Id generation.
 *
 * Every DOM id the library writes is namespaced by an instance id, so putting three
 * editors on one page cannot produce a duplicate (fixes R4). Nothing here touches
 * `window`, so it is safe at module scope during SSR (02 §8).
 */

let counter = 0;

/**
 * Returns a process-unique id with the given prefix, e.g. `rte-3`.
 *
 * Deliberately not random: a stable, monotonic id keeps server and client markup
 * identical for the first render, and React's `useId` supplies the uniqueness that
 * actually matters across concurrent trees.
 */
export function createId(prefix = 'rte'): string {
  counter += 1;
  return `${prefix}-${counter.toString(36)}`;
}

/** Resets the counter. Test-only; keeps id assertions readable. @internal */
export function resetIdCounter(): void {
  counter = 0;
}

/**
 * Builds a DOM id scoped to one editor instance.
 *
 * @example
 * ```ts
 * scopedId('rte-4', 'content'); // 'rte-4-content'
 * ```
 */
export function scopedId(instanceId: string, part: string): string {
  return `${instanceId}-${part}`;
}
