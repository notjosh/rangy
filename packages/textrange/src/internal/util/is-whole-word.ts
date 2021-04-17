import { createRange } from '@rangy/core';
import Position from '../position';

function isWholeWord(startPos: Position, endPos: Position, wordOptions) {
  var range = createRange(startPos.node);
  range.setStartAndEnd(
    startPos.node,
    startPos.offset,
    endPos.node,
    endPos.offset
  );
  return !range.expand('word', { wordOptions: wordOptions });
}

export default isWholeWord;
