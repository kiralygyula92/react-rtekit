import { useCallback, useEffect, useRef, useState } from 'react';
import type { ImageAttrs } from '../../types/commands.js';
import type { RichTextEditorProps } from '../../types/props.js';
import { checkUrl, normalizeUrl } from '../../core/sanitize/url.js';
import { useEditorContext, useLocalization, useRteSlots } from '../context.js';
import { resolveMessage } from '../localization.js';
import { Popover } from '../ui/Popover.js';
import { Button, Checkbox, TextInput } from '../ui/primitives.js';
import { toolbarControl } from './anchor.js';

/**
 * Image chrome: the insert dialog, the selected-image popover and the resize frame
 *.
 *
 * The node itself is the engine's; everything an author touches is here. Resizing
 * works on the DOM element for feedback and commits one `updateImage` at the end, so
 * a drag is a single history entry rather than sixty.
 *
 * @module
 */

/** Props for {@link ImageUi}. */
export interface ImageUiProps {
  options?: RichTextEditorProps['imageOptions'];
  /** Whether a file picker should be offered. */
  canUpload: boolean;
  accept: string;
}

/** Smallest an image may be dragged to, so it never disappears. */
const MIN_WIDTH = 32;

export function ImageUi({ options, canUpload, accept }: ImageUiProps) {
  const editor = useEditorContext();
  const t = useLocalization();
  const { slots } = useRteSlots();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<HTMLImageElement | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);

  // `canUpload` says a handler exists to send the file to; it is no longer what decides
  // whether a file can be chosen, because one can now be embedded instead of sent.
  const canPickFile = canUpload || options?.allowLocalFiles !== false;

  // `openImageDialog` is the command every entry point goes through: the toolbar,
  // the slash menu and consumer code.
  useEffect(
    () =>
      editor.registerCommand('openImageDialog', (_ctx, next) => {
        setDialogOpen(true);
        next();
        return true;
      }),
    [editor],
  );

  // Clicking an image selects it, which is what shows the frame and the popover.
  useEffect(() => {
    const content = editor.engine.contentElement;
    const onClick = (event: MouseEvent): void => {
      const target = event.target as HTMLElement | null;
      const image = target?.tagName === 'IMG' ? (target as HTMLImageElement) : null;
      setSelected(image);
    };
    content.addEventListener('click', onClick);
    return () => {
      content.removeEventListener('click', onClick);
    };
  }, [editor]);

  const insert = useCallback(
    (attrs: ImageAttrs) => {
      editor.insertImage(attrs);
      setDialogOpen(false);
      editor.focus('restore');
    },
    [editor],
  );

  return (
    <>
      {/*
       * Always rendered. The picker used to appear only when the host had given an
       * `onUpload`, so an editor without a backend offered no way to use a picture from
       * the machine it was running on — a URL box and nothing else. Without a handler
       * the file is embedded in the document instead of being sent anywhere.
       */}
      {canPickFile ? (
        <input
          ref={fileInput}
          type="file"
          accept={accept}
          // Visually hidden, but still a control: without a name a screen reader
          // announces an unlabelled file input.
          aria-label={resolveMessage(t.image.upload)}
          multiple
          className="rte-visually-hidden"
          onChange={(event) => {
            const files = [...(event.target.files ?? [])];
            if (files.length > 0) void editor.uploadFiles(files);
            event.target.value = '';
            setDialogOpen(false);
          }}
        />
      ) : null}

      {dialogOpen ? (
        <Popover
          open
          anchor={toolbarControl(editor, 'image') ?? editor.engine.contentElement}
          onClose={() => {
            setDialogOpen(false);
          }}
          label={resolveMessage(t.image.title)}
        >
          <ImageDialogForm
            allowExternalUrl={options?.allowExternalUrl !== false}
            {...(canPickFile
              ? {
                  onChooseFile: () => {
                    fileInput.current?.click();
                  },
                }
              : {})}
            onInsert={insert}
            onClose={() => {
              setDialogOpen(false);
            }}
          />
        </Popover>
      ) : null}

      {selected ? (
        <ImageFrame
          image={selected}
          resizable={options?.resizable !== false}
          maxWidth={options?.maxWidth}
          onCommit={(attrs) => {
            editor.exec('updateImage', attrs);
          }}
          onRemove={() => {
            editor.exec('removeImage');
            setSelected(null);
          }}
          onClose={() => {
            setSelected(null);
          }}
          captions={options?.captions !== false}
          slots={slots}
        />
      ) : null}
    </>
  );
}

/** Props for {@link ImageDialogForm}. */
interface ImageDialogFormProps {
  allowExternalUrl: boolean;
  onChooseFile?: () => void;
  onInsert: (attrs: ImageAttrs) => void;
  onClose: () => void;
}

