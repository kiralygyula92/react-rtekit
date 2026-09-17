import { describe, expect, it } from 'vitest';
import {
  checkUrl,
  getProtocol,
  isExternalUrl,
  normalizeUrl,
  DEFAULT_PROTOCOLS,
} from '../../src/core/sanitize/url.js';
import {
  contrastRatio,
  meetsContrastAA,
  normalizeColor,
} from '../../src/core/utils/color.js';
import { createId, resetIdCounter, scopedId } from '../../src/core/utils/id.js';

/**
 * URL and colour handling, at the unit level.
 *
 * The URL checker is the narrowest security-critical function in the library: every
 * `href` and every `src` goes through it, and the XSS corpus exercises it end to end
 * but not branch by branch. These are the branches — the protocol that is spelled with
 * a tab in it, the data URL that claims to be a PNG, the policy that allows some MIME
 * types and not others.
 */

const policy = {
  allowProtocols: DEFAULT_PROTOCOLS,
  allowDataUrls: false as boolean | { mimeTypes: string[] },
  allowRelative: true,
};

describe('getProtocol', () => {
  it('reads a scheme, lower-cased', () => {
    expect(getProtocol('HTTPS://example.com')).toBe('https');
    expect(getProtocol('mailto:a@b.com')).toBe('mailto');
  });

  it('returns null for a relative URL', () => {
    expect(getProtocol('/images/a.png')).toBeNull();
    expect(getProtocol('#anchor')).toBeNull();
    expect(getProtocol('example.com/path')).toBeNull();
  });

  it('sees through the characters a browser ignores', () => {
    // `jav\tascript:` reaches the browser as `javascript:`, and so must reach us as one.
    expect(getProtocol('jav\tascript:alert(1)')).toBe('javascript');
    expect(getProtocol('java\nscript:alert(1)')).toBe('javascript');
    expect(getProtocol('  javascript:alert(1)')).toBe('javascript');
    expect(getProtocol(`java${String.fromCharCode(0)}script:alert(1)`)).toBe('javascript');
    // And through an entity, which is how the scheme is usually smuggled past a
    // sanitizer that only looks at the raw string.
    expect(getProtocol('&#106;avascript:alert(1)')).toBe('javascript');
  });
});

describe('checkUrl', () => {
  it('keeps an allowed protocol', () => {
    expect(checkUrl('https://example.com', policy)).toEqual({ value: 'https://example.com' });
  });

  it('drops a protocol that is not allowed', () => {
    expect(checkUrl('javascript:alert(1)', policy)).toEqual({
      value: null,
      reason: 'protocol-not-allowed',
    });
    expect(checkUrl('vbscript:msgbox(1)', policy).value).toBeNull();
  });

  it('keeps a relative URL when the policy allows it', () => {
    expect(checkUrl('/images/a.png', policy).value).toBe('/images/a.png');
  });

  it('drops a relative URL when the policy does not', () => {
    const verdict = checkUrl('/images/a.png', { ...policy, allowRelative: false });
    expect(verdict.value).toBeNull();
  });

  it('blocks data:text/html and data SVG whatever the policy says', () => {
    // Both can carry a whole document, so no configuration re-enables them.
    const permissive = { ...policy, allowDataUrls: true };

    expect(checkUrl('data:text/html,<script>alert(1)</script>', permissive).value).toBeNull();
    expect(checkUrl('data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=', permissive).value).toBeNull();
  });

  it('drops any data URL when they are off', () => {
    expect(checkUrl('data:image/png;base64,iVBOR', policy)).toEqual({
      value: null,
      reason: 'data-url-not-allowed',
    });
  });

  it('keeps a data URL when they are on', () => {
    const verdict = checkUrl('data:image/png;base64,iVBOR', { ...policy, allowDataUrls: true });
    expect(verdict.value).toBe('data:image/png;base64,iVBOR');
  });

  it('honours a MIME allowlist', () => {
    const restricted = { ...policy, allowDataUrls: { mimeTypes: ['image/png'] } };

    expect(checkUrl('data:image/png;base64,iVBOR', restricted).value).not.toBeNull();
    expect(checkUrl('data:image/gif;base64,R0lGOD', restricted)).toEqual({
      value: null,
      reason: 'data-url-not-allowed',
    });
  });
});

