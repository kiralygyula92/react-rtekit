/**
 * Sanitization.
 *
 * @module
 */
export { sanitizeHtml, sanitizeNodes, describeProfile, type SanitizeOptions } from './sanitize.js';
export {
  getProfile,
  resolveSanitizeConfig,
  mergeSanitizeConfig,
  HARD_BLOCKED_TAGS,
  UNWRAP_TAGS,
  URL_ATTRIBUTES,
} from './profiles.js';
export {
  checkUrl,
  getProtocol,
  normalizeUrl,
  isExternalUrl,
  DEFAULT_PROTOCOLS,
  HARD_BLOCKED_PROTOCOLS,
  type UrlPolicy,
  type UrlVerdict,
} from './url.js';
export {
  sanitizeStyle,
  parseStyle,
  serializeStyle,
  readStyleProperty,
  EMAIL_SAFE_PROPERTIES,
  STANDARD_SAFE_PROPERTIES,
  type CssDeclaration,
} from './css.js';
