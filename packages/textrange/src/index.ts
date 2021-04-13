import {
  createRange,
  dom,
  Selection,
  util,
  WrappedRange,
  WrappedSelection,
} from "@rangy/core";
import {
  CHARACTER,
  defaultCaretCharacterOptions,
  defaultExpandOptions,
  defaultFindOptions,
  defaultWordIteratorOptions,
  ExpandOptions,
  FindOptions,
  WORD,
  WordIteratorOptions,
} from "./internal/constants";
import log from "./internal/log";
import Position from "./internal/position";
import Session, {
  createEntryPointFunction,
  getSession,
} from "./internal/session";
import createNestedOptions, {
  CharacterOptions,
  defaultCharacterOptions,
} from "./internal/util/create-nested-options";
import createRangeBoundaryMover from "./internal/util/create-range-boundary-mover";
import createRangeTrimmer from "./internal/util/create-range-trimmer";
import createSelectionTrimmer from "./internal/util/create-selection-trimmer";
import createTokenizedTextProvider from "./internal/util/create-tokenized-text-provider";
import { Token } from "./internal/util/default-tokenizer";
import findTextFromPosition from "./internal/util/find-text-from-position";
import getRangeCharacters from "./internal/util/get-range-characters";
import isBlockNode from "./internal/util/is-block-node";
import isCollapsedWhitespaceNode from "./internal/util/is-collapsed-whitespace-node";
import nextNode from "./internal/util/next-node";
import previousNode from "./internal/util/previous-node";

export type CharacterRangeInfo = {
  characterOptions?: CharacterOptions;
  characterRange: {
    start: number;
    end: number;
  };
  backward: boolean;
};

export const innerText = (el: Node, characterOptions: CharacterOptions) => {
  var range = createRange(el);
  range.selectNodeContents(el);
  var text = range.text(characterOptions);
  log.debug(
    "innerText is '" +
      text.replace(/\s/g, function (matched) {
        return "[" + matched.charCodeAt(0) + "]";
      }) +
      "'"
  );
  return text;
};

export const createWordIterator = (
  startNode: Node,
  startOffset: number,
  iteratorOptions: Partial<WordIteratorOptions>
) => {
  const session = getSession();
  iteratorOptions = createNestedOptions(
    iteratorOptions,
    defaultWordIteratorOptions
  );
  var startPos = session.getPosition(startNode, startOffset);
  var tokenizedTextProvider = createTokenizedTextProvider(
    startPos,
    iteratorOptions.characterOptions,
    iteratorOptions.wordOptions
  );
  var backward = Selection.isDirectionBackward(iteratorOptions.direction);

  return {
    next: function () {
      return backward
        ? tokenizedTextProvider.previousStartToken()
        : tokenizedTextProvider.nextEndToken();
    },

    dispose: function () {
      tokenizedTextProvider.dispose();
      this.next = function () {};
    },
  };
};

export const textRange = {
  isBlockNode: isBlockNode,
  isCollapsedWhitespaceNode: isCollapsedWhitespaceNode,

  createPosition: createEntryPointFunction(
    (session: Session, node: Node, offset: number) => {
      return session.getPosition(node, offset);
    }
  ),
};

export { nextNode, previousNode };

WrappedRange.prototype.moveStart = createRangeBoundaryMover(true, false);
WrappedRange.prototype.moveEnd = createRangeBoundaryMover(false, false);
WrappedRange.prototype.move = createRangeBoundaryMover(true, true);
WrappedRange.prototype.trimStart = createRangeTrimmer(true);
WrappedRange.prototype.trimEnd = createRangeTrimmer(false);

WrappedRange.prototype.expand = createEntryPointFunction(function (
  session: Session,
  unit: string = CHARACTER,
  expandOptions?: Partial<ExpandOptions>
) {
  const self = this as WrappedRange;

  let moved = false;
  expandOptions = createNestedOptions(expandOptions, defaultExpandOptions);
  const characterOptions = expandOptions.characterOptions;
  if (unit == WORD) {
    const wordOptions = expandOptions.wordOptions;
    const startPos = session.getRangeBoundaryPosition(self, true);
    const endPos = session.getRangeBoundaryPosition(self, false);

    var startTokenizedTextProvider = createTokenizedTextProvider(
      startPos,
      characterOptions,
      wordOptions
    );
    const startToken = startTokenizedTextProvider.nextEndToken();
    const newStartPos = startToken.chars[0].previousVisible();
    let endToken: Token, newEndPos: Position;

    if (self.collapsed) {
      endToken = startToken;
    } else {
      var endTokenizedTextProvider = createTokenizedTextProvider(
        endPos,
        characterOptions,
        wordOptions
      );
      endToken = endTokenizedTextProvider.previousStartToken();
    }
    newEndPos = endToken.chars[endToken.chars.length - 1];

    if (!newStartPos.equals(startPos)) {
      self.setStart(newStartPos.node, newStartPos.offset);
      moved = true;
    }
    if (newEndPos && !newEndPos.equals(endPos)) {
      self.setEnd(newEndPos.node, newEndPos.offset);
      moved = true;
    }

    if (expandOptions.trim) {
      if (expandOptions.trimStart) {
        moved = self.trimStart(characterOptions) || moved;
      }
      if (expandOptions.trimEnd) {
        moved = self.trimEnd(characterOptions) || moved;
      }
    }

    return moved;
  } else {
    return self.moveEnd(CHARACTER, 1, expandOptions);
  }
});

