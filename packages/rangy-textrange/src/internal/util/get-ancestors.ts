function getAncestors(node: Node): Node[] {
  let ancestors: Node[] = [];
  while (node.parentNode) {
    ancestors.unshift(node.parentNode);
    node = node.parentNode;
  }
  return ancestors;
}

export default getAncestors;
