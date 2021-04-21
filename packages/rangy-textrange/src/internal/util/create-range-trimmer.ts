import { WrappedRange } from '@notjosh/rangy-core';
import {
  allWhiteSpaceRegex,
  CharacterOptions,
  defaultCharacterOptions,
} from '../constants';
import Session, { createEntryPointFunction } from '../session';
import createRangeCharacterIterator from './create-range-character-iterator';

function createRangeTrimmer(isStart: boolean) {
  return createEntryPointFunction(function (
    session: Session,
    characterOptions: Partial<CharacterOptions>
  ): boolean {
    const self = this as WrappedRange;

    const characterOptionsFilled = {
      ...defaultCharacterOptions,
      ...characterOptions,
    };
    var pos;
    var it = createRangeCharacterIterator(
      session,
      self,
      characterOptionsFilled,
      !isStart
    );
    var trimCharCount = 0;
    while ((pos = it.next()) && allWhiteSpaceRegex.test(pos.character)) {
      ++trimCharCount;
    }
    it.dispose();
    var trimmed = trimCharCount > 0;
    if (trimmed) {
      self[isStart ? 'moveStart' : 'moveEnd'](
        'character',
        isStart ? trimCharCount : -trimCharCount,
        { characterOptions: characterOptionsFilled }
      );
    }
    return trimmed;
  });
}

export default createRangeTrimmer;
