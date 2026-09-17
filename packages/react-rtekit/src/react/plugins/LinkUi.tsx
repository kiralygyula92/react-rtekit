import { useCallback, useEffect, useRef, useState } from 'react';
import type { LinkClickContext, LinkOpenContext, RteHandlers } from '../../types/handlers.js';
import type { LinkAttrs } from '../../types/selection.js';
import { checkUrl, normalizeUrl } from '../../core/sanitize/url.js';
import { useEditorContext, useLocalization, useRteSlots } from '../context.js';
import { useFormatState } from '../hooks.js';
import { resolveMessage } from '../localization.js';
import { Popover } from '../ui/Popover.js';
import { runHandler } from '../useEditor.js';
import { toolbarControl } from './anchor.js';

/**
 * The link popover and link click behaviour.
 *
 * Rendered inside the editor root whenever links are enabled. It owns three things
 * the engine deliberately does not: when the popover is open, what a click on a link
 * does, and whether a URL is acceptable.
 *
 * @module
 */

/** Props for {@link LinkUi}. */
export interface LinkUiProps {
  /** Rejects or rewrites a URL; a message means "refuse". */
  validator?: (url: string) => string | null;
  /** Protocol added to a bare host. @default 'https' */
  defaultProtocol?: string;
  /** Interaction middleware. */
  handlers?: Partial<RteHandlers>;
}

/** What the popover is currently editing. */
interface LinkDraft {
  href: string;
  text: string;
  target: string | null;
  /** True when the caret was already inside a link. */
  editing: boolean;
}

export function LinkUi({ validator, defaultProtocol = 'https', handlers }: LinkUiProps) {
  const editor = useEditorContext();
  const t = useLocalization();
  const { slots } = useRteSlots();
  const format = useFormatState();
  const [draft, setDraft] = useState<LinkDraft | null>(null);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  // Handlers change identity on every render of the host; a ref keeps the click
  // listener from being torn down and rebuilt each time.
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);
  // The selection to put back when the popover closes: opening it moves focus out.
  const snapshot = useRef<ReturnType<typeof editor.saveSelection> | null>(null);

  /** Opens the popover for whatever the selection is on. */
  const open = useCallback(() => {
    snapshot.current = editor.saveSelection();
    const existing = editor.getLinkAtSelection();
    // Under the button that opened it, the way the colour picker and the dropdowns
    // behave. Clicking a link in the text sets its own anchor and keeps it.
    setAnchor(toolbarControl(editor, 'link'));
    setDraft({
      href: existing?.href ?? '',
      // The text field only appears for a caret; with a range selected, the selected
      // text is the link text.
      text: '',
      target: existing?.target ?? null,
      editing: existing !== null,
    });
  }, [editor]);

  const close = useCallback(
    (restore = true) => {
      setDraft(null);
      setAnchor(null);
      const saved = snapshot.current;
      snapshot.current = null;
      if (restore && saved) editor.restoreSelection(saved);
    },
    [editor],
  );

  // `openLinkEditor` is a command so the toolbar, the keymap and consumer code all
  // reach the same popover.
  useEffect(
    () =>
      editor.registerCommand('openLinkEditor', (_ctx, next) => {
        open();
        next();
        return true;
      }),
    [editor, open],
  );

  /** Opening a link is its own interaction, so a policy can confirm it. */
  const openHref = useCallback(
    (href: string) => {
      if (!href) return;
      runHandler<LinkOpenContext>(handlersRef.current?.onLinkOpen, { editor, href }, (ctx) => {
        window.open(ctx.href, '_blank', 'noopener,noreferrer');
      });
    },
    [editor],
  );

  // Clicking a link inside the editor opens the popover rather than navigating;
  // Ctrl/Cmd+click follows it, which is what every other editor does.
  useEffect(() => {
    const content = editor.engine.contentElement;

    const onClick = (event: MouseEvent): void => {
      const anchorElement = (event.target as HTMLElement | null)?.closest?.('a');
      if (!anchorElement) return;
      event.preventDefault();

      const href = anchorElement.getAttribute('href') ?? '';
      const attrs = Object.fromEntries(
        [...anchorElement.attributes].map((attribute) => [attribute.name, attribute.value]),
      );

      runHandler<LinkClickContext>(
        handlersRef.current?.onLinkClick,
        { editor, event, href, attrs },
        (ctx) => {
          // Ctrl/Cmd+click follows the link; a plain click edits it.
          if (ctx.event.metaKey || ctx.event.ctrlKey) {
            openHref(ctx.href);
            return;
          }
          setAnchor(anchorElement);
          open();
        },
      );
    };

    content.addEventListener('click', onClick);
    return () => {
      content.removeEventListener('click', onClick);
    };
  }, [editor, open, openHref]);

  /** Normalizes, then asks the consumer's validator. */
  const validate = useCallback(
    (url: string): string | null => {
      const normalized = normalizeUrl(url, defaultProtocol);
      // The sanitizer's own rules first: a validator can tighten them, never loosen
      // them, so a `javascript:` URL is refused whatever the consumer returns.
      const verdict = checkUrl(normalized, {
        allowProtocols: ['https', 'http', 'mailto', 'tel'],
        allowDataUrls: false,
        allowRelative: true,
      });
      if (normalized === '' || verdict.value === null) return resolveMessage(t.link.invalidUrl);
      return validator?.(normalized) ?? null;
    },
    [defaultProtocol, t.link.invalidUrl, validator],
  );

  const apply = useCallback(
    (attrs: LinkAttrs) => {
      const normalized = normalizeUrl(attrs.href, defaultProtocol);
      if (validate(normalized) !== null) return;
      const saved = snapshot.current;
      if (saved) editor.restoreSelection(saved);
      editor.insertLink({ ...attrs, href: normalized });
      close(false);
      editor.focus('restore');
    },
    [close, defaultProtocol, editor, validate],
  );

  const remove = useCallback(() => {
    const saved = snapshot.current;
    if (saved) editor.restoreSelection(saved);
    editor.removeLink();
    close(false);
    editor.focus('restore');
  }, [close, editor]);

  if (!draft) return null;

  const LinkPopover = slots.LinkPopover;
  return (
    <Popover
      open
      anchor={anchor ?? editor.engine.contentElement}
      onClose={() => {
        close();
      }}
      label={resolveMessage(t.link.title)}
    >
      <LinkPopover
        href={draft.href}
        text={draft.text}
        target={draft.target}
        editing={draft.editing || format.link !== null}
        validate={validate}
        onApply={apply}
        onRemove={remove}
        onOpen={() => {
          openHref(draft.href);
        }}
        onClose={() => {
          close();
        }}
      />
    </Popover>
  );
}
