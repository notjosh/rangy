import { dom } from '@notjosh/rangy-core';
import { CharacterOptions } from './constants';
import log from './log';
import NodeWrapper from './nodewrapper';
import Session from './session';
import { Token } from './util/default-tokenizer';
import isCollapsedNode from './util/is-collapsed-node';
import Memoize from './util/memoize-decorator';
import normalizeIgnoredCharacters from './util/normalize-ignored-characters';
import ValueCache from './valuecache';

const EMPTY = 'EMPTY',
  NON_SPACE = 'NON_SPACE',
  UNCOLLAPSIBLE_SPACE = 'UNCOLLAPSIBLE_SPACE',
  COLLAPSIBLE_SPACE = 'COLLAPSIBLE_SPACE',
  TRAILING_SPACE_BEFORE_BLOCK = 'TRAILING_SPACE_BEFORE_BLOCK',
  TRAILING_SPACE_IN_BLOCK = 'TRAILING_SPACE_IN_BLOCK',
  TRAILING_SPACE_BEFORE_BR = 'TRAILING_SPACE_BEFORE_BR',
  PRE_LINE_TRAILING_SPACE_BEFORE_LINE_BREAK =
    'PRE_LINE_TRAILING_SPACE_BEFORE_LINE_BREAK',
  TRAILING_LINE_BREAK_AFTER_BR = 'TRAILING_LINE_BREAK_AFTER_BR',
  INCLUDED_TRAILING_LINE_BREAK_AFTER_BR =
    'INCLUDED_TRAILING_LINE_BREAK_AFTER_BR';

class Position {
  node: Node;
  session: Session;

  private cache: ValueCache = new ValueCache();

  constructor(private nodeWrapper: NodeWrapper, public offset: number) {
    this.node = nodeWrapper.node;
    this.session = nodeWrapper.session;
  }

  inspect() {
    return '[Position(' + dom.inspectNode(this.node) + ':' + this.offset + ')]';
  }

  character = '';
  private characterType = EMPTY;
  private isBr = false;

  private prepopulatedChar: boolean;
  private isCharInvariant: boolean;
  private checkForLeadingSpace: boolean;
  private checkForTrailingSpace: boolean;
  isLeadingSpace: boolean;
  isTrailingSpace: boolean;
  private type: string;
  token: Token;

  /*
        This method:
        - Fully populates positions that have characters that can be determined independently of any other characters.
        - Populates most types of space positions with a provisional character. The character is finalized later.
         */
  prepopulateChar() {
    var pos = this;
    if (!pos.prepopulatedChar) {
      var node = pos.node,
        offset = pos.offset;
      log.debug('prepopulateChar ' + pos.inspect());
      var visibleChar = '',
        charType = EMPTY;
      var finalizedChar = false;
      if (offset > 0) {
        if (node.nodeType == Node.TEXT_NODE) {
          var text = (node as Text).data;
          var textChar = text.charAt(offset - 1);
          log.debug("Got char '" + textChar + "' in data '" + text + "'");

          var nodeInfo = pos.nodeWrapper.getTextNodeInfo();
          var spaceRegex = nodeInfo.spaceRegex;
          if (nodeInfo.collapseSpaces) {
            if (spaceRegex.test(textChar)) {
              // "If the character at position is from set, append a single space (U+0020) to newdata and advance
              // position until the character at position is not from set."

              // We also need to check for the case where we're in a pre-line and we have a space preceding a
              // line break, because such spaces are collapsed in some browsers
              if (offset > 1 && spaceRegex.test(text.charAt(offset - 2))) {
                log.debug(
                  'Character is a collapsible space preceded by another collapsible space, therefore empty'
                );
              } else if (nodeInfo.preLine && text.charAt(offset) === '\n') {
                log.debug(
                  'Character is a collapsible space which is followed by a line break in a pre-line element, skipping'
                );
                visibleChar = ' ';
                charType = PRE_LINE_TRAILING_SPACE_BEFORE_LINE_BREAK;
              } else {
                log.debug(
                  'Character is a collapsible space not preceded by another collapsible space, including but will need to check for whether it precedes a <br> or end of a block'
                );
                visibleChar = ' ';
                //pos.checkForFollowingLineBreak = true;
                charType = COLLAPSIBLE_SPACE;
              }
            } else {
              log.debug('Character is not a space, adding');
              visibleChar = textChar;
              charType = NON_SPACE;
              finalizedChar = true;
            }
          } else {
            log.debug('Spaces are not collapsible, so adding');
            visibleChar = textChar;
            charType = UNCOLLAPSIBLE_SPACE;
            finalizedChar = true;
          }
        } else {
          var nodePassed = node.childNodes[offset - 1];
          if (
            nodePassed &&
            nodePassed.nodeType == Node.ELEMENT_NODE &&
            !isCollapsedNode(nodePassed)
          ) {
            if ((nodePassed as Element).tagName.toLowerCase() == 'br') {
              log.debug('Node is br');
              visibleChar = '\n';
              pos.isBr = true;
              charType = COLLAPSIBLE_SPACE;
              finalizedChar = false;
            } else {
              log.debug(
                'Unresolved trailing space for node ' +
                  dom.inspectNode(nodePassed) +
                  '. Will resolve this later if necessary.'
              );
              pos.checkForTrailingSpace = true;
            }
          }

          // Check the leading space of the next node for the case when a block element follows an inline
          // element or text node. In that case, there is an implied line break between the two nodes.
          if (!visibleChar) {
            var nextNode = node.childNodes[offset];
            if (
              nextNode &&
              nextNode.nodeType == Node.ELEMENT_NODE &&
              !isCollapsedNode(nextNode)
            ) {
              log.debug(
                'Unresolved leading space for node ' +
                  dom.inspectNode(nextNode) +
                  '. Will resolve this later if necessary.'
              );
              pos.checkForLeadingSpace = true;
            }
          }
        }
      }

      pos.prepopulatedChar = true;
      pos.character = visibleChar;
      pos.characterType = charType;
      pos.isCharInvariant = finalizedChar;
    }
  }

