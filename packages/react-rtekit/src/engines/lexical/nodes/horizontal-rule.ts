import {
  $applyNodeReplacement,
  DecoratorNode,
  type DOMConversionMap,
  type DOMExportOutput,
  type EditorConfig,
  type LexicalNode,
  type SerializedLexicalNode,
} from 'lexical';

/**
 * The horizontal-rule node.
 *
 * A `DecoratorNode` whose decoration is nothing: the `<hr>` *is* the node's own DOM,
 * built in `createDOM`. Lexical's own horizontal rule lives in `@lexical/react` and
 * renders through React, which would tie the engine adapter to a renderer; this one
 * keeps the adapter renderer-agnostic.
 *
 * @module
 */

/** Lexical node type id. Part of the serialized format, so it is stable. */
export const HORIZONTAL_RULE_NODE_TYPE = 'rte-horizontal-rule';

export class HorizontalRuleNode extends DecoratorNode<null> {
  static override getType(): string {
    return HORIZONTAL_RULE_NODE_TYPE;
  }

  static override clone(node: HorizontalRuleNode): HorizontalRuleNode {
    return new HorizontalRuleNode(node.__key);
  }

  static override importJSON(): HorizontalRuleNode {
    return $createHorizontalRuleNode();
  }

  static override importDOM(): DOMConversionMap | null {
    return {
      hr: () => ({ conversion: () => ({ node: $createHorizontalRuleNode() }), priority: 0 }),
    };
  }

  override exportJSON(): SerializedLexicalNode {
    return { type: HORIZONTAL_RULE_NODE_TYPE, version: 1 };
  }

  override exportDOM(): DOMExportOutput {
    return { element: document.createElement('hr') };
  }

  override createDOM(config: EditorConfig): HTMLElement {
    const element = document.createElement('hr');
    const theme = config.theme as { horizontalRule?: string };
    if (theme.horizontalRule) element.className = theme.horizontalRule;
    return element;
  }

  override updateDOM(): false {
    // An `<hr>` has nothing that can change.
    return false;
  }

  override isInline(): false {
    return false;
  }

  /** Nothing to decorate: the DOM is the whole node. */
  override decorate(): null {
    return null;
  }
}

/** Creates a horizontal rule. */
export function $createHorizontalRuleNode(): HorizontalRuleNode {
  return $applyNodeReplacement(new HorizontalRuleNode());
}

/** Type guard for {@link HorizontalRuleNode}. */
export function $isHorizontalRuleNode(node: LexicalNode | null | undefined): node is HorizontalRuleNode {
  return node instanceof HorizontalRuleNode;
}
