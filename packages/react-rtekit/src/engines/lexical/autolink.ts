import { createLinkMatcherWithRegExp, registerAutoLink } from '@lexical/link';
import type { LexicalEditor } from 'lexical';
import type { Unregister } from '../../types/common.js';

/**
 * Automatic linking of typed URLs and e-mail addresses.
 *
 * The matchers are deliberately conservative: a full URL with a scheme, a bare host
 * with a recognizable TLD, or an e-mail address. Matching more than that turns every
 * sentence with a dot in it into a link, which authors notice far more than the
 * occasional URL they have to link by hand.
 *
 * The protocol a match is given is checked against the allowed list, so a deployment
 * that only wants `https` never produces anything else — and the sanitizer still has
 * the final say on the way out.
 *
 * @module
 */

/** A URL that already carries its scheme. */
const WITH_SCHEME = /((https?|mailto|tel):\/*[^\s<>"']+[^\s.,;:<>"')\]}])/i;

/** A bare host: `example.com`, `www.example.co.uk/path`. */
const BARE_HOST =
  /((?:www\.|[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s<>"']*)?[^\s.,;:<>"')\]}])/i;

/** An e-mail address. */
const EMAIL = /([\w.+-]+@[\w-]+\.[\w.-]+[a-z]{2,})/i;

/** Options for {@link registerAutoLinking}. */
export interface AutoLinkOptions {
  /** @default true */
  enabled?: boolean;
  /** @default ['https', 'http', 'mailto'] */
  protocols?: string[];
  /** @default 'https' */
  defaultProtocol?: string;
}

/** The scheme a URL carries, lower-cased, or `null` when it has none. */
function schemeOf(url: string): string | null {
  return /^([a-z][a-z0-9+.-]*):/i.exec(url)?.[1]?.toLowerCase() ?? null;
}

/**
 * Registers autolinking, returning an unregister function.
 *
 * Returns a no-op when autolinking is off, so the caller never has to branch.
 */
export function registerAutoLinking(editor: LexicalEditor, options: AutoLinkOptions = {}): Unregister {
  if (options.enabled === false) return () => undefined;

  const protocols = new Set((options.protocols ?? ['https', 'http', 'mailto']).map((p) => p.toLowerCase()));
  const defaultProtocol = options.defaultProtocol ?? 'https';

  /** Gives a bare host its protocol and refuses anything not on the list. */
  const transform = (text: string): string => {
    const scheme = schemeOf(text);
    if (scheme === null) return `${defaultProtocol}://${text}`;
    return protocols.has(scheme) ? text : '';
  };

  const matchers = [
    createLinkMatcherWithRegExp(WITH_SCHEME, transform),
    createLinkMatcherWithRegExp(BARE_HOST, transform),
    createLinkMatcherWithRegExp(EMAIL, (text) => (protocols.has('mailto') ? `mailto:${text}` : '')),
  ];

  // A matcher that produced an empty URL means "not allowed here"; filtering the
  // result rather than the input keeps each regular expression readable.
  const guarded = matchers.map(
    (matcher) => (text: string) => {
      const match = matcher(text);
      return match && match.url !== '' ? match : null;
    },
  );

  return registerAutoLink(editor, { matchers: guarded, changeHandlers: [] });
}
