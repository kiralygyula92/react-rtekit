import {
  $applyNodeReplacement,
  TextNode,
  type EditorConfig,
  type LexicalNode,
  type NodeKey,
  type SerializedTextNode,
  type Spread,
} from 'lexical';

/**
 * The merge-tag node (03 §6, fixes R23).
 *
 * A `TextNode` in `token` mode: Lexical then treats it as one unit for selection,
 * deletion and formatting, which is exactly what a `{contact_first_name}` placeholder
 * needs. Making it a decorator instead would pull in Lexical's React layer and would
 * not survive copy/paste as text.
 *
 * The rendered label may differ from the stored key — the chip can read
 * "Contact first name" — but serialization always writes `{key}`, so the backend
 * substitution is unchanged.
 *
 * @module
 */

/** How a merge tag is stored in Lexical's own JSON. */
export type SerializedMergeTagNode = Spread<
  { tagKey: string; label: string | null },
  SerializedTextNode
>;

/** Lexical node type id. Part of the serialized format, so it is stable. */
export const MERGE_TAG_NODE_TYPE = 'rte-merge-tag';

export class MergeTagNode extends TextNode {
  /** The substitution key, without delimiters. */
  __tagKey: string;
  /** The human label shown in the chip, if any. */
  __label: string | null;

  constructor(tagKey: string, label: string | null = null, text?: string, key?: NodeKey) {
    super(text ?? label ?? tagKey, key);
    this.__tagKey = tagKey;
    this.__label = label;
  }

  static override getType(): string {
    return MERGE_TAG_NODE_TYPE;
  }

  static override clone(node: MergeTagNode): MergeTagNode {
    return new MergeTagNode(node.__tagKey, node.__label, node.__text, node.__key);
  }

  static override importJSON(serialized: SerializedMergeTagNode): MergeTagNode {
    const node = $createMergeTagNode(serialized.tagKey, serialized.label);
    node.setFormat(serialized.format);
    node.setDetail(serialized.detail);
    node.setStyle(serialized.style);
    return node;
  }

  override exportJSON(): SerializedMergeTagNode {
    return { ...super.exportJSON(), type: MERGE_TAG_NODE_TYPE, tagKey: this.__tagKey, label: this.__label };
  }

  override createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config);
    dom.className = 'rte-merge-tag';
    dom.setAttribute('data-merge-tag', this.__tagKey);
    dom.setAttribute('contenteditable', 'false');
    // Not `aria-hidden`: the label is meaningful, and a screen reader should read it.
    dom.setAttribute('role', 'img');
    dom.setAttribute('aria-label', this.__label ?? this.__tagKey);
    return dom;
  }

  override updateDOM(prevNode: this, dom: HTMLElement, config: EditorConfig): boolean {
    const updated = super.updateDOM(prevNode, dom, config);
    if (prevNode.__tagKey !== this.__tagKey) {
      dom.setAttribute('data-merge-tag', this.__tagKey);
      return true;
    }
    return updated;
  }

  /** The substitution key. */
  getTagKey(): string {
    return this.__tagKey;
  }

  /** The label shown in the chip, or `null` when the key is shown. */
  getLabel(): string | null {
    return this.__label;
  }

  /** A tag is never split by formatting or by typing inside it. */
  override isTextEntity(): boolean {
    return true;
  }

  override canInsertTextBefore(): boolean {
    return false;
  }

  override canInsertTextAfter(): boolean {
    return false;
  }
}

/** Creates a merge-tag node in `token` mode. */
export function $createMergeTagNode(tagKey: string, label: string | null = null): MergeTagNode {
  const node = new MergeTagNode(tagKey, label);
  node.setMode('token');
  return $applyNodeReplacement(node);
}

/** Type guard for {@link MergeTagNode}. */
export function $isMergeTagNode(node: LexicalNode | null | undefined): node is MergeTagNode {
  return node instanceof MergeTagNode;
}