WrappedRange.prototype.text = createEntryPointFunction(function (
  session: Session,
  characterOptions: Partial<CharacterOptions>
) {
  const self = this as WrappedRange;

  log.info(
    "text. Transaction: " + session + ", characterOptions:",
    characterOptions
  );
  return self.collapsed
    ? ""
    : getRangeCharacters(session, self, {
        ...defaultCharacterOptions,
        ...characterOptions,
      }).join("");
});

WrappedRange.prototype.selectCharacters = createEntryPointFunction(function (
  session,
  containerNode: Node,
  startIndex: number,
  endIndex: number,
  characterOptions: CharacterOptions
) {
  const self = this as WrappedRange;
  var moveOptions = { characterOptions: characterOptions };
  if (!containerNode) {
    containerNode = util.getBody(self.getDocument());
  }
  self.selectNodeContents(containerNode);
  self.collapse(true);
  self.moveStart("character", startIndex, moveOptions);
  self.collapse(true);
  self.moveEnd("character", endIndex - startIndex, moveOptions);
});

// Character indexes are relative to the start of node
WrappedRange.prototype.toCharacterRange = createEntryPointFunction(function (
  session: Session,
  containerNode: Node,
  characterOptions: Partial<CharacterOptions>
): { start: number; end: number } {
  const self = this as WrappedRange;

  if (!containerNode) {
    containerNode = dom.getBody(self.getDocument());
  }
  var parent = containerNode.parentNode,
    nodeIndex = dom.getNodeIndex(containerNode);
  var rangeStartsBeforeNode =
    dom.comparePoints(
      self.startContainer,
      self.endContainer,
      parent,
      nodeIndex
    ) == -1;
  var rangeBetween = self.cloneRange();
  var startIndex, endIndex;
  if (rangeStartsBeforeNode) {
    rangeBetween.setStartAndEnd(
      self.startContainer,
      self.startOffset,
      parent,
      nodeIndex
    );
    startIndex = -rangeBetween.text(characterOptions).length;
  } else {
    rangeBetween.setStartAndEnd(
      parent,
      nodeIndex,
      self.startContainer,
      self.startOffset
    );
    startIndex = rangeBetween.text(characterOptions).length;
  }
  endIndex = startIndex + self.text(characterOptions).length;

  return {
    start: startIndex,
    end: endIndex,
  };
});

WrappedRange.prototype.findText = createEntryPointFunction(function (
  session: Session,
  searchTermParam: string,
  findOptions: Partial<FindOptions>
): boolean {
  const self = this as WrappedRange;

  // Set up options
  findOptions = createNestedOptions(findOptions, defaultFindOptions);

  // Create word options if we're matching whole words only
  if (findOptions.wholeWordsOnly) {
    // We don't ever want trailing spaces for search results
    findOptions.wordOptions.includeTrailingSpace = false;
  }

  var backward = Selection.isDirectionBackward(findOptions.direction);

  // Create a range representing the search scope if none was provided
  var searchScopeRange = findOptions.withinRange;
  if (!searchScopeRange) {
    searchScopeRange = createRange();
    searchScopeRange.selectNodeContents(self.getDocument());
  }

  // Examine and prepare the search term
  var searchTerm = searchTermParam,
    isRegex = false;
  if (typeof searchTerm == "string") {
    if (!findOptions.caseSensitive) {
      searchTerm = searchTerm.toLowerCase();
    }
  } else {
    isRegex = true;
  }

  var initialPos = session.getRangeBoundaryPosition(self, !backward);

  // Adjust initial position if it lies outside the search scope
  var comparison = searchScopeRange.comparePoint(
    initialPos.node,
    initialPos.offset
  );

  if (comparison === -1) {
    initialPos = session.getRangeBoundaryPosition(searchScopeRange, true);
  } else if (comparison === 1) {
    initialPos = session.getRangeBoundaryPosition(searchScopeRange, false);
  }

  var pos = initialPos;
  var wrappedAround = false;

  // Try to find a match and ignore invalid ones
  var findResult;
  while (true) {
    findResult = findTextFromPosition(
      pos,
      searchTerm,
      isRegex,
      searchScopeRange,
      findOptions
    );

    if (findResult) {
      if (findResult.valid) {
        this.setStartAndEnd(
          findResult.startPos.node,
          findResult.startPos.offset,
          findResult.endPos.node,
          findResult.endPos.offset
        );
        return true;
      } else {
        // We've found a match that is not a whole word, so we carry on searching from the point immediately
        // after the match
        pos = backward ? findResult.startPos : findResult.endPos;
      }
    } else if (findOptions.wrap && !wrappedAround) {
      // No result found but we're wrapping around and limiting the scope to the unsearched part of the range
      searchScopeRange = searchScopeRange.cloneRange();
      pos = session.getRangeBoundaryPosition(searchScopeRange, !backward);
      searchScopeRange.setBoundary(
        initialPos.node,
        initialPos.offset,
        backward
      );
      log.debug(
        "Wrapping search. New search range is " + searchScopeRange.inspect()
      );
      wrappedAround = true;
    } else {
      // Nothing found and we can't wrap around, so we're done
      return false;
    }
  }
});

