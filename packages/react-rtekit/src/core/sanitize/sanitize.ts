import type {
  ResolvedSanitizeConfig,
  SanitizeContext,
  SanitizeOption,
  SanitizeViolation,
} from '../../types/sanitize.js';
import {
  parseHtml,
  serializeHtmlNodes,
  type HtmlElement,
  type HtmlNode,
  type HtmlParserChoice,
} from '../html/index.js';
import { sanitizeStyle } from './css.js';
import { HARD_BLOCKED_TAGS, URL_ATTRIBUTES, UNWRAP_TAGS, getProfile, resolveSanitizeConfig } from './profiles.js';
import { checkUrl, isExternalUrl } from './url.js';

/**
 * The sanitizer (ADR-003).
 *
 * Runs at every content boundary in both directions. The hard rules below cannot be
 * turned off by configuration, and `sanitize: false` is handled by the caller so that
 * the opt-out is visible at the call site rather than buried in here.
 *
 * @module
 */

/** How deep sanitization descends before it stops keeping children. */
const MAX_DEPTH = 100;

/** Options for {@link sanitizeHtml} and {@link sanitizeNodes}. */
export interface SanitizeOptions {
  /** Profile name, config object, or `false` to skip sanitization entirely. */
  sanitize?: SanitizeOption;
  /** Called once per removal. Merged with the profile's own `onViolation`. */
  onViolation?: (violation: SanitizeViolation) => void;
  /** Which HTML parser frontend to use. @default 'auto' */
  parser?: HtmlParserChoice;
}

/** True for every `on…` attribute, including the SVG-only ones. */
function isEventHandler(name: string): boolean {
  return name.startsWith('on');
}

function classAllowed(name: string, patterns: readonly (string | RegExp)[]): boolean {
  for (const pattern of patterns) {
    if (typeof pattern === 'string') {
      if (pattern === name) return true;
    } else if (pattern.test(name)) {
      return true;
    }
  }
  return false;
}

function attributeAllowed(
  tag: string,
  name: string,
  allow: Record<string, string[]>,
): boolean {
  const global = allow['*'] ?? [];
  const perTag = allow[tag] ?? [];
  for (const candidate of [...global, ...perTag]) {
    if (candidate === name) return true;
    if (candidate.endsWith('*') && name.startsWith(candidate.slice(0, -1))) return true;
  }
  return false;
}

interface SanitizeRun {
  config: ResolvedSanitizeConfig;
  report: (violation: SanitizeViolation) => void;
}

function sanitizeAttributes(el: HtmlElement, run: SanitizeRun): Record<string, string> {
  const { config, report } = run;
  const result: Record<string, string> = {};

  for (const [rawName, rawValue] of Object.entries(el.attrs)) {
    const name = rawName.toLowerCase();

    // Hard rule: no event handlers, ever.
    if (isEventHandler(name)) {
      report({ tag: el.tag, attribute: name, reason: 'event-handler' });
      continue;
    }
    // Hard rule: `srcdoc` carries a whole document, and namespaced xlink href is the
    // SVG smuggling route.
    if (name === 'srcdoc' || name === 'xlink:href' || name === 'xmlns' || name.startsWith('xmlns:')) {
      report({ tag: el.tag, attribute: name, reason: 'attribute-not-allowed' });
      continue;
    }

    if (!attributeAllowed(el.tag, name, config.allowAttributes)) {
      report({ tag: el.tag, attribute: name, reason: 'attribute-not-allowed' });
      continue;
    }

    if (URL_ATTRIBUTES.has(name)) {
      const verdict = checkUrl(rawValue, {
        allowProtocols: config.allowProtocols,
        allowDataUrls: config.allowDataUrls,
        allowRelative: config.allowRelative,
      });
      if (verdict.value === null) {
        report({ tag: el.tag, attribute: name, reason: verdict.reason ?? 'protocol-not-allowed' });
        continue;
      }
      result[name] = verdict.value;
      continue;
    }

    if (name === 'style') {
      const filtered = sanitizeStyle(rawValue, config.allowStyles, (property, reason) => {
        report({ tag: el.tag, attribute: `style:${property}`, reason });
      });
      if (filtered !== '') result[name] = filtered;
      continue;
    }

    if (name === 'class') {
      const kept = rawValue
        .split(/\s+/)
        .filter((cls) => cls !== '')
        .filter((cls) => {
          const ok = classAllowed(cls, config.allowClasses);
          if (!ok) report({ tag: el.tag, attribute: `class:${cls}`, reason: 'class-not-allowed' });
          return ok;
        });
      if (kept.length > 0) result[name] = kept.join(' ');
      continue;
    }

    result[name] = rawValue;
  }

  // A link that leaves the page always carries the safety tokens, which closes reverse
  // tabnabbing. Whatever `rel` the author wrote (`nofollow`, `sponsored`, …) is kept.
  const leavesPage =
    el.tag === 'a' &&
    (result.target === '_blank' ||
      (result.target !== undefined && result.href !== undefined && isExternalUrl(result.href)));
  if (leavesPage) {
    const tokens = new Set((result.rel ?? '').split(/\s+/).filter(Boolean));
    for (const token of config.linkRel.split(/\s+/).filter(Boolean)) tokens.add(token);
    result.rel = [...tokens].join(' ');
  }

  return result;
}

