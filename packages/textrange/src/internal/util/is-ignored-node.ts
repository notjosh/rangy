import getComputedDisplay from './get-computed-display';

function isIgnoredNode(node: Node, win?: Window) {
  return (
    node.nodeType ==
      Node.PROCESSING_INSTRUCTION_NODE /* PROCESSING_INSTRUCTION */ ||
    node.nodeType == Node.COMMENT_NODE /* COMMENT */ ||
    (node.nodeType == Node.ELEMENT_NODE &&
      getComputedDisplay(node as Element, win) == 'none')
  );
}

export default isIgnoredNode;
