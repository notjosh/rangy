import { WrappedRange } from '@rangy/core';
import { CharacterOptions } from '../constants';
import Session from '../session';
import createCharacterIterator from './create-character-iterator';

function createRangeCharacterIterator(
  session: Session,
  range: WrappedRange,
  characterOptions: CharacterOptions,
  backward: boolean = false
) {
  var rangeStart = session.getRangeBoundaryPosition(range, true);
  var rangeEnd = session.getRangeBoundaryPosition(range, false);
  var itStart = backward ? rangeEnd : rangeStart;
  var itEnd = backward ? rangeStart : rangeEnd;

  return createCharacterIterator(itStart, !!backward, itEnd, characterOptions);
}

export default createRangeCharacterIterator;
