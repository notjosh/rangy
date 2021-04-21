import { dom } from '@notjosh/rangy-core';

function containsPositions(node: Node): boolean {
  return (
    dom.isCharacterDataNode(node) ||
    !/^(area|base|basefont|br|col|frame|hr|img|input|isindex|link|meta|param)$/i.test(
      node.nodeName
    )
  );
}

export default containsPositions;
