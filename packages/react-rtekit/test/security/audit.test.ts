import { describe, expect, it } from 'vitest';
import { decodeEntities } from '../../src/core/html/entities.js';
import { sanitizeHtml } from '../../src/core/sanitize/sanitize.js';
import { sanitizeStyle } from '../../src/core/sanitize/css.js';

describe('untrusted HTML edge cases', () => {
  it('treats prototype property names as ordinary unknown tags', () => {
    expect(
      sanitizeHtml('<p>before<constructor>inside</constructor>after</p>', {
        parser: 'builtin',
      }),
    ).toBe('<p>beforeinsideafter</p>');
  });

  it('leaves unknown entity names unchanged', () => {
    expect(decodeEntities('&constructor; &toString; &hasOwnProperty;')).toBe(
      '&constructor; &toString; &hasOwnProperty;',
    );
  });

  it.each([
    String.raw`background: url(\6a avascript:alert(1))`,
    String.raw`width: e\78 pression(alert(1))`,
    'width: expression/**/(alert(1))',
    String.raw`background: url(\64 ata:text/html,test)`,
    String.raw`background: url("https://safe.example/*"), url("\6a avascript:alert(1)")`,
    'background: url("https://safe.example/*"), url("data:text/html,test")',
  ])('rejects obfuscated dangerous CSS: %s', (style) => {
    expect(sanitizeStyle(style, ['*'])).toBe('');
  });

  it('preserves harmless CSS escapes and quoted comment text', () => {
    const style = String.raw`font-family: "A\26 B"; color: red`;
    expect(sanitizeStyle(style, ['*'])).toBe(style);
    expect(sanitizeStyle('font-family: "A/*B*/C"', ['*'])).toBe('font-family: "A/*B*/C"');
  });
});
