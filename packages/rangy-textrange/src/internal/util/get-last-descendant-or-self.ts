function getLastDescendantOrSelf(node: Node): Node {
  var lastChild = node.lastChild;
  return lastChild ? getLastDescendantOrSelf(lastChild) : node;
}

export default getLastDescendantOrSelf;
