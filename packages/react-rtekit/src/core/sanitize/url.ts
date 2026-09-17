import { decodeEntitiesDeep } from '../html/entities.js';

/**
 * URL policy (03 §4.3).
 *
 * The rule that matters: decide on the *decoded* value. `jav&#x09;ascript:alert(1)`
 * and `java\nscript:alert(1)` both reach the browser as `javascript:`, so both have to
 * be judged as `javascript:`.
 *
 * @module
 */

/** Schemes that are never allowed, whatever the configuration says. */
export const HARD_BLOCKED_PROTOCOLS = new Set(['javascript', 'vbscript', 'livescript', 'mocha']);

/** The default allowlist. */
export const DEFAULT_PROTOCOLS = ['http', 'https', 'mailto', 'tel'];

/** What {@link checkUrl} decided, and why. */
export interface UrlVerdict {
  /** The value to write, or `null` when the URL must be dropped. */
  value: string | null;
  /** Why it was dropped, for the violation report. Absent when it was kept. */
  reason?: 'protocol-not-allowed' | 'data-url-not-allowed';
}

/**
 * Characters a browser discards while resolving a URL scheme.
 *
 * Written as explicit escapes rather than literals: `jav\tascript:` reaches the
 * browser as `javascript:`, and a literal control character in source is invisible to
 * the next reader.
 */
/* eslint-disable no-control-regex, no-misleading-character-class -- these characters are exactly what has to be stripped */
const CONTROL_CHARACTERS =
  /[\u0000-\u0020\u007F-\u009F\u200B\u200C\u200D\uFEFF]/g;
/* eslint-enable no-control-regex, no-misleading-character-class */

/**
 * Strips the characters a browser ignores when resolving a scheme.
 *
 * Control characters (including tab, newline and carriage return) and leading
 * whitespace are removed, because `java\tscript:` is `javascript:` to a browser.
 */
function normalizeForSchemeCheck(raw: string): string {
  return decodeEntitiesDeep(raw).replace(CONTROL_CHARACTERS, '');
}

/**
 * Extracts the scheme of a URL, or `null` when it is relative.
 *
 * @example
 * ```ts
 * getProtocol('HTTPS://example.com'); // 'https'
 * getProtocol('/images/a.png');       // null
 * ```
 */
export function getProtocol(raw: string): string | null {
  const normalized = normalizeForSchemeCheck(raw);
  const match = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(normalized);
  return match ? match[1]!.toLowerCase() : null;
}

/** Options accepted by {@link checkUrl}. */
export interface UrlPolicy {
  /** Schemes a URL may use. */
  allowProtocols: string[];
  /** Whether `data:` URLs survive, optionally restricted by MIME type. */
  allowDataUrls: boolean | { mimeTypes: string[] };
  /** Whether protocol- and path-relative URLs survive. */
  allowRelative: boolean;
}

/**
 * Applies the URL policy to one attribute value.
 *
 * @param raw the attribute value exactly as it appeared
 * @param policy the resolved profile's URL rules
 */
export function checkUrl(raw: string, policy: UrlPolicy): UrlVerdict {
  const trimmed = raw.trim();
  if (trimmed === '') return { value: '' };

  const protocol = getProtocol(trimmed);

  if (protocol === null) {
    // Relative, protocol-relative (`//host`), fragment or query.
    if (!policy.allowRelative && !trimmed.startsWith('#')) {
      return { value: null, reason: 'protocol-not-allowed' };
    }
    return { value: trimmed };
  }

  if (HARD_BLOCKED_PROTOCOLS.has(protocol)) {
    return { value: null, reason: 'protocol-not-allowed' };
  }

  if (protocol === 'data') {
    const mime = /^data:\s*([^;,]*)/i.exec(normalizeForSchemeCheck(trimmed))?.[1]?.toLowerCase() ?? '';
    // `data:text/html` can carry a whole document, so it is blocked unconditionally.
    if (mime.startsWith('text/html') || mime.includes('svg')) {
      return { value: null, reason: 'data-url-not-allowed' };
    }
    if (policy.allowDataUrls === false) {
      return { value: null, reason: 'data-url-not-allowed' };
    }
    if (typeof policy.allowDataUrls === 'object') {
      if (!policy.allowDataUrls.mimeTypes.includes(mime)) {
        return { value: null, reason: 'data-url-not-allowed' };
      }
    }
    return { value: trimmed };
  }

  if (!policy.allowProtocols.includes(protocol)) {
    return { value: null, reason: 'protocol-not-allowed' };
  }

  return { value: trimmed };
}

/**
 * Adds a default scheme to a bare host, as the link popover does (05 §6).
 *
 * Leaves anything that already has a scheme, an anchor or a mail-like shape alone.
 *
 * @example
 * ```ts
 * normalizeUrl('example.com');        // 'https://example.com'
 * normalizeUrl('a@b.com');            // 'mailto:a@b.com'
 * normalizeUrl('/internal');          // '/internal'
 * ```
 */
export function normalizeUrl(raw: string, defaultProtocol = 'https'): string {
  const trimmed = raw.trim();
  if (trimmed === '') return trimmed;
  if (getProtocol(trimmed) !== null) return trimmed;
  if (trimmed.startsWith('//') || trimmed.startsWith('/') || trimmed.startsWith('#')) return trimmed;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return `mailto:${trimmed}`;
  return `${defaultProtocol}://${trimmed}`;
}

/** True when a URL points somewhere outside the current origin. */
export function isExternalUrl(raw: string): boolean {
  const protocol = getProtocol(raw);
  if (protocol === 'http' || protocol === 'https') return true;
  return raw.trim().startsWith('//');
}
