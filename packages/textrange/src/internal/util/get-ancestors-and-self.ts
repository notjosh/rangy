import getAncestors from "./get-ancestors";

function getAncestorsAndSelf(node: Node): Node[] {
  return getAncestors(node).concat([node]);
}

export default getAncestorsAndSelf;
