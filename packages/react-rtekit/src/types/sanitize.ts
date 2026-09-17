import type { HtmlElement } from '../core/html/nodes.js';

/** Sanitization types (03 §4). @group Security */

/**
 * The element a {@link SanitizeConfig.transform} hook receives.
 *
 * 03 §4.3 writes this as a DOM `Element`. It cannot be one: the sanitizer also runs
 * on a server and in a worker, where there is no DOM, and `<RteContentView>` sanitizes
 * during SSR. The portable node carries the same three things a transform needs -- tag
 * name, attributes and children -- and is what both parser frontends produce.
 */
export type SanitizeElement = HtmlElement;

/** One of the four shipped profiles. */
export type SanitizeProfileName = 'strict' | 'standard' | 'email' | 'permissive';

/** Context handed to a {@link SanitizeConfig.transform} hook. */
export interface SanitizeContext {
  /** The profile the element is being checked against. */
  profile: SanitizeProfileName | 'custom';
  /** Depth of the element below the fragment root. */
  depth: number;
  /** Report something that was removed. */
  report(info: SanitizeViolation): void;
}

/** A removal performed by the sanitizer. */
export interface SanitizeViolation {
  /** The element the removal happened on. */
  tag: string;
  /** The attribute removed, when the removal was not of the whole tag. */
  attribute?: string;
  /** Why it was removed. */
  reason:
    | 'tag-not-allowed'
    | 'tag-hard-blocked'
    | 'attribute-not-allowed'
    | 'event-handler'
    | 'protocol-not-allowed'
    | 'data-url-not-allowed'
    | 'style-property-not-allowed'
    | 'style-value-not-allowed'
    | 'class-not-allowed';
}

/**
 * Fine-grained sanitizer configuration.
 *
 * Anything omitted falls back to the profile the config is merged onto (`standard` by
 * default). The hard rules in 03 §4.3 cannot be re-enabled from here.
 */
export interface SanitizeConfig {
  /** Tag allowlist. Replaces the profile's list when given. */
  allowTags?: string[];
  /** Attribute allowlist per tag. The `'*'` key applies to every tag. */
  allowAttributes?: Record<string, string[]>;
  /** CSS property allowlist for inline `style`. */
  allowStyles?: string[];
  /** Class-name allowlist. Strings match exactly; regexes are tested against the name. */
  allowClasses?: (string | RegExp)[];
  /** URL scheme allowlist. @default ['http','https','mailto','tel'] */
  allowProtocols?: string[];
  /** Allow `data:` URLs, optionally restricted to specific MIME types. @default false */
  allowDataUrls?: boolean | { mimeTypes: string[] };
  /** Allow protocol-relative and path-relative URLs. @default true */
  allowRelative?: boolean;
  /** `rel` forced onto links that open in a new tab. @default 'noopener noreferrer' */
  linkRel?: string;
  /** Per-element hook. Return the element, `null` to drop it, or `'unwrap'` to keep its children. */
  transform?: (el: SanitizeElement, ctx: SanitizeContext) => SanitizeElement | null | 'unwrap';
  /** Called for every removal. */
  onViolation?: (info: SanitizeViolation) => void;
}

/** The `sanitize` prop: a profile name, a config object, or `false` (unsafe). */
export type SanitizeOption = SanitizeProfileName | SanitizeConfig | false;

/** A fully expanded profile: every field resolved, ready to run. */
export interface ResolvedSanitizeConfig extends Required<Omit<SanitizeConfig, 'transform' | 'onViolation'>> {
  /** Which profile this config came from, for reporting and for plugin rules. */
  profile: SanitizeProfileName | 'custom';
  /** The per-element hook, carried through unresolved. */
  transform?: SanitizeConfig['transform'];
  /** The removal callback, carried through unresolved. */
  onViolation?: SanitizeConfig['onViolation'];
}
