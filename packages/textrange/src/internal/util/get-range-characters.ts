import { WrappedRange } from '@rangy/core';
import { CharacterOptions } from '../constants';
import log from '../log';
import Position from '../position';
import Session from '../session';
import createRangeCharacterIterator from './create-range-character-iterator';

function getRangeCharacters(
  session: Session,
  range: WrappedRange,
  characterOptions: CharacterOptions
) {
  log.info('getRangeCharacters called on range ' + range.inspect());

  var chars: Position[] = [],
    it = createRangeCharacterIterator(session, range, characterOptions),
    pos: Position;
  while ((pos = it.next())) {
    log.info(
      '*** GOT CHAR ' +
        pos.character +
        '[' +
        pos.character.charCodeAt(0) +
        '] for ' +
        pos.inspect()
    );
    chars.push(pos);
  }

  it.dispose();
  return chars;
}

export default getRangeCharacters;