  isDefinitelyNonEmpty(): boolean {
    return (
      this.characterType === NON_SPACE ||
      this.characterType === UNCOLLAPSIBLE_SPACE
    );
  }

  // Resolve leading and trailing spaces, which may involve prepopulating other positions
  resolveLeadingAndTrailingSpaces() {
    if (!this.prepopulatedChar) {
      this.prepopulateChar();
    }

    if (this.checkForTrailingSpace) {
      const trailingSpace = this.session
        .getNodeWrapper(this.node.childNodes[this.offset - 1])
        .getTrailingSpace();
      log.debug(
        'resolveLeadingAndTrailingSpaces checking for trailing space on ' +
          this.inspect() +
          ", got '" +
          trailingSpace +
          "'"
      );
      if (trailingSpace) {
        this.isTrailingSpace = true;
        this.character = trailingSpace;
        this.characterType = COLLAPSIBLE_SPACE;
      }
      this.checkForTrailingSpace = false;
    }

    if (this.checkForLeadingSpace) {
      const leadingSpace = this.session
        .getNodeWrapper(this.node.childNodes[this.offset])
        .getLeadingSpace();
      log.debug(
        'resolveLeadingAndTrailingSpaces checking for leading space on ' +
          this.inspect() +
          ", got '" +
          leadingSpace +
          "'"
      );
      if (leadingSpace) {
        this.isLeadingSpace = true;
        this.character = leadingSpace;
        this.characterType = COLLAPSIBLE_SPACE;
      }
      this.checkForLeadingSpace = false;
    }
  }

  getPrecedingUncollapsedPosition(characterOptions): Position | null {
    log.group('getPrecedingUncollapsedPosition ' + this.inspect());
    let pos: Position = this,
      character: string;
    while ((pos = pos.previousVisible())) {
      character = pos.getCharacter(characterOptions);
      if (character !== '') {
        log.groupEnd();
        return pos;
      }
    }

    log.groupEnd();
    return null;
  }

