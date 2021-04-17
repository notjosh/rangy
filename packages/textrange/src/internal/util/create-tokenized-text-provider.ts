// Provides a pair of iterators over text positions, tokenized. Transparently requests more text when next()

import { allWhiteSpaceRegex } from '../constants';
import log from '../log';
import Position from '../position';
import createCharacterIterator from './create-character-iterator';
import { CharacterOptions } from './create-nested-options';
import { WordOptions } from './create-word-options';
import tokenize from './tokenize';

var arrayIndexOf = Array.prototype.indexOf
  ? function (arr: any[], val: any) {
      return arr.indexOf(val);
    }
  : function (arr: any[], val: any) {
      for (var i = 0, len = arr.length; i < len; ++i) {
        if (arr[i] === val) {
          return i;
        }
      }
      return -1;
    };

// is called and there is no more tokenized text
function createTokenizedTextProvider(
  pos: Position,
  characterOptions: CharacterOptions,
  wordOptions: WordOptions
) {
  var forwardIterator = createCharacterIterator(
    pos,
    false,
    null,
    characterOptions
  );
  var backwardIterator = createCharacterIterator(
    pos,
    true,
    null,
    characterOptions
  );
  var tokenizer = wordOptions.tokenizer;

  // Consumes a word and the whitespace beyond it
  function consumeWord(forward: boolean) {
    log.debug('consumeWord called, forward is ' + forward);
    let pos: Position, textChar: string;
    let newChars: Position[] = [],
      it = forward ? forwardIterator : backwardIterator;

    var passedWordBoundary = false,
      insideWord = false;

    while ((pos = it.next())) {
      textChar = pos.character;

      log.debug("Testing char '" + textChar + "'");

      if (allWhiteSpaceRegex.test(textChar)) {
        if (insideWord) {
          insideWord = false;
          passedWordBoundary = true;
        }
      } else {
        log.debug(
          'Got non-whitespace, passedWordBoundary is ' + passedWordBoundary
        );
        if (passedWordBoundary) {
          it.rewind();
          break;
        } else {
          insideWord = true;
        }
      }
      newChars.push(pos);
    }

    log.debug(
      'consumeWord done, pos is ' + (pos ? pos.inspect() : 'non-existent')
    );

    log.debug('consumeWord got new chars ' + newChars.join(''));
    return newChars;
  }

  // Get initial word surrounding initial position and tokenize it
  var forwardChars = consumeWord(true);
  var backwardChars = consumeWord(false).reverse();
  var tokens = tokenize(
    backwardChars.concat(forwardChars),
    wordOptions,
    tokenizer
  );

  // Create initial token buffers
  var forwardTokensBuffer = forwardChars.length
    ? tokens.slice(arrayIndexOf(tokens, forwardChars[0].token))
    : [];

  var backwardTokensBuffer = backwardChars.length
    ? tokens.slice(0, arrayIndexOf(tokens, backwardChars.pop().token) + 1)
    : [];

  function inspectBuffer(buffer) {
    var textPositions = ['[' + buffer.length + ']'];
    for (var i = 0; i < buffer.length; ++i) {
      textPositions.push(
        '(word: ' + buffer[i] + ', is word: ' + buffer[i].isWord + ')'
      );
    }
    return textPositions;
  }

  log.info(
    'Initial word: ',
    inspectBuffer(forwardTokensBuffer) + '',
    ' and ',
    inspectBuffer(backwardTokensBuffer) + '',
    forwardChars,
    backwardChars
  );

  return {
    nextEndToken: function () {
      var lastToken, forwardChars;

      // If we're down to the last token, consume character chunks until we have a word or run out of
      // characters to consume
      while (
        forwardTokensBuffer.length == 1 &&
        !(lastToken = forwardTokensBuffer[0]).isWord &&
        (forwardChars = consumeWord(true)).length > 0
      ) {
        // Merge trailing non-word into next word and tokenize
        forwardTokensBuffer = tokenize(
          lastToken.chars.concat(forwardChars),
          wordOptions,
          tokenizer
        );
      }

      return forwardTokensBuffer.shift();
    },

    previousStartToken: function () {
      var lastToken, backwardChars;

      // If we're down to the last token, consume character chunks until we have a word or run out of
      // characters to consume
      while (
        backwardTokensBuffer.length == 1 &&
        !(lastToken = backwardTokensBuffer[0]).isWord &&
        (backwardChars = consumeWord(false)).length > 0
      ) {
        // Merge leading non-word into next word and tokenize
        backwardTokensBuffer = tokenize(
          backwardChars.reverse().concat(lastToken.chars),
          wordOptions,
          tokenizer
        );
      }

      return backwardTokensBuffer.pop();
    },

    dispose: function () {
      forwardIterator.dispose();
      backwardIterator.dispose();
      forwardTokensBuffer = backwardTokensBuffer = null;
    },
  };
}

export default createTokenizedTextProvider;
