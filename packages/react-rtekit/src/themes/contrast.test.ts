import { describe, expect, it } from 'vitest';
import { contrastRatio, meetsContrastAA } from '../core/index.js';
import { classicTheme, darkTheme, lightTheme, themes } from './index.js';
import type { ResolvedRteTheme } from '../types/theme.js';

/**
 * Every shipped theme meets WCAG AA.
 *
 * This exists because the failure mode is silent: a token can be changed to a nicer
 * shade, look fine to the person changing it, and quietly drop the error message below
 * readable. Three of the tokens here were doing exactly that before this file existed.
 *
 * Only tokens that are *rendered as text* are checked at the 4.5:1 text threshold.
 * Borders and rings are UI components and need 3:1, which is checked separately.
 */

/** Tokens the stylesheet renders as body-sized text, and what they sit on. */
const TEXT_TOKENS = ['text', 'textMuted', 'placeholder', 'danger', 'success', 'warning'] as const;

/** Both surfaces: the toolbar and the footer sit on the muted one, not on white. */
const SURFACES = ['surface', 'surfaceMuted'] as const;

/**
 * UI components, which WCAG 1.4.11 puts at 3:1.
 *
 * The resting field border is deliberately not in this list. `#D5D7DA` is 1.4:1 on
 * white — a frozen parity value — and it is not what identifies the field or
 * its state: the 2px accent focus ring is, and that is what is checked here. Raising
 * the resting border would change every theme's look to satisfy a criterion the focus
 * ring already meets.
 */
const COMPONENT_TOKENS = ['accent', 'danger'] as const;

function describeTheme(name: string, theme: ResolvedRteTheme): void {
  describe(`the ${name} theme`, () => {
    for (const token of TEXT_TOKENS) {
      for (const surface of SURFACES) {
        it(`renders ${token} on ${surface} at AA`, () => {
          const foreground = theme.color[token];
          const background = theme.color[surface];
          const ratio = contrastRatio(foreground, background);

          expect(
            meetsContrastAA(foreground, background),
            `${token} (${foreground}) on ${surface} (${background}) is ${ratio.toFixed(2)}:1`,
          ).toBe(true);
        });
      }
    }

    it('renders a solid button label at AA', () => {
      // `accentContrast` exists for exactly one thing: the label on an accent fill.
      const ratio = contrastRatio(theme.color.accentContrast, theme.color.accent);
      expect(ratio, `accentContrast on accent is ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
    });

    for (const token of COMPONENT_TOKENS) {
      it(`draws ${token} against the surface at the 3:1 component threshold`, () => {
        const ratio = contrastRatio(theme.color[token], theme.color.surface);
        expect(ratio, `${token} on surface is ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(3);
      });
    }
  });
}

describeTheme('light', lightTheme);
describeTheme('classic', classicTheme);
describeTheme('dark', darkTheme);

describe('the theme registry', () => {
  it('covers every shipped theme', () => {
    // compact and bordered change sizes rather than colours, so they inherit light's
    // palette — but the assertion is here so a future theme cannot skip the check.
    for (const [name, theme] of Object.entries(themes)) {
      for (const token of TEXT_TOKENS) {
        expect(
          meetsContrastAA(theme.color[token], theme.color.surface),
          `${name}: ${token} (${theme.color[token]}) on surface (${theme.color.surface})`,
        ).toBe(true);
      }
    }
  });

  it('keeps the classic invalid border at its parity value', () => {
    // The deviation is the error *text*; the 1px border keeps its frozen parity value,
    // and 3.8:1 clears the component threshold it has to meet.
    expect(classicTheme.editor.invalidBorderColor).toBe('#F04438');
    expect(contrastRatio('#F04438', classicTheme.color.surface)).toBeGreaterThanOrEqual(3);
  });

  it('keeps the classic accent and focus ring at their parity values', () => {
    expect(classicTheme.color.accent).toBe('#2196F3');
    expect(classicTheme.editor.focusRing).toBe('inset 0 0 0 2px #2196F3');
  });
});
