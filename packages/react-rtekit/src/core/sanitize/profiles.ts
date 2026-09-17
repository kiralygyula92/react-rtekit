import type {
  ResolvedSanitizeConfig,
  SanitizeConfig,
  SanitizeOption,
  SanitizeProfileName,
} from '../../types/sanitize.js';
import { DEFAULT_PROTOCOLS } from './url.js';
import { EMAIL_SAFE_PROPERTIES, STANDARD_SAFE_PROPERTIES } from './css.js';

/**
 * The four sanitization profiles (03 §4.2).
 *
 * @module
 */

/**
 * Tags removed along with their contents, in every profile.
 *
 * No configuration can re-enable these (03 §4.3). `noscript` and `template` are here
 * because they re-parse their contents in a different context, which is the classic
 * mutation-XSS vector; `svg` and `math` because of `use`, `foreignObject` and
 * `annotation-xml`.
 */
export const HARD_BLOCKED_TAGS = new Set([
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'applet',
  'form',
  'input',
  'button',
  'select',
  'option',
  'optgroup',
  'textarea',
  'label',
  'fieldset',
  'legend',
  'link',
  'meta',
  'base',
  'title',
  'head',
  'html',
  'body',
  'frame',
  'frameset',
  'noframes',
  'noembed',
  'noscript',
  'template',
  'slot',
  'portal',
  'dialog',
  'svg',
  'math',
  'xmp',
  'plaintext',
  'marquee',
  'audio',
  'video',
  'source',
  'track',
  'canvas',
  'map',
  'area',
  'param',
  'keygen',
  'isindex',
  'command',
  'menuitem',
]);

/**
 * Tags that are removed but whose children are kept.
 *
 * Office pastes wrap real content in these, so dropping the content with the wrapper
 * would lose the paste.
 */
export const UNWRAP_TAGS = new Set([
  'o:p',
  'w:sdt',
  'v:shape',
  'v:imagedata',
  'x:num',
  'font',
  'center',
  'nobr',
  'section',
  'article',
  'main',
  'header',
  'footer',
  'aside',
  'nav',
  'details',
  'summary',
]);

/** Attributes carrying a URL, checked against the protocol policy. */
export const URL_ATTRIBUTES = new Set(['href', 'src', 'cite', 'action', 'formaction', 'poster', 'background', 'longdesc', 'xlink:href', 'data', 'srcset', 'ping']);

const STRICT_TAGS = ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del', 'ul', 'ol', 'li', 'a'];

const STANDARD_TAGS = [
  ...STRICT_TAGS,
  'span',
  'div',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'blockquote',
  'pre',
  'code',
  'kbd',
  'samp',
  'sub',
  'sup',
  'mark',
  'small',
  'ins',
  'hr',
  'img',
  'figure',
  'figcaption',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'td',
  'th',
  'caption',
  'colgroup',
  'col',
  'dl',
  'dt',
  'dd',
];

/** Attributes allowed on any tag in the `standard` profile. */
const STANDARD_GLOBAL_ATTRS = ['class', 'style', 'dir', 'lang', 'title', 'id'];

const STANDARD_ATTRS: Record<string, string[]> = {
  '*': STANDARD_GLOBAL_ATTRS,
  a: ['href', 'target', 'rel', 'name', 'download'],
  img: ['src', 'alt', 'width', 'height', 'loading', 'srcset', 'sizes'],
  ol: ['start', 'type', 'reversed'],
  li: ['value', 'data-list', 'data-checked'],
  ul: ['data-list'],
  p: ['data-indent'],
  td: ['colspan', 'rowspan', 'align', 'valign', 'width', 'height', 'bgcolor'],
  th: ['colspan', 'rowspan', 'align', 'valign', 'width', 'height', 'scope', 'bgcolor'],
  table: ['border', 'cellpadding', 'cellspacing', 'width', 'align', 'role'],
  col: ['span', 'width'],
  colgroup: ['span', 'width'],
  span: ['data-merge-tag', 'data-mention-id', 'data-emoji', 'contenteditable'],
  blockquote: ['data-indent'],
  h1: ['data-indent'],
  h2: ['data-indent'],
  h3: ['data-indent'],
  h4: ['data-indent'],
  h5: ['data-indent'],
  h6: ['data-indent'],
};

/** Class names the `standard` profile keeps: ours, plus the legacy Quill ones. */
const STANDARD_CLASSES: (string | RegExp)[] = [/^rte-[\w-]+$/, /^ql-(align|indent|size|font)-[\w-]+$/];

const EMAIL_TAGS = STANDARD_TAGS.filter((tag) => tag !== 'pre' && tag !== 'code' && tag !== 'kbd' && tag !== 'samp');

