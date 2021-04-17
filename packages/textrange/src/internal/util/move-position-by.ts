import { CHARACTER, WORD } from '../constants';
import log from '../log';
import Position from '../position';
import createCharacterIterator from './create-character-iterator';
import { CharacterOptions } from './create-nested-options';
import createTokenizedTextProvider from './create-tokenized-text-provider';
import { WordOptions } from './create-word-options';

function movePositionBy(
  pos: Position,
  unit: string,
  count: number,
  characterOptions: CharacterOptions,
  wordOptions: WordOptions
) {
  log.group('movePositionBy ' + pos.inspect());
  log.info('movePositionBy called ' + count);
  var unitsMoved = 0,
    currentPos: Position,
    newPos = pos,
    charIterator,
    nextPos,
    absCount = Math.abs(count),
    token;
  if (count !== 0) {
    var backward = count < 0;

    switch (unit) {
      case CHARACTER:
        charIterator = createCharacterIterator(
          pos,
          backward,
          null,
          characterOptions
        );
        while ((currentPos = charIterator.next()) && unitsMoved < absCount) {
          log.info(
            '*** movePositionBy GOT CHAR ' +
              currentPos.character +
              '[' +
              currentPos.character.charCodeAt(0) +
              '] at position ' +
              currentPos.inspect()
          );
          ++unitsMoved;
          newPos = currentPos;
          log.debug('unitsMoved: ' + unitsMoved + ', absCount: ' + absCount);
        }
        nextPos = currentPos;
        charIterator.dispose();
        break;
      case WORD:
        var tokenizedTextProvider = createTokenizedTextProvider(
          pos,
          characterOptions,
          wordOptions
        );
        var next = backward
          ? tokenizedTextProvider.previousStartToken
          : tokenizedTextProvider.nextEndToken;

        while ((token = next()) && unitsMoved < absCount) {
          log.debug('token: ' + token.chars.join(''), token.isWord);
          if (token.isWord) {
            ++unitsMoved;
            log.info('**** FOUND END OF WORD. unitsMoved NOW ' + unitsMoved);
            newPos = backward
              ? token.chars[0]
              : token.chars[token.chars.length - 1];
          }
        }
        break;
      default:
        throw new Error("movePositionBy: unit '" + unit + "' not implemented");
    }

    // Perform any necessary position tweaks
    if (backward) {
      log.debug('Adjusting position. Current newPos: ' + newPos);
      newPos = newPos.previousVisible();
      log.debug('newPos now: ' + newPos);
      unitsMoved = -unitsMoved;
    } else if (newPos && newPos.isLeadingSpace && !newPos.isTrailingSpace) {
      // Tweak the position for the case of a leading space. The problem is that an uncollapsed leading space
      // before a block element (for example, the line break between "1" and "2" in the following HTML:
      // "1<p>2</p>") is considered to be attached to the position immediately before the block element, which
      // corresponds with a different selection position in most browsers from the one we want (i.e. at the
      // start of the contents of the block element). We get round this by advancing the position returned to
      // the last possible equivalent visible position.
      log.info(
        'movePositionBy ended immediately after a leading space at ' +
          newPos.inspect()
      );
      if (unit == WORD) {
        charIterator = createCharacterIterator(
          pos,
          false,
          null,
          characterOptions
        );
        nextPos = charIterator.next();
        charIterator.dispose();
      }
      if (nextPos) {
        newPos = nextPos.previousVisible();
        log.info(
          'movePositionBy adjusted leading space position to ' +
            newPos.inspect()
        );
      }
    }
  }

  log.groupEnd();

  return {
    position: newPos,
    unitsMoved: unitsMoved,
  };
}

export default movePositionBy;
