// Adpated from Aryeh's code.
// "node is a collapsed whitespace node if the following algorithm returns

import isHidden from "./is-hidden";
import isWhitespaceNode from "./is-whitespace-node";

// true:"
function isCollapsedWhitespaceNode(node: Node): boolean {
  // "If node's data is the empty string, return true."
  if ((node as Text).data === "") {
    return true;
  }

  // "If node is not a whitespace node, return false."
  if (!isWhitespaceNode(node)) {
    return false;
  }

  // "Let ancestor be node's parent."
  var ancestor = node.parentNode;

  // "If ancestor is null, return true."
  if (!ancestor) {
    return true;
  }

  // "If the "display" property of some ancestor of node has resolved value "none", return true."
  if (isHidden(node)) {
    return true;
  }

  return false;
}

export default isCollapsedWhitespaceNode;
