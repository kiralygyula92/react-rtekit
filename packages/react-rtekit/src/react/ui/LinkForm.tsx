import { useEffect, useRef, useState } from 'react';
import type { LinkPopoverSlotProps } from '../../types/slots.js';
import { useLocalization } from '../context.js';
import { resolveMessage } from '../localization.js';
import { Button, Checkbox, TextInput } from './primitives.js';

/**
 * The default link popover (05 §6).
 *
 * URL, optional text, "open in new tab", and Apply / Remove / Open. Focus moves into
 * the URL field when it opens and Escape closes it, because a popover you cannot
 * reach or leave from the keyboard is not a popover, it is a trap (05 §14).
 *
 * @module
 */

export function LinkForm({
  href,
  text,
  target,
  editing,
  validate,
  onApply,
  onRemove,
  onOpen,
  onClose,
  className,
}: LinkPopoverSlotProps & { className?: string }) {
  const t = useLocalization();
  const [url, setUrl] = useState(href);
  const [label, setLabel] = useState(text);
  const [newTab, setNewTab] = useState(target === '_blank');
  const [error, setError] = useState<string | null>(null);
  const urlRef = useRef<HTMLInputElement | null>(null);

  // The URL is what someone opened this for, so it is what gets the focus.
  useEffect(() => {
    urlRef.current?.focus();
    urlRef.current?.select();
  }, []);

  const submit = (): void => {
    const message = validate(url);
    if (message !== null) {
      setError(message);
      urlRef.current?.focus();
      return;
    }
    onApply({
      href: url,
      ...(label ? { text: label } : {}),
      ...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
    });
  };

  return (
    <form
      className={['rte-link-popover', className].filter(Boolean).join(' ')}
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <TextInput
        ref={urlRef}
        label={resolveMessage(t.link.url)}
        value={url}
        invalid={error !== null}
        onChange={(next: string) => {
          setUrl(next);
          setError(null);
        }}
      />

      {/* Only with a caret: with text selected, the selection is the link text. */}
      {!editing && text !== undefined && label !== undefined && !href ? (
        <TextInput label={resolveMessage(t.link.text)} value={label} onChange={setLabel} />
      ) : null}

      <Checkbox label={resolveMessage(t.link.newTab)} checked={newTab} onChange={setNewTab} />

      {error !== null ? (
        <p className="rte-link-popover__error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="rte-link-popover__actions">
        <Button variant="solid" onClick={submit}>
          {resolveMessage(t.link.apply)}
        </Button>
        {editing ? <Button onClick={onRemove}>{resolveMessage(t.link.remove)}</Button> : null}
        {href ? <Button onClick={onOpen}>{resolveMessage(t.link.open)}</Button> : null}
        {/* The popover closes on Escape and on an outside click of its own accord;
            this is the pointer affordance for the same thing. */}
        <Button onClick={onClose}>{resolveMessage(t.shortcuts.close)}</Button>
      </div>
    </form>
  );
}