WrappedRange.prototype.pasteHtml = function (html: string): void {
  const self = this as WrappedRange;

  self.deleteContents();
  if (html) {
    var frag = self.createContextualFragment(html);
    var lastChild = frag.lastChild;
    self.insertNode(frag);
    self.collapseAfter(lastChild);
  }
};

WrappedSelection.prototype.expand = createEntryPointFunction(function (
  session: Session,
  unit: string,
  expandOptions: Partial<ExpandOptions>
): void {
  const self = this as WrappedSelection;

  self.changeEachRange(function (range) {
    range.expand(unit, expandOptions);
  });
});

WrappedSelection.prototype.move = createEntryPointFunction(function (
  session: Session,
  unit: string,
  count: number,
  options: { characterOptions: CharacterOptions }
): number {
  const self = this as WrappedSelection;

  var unitsMoved = 0;
  if (self.focusNode) {
    self.collapse(self.focusNode, self.focusOffset);
    var range = self.getRangeAt(0) as WrappedRange;
    options.characterOptions = {
      ...defaultCaretCharacterOptions,
      ...options.characterOptions,
    };
    unitsMoved = range.move(unit, count, options);
    log.debug("Selection move setting range " + range.inspect());
    self.setSingleRange(range);
    log.debug("Selection now " + self.inspect());
  }
  return unitsMoved;
});

WrappedSelection.prototype.trimStart = createSelectionTrimmer("trimStart");
WrappedSelection.prototype.trimEnd = createSelectionTrimmer("trimEnd");
WrappedSelection.prototype.trim = createSelectionTrimmer("trim");

WrappedSelection.prototype.selectCharacters = createEntryPointFunction(
  function (
    session: Session,
    containerNode: Node,
    startIndex: number,
    endIndex: number,
    direction: string,
    characterOptions: Partial<CharacterOptions>
  ): void {
    const self = this as WrappedSelection;

    var range = createRange(containerNode);
    range.selectCharacters(
      containerNode,
      startIndex,
      endIndex,
      characterOptions
    );
    self.setSingleRange(range, direction);
  }
);

WrappedSelection.prototype.saveCharacterRanges = createEntryPointFunction(
  function (
    session: Session,
    containerNode: Node,
    characterOptions: CharacterOptions
  ): CharacterRangeInfo[] {
    const self = this as WrappedSelection;

    var ranges = self.getAllRanges(),
      rangeCount = ranges.length;
    var rangeInfos: CharacterRangeInfo[] = [];

    var backward = rangeCount == 1 && self.isBackward();

    for (var i = 0, len = ranges.length; i < len; ++i) {
      rangeInfos[i] = {
        characterRange: ranges[i].toCharacterRange(
          containerNode,
          characterOptions
        ),
        backward: backward,
        characterOptions: characterOptions,
      };
    }

    return rangeInfos;
  }
);

WrappedSelection.prototype.restoreCharacterRanges = createEntryPointFunction(
  function (
    session: Session,
    containerNode: Node,
    saved: CharacterRangeInfo[]
  ): void {
    const self = this as WrappedSelection;

    self.removeAllRanges();
    for (
      var i = 0, len = saved.length, range, rangeInfo, characterRange;
      i < len;
      ++i
    ) {
      rangeInfo = saved[i];
      characterRange = rangeInfo.characterRange;
      range = createRange(containerNode);
      range.selectCharacters(
        containerNode,
        characterRange.start,
        characterRange.end,
        rangeInfo.characterOptions
      );
      log.info("New selected range: " + range.inspect());
      self.addRange(range, rangeInfo.backward);
    }
  }
);

WrappedSelection.prototype.text = createEntryPointFunction(function (
  session: Session,
  characterOptions: Partial<CharacterOptions>
): string {
  const self = this as WrappedSelection;
  var rangeTexts: string[] = [];
  for (var i = 0, len = self.rangeCount; i < len; ++i) {
    rangeTexts[i] = (self.getRangeAt(i) as WrappedRange).text(characterOptions);
  }
  return rangeTexts.join("");
});
