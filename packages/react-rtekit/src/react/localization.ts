import type { DeepPartial } from '../types/common.js';
import type { LocalizedString, RteLocalization } from '../types/localization.js';
import { en } from '../locales/en.js';

/**
 * Message resolution.
 *
 * A message is either a string with `{name}` placeholders or a function of its values,
 * which is how plural rules and locale-specific ordering are expressed without a
 * dependency on an i18n runtime.
 *
 * @module
 */

/**
 * Resolves a message to a string.
 *
 * @example
 * ```ts
 * resolveMessage(t.counter.limit, { count: 231, max: 2048 }); // '231 / 2048'
 * resolveMessage('Hello {name}', { name: 'Jane' });           // 'Hello Jane'
 * ```
 */
export function resolveMessage(
  message: LocalizedString | undefined,
  values: Record<string, string | number> = {},
): string {
  if (message === undefined) return '';
  if (typeof message === 'function') return message(values);
  return message.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = values[key];
    return value === undefined ? match : String(value);
  });
}

/** Deep-merges a partial catalogue onto a base one. */
export function mergeLocalization(
  base: RteLocalization,
  override: DeepPartial<RteLocalization> | undefined,
): RteLocalization {
  if (!override) return base;
  const result = { ...base } as Record<string, unknown>;
  for (const [key, value] of Object.entries(override) as [string, unknown][]) {
    if (value === undefined) continue;
    const existing = result[key];
    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      existing !== null &&
      typeof existing === 'object' &&
      !Array.isArray(existing)
    ) {
      // The catalogue is a plain nested record of messages, so the same merge works at
      // every level; the casts only re-state that for the type checker.
      result[key] = mergeLocalization(existing as unknown as RteLocalization, value);
    } else {
      result[key] = value;
    }
  }
  return result as unknown as RteLocalization;
}

/** The default catalogue, for callers that need a base to merge onto. */
export const defaultLocalization: RteLocalization = en;
