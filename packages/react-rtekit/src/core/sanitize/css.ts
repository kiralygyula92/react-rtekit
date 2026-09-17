import { decodeEntitiesDeep } from '../html/entities.js';

/**
 * Inline-style policy.
 *
 * Inline CSS is a real attack surface — `expression()`, `url(javascript:)`, `@import`
 * and IE's `behavior:` all execute — and it is also where Word and Quill put most of
 * their formatting, so it cannot simply be dropped.
 *
 * @module
 */

/** CSS values containing any of these are removed, whatever the property is. */
const DANGEROUS_VALUE = /expression\s*\(|javascript\s*:|vbscript\s*:|@import|behavio(u)?r\s*:|-moz-binding|url\s*\(\s*['"]?\s*(javascript|vbscript|data:text\/html)/i;

/**
 * A well-formed CSS property name.
 *
 * Anything else is rejected outright, which is what stops an at-rule smuggled into an
 * inline style: `style="@import url(https://evil/x.css)"` parses as the "property"
 * `@import url(https` and would otherwise sail through a value-only check.
 */
const PROPERTY_NAME = /^-?[a-z][a-z0-9-]*$/;

/** Properties that are never allowed, whatever the profile says. */
const HARD_BLOCKED_PROPERTIES = new Set([
  'behavior',
  '-moz-binding',
  'position',
  'z-index',
  '-o-link',
  '-o-link-source',
]);

/** The properties the `email` profile permits. */
export const EMAIL_SAFE_PROPERTIES = [
  'color',
  'background-color',
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'text-decoration',
  'text-align',
  'padding',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'border',
  'border-collapse',
  'width',
  'height',
  'max-width',
  'vertical-align',
  'line-height',
  'list-style-type',
];

/** The properties the `standard` profile permits. */
export const STANDARD_SAFE_PROPERTIES = [
  ...EMAIL_SAFE_PROPERTIES,
  'background',
  'border-radius',
  'border-color',
  'border-style',
  'border-width',
  'text-indent',
  'text-transform',
  'letter-spacing',
  'white-space',
  'direction',
  'min-width',
  'max-height',
  'display',
];

/** One parsed declaration. */
export interface CssDeclaration {
  /** The property name, lower-cased. */
  property: string;
  /** The declared value, with its whitespace trimmed. */
  value: string;
}

/**
 * Splits an inline `style` value into declarations.
 *
 * Semicolons inside `url(…)` and quoted strings do not terminate a declaration, which
 * is exactly where a naive `split(';')` goes wrong.
 */
export function parseStyle(style: string): CssDeclaration[] {
  const declarations: CssDeclaration[] = [];
  let depth = 0;
  let quote: string | null = null;
  let current = '';

  const push = (chunk: string): void => {
    const colon = chunk.indexOf(':');
    if (colon === -1) return;
    const property = chunk.slice(0, colon).trim().toLowerCase();
    const value = chunk.slice(colon + 1).trim();
    if (property !== '' && value !== '') declarations.push({ property, value });
  };

  for (const char of style) {
    if (quote) {
      current += char;
      if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      current += char;
      continue;
    }
    if (char === '(') depth += 1;
    if (char === ')') depth = Math.max(0, depth - 1);
    if (char === ';' && depth === 0) {
      push(current);
      current = '';
      continue;
    }
    current += char;
  }
  push(current);

  return declarations;
}

/** Joins declarations back into an inline `style` value. */
export function serializeStyle(declarations: CssDeclaration[]): string {
  return declarations.map(({ property, value }) => `${property}: ${value}`).join('; ');
}

/**
 * Filters an inline `style` value against an allowlist.
 *
 * @param style the raw attribute value
 * @param allowed the permitted property names; `['*']` permits any property that is
 * not hard-blocked
 * @param onViolation called once per removed declaration
 * @returns the filtered value, or `''` when nothing survived
 */
export function sanitizeStyle(
  style: string,
  allowed: readonly string[],
  onViolation?: (property: string, reason: 'style-property-not-allowed' | 'style-value-not-allowed') => void,
): string {
  const decoded = decodeEntitiesDeep(style);
  const allowAny = allowed.includes('*');
  const allowedSet = new Set(allowed);
  const kept: CssDeclaration[] = [];

  for (const declaration of parseStyle(decoded)) {
    const { property, value } = declaration;

    if (!PROPERTY_NAME.test(property) || HARD_BLOCKED_PROPERTIES.has(property)) {
      onViolation?.(property, 'style-property-not-allowed');
      continue;
    }
    if (!allowAny && !allowedSet.has(property)) {
      onViolation?.(property, 'style-property-not-allowed');
      continue;
    }
    if (DANGEROUS_VALUE.test(value)) {
      onViolation?.(property, 'style-value-not-allowed');
      continue;
    }
    kept.push(declaration);
  }

  return serializeStyle(kept);
}

/**
 * Reads one declaration out of an inline `style` value.
 *
 * Used by the interop parsers, which need `text-align` and `color` before the document
 * model exists.
 */
export function readStyleProperty(style: string | undefined, property: string): string | null {
  if (!style) return null;
  for (const declaration of parseStyle(style)) {
    if (declaration.property === property) return declaration.value.trim();
  }
  return null;
}
