import { WrappedRange } from '@rangy/core';
import log from '../log';
import Session from '../session';
import createRangeCharacterIterator from './create-range-character-iterator';

function getRangeCharacters(
  session: Session,
  range: WrappedRange,
  characterOptions
) {
  log.info('getRangeCharacters called on range ' + range.inspect());

  var chars = [],
    it = createRangeCharacterIterator(session, range, characterOptions),
    pos;
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
