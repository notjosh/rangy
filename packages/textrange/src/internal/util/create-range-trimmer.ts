import { WrappedRange } from '@rangy/core';
import { allWhiteSpaceRegex } from '../constants';
import Session, { createEntryPointFunction } from '../session';
import {
  CharacterOptions,
  defaultCharacterOptions,
} from './create-nested-options';
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
      characterOptions,
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