function sanitizeNodeList(nodes: HtmlNode[], run: SanitizeRun, depth: number): HtmlNode[] {
  const out: HtmlNode[] = [];

  for (const node of nodes) {
    if (node.type === 'text') {
      if (node.text !== '') out.push({ type: 'text', text: node.text });
      continue;
    }
    // Comments never survive: conditional comments are executable in old Outlook and
    // are a smuggling route everywhere else.
    if (node.type === 'comment') continue;

    const tag = node.tag;

    if (HARD_BLOCKED_TAGS.has(tag)) {
      run.report({ tag, reason: 'tag-hard-blocked' });
      continue;
    }

    if (depth >= MAX_DEPTH) {
      run.report({ tag, reason: 'tag-not-allowed' });
      continue;
    }

    const allowed = run.config.allowTags.includes(tag);
    const shouldUnwrap = !allowed && (UNWRAP_TAGS.has(tag) || tag.includes(':'));

    if (!allowed && !shouldUnwrap) {
      run.report({ tag, reason: 'tag-not-allowed' });
      // Keep the text, drop the markup: this is what makes a disabled feature degrade
      // rather than delete the author's words.
      out.push(...sanitizeNodeList(node.children, run, depth + 1));
      continue;
    }

    if (shouldUnwrap) {
      out.push(...sanitizeNodeList(node.children, run, depth + 1));
      continue;
    }

    let element: HtmlElement = {
      type: 'element',
      tag,
      attrs: sanitizeAttributes(node, run),
      children: [],
    };

    if (run.config.transform) {
      const ctx: SanitizeContext = {
        profile: run.config.profile,
        depth,
        report: run.report,
      };
      const transformed = run.config.transform(element, ctx);
      if (transformed === null) continue;
      if (transformed === 'unwrap') {
        out.push(...sanitizeNodeList(node.children, run, depth + 1));
        continue;
      }
      element = transformed;
      // A transform may introduce markup of its own, so its attributes are re-checked.
      element.attrs = sanitizeAttributes(element, run);
    }

    element.children = sanitizeNodeList(node.children, run, depth + 1);
    out.push(element);
  }

  return out;
}

/** Builds the run context shared by {@link sanitizeNodes} and {@link sanitizeHtml}. */
function createRun(options: SanitizeOptions): SanitizeRun | null {
  const option = options.sanitize ?? 'standard';
  if (option === false) return null;

  const config = resolveSanitizeConfig(option);
  const report = (violation: SanitizeViolation): void => {
    config.onViolation?.(violation);
    options.onViolation?.(violation);
  };
  return { config, report };
}

/**
 * Sanitizes an already-parsed tree.
 *
 * Used by the interop parsers, which have a tree in hand and would otherwise have to
 * serialize and re-parse.
 */
export function sanitizeNodes(nodes: HtmlNode[], options: SanitizeOptions = {}): HtmlNode[] {
  const run = createRun(options);
  if (!run) return nodes;
  return sanitizeNodeList(nodes, run, 0);
}

/**
 * Sanitizes an HTML string against a profile or configuration.
 *
 * Runs at every content boundary in both directions. The hard rules in
 * The hard rules apply regardless of configuration.
 *
 * @param html untrusted HTML
 * @param options profile or config, plus an optional violation reporter
 * @returns HTML containing only allowlisted tags, attributes, protocols and CSS
 *
 * @example
 * ```ts
 * sanitizeHtml('<img src=x onerror=alert(1)>');
 * // '<img src="x">'
 *
 * sanitizeHtml('<p class="ql-align-center">hi</p>', { sanitize: 'email' });
 * // '<p>hi</p>'  — the email profile keeps no classes
 * ```
 */
export function sanitizeHtml(html: string, options: SanitizeOptions = {}): string {
  if (html === '') return '';
  if ((options.sanitize ?? 'standard') === false) return html;
  const nodes = parseHtml(html, options.parser ?? 'auto');
  return serializeHtmlNodes(sanitizeNodes(nodes, options));
}

/**
 * The profile a name resolves to, for tests and for the docs site's profile table.
 *
 * @example
 * ```ts
 * describeProfile('strict').allowTags; // ['p','br','strong', …]
 * ```
 */
export function describeProfile(name: Parameters<typeof getProfile>[0]): ResolvedSanitizeConfig {
  return getProfile(name);
}
