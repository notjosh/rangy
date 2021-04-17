import isCollapsedWhitespaceNode from './is-collapsed-whitespace-node';
import isHidden from './is-hidden';
import isVisibilityHiddenTextNode from './is-visibility-hidden-text-node';

function isCollapsedNode(node: Node): boolean {
  const type = node.nodeType;
  //log.debug("isCollapsedNode", isHidden(node), /^(script|style)$/i.test(node.nodeName), isCollapsedWhitespaceNode(node));
  ProcessingInstruction;
  return (
    type == Node.PROCESSING_INSTRUCTION_NODE /* 7: PROCESSING_INSTRUCTION */ ||
    type == Node.COMMENT_NODE /* 8: COMMENT */ ||
    isHidden(node) ||
    /^(script|style)$/i.test(node.nodeName) ||
    isVisibilityHiddenTextNode(node) ||
    isCollapsedWhitespaceNode(node)
  );
}

export default isCollapsedNode;
