function previousNode(node: Node): Node | null {
  var previous = node.previousSibling;
  if (previous) {
    node = previous;
    while (node.hasChildNodes()) {
      node = node.lastChild;
    }
    return node;
  }
  var parent = node.parentNode;
  if (parent && parent.nodeType == Node.ELEMENT_NODE) {
    return parent;
  }
  return null;
}

export default previousNode;