  getCharacter(characterOptions: CharacterOptions): string {
    log.group('getCharacter called on ' + this.inspect());
    this.resolveLeadingAndTrailingSpaces();

    var thisChar = this.character,
      returnChar: string;

    // Check if character is ignored
    var ignoredChars = normalizeIgnoredCharacters(
      characterOptions.ignoreCharacters
    );
    const isIgnoredCharacter =
      thisChar !== '' && ignoredChars.indexOf(thisChar) > -1;

    // Check if this position's  character is invariant (i.e. not dependent on character options) and return it
    // if so
    if (this.isCharInvariant) {
      returnChar = isIgnoredCharacter ? '' : thisChar;
      log.debug(
        'Character is invariant. isIgnored: ' +
          isIgnoredCharacter +
          ". Returning '" +
          returnChar +
          "'"
      );
      log.groupEnd();
      return returnChar;
    }

    var cacheKey = [
      'character',
      characterOptions.includeSpaceBeforeBr,
      characterOptions.includeBlockContentTrailingSpace,
      characterOptions.includePreLineTrailingSpace,
      ignoredChars,
    ].join('_');
    var cachedChar = this.cache.get(cacheKey);
    if (cachedChar !== null) {
      log.debug(
        "Returning cached character '" +
          cachedChar +
          "' for key: '" +
          cacheKey +
          "'."
      );
      log.groupEnd();
      return cachedChar;
    }

    // We need to actually get the character now
    let character = '';
    const collapsible = this.characterType == COLLAPSIBLE_SPACE;
    log.info(
      "getCharacter initial character is '" + thisChar + "'",
      collapsible ? 'collapsible' : ''
    );

    let nextPos: Position, previousPos: Position;
    let gotPreviousPos = false;
    let pos = this;

    function getPreviousPos() {
      if (!gotPreviousPos) {
        previousPos = pos.getPrecedingUncollapsedPosition(characterOptions);
        gotPreviousPos = true;
      }
      return previousPos;
    }

    // Disallow a collapsible space that is followed by a line break or is the last character
    if (collapsible) {
      // Allow a trailing space that we've previously determined should be included
      if (this.type == INCLUDED_TRAILING_LINE_BREAK_AFTER_BR) {
        log.debug(
          'Trailing space following a br not preceded by a leading line break is included.'
        );
        character = '\n';
      }
      // Disallow a collapsible space that follows a trailing space or line break, or is the first character,
      // or follows a collapsible included space
      else if (
        thisChar == ' ' &&
        (!getPreviousPos() ||
          previousPos.isTrailingSpace ||
          previousPos.character == '\n' ||
          (previousPos.character == ' ' &&
            previousPos.characterType == COLLAPSIBLE_SPACE))
      ) {
        log.info(
          'Current possible character is a collapsible space and preceding character either non-existent, a trailing space, follows a line break or a collapsible space, so current space is collapsed'
        );
      }
      // Allow a leading line break unless it follows a line break
      else if (thisChar == '\n' && this.isLeadingSpace) {
        if (getPreviousPos() && previousPos.character != '\n') {
          character = '\n';
          log.info('Character is a leading line break and is being included');
        } else {
          log.info(
            'Character is a leading line break and preceding character is a line break or non-existent, so leading line break is excluded'
          );
          console.log('previousPos.character', previousPos.character);
        }
      } else {
        nextPos = this.nextUncollapsed();
        log.debug('nextPos: ' + (nextPos ? nextPos.inspect() : 'non-existent'));
        if (nextPos) {
          if (nextPos.isBr) {
            this.type = TRAILING_SPACE_BEFORE_BR;
          } else if (nextPos.isTrailingSpace && nextPos.character == '\n') {
            this.type = TRAILING_SPACE_IN_BLOCK;
          } else if (nextPos.isLeadingSpace && nextPos.character == '\n') {
            this.type = TRAILING_SPACE_BEFORE_BLOCK;
          }

          log.debug(
            'nextPos.isLeadingSpace: ' +
              nextPos.isLeadingSpace +
              ', this type: ' +
              this.type
          );
          if (nextPos.character == '\n') {
            if (
              this.type == TRAILING_SPACE_BEFORE_BR &&
              !characterOptions.includeSpaceBeforeBr
            ) {
              log.debug(
                'Character is a space which is followed by a br. Policy from options is to collapse.'
              );
            } else if (
              this.type == TRAILING_SPACE_BEFORE_BLOCK &&
              !characterOptions.includeSpaceBeforeBlock
            ) {
              log.debug(
                'Character is a space which is followed by a block. Policy from options is to collapse.'
              );
            } else if (
              this.type == TRAILING_SPACE_IN_BLOCK &&
              nextPos.isTrailingSpace &&
              !characterOptions.includeBlockContentTrailingSpace
            ) {
              log.debug(
                'Character is a space which is the final character in a block. Policy from options is to collapse.'
              );
            } else if (
              this.type == PRE_LINE_TRAILING_SPACE_BEFORE_LINE_BREAK &&
              nextPos.type == NON_SPACE &&
              !characterOptions.includePreLineTrailingSpace
            ) {
              log.debug(
                'Character is a space which is followed by a line break in a pre-line element. Policy from options is to collapse.'
              );
            } else if (thisChar == '\n') {
              if (nextPos.isTrailingSpace) {
                if (this.isTrailingSpace) {
                  log.debug(
                    'Trailing line break preceding another trailing line break is excluded.'
                  );
                } else if (this.isBr) {
                  log.debug(
                    'Trailing line break (type ' +
                      nextPos.type +
                      ', characterType ' +
                      nextPos.characterType +
                      ') following a br is excluded but br may be included.'
                  );
                  nextPos.type = TRAILING_LINE_BREAK_AFTER_BR;

                  if (
                    getPreviousPos() &&
                    previousPos.isLeadingSpace &&
                    !previousPos.isTrailingSpace &&
                    previousPos.character == '\n'
                  ) {
                    log.debug(
                      'Trailing space following a br following a leading line break is excluded.'
                    );
                    nextPos.character = '';
                  } else {
                    log.debug(
                      'Trailing space following a br not preceded by a leading line break will be included ' +
                        nextPos.inspect()
                    );
                    nextPos.type = INCLUDED_TRAILING_LINE_BREAK_AFTER_BR;
                  }
                }
              } else {
                log.debug(
                  'Collapsible line break followed by a non-trailing line break is being included.'
                );
                character = '\n';
              }
            } else if (thisChar == ' ') {
              log.debug(
                'Collapsible space followed by a line break is being included.'
              );
              character = ' ';
            } else {
              log.debug(
                'Collapsible space (' +
                  this.inspect() +
                  ') that is neither space nor line break and is followed by a line break is being excluded.'
              );
            }
          } else {
            log.debug(
              'Character is a collapsible space or line break that has not been disallowed'
            );
            character = thisChar;
          }
        } else {
          log.debug(
            'Character is a space which is followed by nothing, so collapsing'
          );
        }
      }
    }

    if (ignoredChars.indexOf(character) > -1) {
      log.debug('Character ' + character + ' is ignored in character options');
      character = '';
    }

    log.debug("getCharacter got '" + character + "' for pos " + this.inspect());
    log.groupEnd();

    this.cache.set(cacheKey, character);

    return character;
  }

