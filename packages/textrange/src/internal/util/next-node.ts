import nextNodeDescendants from "./next-node-descendants";

function nextNode(node: Node, excludeChildren: boolean = false): Node | null {
  if (!excludeChildren && node.hasChildNodes()) {
    return node.firstChild;
  }
  return nextNodeDescendants(node);
}

export default nextNode;
