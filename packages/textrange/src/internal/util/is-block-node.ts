// resolved value "inline" or "inline-block" or "inline-table" or "none", or a
// "A block node is either an Element whose "display" property does not have

import getComputedDisplay from "./get-computed-display";

// Document, or a DocumentFragment."
function isBlockNode(node: Node): boolean {
  return (
    node &&
    ((node.nodeType == Node.ELEMENT_NODE &&
      !/^(inline(-block|-table)?|none)$/.test(
        getComputedDisplay(node as Element)
      )) ||
      node.nodeType == Node.DOCUMENT_NODE ||
      node.nodeType == Node.DOCUMENT_FRAGMENT_NODE)
  );
}

export default isBlockNode;
