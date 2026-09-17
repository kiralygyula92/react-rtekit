import type { ReactNode } from 'react';
import type { RteIcons } from '../types/icons.js';

/**
 * The default icon set (06 §9).
 *
 * In-house inline SVGs so no icon package ever reaches a consumer's bundle. Every glyph
 * is drawn on Material's 24×24 grid with `currentColor`, which is what lets the
 * `classic` preset match the MUI icons the old editor used at the same size and colour
 * (07 §4).
 *
 * @module
 */

/** Wraps a path in the shared 24×24 frame. */
function icon(path: ReactNode, viewBox = '0 0 24 24'): ReactNode {
  return (
    <svg viewBox={viewBox} fill="currentColor" aria-hidden="true" focusable="false">
      {path}
    </svg>
  );
}

/** Same frame, but stroked rather than filled. */
function strokeIcon(path: ReactNode): ReactNode {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {path}
    </svg>
  );
}

/**
 * Every built-in icon, keyed by toolbar item name plus the shared UI glyphs.
 *
 * Override any of them with the `icons` prop.
 */
export const defaultIcons: RteIcons = {
  // ── marks ────────────────────────────────────────────────────────────────
  bold: /* @__PURE__ */ icon(
    <path d="M15.6 10.79A4.5 4.5 0 0 0 13 3H7v14h6.8a4.5 4.5 0 0 0 1.8-6.21ZM10 5.5h2.5a2 2 0 0 1 0 4H10Zm3 9H10v-4h3a2 2 0 0 1 0 4Z" />,
  ),
  italic: /* @__PURE__ */ icon(<path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z" />),
  underline: /* @__PURE__ */ icon(
    <path d="M12 17a5 5 0 0 0 5-5V4h-2.5v8a2.5 2.5 0 0 1-5 0V4H7v8a5 5 0 0 0 5 5Zm-7 2v2h14v-2Z" />,
  ),
  strike: /* @__PURE__ */ icon(
    <path d="M10 19h4v-3h-4zM5 4v3h5v3h4V7h5V4zM3 14h18v-2H3z" />,
  ),
  code: /* @__PURE__ */ icon(
    <path d="M9.4 16.6 4.8 12l4.6-4.6L8 6l-6 6 6 6zm5.2 0 4.6-4.6-4.6-4.6L16 6l6 6-6 6z" />,
  ),
  subscript: /* @__PURE__ */ icon(
    <path d="M20 18h-2v1h3v1h-4v-2a1 1 0 0 1 1-1h2v-1h-3v-1h3a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1ZM5.9 16h2.4l2.3-3.7L12.9 16h2.4l-3.4-5.2L15.1 6h-2.4l-2.1 3.4L8.4 6H6l3.3 4.8Z" />,
  ),
  superscript: /* @__PURE__ */ icon(
    <path d="M20 8h-2V9h3v1h-4V8a1 1 0 0 1 1-1h2V6h-3V5h3a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1ZM5.9 18h2.4l2.3-3.7 2.3 3.7h2.4l-3.4-5.2L15.1 8h-2.4l-2.1 3.4L8.4 8H6l3.3 4.8Z" />,
  ),

  // ── colour ───────────────────────────────────────────────────────────────
  color: /* @__PURE__ */ icon(
    <>
      <path d="M2 20h20v4H2z" opacity=".9" />
      <path d="m9.6 14 1.2-3.2h5.4l1.2 3.2H20L14.8 1h-2.6L7 14Zm2-5.2L13.5 3l1.9 5.8Z" />
    </>,
  ),
  backgroundColor: /* @__PURE__ */ icon(
    <>
      <path d="M2 20h20v4H2z" opacity=".9" />
      <path d="m16.6 6.3-9-4.4L6.3 4.3l2.3 1.1-3.3 6.8a1.5 1.5 0 0 0 .7 2l4.6 2.3a1.5 1.5 0 0 0 2-.7l3.3-6.8 2.3 1.1Zm-8.2 8L11.7 7.5l-4.2-2-3.3 6.8Z" />
    </>,
  ),
  clearFormatting: /* @__PURE__ */ icon(
    <path d="M3.3 3 2 4.3 8.8 11 6.5 16H9l1.5-3.2 5.2 5.2H8v2h9l2.7 2.7 1.3-1.3ZM6 5v.1l2 2V7h2.1l1.8 1.8L12.5 7H17l1.5-2Z" />,
  ),
  fontFamily: /* @__PURE__ */ icon(
    <path d="M9.6 14h4.8l1 3H18L13.4 4h-2.8L6 17h2.6Zm2.4-7.4L13.7 12h-3.4Z" />,
  ),
  fontSize: /* @__PURE__ */ icon(
    <path d="M2.5 18h2.6l1-2.8h4.6l1 2.8h2.6L9.7 6H7.2Zm4.3-4.9L8.4 8.5l1.6 4.6ZM15 18h2.2l.8-2.2h3.4l.8 2.2H24l-3.6-9h-1.9Zm3.5-3.8 1-2.8 1 2.8Z" />,
  ),

  // ── blocks ───────────────────────────────────────────────────────────────
  heading: /* @__PURE__ */ icon(<path d="M5 4v16h3v-6.5h8V20h3V4h-3v6.5H8V4Z" />),
  blockType: /* @__PURE__ */ icon(<path d="M5 4v16h3v-6.5h8V20h3V4h-3v6.5H8V4Z" />),
  blockquote: /* @__PURE__ */ icon(
    <path d="M6 17h3l2-4V6H5v7h3Zm8 0h3l2-4V6h-6v7h3Z" />,
  ),
  codeBlock: /* @__PURE__ */ icon(
    <path d="M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm1 2v14h14V5Zm4.4 10.6L6 12l3.4-3.6 1.2 1.2L9 12l1.6 2.4Zm5.2 0-1.2-1.2L15 12l-1.6-2.4 1.2-1.2L18 12Z" />,
  ),
  horizontalRule: /* @__PURE__ */ icon(<path d="M4 11h16v2H4z" />),

  // ── alignment and indent ─────────────────────────────────────────────────
  alignLeft: /* @__PURE__ */ icon(<path d="M3 5h18v2H3zm0 4h12v2H3zm0 4h18v2H3zm0 4h12v2H3z" />),
  alignCenter: /* @__PURE__ */ icon(<path d="M3 5h18v2H3zm3 4h12v2H6zm-3 4h18v2H3zm3 4h12v2H6z" />),
  alignRight: /* @__PURE__ */ icon(<path d="M3 5h18v2H3zm6 4h12v2H9zm-6 4h18v2H3zm6 4h12v2H9z" />),
  alignJustify: /* @__PURE__ */ icon(<path d="M3 5h18v2H3zm0 4h18v2H3zm0 4h18v2H3zm0 4h18v2H3z" />),
  align: /* @__PURE__ */ icon(<path d="M3 5h18v2H3zm3 4h12v2H6zm-3 4h18v2H3zm3 4h12v2H6z" />),
  indent: /* @__PURE__ */ icon(<path d="M3 5h18v2H3zm8 4h10v2H11zm0 4h10v2H11zm-8 4h18v2H3zM3 9v6l4-3z" />),
  outdent: /* @__PURE__ */ icon(<path d="M3 5h18v2H3zm8 4h10v2H11zm0 4h10v2H11zm-8 4h18v2H3zM7 9v6l-4-3z" />),

  // ── lists ────────────────────────────────────────────────────────────────
  bulletList: /* @__PURE__ */ icon(
    <path d="M4 10.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm0-6a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm0 12a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3ZM8 5h13v2H8Zm0 6h13v2H8Zm0 6h13v2H8Z" />,
  ),
  orderedList: /* @__PURE__ */ icon(
    <path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2Zm1-9h1V4H2v1h1Zm-1 3h1.8L2 13.1V14h3v-1H3.2L5 10.9V10H2ZM8 5h13v2H8Zm0 6h13v2H8Zm0 6h13v2H8Z" />,
  ),
  checkList: /* @__PURE__ */ icon(
    <path d="M21 5h-9v2h9Zm0 6h-9v2h9Zm0 6h-9v2h9ZM6.5 9.5 3 6l1.4-1.4 2.1 2.1L9.6 3.6 11 5Zm0 8L3 14l1.4-1.4 2.1 2.1 3.1-3.1L11 13Z" />,
  ),

  // ── insert ───────────────────────────────────────────────────────────────
  link: /* @__PURE__ */ icon(
    <path d="M3.9 12a3.1 3.1 0 0 1 3.1-3.1h4V7H7a5 5 0 0 0 0 10h4v-1.9H7A3.1 3.1 0 0 1 3.9 12ZM8 13h8v-2H8Zm9-6h-4v1.9h4a3.1 3.1 0 0 1 0 6.2h-4V17h4a5 5 0 0 0 0-10Z" />,
  ),
  unlink: /* @__PURE__ */ icon(
    <path d="m17 7h-4v1.9h4a3.1 3.1 0 0 1 2.2 5.3l1.3 1.3A5 5 0 0 0 17 7ZM2 4.3 3.3 3 21 20.7 19.7 22l-3.5-3.5V17h-1.5l-2-2H16v-2h-3.5l-2-2H16v-.5l-1.8-1.8V8.9H11L8.9 6.8H11V7h.3ZM7 8.9h1.6l2 2H7A3.1 3.1 0 0 0 7 17h4v-1.9H7.4l-.4.1A5 5 0 0 1 7 7v1.9Z" />,
  ),
  image: /* @__PURE__ */ icon(
    <path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2ZM8.5 13.5l2.5 3 3.5-4.5 4.5 6H5Z" />,
  ),
  table: /* @__PURE__ */ icon(
    <path d="M20 3H4a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1Zm-9 16H5v-4h6Zm0-6H5V9h6Zm8 6h-6v-4h6Zm0-6h-6V9h6Zm0-6H5V5h14Z" />,
  ),
  emoji: /* @__PURE__ */ icon(
    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm3.5-9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm-7 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM12 17.5c2.3 0 4.3-1.4 5.1-3.5H6.9c.8 2.1 2.8 3.5 5.1 3.5Z" />,
  ),
  mergeTag: /* @__PURE__ */ icon(
    <path d="M7 3H6a3 3 0 0 0-3 3v3a2 2 0 0 1-2 2v2a2 2 0 0 1 2 2v3a3 3 0 0 0 3 3h1v-2h-.6A1.4 1.4 0 0 1 5 17.6V15a3 3 0 0 0-1.4-2.5v-1A3 3 0 0 0 5 9V6.4A1.4 1.4 0 0 1 6.4 5H7Zm10 0h1a3 3 0 0 1 3 3v3a2 2 0 0 0 2 2v2a2 2 0 0 0-2 2v3a3 3 0 0 1-3 3h-1v-2h.6a1.4 1.4 0 0 0 1.4-1.4V15a3 3 0 0 1 1.4-2.5v-1A3 3 0 0 1 19 9V6.4A1.4 1.4 0 0 0 17.6 5H17Z" />,
  ),
  mention: /* @__PURE__ */ icon(
    <path d="M12 2a10 10 0 0 0 0 20h5v-2h-5a8 8 0 1 1 8-8v1.2a1.4 1.4 0 0 1-2.8 0V12a5.2 5.2 0 1 0-1.6 3.8A3.4 3.4 0 0 0 22 13.2V12A10 10 0 0 0 12 2Zm0 15.2A5.2 5.2 0 1 1 12 6.8a5.2 5.2 0 0 1 0 10.4Zm0-2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" />,
  ),

  // ── history and tools ────────────────────────────────────────────────────
  undo: /* @__PURE__ */ icon(
    <path d="M12.5 8c-2.6 0-5 1-6.8 2.6L2 7v9h9l-3.6-3.6A7.5 7.5 0 0 1 19.6 15l2.4-.8A10 10 0 0 0 12.5 8Z" />,
  ),
  redo: /* @__PURE__ */ icon(
    <path d="M18.4 10.6A9.9 9.9 0 0 0 11.5 8a10 10 0 0 0-9.5 6.2l2.4.8a7.5 7.5 0 0 1 12.2-2.6L13 16h9V7Z" />,
  ),
  findReplace: /* @__PURE__ */ icon(
    <path d="M11 6c1.4 0 2.7.6 3.6 1.5L12 10h6V4l-2 2A7 7 0 0 0 4.1 9.9l1.9.5A5 5 0 0 1 11 6Zm5.3 9.9-.3-.4h-.8l-2.5-2.5a5.5 5.5 0 1 0-1 1L14.2 16v.8l.4.3 3.4 3.5 1.2-1.2Zm-6.8-.4a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z" />,
  ),
  sourceView: /* @__PURE__ */ icon(
    <path d="M9.4 16.6 4.8 12l4.6-4.6L8 6l-6 6 6 6zm5.2 0 4.6-4.6-4.6-4.6L16 6l6 6-6 6z" />,
  ),
  fullscreen: /* @__PURE__ */ icon(<path d="M7 14H5v5h5v-2H7Zm-2-4h2V7h3V5H5Zm12 7h-3v2h5v-5h-2ZM14 5v2h3v3h2V5Z" />),
  print: /* @__PURE__ */ icon(
    <path d="M19 8H5a3 3 0 0 0-3 3v6h4v4h12v-4h4v-6a3 3 0 0 0-3-3Zm-3 11H8v-5h8Zm3-7a1 1 0 1 1 0-2 1 1 0 0 1 0 2ZM18 3H6v4h12Z" />,
  ),
  wordCount: /* @__PURE__ */ icon(
    <path d="M4 5h16v2H4zm0 4h10v2H4zm0 4h16v2H4zm0 4h10v2H4z" />,
  ),

  // ── shared UI glyphs ─────────────────────────────────────────────────────
  chevronDown: /* @__PURE__ */ icon(<path d="m7 10 5 5 5-5z" />),
  chevronRight: /* @__PURE__ */ icon(<path d="m10 17 5-5-5-5z" />),
  close: /* @__PURE__ */ icon(<path d="M19 6.4 17.6 5 12 10.6 6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12Z" />),
  check: /* @__PURE__ */ icon(<path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4Z" />),
  search: /* @__PURE__ */ icon(
    <path d="M15.5 14h-.8l-.3-.3a6.5 6.5 0 1 0-.7.7l.3.3v.8l5 5 1.5-1.5Zm-6 0a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9Z" />,
  ),
  spinner: /* @__PURE__ */ strokeIcon(<circle cx="12" cy="12" r="9" strokeDasharray="44" strokeDashoffset="14" />),
  dragHandle: /* @__PURE__ */ icon(
    <path d="M9 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm6 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM9 10.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm6 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM9 17a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm6 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" />,
  ),
  external: /* @__PURE__ */ icon(
    <path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2ZM14 3v2h3.6l-9.8 9.8 1.4 1.4L19 6.4V10h2V3Z" />,
  ),
  more: /* @__PURE__ */ icon(
    <path d="M6 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm6 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm6 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z" />,
  ),
  alert: /* @__PURE__ */ icon(
    <path d="M12 2 1 21h22Zm0 5 7.5 12.9h-15ZM11 10v5h2v-5Zm0 6.5V18h2v-1.5Z" />,
  ),
};

/** Merges consumer overrides onto the defaults. */
export function resolveIcons(overrides: RteIcons | undefined): RteIcons {
  return overrides ? { ...defaultIcons, ...overrides } : defaultIcons;
}