/** Every profile, fully expanded. */
const PROFILES: Record<SanitizeProfileName, Omit<ResolvedSanitizeConfig, 'profile'>> = {
  strict: {
    allowTags: STRICT_TAGS,
    allowAttributes: { a: ['href', 'target', 'rel'] },
    allowStyles: [],
    allowClasses: [],
    allowProtocols: DEFAULT_PROTOCOLS,
    allowDataUrls: false,
    allowRelative: true,
    linkRel: 'noopener noreferrer',
  },
  standard: {
    allowTags: STANDARD_TAGS,
    allowAttributes: STANDARD_ATTRS,
    allowStyles: STANDARD_SAFE_PROPERTIES,
    allowClasses: STANDARD_CLASSES,
    allowProtocols: DEFAULT_PROTOCOLS,
    allowDataUrls: false,
    allowRelative: true,
    linkRel: 'noopener noreferrer',
  },
  email: {
    allowTags: EMAIL_TAGS,
    allowAttributes: {
      ...STANDARD_ATTRS,
      // No `class` and no `id`: e-mail clients strip stylesheets, so classes are dead
      // weight, and ids collide with the host document (03 §5.3).
      '*': ['style', 'dir', 'lang', 'title'],
    },
    allowStyles: EMAIL_SAFE_PROPERTIES,
    allowClasses: [],
    allowProtocols: [...DEFAULT_PROTOCOLS, 'cid'],
    allowDataUrls: false,
    allowRelative: true,
    linkRel: 'noopener noreferrer',
  },
  permissive: {
    allowTags: [...STANDARD_TAGS, 'section', 'article', 'header', 'footer', 'aside', 'nav', 'abbr', 'cite', 'q', 'time', 'address', 'bdi', 'bdo', 'ruby', 'rt', 'rp', 'wbr'],
    allowAttributes: { ...STANDARD_ATTRS, '*': [...STANDARD_GLOBAL_ATTRS, 'role', 'data-*'] },
    allowStyles: ['*'],
    allowClasses: [/.*/],
    allowProtocols: [...DEFAULT_PROTOCOLS, 'ftp', 'sms', 'cid'],
    allowDataUrls: { mimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'] },
    allowRelative: true,
    linkRel: 'noopener noreferrer',
  },
};

/** Returns a profile by name. The returned object is a fresh copy. */
export function getProfile(name: SanitizeProfileName): ResolvedSanitizeConfig {
  const base = PROFILES[name];
  return {
    profile: name,
    allowTags: [...base.allowTags],
    allowAttributes: Object.fromEntries(
      Object.entries(base.allowAttributes).map(([tag, attrs]) => [tag, [...attrs]]),
    ),
    allowStyles: [...base.allowStyles],
    allowClasses: [...base.allowClasses],
    allowProtocols: [...base.allowProtocols],
    allowDataUrls: base.allowDataUrls,
    allowRelative: base.allowRelative,
    linkRel: base.linkRel,
  };
}

/**
 * Turns the `sanitize` prop into a resolved configuration.
 *
 * A config object is merged onto `standard`; `false` is handled by the caller, which
 * also emits the development warning (03 §4.2).
 *
 * @example
 * ```ts
 * resolveSanitizeConfig('email');
 * resolveSanitizeConfig({ allowTags: ['p', 'b'] });   // merged onto `standard`
 * ```
 */
export function resolveSanitizeConfig(option: Exclude<SanitizeOption, false>): ResolvedSanitizeConfig {
  if (typeof option === 'string') return getProfile(option);
  return mergeSanitizeConfig(getProfile('standard'), option);
}

/** Merges a partial config onto a resolved one. */
export function mergeSanitizeConfig(
  base: ResolvedSanitizeConfig,
  override: SanitizeConfig,
): ResolvedSanitizeConfig {
  const merged: ResolvedSanitizeConfig = {
    ...base,
    profile: 'custom',
    allowTags: override.allowTags ?? base.allowTags,
    allowAttributes: override.allowAttributes
      ? mergeAttributeMaps(base.allowAttributes, override.allowAttributes)
      : base.allowAttributes,
    allowStyles: override.allowStyles ?? base.allowStyles,
    allowClasses: override.allowClasses ?? base.allowClasses,
    allowProtocols: override.allowProtocols ?? base.allowProtocols,
    allowDataUrls: override.allowDataUrls ?? base.allowDataUrls,
    allowRelative: override.allowRelative ?? base.allowRelative,
    linkRel: override.linkRel ?? base.linkRel,
  };
  if (override.transform) merged.transform = override.transform;
  if (override.onViolation) merged.onViolation = override.onViolation;
  return merged;
}

function mergeAttributeMaps(
  base: Record<string, string[]>,
  override: Record<string, string[]>,
): Record<string, string[]> {
  const result: Record<string, string[]> = { ...base };
  for (const [tag, attrs] of Object.entries(override)) {
    result[tag] = [...new Set([...(base[tag] ?? []), ...attrs])];
  }
  return result;
}
