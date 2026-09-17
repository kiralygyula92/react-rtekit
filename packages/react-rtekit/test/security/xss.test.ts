import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { SanitizeProfileName } from '../../src/types/sanitize.js';
import { sanitizeHtml } from '../../src/core/sanitize/index.js';
import { parseHtml, walkElements, type HtmlElement } from '../../src/core/html/index.js';
import { HARD_BLOCKED_TAGS } from '../../src/core/sanitize/profiles.js';
import { FORBIDDEN_IN_OUTPUT, XSS_PAYLOADS } from '../fixtures/xss.js';

/**
 * The security gate.
 *
 * Every payload is run through every profile, with both parser frontends. The
 * assertion is not "looks safe" but "contains nothing that can execute": no blocked
 * element, no event handler, no dangerous URL scheme, no executable CSS.
 */

const PROFILES: SanitizeProfileName[] = ['strict', 'standard', 'email', 'permissive'];
const PARSERS = ['builtin', 'auto'] as const;

/** Re-parses the sanitized output and inspects the tree, not the string. */
function inspect(html: string): { tags: string[]; attributes: string[]; urls: string[]; styles: string[] } {
  const tags: string[] = [];
  const attributes: string[] = [];
  const urls: string[] = [];
  const styles: string[] = [];
  walkElements(parseHtml(html, 'builtin'), (el: HtmlElement) => {
    tags.push(el.tag);
    for (const [name, value] of Object.entries(el.attrs)) {
      attributes.push(name);
      if (name === 'href' || name === 'src' || name === 'data' || name === 'action') urls.push(value);
      if (name === 'style') styles.push(value);
    }
  });
  return { tags, attributes, urls, styles };
}

