import { nonLineBreakWhiteSpaceRegex } from '../constants';
import Position from '../position';
import { WordOptions } from './create-word-options';

export type Token = {
  isWord: boolean;
  chars: TokenChar[];
  toString: () => string;
};

export type TokenChar = Position;

export type TokenRange = {
  start: number;
  end: number;
  isWord: boolean;
};

// This function must create word and non-word tokens for the whole of the text supplied to it
function defaultTokenizer(
  chars: TokenChar[],
  wordOptions: WordOptions
): TokenRange[] {
  var word = chars.join(''),
    result: RegExpExecArray,
    tokenRanges: TokenRange[] = [];

  function createTokenRange(start: number, end: number, isWord: boolean) {
    tokenRanges.push({ start: start, end: end, isWord: isWord });
  }

  // Match words and mark characters
  var lastWordEnd = 0,
    wordStart: number,
    wordEnd: number;
  while ((result = wordOptions.wordRegex.exec(word))) {
    wordStart = result.index;
    wordEnd = wordStart + result[0].length;

    // Create token for non-word characters preceding this word
    if (wordStart > lastWordEnd) {
      createTokenRange(lastWordEnd, wordStart, false);
    }

    // Get trailing space characters for word
    if (wordOptions.includeTrailingSpace) {
      while (nonLineBreakWhiteSpaceRegex.test(chars[wordEnd].character)) {
        ++wordEnd;
      }
    }
    createTokenRange(wordStart, wordEnd, true);
    lastWordEnd = wordEnd;
  }

  // Create token for trailing non-word characters, if any exist
  if (lastWordEnd < chars.length) {
    createTokenRange(lastWordEnd, chars.length, false);
  }

  return tokenRanges;
}

export default defaultTokenizer;
