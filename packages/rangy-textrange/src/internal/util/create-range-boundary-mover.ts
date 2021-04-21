import { WrappedRange } from '@notjosh/rangy-core';
import {
  CHARACTER,
  CharacterOptions,
  defaultCharacterOptions,
  defaultWordOptions,
} from '../constants';
import log from '../log';
import Session, { createEntryPointFunction } from '../session';
import createNestedOptions from './create-nested-options';
import { WordOptions } from './create-word-options';
import movePositionBy from './move-position-by';

const defaultMoveOptions = {
  wordOptions: defaultWordOptions,
  characterOptions: defaultCharacterOptions,
};

export type MoveOptionsArgument = {
  wordOptions?: Partial<WordOptions>;
  characterOptions?: Partial<CharacterOptions>;
};

export type MoveOptions = {
  wordOptions?: WordOptions;
  characterOptions?: CharacterOptions;
};

function createRangeBoundaryMover(isStart: boolean, collapse: boolean) {
  /*
         Unit can be "character" or "word"
         Options:

         - includeTrailingSpace
         - wordRegex
         - tokenizer
         - collapseSpaceBeforeLineBreak
         */
  return createEntryPointFunction(function (
    session: Session,
    unit: string = CHARACTER,
    count: number,
    moveOptionsArgument?: MoveOptionsArgument
  ) {
    const self = this as WrappedRange;
    // if (typeof count == UNDEF) {
    //   count = unit;
    //   unit = CHARACTER;
    // }
    const moveOptions: MoveOptions = createNestedOptions(
      moveOptionsArgument,
      defaultMoveOptions
    );
    log.debug(
      '** moving boundary. start: ' +
        isStart +
        ', unit: ' +
        unit +
        ', count: ' +
        count
    );

    var boundaryIsStart = isStart;
    if (collapse) {
      boundaryIsStart = count >= 0;
      self.collapse(!boundaryIsStart);
    }
    var moveResult = movePositionBy(
      session.getRangeBoundaryPosition(self, boundaryIsStart),
      unit,
      count,
      moveOptions.characterOptions,
      moveOptions.wordOptions
    );
    var newPos = moveResult.position;
    self[boundaryIsStart ? 'setStart' : 'setEnd'](newPos.node, newPos.offset);
    log.debug('*** MOVED ' + moveResult.unitsMoved, newPos.inspect());
    return moveResult.unitsMoved;
  });
}

export default createRangeBoundaryMover;
