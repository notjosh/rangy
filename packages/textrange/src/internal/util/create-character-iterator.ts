import log from '../log';
import Position from '../position';
import { CharacterOptions } from './create-nested-options';
import isCollapsedNode from './is-collapsed-node';

function createCharacterIterator(
  startPos: Position,
  backward: boolean,
  endPos: Position,
  characterOptions: CharacterOptions
) {
  log.info(
    'createCharacterIterator called backwards ' +
      backward +
      ' and with endPos ' +
      (endPos ? endPos.inspect() : '')
  );

  // Adjust the end position to ensure that it is actually reached
  if (endPos) {
    if (backward) {
      if (isCollapsedNode(endPos.node)) {
        endPos = startPos.previousVisible();
      }
    } else {
      if (isCollapsedNode(endPos.node)) {
        endPos = endPos.nextVisible();
      }
    }
  }

  log.info(
    'endPos now ' +
      (endPos ? endPos.inspect() : '') +
      ', startPos ' +
      startPos.inspect()
  );

  var pos = startPos,
    finished = false;

  function next() {
    log.debug(
      '****** NEXT CALLED. FINISHED IS ' +
        finished +
        ', pos is ' +
        (pos ? pos.inspect() : 'non-existent')
    );
    var charPos = null;
    if (backward) {
      charPos = pos;
      if (!finished) {
        pos = pos.previousVisible();
        finished = !pos || (endPos && pos.equals(endPos));
      }
    } else {
      if (!finished) {
        charPos = pos = pos.nextVisible();
        finished = !pos || (endPos && pos.equals(endPos));
      }
    }
    if (finished) {
      pos = null;
    }
    log.info('Finished: ' + finished);
    return charPos;
  }

  let previousTextPos: Position,
    returnPreviousTextPos = false;

  return {
    next: function () {
      if (returnPreviousTextPos) {
        returnPreviousTextPos = false;
        return previousTextPos;
      } else {
        var pos: Position, character: string;
        while ((pos = next())) {
          character = pos.getCharacter(characterOptions);
          if (character) {
            previousTextPos = pos;
            return pos;
          }
        }
        return null;
      }
    },

    rewind: function () {
      if (previousTextPos) {
        returnPreviousTextPos = true;
      } else {
        throw new Error(
          'createCharacterIterator: cannot rewind. Only one position can be rewound.'
        );
      }
    },

    dispose: function () {
      startPos = endPos = null;
    },
  };
}

export default createCharacterIterator;
