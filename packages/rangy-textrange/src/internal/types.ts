import { CharacterRangeInfo } from '../';
import {
  CharacterOptions,
  ExpandOptionsArgument,
  FindOptions,
} from '../internal/constants';
import { MoveOptionsArgument } from '../internal/util/create-range-boundary-mover';

declare module '@notjosh/rangy-core' {
  interface WrappedRange {
    moveStart: (
      unit: string,
      count: number,
      moveOptions?: MoveOptionsArgument
    ) => number;
    moveEnd: (
      unit: string,
      count: number,
      moveOptions?: MoveOptionsArgument
    ) => number;
    move: (
      unit: string,
      count: number,
      moveOptions?: MoveOptionsArgument
    ) => number;
    trimStart: (characterOptions?: CharacterOptions) => boolean;
    trimEnd: (characterOptions?: CharacterOptions) => boolean;
    expand: (unit: string, expandOptions?: ExpandOptionsArgument) => boolean;
    text: (characterOptions?: Partial<CharacterOptions>) => string;
    selectCharacters: (
      containerNode: Node,
      startIndex: number,
      endIndex: number,
      characterOptions?: Partial<CharacterOptions>
    ) => void;
    toCharacterRange: (
      containerNode?: Node,
      characterOptions?: Partial<CharacterOptions>
    ) => { start: number; end: number };
    findText: (
      searchTermParam: RegExp | string,
      findOptions: Partial<FindOptions>
    ) => boolean;
    pasteHtml: (html: string) => void;
  }
}

declare module '@notjosh/rangy-core' {
  interface WrappedSelection {
    expand: (unit: string, expandOptions: ExpandOptionsArgument) => void;
    move: (
      unit: string,
      count: number,
      options?: { characterOptions: CharacterOptions }
    ) => number;
    trimStart: (characterOptions: Partial<CharacterOptions>) => boolean;
    trimEnd: (characterOptions: Partial<CharacterOptions>) => boolean;
    trim: (characterOptions: Partial<CharacterOptions>) => boolean;
    selectCharacters: (
      containerNode: Node,
      startIndex: number,
      endIndex: number,
      direction: string,
      characterOptions: Partial<CharacterOptions>
    ) => void;
    saveCharacterRanges: (
      containerNode: Node,
      characterOptions: Partial<CharacterOptions>
    ) => CharacterRangeInfo[];
    restoreCharacterRanges: (
      containerNode: Node,
      saved: CharacterRangeInfo[]
    ) => void;
    text: (characterOptions: Partial<CharacterOptions>) => string;
  }
}
