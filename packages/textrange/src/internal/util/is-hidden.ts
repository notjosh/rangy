import getAncestorsAndSelf from "./get-ancestors-and-self";
import getComputedDisplay from "./get-computed-display";

function isHidden(node: Node): boolean {
  var ancestors = getAncestorsAndSelf(node);
  for (let i = 0; i < ancestors.length; i += 1) {
    if (
      ancestors[i].nodeType == Node.ELEMENT_NODE &&
      getComputedDisplay(ancestors[i] as Element) == "none"
    ) {
      return true;
    }
  }

  return false;
}

export default isHidden;
