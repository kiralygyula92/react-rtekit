import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { VERSION } from '../../src/version.js';

/**
 * `VERSION` is what a bug report quotes.
 *
 * It used to be a literal with a comment claiming it was injected at build time, so it
 * would have reported `0.0.0` for the rest of the project's life. It is generated from
 * the manifest now, and this is what notices when a version bump has not been built.
 */
describe('the exported version', () => {
  it('matches package.json', () => {
    const manifest = JSON.parse(
      readFileSync('packages/react-rtekit/package.json', 'utf8'),
    ) as { version: string };

    expect(VERSION).toBe(manifest.version);
  });

  it('is a semantic version', () => {
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+(?:-[\w.]+)?$/);
  });
});
