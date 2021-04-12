// Adpated from Aryeh's code.
// "A whitespace node is either a Text node whose data is the empty string; or
// a Text node whose data consists only of one or more tabs (0x0009), line
// feeds (0x000A), carriage returns (0x000D), and/or spaces (0x0020), and whose
// parent is an Element whose resolved value for "white-space" is "normal" or
// "nowrap"; or a Text node whose data consists only of one or more tabs
// (0x0009), carriage returns (0x000D), and/or spaces (0x0020), and whose

import { dom } from "@rangy/core";

// parent is an Element whose resolved value for "white-space" is "pre-line"."
function isWhitespaceNode(node: Node): boolean {
  if (!node || node.nodeType != Node.TEXT_NODE) {
    return false;
  }

  const textNode = node as Text;

  var text = textNode.data;
  if (text === "") {
    return true;
  }

  var parent = node.parentNode;
  if (!parent || parent.nodeType != 1) {
    return false;
  }
  var computedWhiteSpace = dom.getComputedStyleProperty(
    node.parentNode,
    "whiteSpace"
  );

  return (
    (/^[\t\n\r ]+$/.test(text) &&
      /^(normal|nowrap)$/.test(computedWhiteSpace)) ||
    (/^[\t\r ]+$/.test(text) && computedWhiteSpace == "pre-line")
  );
}

export default isWhitespaceNode;
