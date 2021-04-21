function nextNodeDescendants(node: Node): Node | null {
  while (node && !node.nextSibling) {
    node = node.parentNode;
  }
  if (!node) {
    return null;
  }
  return node.nextSibling;
}

export default nextNodeDescendants;