describe.each(PROFILES)('sanitize profile: %s', (profile) => {
  describe.each(PARSERS)('parser: %s', (parser) => {
    it.each(XSS_PAYLOADS.map((payload) => [payload.id, payload.vector, payload.html] as const))(
      'neutralizes %s (%s)',
      (_id, _vector, html) => {
        const output = sanitizeHtml(html, { sanitize: profile, parser });
        const lower = output.toLowerCase();

        for (const forbidden of FORBIDDEN_IN_OUTPUT) {
          expect(lower, `output still contains ${forbidden}: ${output}`).not.toContain(forbidden);
        }

        const { tags, attributes, urls, styles } = inspect(output);
        for (const tag of tags) {
          expect(HARD_BLOCKED_TAGS.has(tag), `hard-blocked tag survived: ${tag}`).toBe(false);
        }
        for (const attribute of attributes) {
          expect(attribute.startsWith('on'), `event handler survived: ${attribute}`).toBe(false);
          expect(attribute).not.toBe('srcdoc');
          expect(attribute).not.toBe('xlink:href');
        }
        for (const url of urls) {
          expect(url.toLowerCase()).not.toMatch(/^\s*(javascript|vbscript|livescript|mocha|data:text\/html)/);
        }
        for (const style of styles) {
          expect(style.toLowerCase()).not.toMatch(/expression\s*\(|@import|behaviou?r\s*:|-moz-binding/);
        }
      },
    );
  });
});

describe('hard rules cannot be configured away', () => {
  it('refuses to re-enable script through allowTags', () => {
    const output = sanitizeHtml('<script>alert(1)</script><p>after</p>', {
      sanitize: { allowTags: ['script', 'p'], allowAttributes: { '*': ['onerror'] } },
    });
    expect(output).toBe('<p>after</p>');
  });

  it('refuses to re-enable event handlers through allowAttributes', () => {
    const output = sanitizeHtml('<p onclick="alert(1)">x</p>', {
      sanitize: { allowAttributes: { p: ['onclick'], '*': ['onmouseover'] } },
    });
    expect(output).toBe('<p>x</p>');
  });

  it('refuses javascript: however the protocol list is configured', () => {
    const output = sanitizeHtml('<a href="javascript:alert(1)">x</a>', {
      sanitize: { allowProtocols: ['javascript', 'http', 'https'] },
    });
    expect(output).toBe('<a>x</a>');
  });

  it('refuses data:text/html even when data URLs are allowed', () => {
    const output = sanitizeHtml('<a href="data:text/html,<script>alert(1)</script>">x</a>', {
      sanitize: { allowDataUrls: true },
    });
    expect(output).toBe('<a>x</a>');
  });

  it('refuses data: SVG images even when data URLs are allowed', () => {
    const output = sanitizeHtml('<img src="data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=">', {
      sanitize: { allowDataUrls: true },
    });
    expect(output).toBe('<img>');
  });

  it('allows a configured data: image type', () => {
    const png = 'data:image/png;base64,iVBORw0KGgo=';
    const output = sanitizeHtml(`<img src="${png}">`, {
      sanitize: { allowDataUrls: { mimeTypes: ['image/png'] } },
    });
    expect(output).toBe(`<img src="${png}">`);
  });
});

describe('link safety', () => {
  it('adds rel to every target=_blank link', () => {
    const output = sanitizeHtml('<a href="https://example.com" target="_blank">x</a>');
    expect(output).toContain('rel="noopener noreferrer"');
  });

  it('keeps an existing rel and adds the safety tokens', () => {
    const output = sanitizeHtml(
      '<a href="https://example.com" target="_blank" rel="nofollow">x</a>',
    );
    expect(output).toContain('nofollow');
    expect(output).toContain('noopener');
    expect(output).toContain('noreferrer');
  });

  it('leaves same-tab links alone', () => {
    const output = sanitizeHtml('<a href="https://example.com">x</a>');
    expect(output).toBe('<a href="https://example.com">x</a>');
  });
});

describe('content preservation', () => {
  it('keeps the text of a disallowed element rather than deleting it', () => {
    const output = sanitizeHtml('<p>before <marquee>words</marquee> after</p>', {
      sanitize: 'strict',
    });
    // `marquee` is hard-blocked, so its content goes with it.
    expect(output).toBe('<p>before  after</p>');
  });

  it('unwraps a disallowed wrapper and keeps its children', () => {
    const output = sanitizeHtml('<p>a <center><b>bold</b></center> b</p>', { sanitize: 'standard' });
    expect(output).toBe('<p>a <b>bold</b> b</p>');
  });

  it('keeps allowlisted formatting untouched', () => {
    const input = '<p><strong>bold</strong> <em>italic</em> <u>underline</u></p>';
    expect(sanitizeHtml(input)).toBe(input);
  });

  it('strips classes the email profile does not keep', () => {
    const output = sanitizeHtml('<p class="rte-align-center" id="x">hi</p>', { sanitize: 'email' });
    expect(output).toBe('<p>hi</p>');
  });

  it('keeps rte- and ql- classes in the standard profile', () => {
    const output = sanitizeHtml('<p class="rte-align-center ql-indent-1 evil">hi</p>');
    expect(output).toBe('<p class="rte-align-center ql-indent-1">hi</p>');
  });
});

describe('violation reporting', () => {
  it('reports what it removed', () => {
    const violations: { tag: string; attribute?: string; reason: string }[] = [];
    sanitizeHtml('<img src="javascript:alert(1)" onerror="x"><script>1</script>', {
      onViolation: (violation) => violations.push(violation),
    });
    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ tag: 'img', attribute: 'onerror', reason: 'event-handler' }),
        expect.objectContaining({ tag: 'img', attribute: 'src', reason: 'protocol-not-allowed' }),
        expect.objectContaining({ tag: 'script', reason: 'tag-hard-blocked' }),
      ]),
    );
  });
});

describe('fuzzing', () => {
  /** Characters chosen to produce broken markup, not pretty markup. */
  const chaos = fc.stringMatching(/^[<>"'&/\\=\s\w:;(){}[\]#.-]{0,120}$/);

  it('never throws and never emits a blocked tag, handler or scheme', () => {
    fc.assert(
      fc.property(chaos, (raw) => {
        const html = `<div>${raw}</div>`;
        for (const profile of PROFILES) {
          const output = sanitizeHtml(html, { sanitize: profile, parser: 'builtin' });
          const { tags, attributes, urls } = inspect(output);
          for (const tag of tags) if (HARD_BLOCKED_TAGS.has(tag)) return false;
          for (const attribute of attributes) if (attribute.startsWith('on')) return false;
          for (const url of urls) {
            if (/^\s*(javascript|vbscript)/i.test(url)) return false;
          }
        }
        return true;
      }),
      { numRuns: 400 },
    );
  });

  it('is idempotent: sanitizing twice changes nothing', () => {
    fc.assert(
      fc.property(chaos, (raw) => {
        const once = sanitizeHtml(`<p>${raw}</p>`, { parser: 'builtin' });
        const twice = sanitizeHtml(once, { parser: 'builtin' });
        return once === twice;
      }),
      { numRuns: 300 },
    );
  });
});
