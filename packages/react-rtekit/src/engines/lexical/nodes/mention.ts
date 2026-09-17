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
 * The mention node.
 *
 * The same shape as the merge tag: a `TextNode` in `token` mode, so selection,
 * deletion and formatting treat it as one unit and a copy to a plain-text field still
 * carries the label. The id is what the consumer stores; the label is what the author
 * sees, and the two are independent.
 *
 * @module
 */

/** How a mention is stored in Lexical's own JSON. */
export type SerializedMentionNode = Spread<{ mentionId: string }, SerializedTextNode>;

/** Lexical node type id. Part of the serialized format, so it is stable. */
export const MENTION_NODE_TYPE = 'rte-mention';

export class MentionNode extends TextNode {
  /** The stable id of whoever was mentioned. */
  __mentionId: string;

  constructor(mentionId: string, label: string, key?: NodeKey) {
    super(label, key);
    this.__mentionId = mentionId;
  }

  static override getType(): string {
    return MENTION_NODE_TYPE;
  }

  static override clone(node: MentionNode): MentionNode {
    return new MentionNode(node.__mentionId, node.__text, node.__key);
  }

  static override importJSON(serialized: SerializedMentionNode): MentionNode {
    const node = $createMentionNode(serialized.mentionId, serialized.text);
    node.setFormat(serialized.format);
    node.setDetail(serialized.detail);
    node.setStyle(serialized.style);
    return node;
  }

  override exportJSON(): SerializedMentionNode {
    return { ...super.exportJSON(), type: MENTION_NODE_TYPE, mentionId: this.__mentionId };
  }

  /**
   * The chip's element.
   *
   * Deliberately *not* `contenteditable="false"`, for the same reason as the merge tag:
   * token mode already makes it atomic in the model, and the attribute stops Safari's
   * select-all at the chip's edge — so typing over a selection that ends in a mention
   * leaves the mention behind.
   */
  override createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config);
    dom.className = 'rte-mention';
    dom.setAttribute('data-mention-id', this.__mentionId);
    return dom;
  }

  override updateDOM(prevNode: this, dom: HTMLElement, config: EditorConfig): boolean {
    const updated = super.updateDOM(prevNode, dom, config);
    if (prevNode.__mentionId !== this.__mentionId) {
      dom.setAttribute('data-mention-id', this.__mentionId);
      return true;
    }
    return updated;
  }

  /** The id of whoever was mentioned. */
  getMentionId(): string {
    return this.__mentionId;
  }

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

/** Creates a mention node in `token` mode. */
export function $createMentionNode(mentionId: string, label: string): MentionNode {
  const node = new MentionNode(mentionId, label);
  node.setMode('token');
  return $applyNodeReplacement(node);
}

/** Type guard for {@link MentionNode}. */
export function $isMentionNode(node: LexicalNode | null | undefined): node is MentionNode {
  return node instanceof MentionNode;
}
