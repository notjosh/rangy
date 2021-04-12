import { Selection } from "@rangy/core";
import log from "../log";
import Position from "../position";
import createCharacterIterator from "./create-character-iterator";
import isWholeWord from "./is-whole-word";

function findTextFromPosition(
  initialPos,
  searchTerm,
  isRegex,
  searchScopeRange,
  findOptions
) {
  log.debug(
    "findTextFromPosition called with search term " +
      searchTerm +
      ", initialPos " +
      initialPos.inspect() +
      " within range " +
      searchScopeRange.inspect()
  );
  var backward = Selection.isDirectionBackward(findOptions.direction);
  var it = createCharacterIterator(
    initialPos,
    backward,
    initialPos.session.getRangeBoundaryPosition(searchScopeRange, backward),
    findOptions.characterOptions
  );
  var text = "",
    chars: Position[] = [],
    pos: Position,
    currentChar: string,
    matchStartIndex: number,
    matchEndIndex: number;
  var result, insideRegexMatch;
  var returnValue = null;

  function handleMatch(startIndex: number, endIndex: number) {
    var startPos = chars[startIndex].previousVisible();
    var endPos = chars[endIndex - 1];
    var valid =
      !findOptions.wholeWordsOnly ||
      isWholeWord(startPos, endPos, findOptions.wordOptions);

    return {
      startPos: startPos,
      endPos: endPos,
      valid: valid,
    };
  }

  while ((pos = it.next())) {
    currentChar = pos.character;
    if (!isRegex && !findOptions.caseSensitive) {
      currentChar = currentChar.toLowerCase();
    }

    if (backward) {
      chars.unshift(pos);
      text = currentChar + text;
    } else {
      chars.push(pos);
      text += currentChar;
    }

    if (isRegex) {
      result = searchTerm.exec(text);
      if (result) {
        matchStartIndex = result.index;
        matchEndIndex = matchStartIndex + result[0].length;
        if (insideRegexMatch) {
          // Check whether the match is now over
          if (
            (!backward && matchEndIndex < text.length) ||
            (backward && matchStartIndex > 0)
          ) {
            returnValue = handleMatch(matchStartIndex, matchEndIndex);
            break;
          }
        } else {
          insideRegexMatch = true;
        }
      }
    } else if ((matchStartIndex = text.indexOf(searchTerm)) != -1) {
      returnValue = handleMatch(
        matchStartIndex,
        matchStartIndex + searchTerm.length
      );
      break;
    }
    log.debug(
      text.replace(/\s/g, function (m) {
        return "[" + m.charCodeAt(0) + "]";
      }),
      matchStartIndex
    );
  }

  // Check whether regex match extends to the end of the range
  if (insideRegexMatch) {
    returnValue = handleMatch(matchStartIndex, matchEndIndex);
  }
  it.dispose();

  return returnValue;
}

export default findTextFromPosition;
