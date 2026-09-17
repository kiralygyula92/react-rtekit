import {
  $applyNodeReplacement,
  DecoratorNode,
  type DOMConversionMap,
  type DOMExportOutput,
  type EditorConfig,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from 'lexical';
import type { Align } from '../../../types/document.js';
import type { ImageAttrs } from '../../../types/commands.js';

/**
 * The image node.
 *
 * A `DecoratorNode` that builds its own `<img>` — and, when there is a caption, a
 * `<figure>` around it — rather than decorating through React, so the engine adapter
 * stays independent of the renderer. Resize handles and the alt-text dialog
 * are chrome, and live in the React layer above.
 *
 * The `src` a node holds has already been through the sanitizer's URL rules: the node
 * is constructed from an `ImageAttrs`, and every path that builds one — command,
 * upload, paste, HTML import — sanitizes first.
 *
 * @module
 */

/** How an image is stored in Lexical's own JSON. */
export type SerializedImageNode = Spread<
  {
    src: string;
    alt: string;
    title: string | null;
    width: number | null;
    height: number | null;
    align: Align | null;
    caption: string | null;
  },
  SerializedLexicalNode
>;

/** Lexical node type id. Part of the serialized format, so it is stable. */
export const IMAGE_NODE_TYPE = 'rte-image';

export class ImageNode extends DecoratorNode<null> {
  __src: string;
  __alt: string;
  __title: string | null;
  __width: number | null;
  __height: number | null;
  __align: Align | null;
  __caption: string | null;

  static override getType(): string {
    return IMAGE_NODE_TYPE;
  }

  static override clone(node: ImageNode): ImageNode {
    return new ImageNode(
      {
        src: node.__src,
        alt: node.__alt,
        ...(node.__title !== null ? { title: node.__title } : {}),
        ...(node.__width !== null ? { width: node.__width } : {}),
        ...(node.__height !== null ? { height: node.__height } : {}),
        ...(node.__align !== null ? { align: node.__align } : {}),
        ...(node.__caption !== null ? { caption: node.__caption } : {}),
      },
      node.__key,
    );
  }

  static override importJSON(serialized: SerializedImageNode): ImageNode {
    return $createImageNode({
      src: serialized.src,
      alt: serialized.alt,
      ...(serialized.title !== null ? { title: serialized.title } : {}),
      ...(serialized.width !== null ? { width: serialized.width } : {}),
      ...(serialized.height !== null ? { height: serialized.height } : {}),
      ...(serialized.align !== null ? { align: serialized.align } : {}),
      ...(serialized.caption !== null ? { caption: serialized.caption } : {}),
    });
  }

  static override importDOM(): DOMConversionMap | null {
    return {
      img: () => ({
        conversion: (element: HTMLElement) => {
          const image = element as HTMLImageElement;
          const src = image.getAttribute('src');
          // A `<img>` with no source is not an image; dropping it loses nothing.
          if (!src) return null;
          const width = Number.parseInt(image.getAttribute('width') ?? '', 10);
          const height = Number.parseInt(image.getAttribute('height') ?? '', 10);
          return {
            node: $createImageNode({
              src,
              alt: image.getAttribute('alt') ?? '',
              ...(image.getAttribute('title') ? { title: image.getAttribute('title')! } : {}),
              ...(Number.isFinite(width) ? { width } : {}),
              ...(Number.isFinite(height) ? { height } : {}),
            }),
          };
        },
        priority: 0,
      }),
    };
  }

  constructor(attrs: ImageAttrs, key?: NodeKey) {
    super(key);
    this.__src = attrs.src;
    this.__alt = attrs.alt ?? '';
    this.__title = attrs.title ?? null;
    this.__width = attrs.width ?? null;
    this.__height = attrs.height ?? null;
    this.__align = attrs.align ?? null;
    this.__caption = attrs.caption ?? null;
  }

  override exportJSON(): SerializedImageNode {
    return {
      type: IMAGE_NODE_TYPE,
      version: 1,
      src: this.__src,
      alt: this.__alt,
      title: this.__title,
      width: this.__width,
      height: this.__height,
      align: this.__align,
      caption: this.__caption,
    };
  }

  override exportDOM(): DOMExportOutput {
    return { element: this.buildDom() };
  }

  override createDOM(config: EditorConfig): HTMLElement {
    const element = this.buildDom();
    const theme = config.theme as { image?: string };
    if (theme.image) element.classList.add(theme.image);
    return element;
  }

  override updateDOM(): false {
    // Every attribute change replaces the node, so the DOM is rebuilt rather than
    // patched — an image has few enough attributes for that to be the simpler rule.
    return false;
  }

  override isInline(): false {
    return false;
  }

  override decorate(): null {
    return null;
  }

  /** The attributes, in the shape the public API uses. */
  getAttrs(): ImageAttrs {
    return {
      src: this.__src,
      alt: this.__alt,
      ...(this.__title !== null ? { title: this.__title } : {}),
      ...(this.__width !== null ? { width: this.__width } : {}),
      ...(this.__height !== null ? { height: this.__height } : {}),
      ...(this.__align !== null ? { align: this.__align } : {}),
      ...(this.__caption !== null ? { caption: this.__caption } : {}),
    };
  }

  /** Returns a copy with `attrs` merged in. */
  setAttrs(attrs: Partial<ImageAttrs>): this {
    const writable = this.getWritable();
    if (attrs.src !== undefined) writable.__src = attrs.src;
    if (attrs.alt !== undefined) writable.__alt = attrs.alt;
    if (attrs.title !== undefined) writable.__title = attrs.title;
    if (attrs.width !== undefined) writable.__width = attrs.width;
    if (attrs.height !== undefined) writable.__height = attrs.height;
    if (attrs.align !== undefined) writable.__align = attrs.align;
    if (attrs.caption !== undefined) writable.__caption = attrs.caption;
    return writable;
  }

  /** Builds the `<img>`, wrapped in a `<figure>` when there is a caption. */
  private buildDom(): HTMLElement {
    const image = document.createElement('img');
    image.setAttribute('src', this.__src);
    // Always written, even when empty: an empty `alt` is how you mark an image
    // decorative, and a missing one is an accessibility defect.
    image.setAttribute('alt', this.__alt);
    if (this.__title !== null) image.setAttribute('title', this.__title);
    if (this.__width !== null) image.setAttribute('width', String(this.__width));
    if (this.__height !== null) image.setAttribute('height', String(this.__height));
    image.className = 'rte-image';
    image.setAttribute('draggable', 'false');

    if (this.__caption === null) {
      if (this.__align !== null) image.setAttribute('data-align', this.__align);
      return image;
    }

    const figure = document.createElement('figure');
    figure.className = 'rte-figure';
    if (this.__align !== null) figure.setAttribute('data-align', this.__align);
    const caption = document.createElement('figcaption');
    caption.textContent = this.__caption;
    figure.append(image, caption);
    return figure;
  }
}

/** Creates an image node from sanitized attributes. */
export function $createImageNode(attrs: ImageAttrs): ImageNode {
  return $applyNodeReplacement(new ImageNode(attrs));
}

/** Type guard for {@link ImageNode}. */
export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
  return node instanceof ImageNode;
}
