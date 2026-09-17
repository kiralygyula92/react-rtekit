/**
 * HTML entity handling.
 *
 * Decoding is security-relevant: `&#106;avascript:` and `jav&#x09;ascript:` are the
 * classic ways to smuggle a dangerous URL past a naive check, so URLs are always
 * decoded before their scheme is inspected (03 §4.3).
 *
 * Only the named entities that actually occur in editor content are tabulated;
 * everything else goes through the numeric path or is left alone, which keeps this
 * module small enough to live inside the sanitizer's 4 kB budget.
 */

const NAMED: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ensp: ' ',
  emsp: ' ',
  thinsp: ' ',
  zwnj: '‌',
  zwj: '‍',
  shy: '­',
  copy: '©',
  reg: '®',
  trade: '™',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  bull: '•',
  middot: '·',
  deg: '°',
  plusmn: '±',
  times: '×',
  divide: '÷',
  frac12: '½',
  frac14: '¼',
  euro: '€',
  pound: '£',
  yen: '¥',
  cent: '¢',
  sect: '§',
  para: '¶',
  laquo: '«',
  raquo: '»',
  larr: '←',
  rarr: '→',
  harr: '↔',
  dagger: '†',
  Dagger: '‡',
  permil: '‰',
  prime: '′',
  Prime: '″',
  oline: '‾',
  frasl: '⁄',
  weierp: '℘',
  image: 'ℑ',
  real: 'ℜ',
  alefsym: 'ℵ',
};

const ENTITY_RE = /&(#[Xx][0-9A-Fa-f]+|#\d+|[A-Za-z][A-Za-z0-9]{1,31});?/g;

/** Code points that must never be produced by decoding. */
function safeFromCodePoint(code: number): string {
  // Surrogates, out-of-range values and the null character all become U+FFFD, which
  // is what the HTML spec requires and stops `&#0;`-style filter evasion.
  if (code === 0 || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) return '�';
  return String.fromCodePoint(code);
}

/**
 * Decodes HTML entities in a string.
 *
 * Applied repeatedly by {@link decodeEntitiesDeep} where double-encoding could hide a
 * payload.
 */
export function decodeEntities(input: string): string {
  if (!input.includes('&')) return input;
  return input.replace(ENTITY_RE, (match, body: string) => {
    if (body.startsWith('#')) {
      const hex = body[1] === 'x' || body[1] === 'X';
      const digits = hex ? body.slice(2) : body.slice(1);
      const code = Number.parseInt(digits, hex ? 16 : 10);
      return Number.isNaN(code) ? match : safeFromCodePoint(code);
    }
    return NAMED[body] ?? match;
  });
}

/**
 * Decodes until the string stops changing, so `&amp;#106;` cannot hide a `j`.
 *
 * Capped at five passes: that is far more nesting than any real content has, and it
 * bounds the work an attacker can force.
 */
export function decodeEntitiesDeep(input: string, maxPasses = 5): string {
  let current = input;
  for (let pass = 0; pass < maxPasses; pass += 1) {
    const next = decodeEntities(current);
    if (next === current) return current;
    current = next;
  }
  return current;
}

/** Escapes text for a text node: `&`, `<` and `>`. */
export function escapeText(input: string): string {
  return input.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Escapes a value for a double-quoted attribute.
 *
 * `<` and `>` are escaped too. They are not strictly required inside an attribute,
 * but escaping them removes a whole class of mutation bugs if the output is ever
 * re-parsed in a different context.
 */
export function escapeAttribute(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
