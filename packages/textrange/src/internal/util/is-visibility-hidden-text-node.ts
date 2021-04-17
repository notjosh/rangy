import { dom } from '@rangy/core';

function isVisibilityHiddenTextNode(node: Node): boolean {
  let el: Node;
  return (
    node.nodeType == Node.TEXT_NODE &&
    (el = node.parentNode) &&
    dom.getComputedStyleProperty(el, 'visibility') == 'hidden'
  );
}

export default isVisibilityHiddenTextNode;