/** URL, alt text and a file button. */
function ImageDialogForm({ allowExternalUrl, onChooseFile, onInsert, onClose }: ImageDialogFormProps) {
  const t = useLocalization();
  const [url, setUrl] = useState('');
  const [alt, setAlt] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = (): void => {
    const normalized = normalizeUrl(url, 'https');
    const verdict = checkUrl(normalized, {
      allowProtocols: ['https', 'http'],
      allowDataUrls: false,
      allowRelative: true,
    });
    if (normalized === '' || verdict.value === null) {
      setError(resolveMessage(t.image.invalidUrl));
      return;
    }
    onInsert({ src: normalized, alt });
  };

  return (
    <form
      className="rte-image-dialog"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      {allowExternalUrl ? (
        <TextInput
          label={resolveMessage(t.image.url)}
          value={url}
          invalid={error !== null}
          onChange={(next: string) => {
            setUrl(next);
            setError(null);
          }}
        />
      ) : null}

      <TextInput label={resolveMessage(t.image.alt)} value={alt} onChange={setAlt} />

      {error !== null ? (
        <p className="rte-image-dialog__error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="rte-image-dialog__actions">
        {allowExternalUrl ? (
          <Button variant="solid" onClick={submit}>
            {resolveMessage(t.image.insert)}
          </Button>
        ) : null}
        {onChooseFile ? (
          <Button onClick={onChooseFile}>{resolveMessage(t.image.upload)}</Button>
        ) : null}
        <Button onClick={onClose}>{resolveMessage(t.shortcuts.close)}</Button>
      </div>
    </form>
  );
}

/** Props for {@link ImageFrame}. */
interface ImageFrameProps {
  image: HTMLImageElement;
  resizable: boolean;
  captions: boolean;
  maxWidth?: number;
  onCommit: (attrs: Partial<ImageAttrs>) => void;
  onRemove: () => void;
  onClose: () => void;
  slots: ReturnType<typeof useRteSlots>['slots'];
}

/** The resize handles and the controls for a selected image. */
function ImageFrame({
  image,
  resizable,
  captions,
  maxWidth,
  onCommit,
  onRemove,
  onClose,
  slots,
}: ImageFrameProps) {
  const t = useLocalization();
  const [alt, setAlt] = useState(image.getAttribute('alt') ?? '');
  const [caption, setCaption] = useState('');
  const [width, setWidth] = useState(image.width || null);

  /** A pointer drag on a handle, previewed live and committed once at the end. */
  const startResize = (event: React.PointerEvent, direction: 1 | -1): void => {
    if (!resizable) return;
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = image.getBoundingClientRect().width;
    const ratio = image.naturalHeight / (image.naturalWidth || 1);
    const ceiling = maxWidth ?? image.parentElement?.getBoundingClientRect().width ?? Infinity;

    const onMove = (move: PointerEvent): void => {
      const next = Math.round(
        Math.min(Math.max(startWidth + (move.clientX - startX) * direction, MIN_WIDTH), ceiling),
      );
      // Previewed on the element: committing per frame would fill the undo stack.
      image.style.width = `${next}px`;
      setWidth(next);
    };
    const onUp = (): void => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      const finalWidth = Math.round(image.getBoundingClientRect().width);
      image.style.width = '';
      onCommit({ width: finalWidth, height: Math.round(finalWidth * ratio) });
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const ImagePopover = slots.ImagePopover;
  return (
    <Popover open anchor={image} onClose={onClose} label={resolveMessage(t.image.title)}>
      <ImagePopover>
        <div className="rte-image-popover">
          <TextInput
            label={resolveMessage(t.image.alt)}
            value={alt}
            onChange={(next: string) => {
              setAlt(next);
              onCommit({ alt: next });
            }}
          />

          {captions ? (
            <TextInput
              label={resolveMessage(t.image.caption)}
              value={caption}
              onChange={(next: string) => {
                setCaption(next);
                onCommit({ caption: next });
              }}
            />
          ) : null}

          {resizable ? (
            <div className="rte-image-popover__resize">
              <span className="rte-field-label">{resolveMessage(t.image.width)}</span>
              <button
                type="button"
                className="rte-image-handle"
                aria-label={resolveMessage(t.image.resize)}
                onPointerDown={(event) => {
                  startResize(event, 1);
                }}
              >
                {width ? `${width}px` : '—'}
              </button>
            </div>
          ) : null}

          <div className="rte-image-popover__actions">
            <Checkbox
              label={resolveMessage(t.image.decorative)}
              checked={alt === ''}
              onChange={(checked: boolean) => {
                const next = checked ? '' : alt;
                setAlt(next);
                onCommit({ alt: next });
              }}
            />
            <Button onClick={onRemove}>{resolveMessage(t.image.remove)}</Button>
            <Button onClick={onClose}>{resolveMessage(t.shortcuts.close)}</Button>
          </div>
        </div>
      </ImagePopover>
    </Popover>
  );
}