  equals(pos: Position): boolean {
    return !!pos && this.node === pos.node && this.offset === pos.offset;
  }

  toString(): string {
    return this.character;
  }

  @Memoize()
  next(): Position | null {
    const pos = this;

    var nodeWrapper = pos.nodeWrapper,
      node = pos.node,
      offset = pos.offset,
      session = nodeWrapper.session;
    if (!node) {
      return null;
    }
    var nextNode: Node, nextOffset: number, child: Node;
    if (offset == nodeWrapper.getLength()) {
      // Move onto the next node
      nextNode = node.parentNode;
      nextOffset = nextNode ? nodeWrapper.getNodeIndex() + 1 : 0;
    } else {
      if (nodeWrapper.isCharacterDataNode()) {
        nextNode = node;
        nextOffset = offset + 1;
      } else {
        child = node.childNodes[offset];
        // Go into the children next, if children there are
        if (session.getNodeWrapper(child).containsPositions()) {
          nextNode = child;
          nextOffset = 0;
        } else {
          nextNode = node;
          nextOffset = offset + 1;
        }
      }
    }

    return nextNode ? session.getPosition(nextNode, nextOffset) : null;
  }

  @Memoize()
  previous(): Position | null {
    const pos = this;
    var nodeWrapper = pos.nodeWrapper,
      node = pos.node,
      offset = pos.offset,
      session = nodeWrapper.session;
    var previousNode, previousOffset, child;
    if (offset == 0) {
      previousNode = node.parentNode;
      previousOffset = previousNode ? nodeWrapper.getNodeIndex() : 0;
    } else {
      if (nodeWrapper.isCharacterDataNode()) {
        previousNode = node;
        previousOffset = offset - 1;
      } else {
        child = node.childNodes[offset - 1];
        // Go into the children next, if children there are
        if (session.getNodeWrapper(child).containsPositions()) {
          previousNode = child;
          previousOffset = dom.getNodeLength(child);
        } else {
          previousNode = node;
          previousOffset = offset - 1;
        }
      }
    }
    return previousNode
      ? session.getPosition(previousNode, previousOffset)
      : null;
  }

  /*
    Next and previous position moving functions that filter out

    - Hidden (CSS visibility/display) elements
    - Script and style elements
    */
  @Memoize()
  nextVisible(): Position | null {
    const pos = this;
    var next = pos.next();
    if (!next) {
      return null;
    }
    var nodeWrapper = next.nodeWrapper,
      node = next.node;
    var newPos = next;
    if (nodeWrapper.isCollapsed()) {
      // We're skipping this node and all its descendants
      newPos = nodeWrapper.session.getPosition(
        node.parentNode,
        nodeWrapper.getNodeIndex() + 1
      );
    }
    return newPos;
  }

  @Memoize()
  nextUncollapsed(): Position | null {
    const pos: Position = this;
    log.group('nextUncollapsed ' + this.inspect());
    var nextPos = pos;
    while ((nextPos = nextPos.nextVisible())) {
      nextPos.resolveLeadingAndTrailingSpaces();
      if (nextPos.character !== '') {
        log.groupEnd();
        return nextPos;
      }
    }
    log.groupEnd();
    return null;
  }

  @Memoize()
  previousVisible(): Position | null {
    const pos: Position = this;
    var previous = pos.previous();
    if (!previous) {
      return null;
    }
    var nodeWrapper = previous.nodeWrapper,
      node = previous.node;
    var newPos = previous;
    if (nodeWrapper.isCollapsed()) {
      // We're skipping this node and all its descendants
      newPos = nodeWrapper.session.getPosition(
        node.parentNode,
        nodeWrapper.getNodeIndex()
      );
    }
    return newPos;
  }
}

export default Position;