describe('normalizeUrl', () => {
  it('adds the default protocol to a bare host', () => {
    expect(normalizeUrl('example.com')).toBe('https://example.com');
    expect(normalizeUrl('example.com', 'http')).toBe('http://example.com');
  });

  it('leaves anything that already has a scheme', () => {
    expect(normalizeUrl('https://example.com')).toBe('https://example.com');
    expect(normalizeUrl('mailto:a@b.com')).toBe('mailto:a@b.com');
  });

  it('leaves relative, protocol-relative and anchor URLs', () => {
    expect(normalizeUrl('/internal')).toBe('/internal');
    expect(normalizeUrl('//cdn.example.com/a.png')).toBe('//cdn.example.com/a.png');
    expect(normalizeUrl('#section')).toBe('#section');
  });

  it('recognises an e-mail address', () => {
    expect(normalizeUrl('a@b.com')).toBe('mailto:a@b.com');
  });

  it('leaves an empty string alone', () => {
    expect(normalizeUrl('   ')).toBe('');
  });
});

describe('isExternalUrl', () => {
  it('is true for http, https and protocol-relative', () => {
    expect(isExternalUrl('https://example.com')).toBe(true);
    expect(isExternalUrl('http://example.com')).toBe(true);
    expect(isExternalUrl('//cdn.example.com')).toBe(true);
  });

  it('is false for relative, anchor and mailto', () => {
    expect(isExternalUrl('/internal')).toBe(false);
    expect(isExternalUrl('#section')).toBe(false);
    expect(isExternalUrl('mailto:a@b.com')).toBe(false);
  });
});

describe('normalizeColor', () => {
  it('expands a short hex, in one consistent case', () => {
    expect(normalizeColor('#abc')).toBe('#aabbcc');
  });

  it('keeps a full hex', () => {
    // The case is normalized rather than preserved, which is what lets the picker
    // compare a palette entry with the applied colour without caring how either was
    // written.
    expect(normalizeColor('#1f2933')).toBe('#1f2933');
  });

  it('reads rgb and rgba', () => {
    expect(normalizeColor('rgb(255, 0, 0)')).toBe('#ff0000');
    expect(normalizeColor('rgba(255, 0, 0, 0.5)')).toBe('#ff0000');
  });

  it('returns null for nothing and for anything it cannot read', () => {
    expect(normalizeColor(null)).toBeNull();
    expect(normalizeColor(undefined)).toBeNull();
    expect(normalizeColor('')).toBeNull();
    expect(normalizeColor('not a colour')).toBeNull();
  });
});

describe('contrastRatio and meetsContrastAA', () => {
  it('is 21 for black on white, and symmetric', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 1);
  });

  it('is 1 for a colour against itself', () => {
    expect(contrastRatio('#336699', '#336699')).toBeCloseTo(1, 5);
  });

  it('applies the AA thresholds, and the lower one for large text', () => {
    // 3.7:1 — under 4.5 for body text, over 3 for large.
    expect(meetsContrastAA('#F04438', '#FFFFFF')).toBe(false);
    expect(meetsContrastAA('#F04438', '#FFFFFF', true)).toBe(true);
    expect(meetsContrastAA('#D92D20', '#FFFFFF')).toBe(true);
  });
});

describe('ids', () => {
  it('counts up from a prefix', () => {
    resetIdCounter();
    expect(createId('rte')).not.toBe(createId('rte'));
  });

  it('starts again after a reset, which is what keeps snapshots stable', () => {
    resetIdCounter();
    const first = createId('x');
    resetIdCounter();
    expect(createId('x')).toBe(first);
  });

  it('scopes a part to an instance', () => {
    expect(scopedId('rte-1', 'content')).toBe('rte-1-content');
  });
});
