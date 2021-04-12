import { dom } from "@rangy/core";
import { spacesMinusLineBreaksRegex, spacesRegex } from "./constants";
import log from "./log";
import Position from "./position";
import Session from "./session";
import containsPositions from "./util/contains-positions";
import getComputedDisplay from "./util/get-computed-display";
import isCollapsedNode from "./util/is-collapsed-node";
import isCollapsedWhitespaceNode from "./util/is-collapsed-whitespace-node";
import isIgnoredNode from "./util/is-ignored-node";
import isWhitespaceNode from "./util/is-whitespace-node";
import nextNode from "./util/next-node";
import previousNode from "./util/previous-node";
import mem from "mem";

type TextNodeInfo = {
  node: Text;
  text: string;
  spaceRegex: RegExp;
  collapseSpaces: boolean;
  preLine: boolean;
};

class NodeWrapper {
  positions = new ValueCache();

  constructor(public node: Node, public session: Session) {}

  getPosition(offset) {
    var positions = this.positions;
    return (
      positions.get(offset) || positions.set(offset, new Position(this, offset))
    );
  }

  toString() {
    return "[NodeWrapper(" + dom.inspectNode(this.node) + ")]";
  }

  @mem.decorator()
  isCharacterDataNode(): boolean {
    return dom.isCharacterDataNode(this.node);
  }

  @mem.decorator()
  getNodeIndex(): number {
    return dom.getNodeIndex(this.node);
  }

  @mem.decorator()
  getLength(): number {
    return dom.getNodeLength(this.node);
  }

  @mem.decorator()
  containsPositions(): boolean {
    return containsPositions(this.node);
  }

  @mem.decorator()
  isWhitespace(): boolean {
    return isWhitespaceNode(this.node);
  }

  @mem.decorator()
  isCollapsedWhitespace(): boolean {
    return isCollapsedWhitespaceNode(this.node);
  }

  @mem.decorator()
  getComputedDisplay(): string {
    if (this.node.nodeType !== Node.ELEMENT_NODE) {
      throw new Error(
        `getComputedDisplay only works on element nodes, this is type: ${this.node.nodeType}`
      );
    }

    return getComputedDisplay(this.node as Element);
  }

  @mem.decorator()
  isCollapsed(): boolean {
    return isCollapsedNode(this.node);
  }

  @mem.decorator()
  isIgnored(): boolean {
    return isIgnoredNode(this.node);
  }

  @mem.decorator()
  next() {
    return nextNode(this.node);
  }

  @mem.decorator()
  previous() {
    return previousNode(this.node);
  }

  @mem.decorator()
  getTextNodeInfo(): TextNodeInfo {
    if (this.node.nodeType !== Node.TEXT_NODE) {
      throw new Error(
        `getTextNodeInfo only works on text nodes, this is type: ${this.node.nodeType}`
      );
    }

    const textNode = this.node as Text;

    log.debug("getTextNodeInfo for " + textNode.data);
    var spaceRegex = null,
      collapseSpaces = false;
    var cssWhitespace = dom.getComputedStyleProperty(
      textNode.parentNode,
      "whiteSpace"
    );
    var preLine = cssWhitespace == "pre-line";
    if (preLine) {
      spaceRegex = spacesMinusLineBreaksRegex;
      collapseSpaces = true;
    } else if (cssWhitespace == "normal" || cssWhitespace == "nowrap") {
      spaceRegex = spacesRegex;
      collapseSpaces = true;
    }

    return {
      node: textNode,
      text: textNode.data,
      spaceRegex,
      collapseSpaces,
      preLine,
    };
  }

  @mem.decorator()
  hasInnerText(backward: boolean = false): boolean {
    if (this.node.nodeType !== Node.ELEMENT_NODE) {
      throw new Error(
        `hasInnerText only works on element nodes, this is type: ${this.node.nodeType}`
      );
    }

    const el = this.node as Element;

    var session = this.session;
    var posAfterEl = session.getPosition(
      el.parentNode,
      this.getNodeIndex() + 1
    );
    var firstPosInEl = session.getPosition(el, 0);

    var pos = backward ? posAfterEl : firstPosInEl;
    var endPos = backward ? firstPosInEl : posAfterEl;

    /*
             <body><p>X  </p><p>Y</p></body>

             Positions:

             body:0:""
             p:0:""
             text:0:""
             text:1:"X"
             text:2:TRAILING_SPACE_IN_BLOCK
             text:3:COLLAPSED_SPACE
             p:1:""
             body:1:"\n"
             p:0:""
             text:0:""
             text:1:"Y"

             A character is a TRAILING_SPACE_IN_BLOCK iff:

             - There is no uncollapsed character after it within the visible containing block element

             A character is a TRAILING_SPACE_BEFORE_BR iff:

             - There is no uncollapsed character after it preceding a <br> element

             An element has inner text iff

             - It is not hidden
             - It contains an uncollapsed character

             All trailing spaces (pre-line, before <br>, end of block) require definite non-empty characters to render.
             */

    while (pos !== endPos) {
      pos.prepopulateChar();
      if (pos.isDefinitelyNonEmpty()) {
        return true;
      }
      pos = backward ? pos.previousVisible() : pos.nextVisible();
    }

    return false;
  }

  @mem.decorator()
  isRenderedBlock(): boolean {
    if (this.node.nodeType !== Node.ELEMENT_NODE) {
      throw new Error(
        `hasInnerText only works on element nodes, this is type: ${this.node.nodeType}`
      );
    }

    const el = this.node as Element;

    // Ensure that a block element containing a <br> is considered to have inner text
    var brs = el.getElementsByTagName("br");
    for (var i = 0, len = brs.length; i < len; ++i) {
      if (!isCollapsedNode(brs[i])) {
        return true;
      }
    }
    return this.hasInnerText();
  }

  @mem.decorator()
  getTrailingSpace(): string {
    if (this.node.nodeType !== Node.ELEMENT_NODE) {
      throw new Error(
        `getTrailingSpace only works on element nodes, this is type: ${this.node.nodeType}`
      );
    }

    const el = this.node as Element;

    if (el.tagName.toLowerCase() == "br") {
      return "";
    } else {
      switch (this.getComputedDisplay()) {
        case "inline":
          var child = el.lastChild;
          while (child) {
            if (!isIgnoredNode(child)) {
              return child.nodeType == Node.ELEMENT_NODE
                ? this.session.getNodeWrapper(child).getTrailingSpace()
                : "";
            }
            child = child.previousSibling;
          }
          break;
        case "inline-block":
        case "inline-table":
        case "none":
        case "table-column":
        case "table-column-group":
          break;
        case "table-cell":
          return "\t";
        default:
          return this.isRenderedBlock() ? "\n" : "";
      }
    }
    return "";
  }

  @mem.decorator()
  getLeadingSpace(): string {
    switch (this.getComputedDisplay()) {
      case "inline":
      case "inline-block":
      case "inline-table":
      case "none":
      case "table-column":
      case "table-column-group":
      case "table-cell":
        break;
      default:
        return this.isRenderedBlock() ? "\n" : "";
    }
    return "";
  }
}

export default NodeWrapper;
