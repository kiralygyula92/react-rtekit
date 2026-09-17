import { describe, expect, it } from 'vitest';
import { en } from '../../src/locales/en.js';
import { VERSION } from '../../src/version.js';
import { meta } from '../../src/meta.js';
import {
  DEFAULT_WATER_TEST_EMAIL_MESSAGE,
  OFFICE_FIXTURES,
  QUILL_FIXTURES,
  RTE_PREDEFINED_COLORS,
  XSS_PAYLOADS,
  buildLargeDocument,
  quillFixture,
} from '../fixtures/index.js';

/**
 * Milestone 0 acceptance: the scaffold is wired together and the fixture corpus the
 * later milestones depend on is present and well-formed.
 */
describe('scaffold', () => {
  it('exposes a version string', () => {
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('ships runtime metadata for the docs site', () => {
    expect(meta.version).toBe(VERSION);
    // The lists fill in as features land; the shape is the contract.
    expect(meta).toMatchObject({
      slots: expect.any(Array),
      commands: expect.any(Array),
      handlers: expect.any(Array),
      tokens: expect.any(Array),
      localizationKeys: expect.any(Array),
      icons: expect.any(Array),
    });
  });
});

describe('default localization', () => {
  /** Walks the catalogue and collects `a.b.c` paths with their leaf values. */
  function leaves(node: unknown, prefix = ''): [string, unknown][] {
    if (node === null || typeof node !== 'object') return [[prefix, node]];
    return Object.entries(node as Record<string, unknown>).flatMap(([key, value]) =>
      leaves(value, prefix ? `${prefix}.${key}` : key),
    );
  }

  it('resolves every leaf to a string or a formatter function', () => {
    // `custom` is the plugin namespace and is empty by default.
    const entries = leaves(en).filter(([path]) => !path.startsWith('custom'));
    const bad = entries.filter(
      ([, value]) => typeof value !== 'string' && typeof value !== 'function',
    );
    expect(bad).toEqual([]);
    expect(entries.length).toBeGreaterThan(100);
  });

  it('has no empty strings, which would render as an invisible control', () => {
    const empty = leaves(en)
      .filter(([, value]) => typeof value === 'string' && value.trim() === '')
      .map(([path]) => path);
    expect(empty).toEqual([]);
  });

  it('interpolates the parameterised messages', () => {
    const limit = en.counter.limit;
    expect(typeof limit).toBe('function');
    expect(typeof limit === 'function' ? limit({ count: 231, max: 2048 }) : limit).toBe(
      '231 / 2048',
    );

    const headingLevel = en.toolbar.headingLevel;
    expect(typeof headingLevel === 'function' ? headingLevel({ level: 2 }) : headingLevel).toBe(
      'Heading 2',
    );
  });
});

describe('fixture corpus', () => {
  it('has unique Quill fixture ids and non-empty markup', () => {
    const ids = QUILL_FIXTURES.map((fixture) => fixture.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const fixture of QUILL_FIXTURES) {
      expect(fixture.html.length, fixture.id).toBeGreaterThan(0);
      expect(fixture.description.length, fixture.id).toBeGreaterThan(0);
    }
  });

  it('keeps the exact default e-mail body, merge tags included', () => {
    expect(DEFAULT_WATER_TEST_EMAIL_MESSAGE).toContain('{contact_first_name}');
    expect(DEFAULT_WATER_TEST_EMAIL_MESSAGE).toContain('{next_test_date}');
    expect(DEFAULT_WATER_TEST_EMAIL_MESSAGE).toContain('{report_date}');
    expect(DEFAULT_WATER_TEST_EMAIL_MESSAGE).toContain('{org_name}');
    expect(DEFAULT_WATER_TEST_EMAIL_MESSAGE).toContain('{org_address}');
  });

  it('throws loudly for an unknown fixture id', () => {
    expect(() => quillFixture('nope')).toThrow(/Unknown Quill fixture/);
  });

  it('keeps the 21 classic swatches in their original order', () => {
    expect(RTE_PREDEFINED_COLORS).toHaveLength(21);
    expect(RTE_PREDEFINED_COLORS[0]).toBe('#000000');
    expect(RTE_PREDEFINED_COLORS[20]).toBe('#DDA0DD');
    expect(new Set(RTE_PREDEFINED_COLORS).size).toBe(21);
  });

  it('covers every office source', () => {
    const sources = new Set(OFFICE_FIXTURES.map((fixture) => fixture.source));
    expect(sources).toEqual(new Set(['word', 'gdocs', 'excel']));
  });

  it('has a broad XSS corpus with unique ids', () => {
    const ids = XSS_PAYLOADS.map((payload) => payload.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(XSS_PAYLOADS.length).toBeGreaterThanOrEqual(30);
  });

  it('generates a large document of about the requested size', () => {
    const html = buildLargeDocument(100_000);
    expect(html.length).toBeGreaterThanOrEqual(100_000);
    expect(html.length).toBeLessThan(101_000);
    expect(html.startsWith('<')).toBe(true);
  });
});
