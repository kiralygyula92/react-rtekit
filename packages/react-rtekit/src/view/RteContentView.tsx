import { useMemo } from 'react';
import type { RteContentViewProps } from '../types/props.js';
import { documentToHtml } from '../core/serialize/to-html.js';
import { htmlToDocument } from '../core/serialize/from-html.js';
import { markdownToDocument } from '../core/serialize/markdown.js';
import { textToDocument } from '../core/serialize/text.js';
import { isEditorDocument } from '../core/document.js';
import type { EditorDocument } from '../types/document.js';
import { themeToCssVars as flattenTheme } from '../themes/css-vars.js';

/**
 * The read-only renderer.
 *
 * The right way to render stored content outside an editor: it loads no engine, it
 * sanitizes before rendering, and it applies the same content styles, so a preview,
 * a list page and the editor itself cannot drift apart.
 *
 * @module
 */

/**
 * Renders stored content read-only.
 *
 * @example
 * ```tsx
 * <RteContentView
 *   value={storedHtml}
 *   sanitize="email"
 *   mergeTagPreview={{ first_name: 'Jane' }}
 * />
 * ```
 */
export function RteContentView({
  value,
  valueFormat = 'html',
  sanitize = 'standard',
  htmlProfile = 'standard',
  theme,
  colorScheme,
  className,
  style,
  mergeTagPreview,
  as: Component = 'div',
  unstyled = false,
  id,
}: RteContentViewProps) {
  const html = useMemo(() => {
    // Always the full pipeline, never a sanitize-only shortcut for HTML input: the
    // shortcut would leave legacy `ql-align-center` in place where the editor emits
    // `rte-align-center`. Both render the same, but "the view shows exactly what the
    // editor shows" is this component's entire reason to exist, so the two must not
    // produce different markup for the same input.
    const document: EditorDocument = isEditorDocument(value)
      ? value
      : valueFormat === 'markdown'
        ? markdownToDocument(value, { sanitize })
        : valueFormat === 'text'
          ? textToDocument(value)
          : htmlToDocument(value, { sanitize });

    return documentToHtml(document, {
      profile: htmlProfile,
      sanitizeWith: sanitize,
      ...(mergeTagPreview ? { mergeTagPreview } : {}),
    });
  }, [htmlProfile, mergeTagPreview, sanitize, value, valueFormat]);

  const themeVars = useMemo(() => (theme ? flattenTheme(theme) : undefined), [theme]);

  return (
    <Component
      {...(id ? { id } : {})}
      className={[unstyled ? undefined : 'rte-view', className].filter(Boolean).join(' ')}
      style={{ ...themeVars, ...style }}
      {...(colorScheme && colorScheme !== 'auto' ? { 'data-color-scheme': colorScheme } : {})}
      // Safe by construction: the string was produced by our own serializer from a
      // sanitized document, and is never the caller's raw input.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
