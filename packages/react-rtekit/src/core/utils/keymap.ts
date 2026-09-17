/**
 * Keyboard shortcut parsing and matching.
 *
 * `Mod` is Cmd on macOS and Ctrl everywhere else, so one binding table covers both and
 * the help dialog and tooltips can render the right glyphs per platform.
 *
 * @module
 */

/** A parsed binding. */
export interface ParsedShortcut {
  /** The non-modifier key, lower-cased. */
  key: string;
  /** True for `Mod`, which is Cmd on Apple platforms and Ctrl elsewhere. */
  mod: boolean;
  /** True for an explicit `Ctrl`. */
  ctrl: boolean;
  /** True for an explicit `Meta`. */
  meta: boolean;
  /** True for `Alt`. */
  alt: boolean;
  /** True for `Shift`. */
  shift: boolean;
}

/** True when the current platform uses Cmd for `Mod`. */
export function isApplePlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  // `navigator.platform` is deprecated; the user-agent string is what is left, and it
  // only decides which modifier glyph to draw.
  return /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
}

/**
 * Parses a binding such as `'Mod+Shift+X'`.
 *
 * @example
 * ```ts
 * parseShortcut('Mod+B'); // { key: 'b', mod: true, … }
 * ```
 */
export function parseShortcut(shortcut: string): ParsedShortcut {
  const parts = shortcut.split('+').map((part) => part.trim());
  const parsed: ParsedShortcut = {
    key: '',
    mod: false,
    ctrl: false,
    meta: false,
    alt: false,
    shift: false,
  };
  for (const part of parts) {
    const lower = part.toLowerCase();
    if (lower === 'mod') parsed.mod = true;
    else if (lower === 'ctrl' || lower === 'control') parsed.ctrl = true;
    else if (lower === 'meta' || lower === 'cmd' || lower === 'command') parsed.meta = true;
    else if (lower === 'alt' || lower === 'option') parsed.alt = true;
    else if (lower === 'shift') parsed.shift = true;
    else parsed.key = lower;
  }
  return parsed;
}

/** True when a keyboard event matches a parsed binding. */
export function matchesShortcut(event: KeyboardEvent, shortcut: ParsedShortcut): boolean {
  const key = event.key.toLowerCase();
  // `event.code` covers the digits and punctuation that Shift rewrites: Shift+7 arrives
  // as '&' on a US layout, and the binding is written as the digit.
  const code = event.code.replace(/^(Key|Digit)/, '').toLowerCase();
  if (key !== shortcut.key && code !== shortcut.key) return false;

  const apple = isApplePlatform();
  const wantsCtrl = shortcut.ctrl || (shortcut.mod && !apple);
  const wantsMeta = shortcut.meta || (shortcut.mod && apple);

  return (
    event.ctrlKey === wantsCtrl &&
    event.metaKey === wantsMeta &&
    event.altKey === shortcut.alt &&
    event.shiftKey === shortcut.shift
  );
}

/** Renders a binding for display, with the platform's glyphs. */
export function formatShortcut(shortcut: string): string {
  const parsed = parseShortcut(shortcut);
  const apple = isApplePlatform();
  const parts: string[] = [];
  if (parsed.mod) parts.push(apple ? '⌘' : 'Ctrl');
  if (parsed.ctrl && !parsed.mod) parts.push(apple ? '⌃' : 'Ctrl');
  if (parsed.meta && !parsed.mod) parts.push(apple ? '⌘' : 'Win');
  if (parsed.alt) parts.push(apple ? '⌥' : 'Alt');
  if (parsed.shift) parts.push(apple ? '⇧' : 'Shift');
  parts.push(parsed.key.length === 1 ? parsed.key.toUpperCase() : parsed.key);
  return parts.join(apple ? '' : '+');
}

/** A binding plus what it runs. */
export interface KeymapEntry<Handler> {
  shortcut: ParsedShortcut;
  source: string;
  handler: Handler;
}

/**
 * Builds a lookup table from a binding map.
 *
 * Later entries win, so a consumer's `keymap` overrides a plugin's, which overrides the
 * built-ins.
 */
export function buildKeymap<Handler>(
  bindings: Record<string, Handler>,
  disabled: string[] = [],
): KeymapEntry<Handler>[] {
  const off = new Set(disabled.map((entry) => entry.toLowerCase()));
  return Object.entries(bindings)
    .filter(([shortcut]) => !off.has(shortcut.toLowerCase()))
    .map(([shortcut, handler]) => ({
      shortcut: parseShortcut(shortcut),
      source: shortcut,
      handler,
    }));
}

/** The first entry matching an event, or `undefined`. */
export function findKeymapMatch<Handler>(
  entries: KeymapEntry<Handler>[],
  event: KeyboardEvent,
): KeymapEntry<Handler> | undefined {
  return entries.find((entry) => matchesShortcut(event, entry.shortcut));
}

/**
 * The payload a binding carries in the shortcut itself.
 *
 * `Mod+Shift+E` means "align center" and `Mod+Alt+2` means "heading 2": the command id
 * alone does not say which, so the binding string is the only place the argument can
 * come from.
 *
 * @example
 * ```ts
 * payloadForShortcut('Mod+Shift+E'); // { align: 'center' }
 * payloadForShortcut('Mod+Alt+0');   // { type: 'paragraph' }
 * ```
 */
export function payloadForShortcut(shortcut: string): unknown {
  const align = /^Mod\+Shift\+([LERJ])$/i.exec(shortcut);
  if (align) {
    const map: Record<string, string> = { l: 'left', e: 'center', r: 'right', j: 'justify' };
    return { align: map[align[1]!.toLowerCase()] };
  }
  const heading = /^Mod\+Alt\+(\d)$/.exec(shortcut);
  if (heading) {
    const level = Number(heading[1]);
    return level === 0 ? { type: 'paragraph' } : { type: 'heading', level };
  }
  return undefined;
}
