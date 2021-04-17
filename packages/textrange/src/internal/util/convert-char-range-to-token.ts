import { Token, TokenChar, TokenRange } from './default-tokenizer';

function convertCharRangeToToken(
  chars: TokenChar[],
  tokenRange: TokenRange
): Token {
  var tokenChars = chars.slice(tokenRange.start, tokenRange.end);
  var token: Token = {
    isWord: tokenRange.isWord,
    chars: tokenChars,
    toString: function () {
      return tokenChars.join('');
    },
  };
  for (var i = 0, len = tokenChars.length; i < len; ++i) {
    tokenChars[i].token = token;
  }
  return token;
}

export default convertCharRangeToToken;
